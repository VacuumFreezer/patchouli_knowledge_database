import { createHash, randomUUID } from "node:crypto";
import * as fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { normalizeCardDraft } from "./cards.js";
import { PatchouliError, isNodeError } from "./errors.js";
import type {
  CardDraft,
  CheckpointDraft,
  CheckpointReference,
  PatchouliSessionStatus,
} from "./types.js";

interface SessionState {
  version: 1;
  active: boolean;
  launchId: string;
  sequence: number;
  launchedAt?: string;
  updatedAt: string;
  lastTranscriptDigest?: string;
  lastGenerationStartedAtMs?: number;
  checkpoints: CheckpointDraft[];
}

export interface ReplaceCheckpointInput {
  trigger: "auto" | "manual";
  turnId: string;
  model: string;
  messageCount: number;
  transcriptDigest: string;
  generationStartedAtMs: number;
  drafts: CardDraft[];
}

export function defaultCheckpointRoot(): string {
  const applicationData = process.env.APPDATA?.trim();
  return process.env.PATCHOULI_CHECKPOINT_ROOT?.trim()
    || path.join(applicationData || path.join(os.homedir(), "AppData", "Roaming"), "Patchouli", "session-checkpoints");
}

export function currentPatchouliSessionId(): string {
  const sessionId = process.env.PATCHOULI_SESSION_ID?.trim()
    || process.env.CODEX_SESSION_ID?.trim()
    || process.env.CODEX_THREAD_ID?.trim();
  if (!sessionId) {
    throw new PatchouliError(
      "SESSION_CONTEXT_MISSING",
      "Patchouli cannot identify the current Codex task. Start a fresh task after installing or updating the plugin.",
    );
  }
  return sessionId;
}

function sessionKey(sessionId: string): string {
  if (typeof sessionId !== "string" || sessionId.trim().length === 0) {
    throw new PatchouliError("SESSION_CONTEXT_MISSING", "The Codex task identifier is missing.");
  }
  return createHash("sha256").update(sessionId.trim(), "utf8").digest("hex");
}

function draftRevision(draft: CardDraft): string {
  return createHash("sha256").update(JSON.stringify(normalizeCardDraft(draft)), "utf8").digest("hex");
}

const wait = (milliseconds: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, milliseconds));

export class CheckpointStore {
  readonly root: string;
  readonly #now: () => Date;

  constructor(options: { root?: string; now?: () => Date } = {}) {
    this.root = path.resolve(options.root ?? defaultCheckpointRoot());
    this.#now = options.now ?? (() => new Date());
  }

  async launch(sessionId: string): Promise<PatchouliSessionStatus> {
    return this.#withLock(sessionId, async () => {
      const current = await this.#read(sessionId);
      const now = this.#now().toISOString();
      const state: SessionState = current ?? {
        version: 1,
        active: true,
        launchId: randomUUID(),
        sequence: 0,
        launchedAt: now,
        updatedAt: now,
        checkpoints: [],
      };
      state.active = true;
      state.launchedAt ??= now;
      state.updatedAt = now;
      await this.#write(sessionId, state);
      return this.#status(state);
    });
  }

  async status(sessionId: string): Promise<PatchouliSessionStatus> {
    const state = await this.#read(sessionId);
    return state ? this.#status(state) : { active: false, checkpointCount: 0 };
  }

  async stop(sessionId: string, discardCheckpoints = false): Promise<PatchouliSessionStatus> {
    return this.#withLock(sessionId, async () => {
      const state = await this.#read(sessionId);
      if (!state) return { active: false, checkpointCount: 0 };
      state.active = false;
      state.updatedAt = this.#now().toISOString();
      if (discardCheckpoints) state.checkpoints = [];
      await this.#write(sessionId, state);
      return this.#status(state);
    });
  }

  async list(sessionId: string): Promise<CheckpointDraft[]> {
    const state = await this.#read(sessionId);
    return state?.checkpoints.map((checkpoint) => structuredClone(checkpoint)) ?? [];
  }

  async hasTranscriptDigest(sessionId: string, transcriptDigest: string): Promise<boolean> {
    const state = await this.#read(sessionId);
    return Boolean(state?.active && state.lastTranscriptDigest === transcriptDigest);
  }

  async discard(sessionId: string, references?: CheckpointReference[]): Promise<number> {
    return this.#withLock(sessionId, async () => {
      const state = await this.#read(sessionId);
      if (!state) return 0;
      const before = state.checkpoints.length;
      if (references === undefined) {
        state.checkpoints = [];
      } else {
        const keys = new Set(references.map((item) => `${item.checkpointId}\u0000${item.revision}`));
        state.checkpoints = state.checkpoints.filter(
          (item) => !keys.has(`${item.checkpointId}\u0000${item.revision}`),
        );
      }
      const removed = before - state.checkpoints.length;
      if (removed > 0) {
        state.updatedAt = this.#now().toISOString();
        await this.#write(sessionId, state);
      }
      return removed;
    });
  }

  async replaceFromCompaction(sessionId: string, input: ReplaceCheckpointInput): Promise<{
    generated: boolean;
    checkpoints: CheckpointDraft[];
  }> {
    return this.#withLock(sessionId, async () => {
      const state = await this.#read(sessionId);
      if (!state?.active) {
        throw new PatchouliError("SESSION_INACTIVE", "Patchouli capture is not active for this task.");
      }
      if (state.lastTranscriptDigest === input.transcriptDigest) {
        return { generated: false, checkpoints: structuredClone(state.checkpoints) };
      }
      if (
        state.lastGenerationStartedAtMs !== undefined
        && input.generationStartedAtMs <= state.lastGenerationStartedAtMs
      ) {
        return { generated: false, checkpoints: structuredClone(state.checkpoints) };
      }
      const now = this.#now().toISOString();
      const sequence = state.sequence + 1;
      const oldByRevision = new Map(state.checkpoints.map((item) => [item.revision, item]));
      const checkpoints = input.drafts.slice(0, 8).map((draft) => {
        const normalized = normalizeCardDraft(draft);
        const revision = draftRevision(normalized);
        const old = oldByRevision.get(revision);
        return {
          launchId: state.launchId,
          checkpointId: old?.checkpointId ?? randomUUID(),
          revision,
          sequence,
          contextDigest: input.transcriptDigest,
          createdAt: old?.createdAt ?? now,
          updatedAt: now,
          trigger: input.trigger,
          turnId: input.turnId,
          model: input.model,
          messageCount: input.messageCount,
          draft: normalized,
        };
      });
      state.checkpoints = checkpoints;
      state.sequence = sequence;
      state.lastTranscriptDigest = input.transcriptDigest;
      state.lastGenerationStartedAtMs = input.generationStartedAtMs;
      state.updatedAt = now;
      await this.#write(sessionId, state);
      return { generated: true, checkpoints: structuredClone(checkpoints) };
    });
  }

  #status(state: SessionState): PatchouliSessionStatus {
    return {
      active: state.active,
      launchId: state.launchId,
      ...(state.launchedAt ? { launchedAt: state.launchedAt } : {}),
      updatedAt: state.updatedAt,
      checkpointCount: state.checkpoints.length,
    };
  }

  #directory(sessionId: string): string {
    return path.join(this.root, sessionKey(sessionId));
  }

  #file(sessionId: string): string {
    return path.join(this.#directory(sessionId), "state.json");
  }

  async #read(sessionId: string): Promise<SessionState | undefined> {
    try {
      const stats = await fs.stat(this.#file(sessionId));
      if (stats.size > 4 * 1024 * 1024) throw new Error("Checkpoint state exceeds the 4 MiB safety limit.");
      const parsed = JSON.parse(await fs.readFile(this.#file(sessionId), "utf8")) as Partial<SessionState>;
      if (
        parsed.version !== 1
        || typeof parsed.active !== "boolean"
        || typeof parsed.launchId !== "string"
        || !Number.isSafeInteger(parsed.sequence)
        || !Array.isArray(parsed.checkpoints)
        || parsed.checkpoints.length > 8
      ) {
        throw new Error("Unsupported checkpoint state.");
      }
      return {
        version: 1,
        active: parsed.active,
        launchId: parsed.launchId,
        sequence: parsed.sequence as number,
        ...(typeof parsed.launchedAt === "string" ? { launchedAt: parsed.launchedAt } : {}),
        updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : this.#now().toISOString(),
        ...(typeof parsed.lastTranscriptDigest === "string" ? { lastTranscriptDigest: parsed.lastTranscriptDigest } : {}),
        ...(typeof parsed.lastGenerationStartedAtMs === "number"
          ? { lastGenerationStartedAtMs: parsed.lastGenerationStartedAtMs }
          : {}),
        checkpoints: parsed.checkpoints.map((item) => ({
          ...(item as CheckpointDraft),
          draft: normalizeCardDraft((item as CheckpointDraft).draft),
        })),
      };
    } catch (error: unknown) {
      if (isNodeError(error) && error.code === "ENOENT") return undefined;
      throw new PatchouliError("IO_ERROR", "Patchouli could not read its task checkpoint state.", {}, { cause: error });
    }
  }

  async #write(sessionId: string, state: SessionState): Promise<void> {
    const directory = this.#directory(sessionId);
    await fs.mkdir(directory, { recursive: true });
    const temporary = path.join(directory, `.state-${randomUUID()}.tmp`);
    try {
      const serialized = `${JSON.stringify(state, null, 2)}\n`;
      if (Buffer.byteLength(serialized, "utf8") > 4 * 1024 * 1024) {
        throw new Error("Checkpoint state exceeds the 4 MiB safety limit.");
      }
      await fs.writeFile(temporary, serialized, { encoding: "utf8", mode: 0o600 });
      await fs.rename(temporary, this.#file(sessionId));
    } catch (error: unknown) {
      throw new PatchouliError("IO_ERROR", "Patchouli could not persist its task checkpoint state.", {}, { cause: error });
    } finally {
      await fs.unlink(temporary).catch(() => undefined);
    }
  }

  async #withLock<T>(sessionId: string, action: () => Promise<T>): Promise<T> {
    const directory = this.#directory(sessionId);
    const lock = path.join(directory, ".lock");
    await fs.mkdir(directory, { recursive: true });
    for (let attempt = 0; attempt < 40; attempt += 1) {
      try {
        await fs.mkdir(lock);
        try {
          return await action();
        } finally {
          await fs.rmdir(lock).catch(() => undefined);
        }
      } catch (error: unknown) {
        if (!isNodeError(error) || error.code !== "EEXIST") throw error;
        if (attempt === 39) {
          throw new PatchouliError("IO_ERROR", "Patchouli checkpoint state is busy; try again.");
        }
        await wait(25 + attempt * 5);
      }
    }
    throw new PatchouliError("IO_ERROR", "Patchouli checkpoint state is busy; try again.");
  }
}
