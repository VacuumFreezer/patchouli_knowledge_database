import { createHash, randomBytes } from "node:crypto";

import { PatchouliError } from "../core/errors.js";
import type { NormalizedCardDraft } from "../core/types.js";

interface PendingRecord<T, M> {
  expiresAtMs: number;
  metadata?: M;
  inFlight?: {
    digest: string;
    promise: Promise<T>;
  };
  saved?: {
    digest: string;
    value: T;
  };
}

export interface PendingPreview {
  pendingToken: string;
  expiresAt: string;
}

export interface SaveResolution<T> {
  value: T;
  idempotentReplay: boolean;
}

export interface PendingPreviewStoreOptions {
  ttlMs?: number;
  now?: () => number;
  tokenFactory?: () => string;
}

function draftDigest(draft: NormalizedCardDraft): string {
  return createHash("sha256").update(JSON.stringify(draft), "utf8").digest("hex");
}

export class PendingPreviewStore<T, M = undefined> {
  readonly ttlMs: number;
  readonly #now: () => number;
  readonly #tokenFactory: () => string;
  readonly #records = new Map<string, PendingRecord<T, M>>();

  constructor(options: PendingPreviewStoreOptions = {}) {
    this.ttlMs = options.ttlMs ?? 15 * 60 * 1000;
    if (!Number.isFinite(this.ttlMs) || this.ttlMs < 1 || this.ttlMs > 24 * 60 * 60 * 1000) {
      throw new PatchouliError("CONFIGURATION_INVALID", "Preview token TTL must be between 1 ms and 24 hours.");
    }
    this.#now = options.now ?? Date.now;
    this.#tokenFactory = options.tokenFactory ?? (() => randomBytes(32).toString("base64url"));
  }

  issue(metadata?: M): PendingPreview {
    this.#removeExpired();
    let pendingToken = this.#tokenFactory();
    while (this.#records.has(pendingToken)) pendingToken = this.#tokenFactory();
    const expiresAtMs = this.#now() + this.ttlMs;
    this.#records.set(pendingToken, { expiresAtMs, ...(metadata === undefined ? {} : { metadata }) });
    return {
      pendingToken,
      expiresAt: new Date(expiresAtMs).toISOString(),
    };
  }

  async save(
    pendingToken: string,
    draft: NormalizedCardDraft,
    writer: (metadata: M | undefined) => Promise<T>,
  ): Promise<SaveResolution<T>> {
    if (typeof pendingToken !== "string" || !/^[A-Za-z0-9_-]{32,128}$/u.test(pendingToken)) {
      throw new PatchouliError("TOKEN_INVALID", "The pending preview token is invalid.");
    }
    const record = this.#records.get(pendingToken);
    if (!record) {
      throw new PatchouliError("TOKEN_INVALID", "The pending preview token is unknown or no longer available.");
    }
    if (this.#now() >= record.expiresAtMs) {
      this.#records.delete(pendingToken);
      throw new PatchouliError("TOKEN_EXPIRED", "The pending preview token has expired. Preview the card again.");
    }

    const digest = draftDigest(draft);
    if (record.saved) {
      if (record.saved.digest !== digest) {
        throw new PatchouliError(
          "TOKEN_CONSUMED",
          "This preview token already saved a different final draft.",
        );
      }
      return { value: record.saved.value, idempotentReplay: true };
    }
    if (record.inFlight) {
      if (record.inFlight.digest !== digest) {
        throw new PatchouliError("TOKEN_CONSUMED", "This preview token is already saving another draft.");
      }
      return { value: await record.inFlight.promise, idempotentReplay: true };
    }

    const promise = writer(record.metadata);
    record.inFlight = { digest, promise };
    try {
      const value = await promise;
      record.saved = { digest, value };
      record.inFlight = undefined;
      return { value, idempotentReplay: false };
    } catch (error: unknown) {
      record.inFlight = undefined;
      throw error;
    }
  }

  #removeExpired(): void {
    const now = this.#now();
    for (const [token, record] of this.#records) {
      if (now >= record.expiresAtMs) this.#records.delete(token);
    }
  }
}
