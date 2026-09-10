import { randomBytes } from "node:crypto";
import { normalizeCardDraft } from "./cards.js";
import { PatchouliError } from "./errors.js";
import type { CheckpointStore } from "./checkpoints.js";
import type { VaultCardEngine } from "./vault.js";
import type { CardDraft, NormalizedCardDraft, CheckpointReference, SavedCard } from "./types.js";

export interface CaptureMember {
  key: string;
  splitReason: string;
  selected?: boolean;
  draft: CardDraft;
  cardRef?: string;
  expectedRevision?: string;
  checkpointRefs?: CheckpointReference[];
}
export interface CaptureRelationship { fromKey: string; toKey: string; reason: string; selected: boolean }
export interface CaptureInput { cards: CaptureMember[]; relationships: CaptureRelationship[] }
export interface CaptureMemberPreview extends CaptureMember {
  selected: boolean;
  draft: NormalizedCardDraft;
  resolvedDraft: NormalizedCardDraft;
  destinationRef: string;
}
export interface CapturePreview {
  cards: CaptureMemberPreview[];
  relationships: CaptureRelationship[];
  pendingToken: string;
  expiresAt: string;
  confirmationRequired: true;
}
export interface CaptureResult {
  cards: SavedCard[];
  cancelled: boolean;
  retainedCheckpointRefs: CheckpointReference[];
  warnings: string[];
}
interface CaptureRecord {
  preview: CapturePreview;
  sessionId: string;
  configuration: string;
  saved: Map<string, SavedCard>;
  result?: CaptureResult;
  inFlight?: Promise<CaptureResult>;
  action?: "save" | "cancel";
}
const folded = (value: string) => value.normalize("NFC").toLocaleLowerCase("en-US");
const referenceKey = (ref: CheckpointReference) => `${ref.checkpointId}:${ref.revision}`;

/** In-memory review receipts: file writes are individually atomic, not a multi-file transaction. */
export class CaptureStore {
  readonly #records = new Map<string, CaptureRecord>();
  constructor(readonly engine: VaultCardEngine, readonly checkpoints: CheckpointStore,
    readonly ttlMs = 15 * 60 * 1000, readonly now = Date.now) {}

  async #configuration(): Promise<string> {
    return JSON.stringify(await this.engine.configurationStore.requireConfiguration());
  }
  async #checkReferences(sessionId: string, refs: CheckpointReference[]): Promise<void> {
    if (!refs.length) return;
    const available = new Set((await this.checkpoints.list(sessionId)).map(referenceKey));
    if (refs.some(ref => !available.has(referenceKey(ref)))) throw new PatchouliError("CHECKPOINT_NOT_FOUND", "Checkpoint drafts changed. Read them and preview again.");
  }
  async preview(input: CaptureInput, sessionId: string): Promise<CapturePreview> {
    if (input.cards.length < 1 || input.cards.length > 8) throw new PatchouliError("VALIDATION_ERROR", "A capture contains one to eight concepts.");
    const configuration = await this.#configuration();
    const keys = new Set<string>();
    const destinations = new Set<string>();
    const targets = new Set<string>();
    const cards: CaptureMemberPreview[] = [];
    for (const member of input.cards) {
      if (!/^[A-Za-z0-9_-]{1,64}$/u.test(member.key) || keys.has(member.key) || !member.splitReason.trim()) throw new PatchouliError("VALIDATION_ERROR", "Each concept needs a unique temporary key and a meaningful boundary reason.");
      keys.add(member.key);
      if (Boolean(member.cardRef) !== Boolean(member.expectedRevision)) throw new PatchouliError("VALIDATION_ERROR", "An update requires both cardRef and expectedRevision.");
      const draft = normalizeCardDraft(member.draft);
      const selected = member.selected !== false;
      const inspection = member.cardRef
        ? await this.engine.inspectCardUpdate(member.cardRef, member.expectedRevision!, draft)
        : await this.engine.inspectDraft(draft);
      const destinationRef = "destination" in inspection ? inspection.destination.cardRef : inspection.collision.cardRef;
      const collision = "destination" in inspection ? inspection.destination.collision : inspection.collision.exists;
      if (selected && collision) throw new PatchouliError("COLLISION", "A capture destination already exists.", { destinationRef });
      if (destinations.has(folded(destinationRef))) throw new PatchouliError("COLLISION", "Capture members resolve to the same filename, including case/Unicode aliases.", { destinationRef });
      destinations.add(folded(destinationRef));
      if (member.cardRef) {
        const target = folded(member.cardRef);
        if (targets.has(target)) throw new PatchouliError("VALIDATION_ERROR", "A capture cannot update the same card twice.");
        targets.add(target);
      }
      await this.#checkReferences(sessionId, member.checkpointRefs ?? []);
      cards.push({ ...structuredClone(member), selected, draft, resolvedDraft: structuredClone(draft), destinationRef });
    }
    if (!cards.some(card => card.selected)) throw new PatchouliError("VALIDATION_ERROR", "Select at least one concept to review.");
    const pairs = new Set<string>();
    const relationships = structuredClone(input.relationships);
    for (const relation of relationships) {
      const from = cards.find(card => card.key === relation.fromKey);
      const to = cards.find(card => card.key === relation.toKey);
      const pair = `${relation.fromKey}:${relation.toKey}`;
      if (!from || !to || from === to || pairs.has(pair) || !relation.reason.trim()) throw new PatchouliError("VALIDATION_ERROR", "Peer connections need distinct existing member keys, a reason, and no duplicate directed pair.");
      pairs.add(pair);
      // Omitted concepts remain visible but cannot leave a selected dangling link.
      relation.selected = relation.selected && from.selected && to.selected;
      from.resolvedDraft.connections.push({ cardRef: to.destinationRef, title: to.draft.title, reason: relation.reason.trim(), selected: relation.selected });
    }
    for (const card of cards) {
      const refs = new Set<string>();
      for (const connection of card.resolvedDraft.connections) {
        if (!connection.selected || !card.selected) continue;
        const target = folded(connection.cardRef);
        if (target === folded(card.destinationRef) || refs.has(target)) throw new PatchouliError("VALIDATION_ERROR", "Selected connections cannot point to the same card or duplicate a target.", { cardKey: card.key });
        refs.add(target);
        const peer = cards.find(item => folded(item.destinationRef) === target);
        if (peer) {
          if (!peer.selected || !relationships.some(r => r.fromKey === card.key && r.toKey === peer.key && r.selected)) throw new PatchouliError("VALIDATION_ERROR", "Use relationships for selected in-group connections.");
        } else {
          const existing = await this.engine.getCard(connection.cardRef);
          if (cards.some(item => item.cardRef && folded(item.cardRef) === folded(existing.cardRef))) throw new PatchouliError("VALIDATION_ERROR", "Use a peer relationship for a card updated in this capture, so title changes remain consistent.");
          connection.cardRef = existing.cardRef;
        }
      }
    }
    if (await this.#configuration() !== configuration) throw new PatchouliError("CONFIGURATION_INVALID", "Vault configuration changed during preview. Preview again.");
    for (const [token, record] of this.#records) if (this.now() >= Date.parse(record.preview.expiresAt) && !record.inFlight) this.#records.delete(token);
    const preview: CapturePreview = { cards, relationships, pendingToken: randomBytes(32).toString("base64url"), expiresAt: new Date(this.now() + this.ttlMs).toISOString(), confirmationRequired: true };
    this.#records.set(preview.pendingToken, { preview: structuredClone(preview), sessionId, configuration, saved: new Map() });
    return preview;
  }

  async save(token: string, sessionId: string, action: "save" | "cancel" = "save"): Promise<{ result: CaptureResult; idempotentReplay: boolean }> {
    const record = this.#records.get(token);
    if (!record || record.sessionId !== sessionId) throw new PatchouliError("TOKEN_INVALID", "This capture token is unknown or belongs to another task/operation.");
    if (this.now() >= Date.parse(record.preview.expiresAt)) throw new PatchouliError("TOKEN_EXPIRED", "The capture review expired. Read saved cards and preview any remaining work again.");
    if (await this.#configuration() !== record.configuration) throw new PatchouliError("CONFIGURATION_INVALID", "Vault configuration changed after review. Restore it or preview again.");
    if (record.action && record.action !== action) throw new PatchouliError("TOKEN_CONSUMED", "This capture token has already been used for another action.");
    if (record.result) return { result: structuredClone(record.result), idempotentReplay: true };
    if (record.inFlight) return { result: structuredClone(await record.inFlight), idempotentReplay: true };
    record.action = action;
    record.inFlight = this.#commit(record, action);
    try {
      record.result = await record.inFlight;
      return { result: structuredClone(record.result), idempotentReplay: false };
    } catch (error: unknown) {
      // A rejected preflight is still an unused preview; the user can cancel it.
      if (record.saved.size === 0) record.action = undefined;
      throw error;
    } finally { record.inFlight = undefined; }
  }

  async #commit(record: CaptureRecord, action: "save" | "cancel"): Promise<CaptureResult> {
    const allRefs = [...new Map(record.preview.cards.flatMap(c => c.checkpointRefs ?? []).map(ref => [referenceKey(ref), ref])).values()];
    if (action === "cancel") return { cards: [...record.saved.values()], cancelled: true, retainedCheckpointRefs: allRefs, warnings: [] };
    try {
      const selected = record.preview.cards.filter(c => c.selected);
      await this.#checkReferences(record.sessionId, allRefs);
      // Preflight the entire group before the first mutation and every retry.
      for (const member of selected) {
        const receipt = record.saved.get(member.key);
        if (receipt) {
          if ((await this.engine.getCard(receipt.card.cardRef)).revision !== receipt.card.revision) throw new PatchouliError("REVISION_CONFLICT", "A partially saved card changed. Keep the edit and review remaining work again.", { cardRef: receipt.card.cardRef });
        } else if (member.cardRef) {
          const inspection = await this.engine.inspectCardUpdate(member.cardRef, member.expectedRevision!, member.resolvedDraft);
          if (inspection.destination.collision || inspection.destination.cardRef !== member.destinationRef) throw new PatchouliError("COLLISION", "An update destination changed after group preview.");
        } else if ((await this.engine.inspectDraft(member.resolvedDraft)).collision.exists) throw new PatchouliError("COLLISION", "A capture destination appeared after preview.", { cardRef: member.destinationRef });
        for (const link of member.resolvedDraft.connections.filter(c => c.selected)) {
          if (!selected.some(c => c.destinationRef === link.cardRef)) await this.engine.getCard(link.cardRef);
        }
      }
      for (const member of selected) {
        if (record.saved.has(member.key)) continue;
        if (await this.#configuration() !== record.configuration) throw new PatchouliError("CONFIGURATION_INVALID", "Vault configuration changed while saving the group.");
        const saved = member.cardRef
          ? await this.engine.updateCard(member.cardRef, member.expectedRevision!, member.resolvedDraft)
          : await this.engine.writeCard(member.resolvedDraft);
        record.saved.set(member.key, saved);
      }
      const retainedCheckpointRefs = allRefs.filter(ref => record.preview.cards.some(c => !c.selected && c.checkpointRefs?.some(other => referenceKey(other) === referenceKey(ref))));
      const consumed = allRefs.filter(ref => !retainedCheckpointRefs.some(other => referenceKey(other) === referenceKey(ref)));
      const warnings: string[] = [];
      try { if (consumed.length) await this.checkpoints.discard(record.sessionId, consumed); }
      catch { retainedCheckpointRefs.push(...consumed); warnings.push("Cards saved; private checkpoint cleanup failed. The drafts remain available."); }
      return { cards: [...record.saved.values()], cancelled: false, retainedCheckpointRefs, warnings };
    } catch (error: unknown) {
      throw new PatchouliError(error instanceof PatchouliError ? error.code : "IO_ERROR", record.saved.size ? "Only part of the capture was saved. Retry this same token to resume; saved cards will not be duplicated. If a card changed, read it and review the remaining work again." : (error instanceof Error ? error.message : "Capture save failed before any card was committed."), {
        savedCards: [...record.saved.values()].map(saved => ({ cardRef: saved.card.cardRef, id: saved.card.id, revision: saved.card.revision })),
        retryable: true, causeCode: error instanceof PatchouliError ? error.code : "IO_ERROR", retainedCheckpointRefs: allRefs,
      }, { cause: error });
    }
  }
}
