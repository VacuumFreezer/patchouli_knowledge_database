import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";

interface EvidenceDraft {
  claim: string;
  sourceReference: string;
}

interface SourceDraft {
  type: string;
  label: string;
  url?: string;
}

interface ConnectionDraft {
  cardRef: string;
  title: string;
  reason: string;
  selected: boolean;
}

interface ReviewDraft {
  title: string;
  filename: string;
  categories: string[];
  summaryMarkdown: string;
  detailMarkdown: string;
  fyiMarkdown?: string;
  evidence: EvidenceDraft[];
  sources: SourceDraft[];
  connections: ConnectionDraft[];
}

interface PreviewPayload {
  operation?: "create" | "update";
  draft: ReviewDraft;
  collision?: { exists: boolean; cardRef: string };
  target?: { cardRef: string; title: string; revision: string };
  destination?: { cardRef: string; renamed: boolean; collision: boolean };
  pendingToken: string;
  expiresAt: string;
  confirmationRequired: true;
}

interface GroupMember {
  key: string; splitReason: string; selected: boolean; draft: ReviewDraft; resolvedDraft: ReviewDraft; destinationRef: string;
  cardRef?: string; expectedRevision?: string; checkpointRefs?: { checkpointId: string; revision: string }[];
}
interface GroupRelationship { fromKey: string; toKey: string; reason: string; selected: boolean }
interface GroupPreview { cards: GroupMember[]; relationships: GroupRelationship[]; pendingToken: string; expiresAt: string }

interface ToolStructuredContent {
  capturePreview?: GroupPreview;
  cards?: { title: string; cardRef: string }[];
  ok?: boolean;
  preview?: PreviewPayload;
  card?: { title: string; cardRef: string };
  error?: { code?: string; message?: string };
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id?: number;
  result?: unknown;
  error?: unknown;
  method?: string;
  params?: {
    structuredContent?: ToolStructuredContent;
  };
}

declare global {
  interface Window {
    openai?: {
      toolOutput?: ToolStructuredContent;
    };
  }
}

const pendingRequests = new Map<number, {
  resolve: (result: unknown) => void;
  reject: (error: unknown) => void;
}>();
let nextRequestId = 1;

function request(method: string, params: unknown): Promise<unknown> {
  const id = nextRequestId++;
  window.parent.postMessage({ jsonrpc: "2.0", id, method, params }, "*");
  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
  });
}

function notify(method: string, params: unknown): void {
  window.parent.postMessage({ jsonrpc: "2.0", method, params }, "*");
}

function toCardDraft(draft: ReviewDraft): Omit<ReviewDraft, "filename"> {
  const { filename: _filename, ...cardDraft } = draft;
  return {
    ...cardDraft,
    sources: cardDraft.sources.map(({ url, ...source }) => (
      url?.trim() ? { ...source, url: url.trim() } : source
    )),
  };
}

function validationErrors(draft: ReviewDraft): string[] {
  const errors: string[] = [];
  if (!draft.title.trim()) errors.push("Title is required.");
  if (!draft.summaryMarkdown.trim()) errors.push("Summary is required.");
  if (!draft.detailMarkdown.trim()) errors.push("Core is required.");
  if (hasStructuralHeading(draft.summaryMarkdown)) {
    errors.push("Summary cannot contain level-one or level-two headings; use ### or a lower heading level.");
  }
  if (hasStructuralHeading(draft.detailMarkdown)) {
    errors.push("Core cannot contain level-one or level-two headings; use ### or a lower heading level.");
  }
  if (hasStructuralHeading(draft.fyiMarkdown ?? "")) errors.push("FYI cannot contain level-one or level-two headings; use ### or lower.");
  draft.evidence.forEach((item, index) => {
    if (!item.claim.trim() || !item.sourceReference.trim()) {
      errors.push(`Evidence item ${index + 1} needs both a claim and source reference.`);
    }
  });
  draft.sources.forEach((source, index) => {
    if (!source.type.trim() || !source.label.trim()) {
      errors.push(`Source ${index + 1} needs both a type and label.`);
    }
    if (source.url?.trim()) {
      try {
        const parsed = new URL(source.url);
        if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("unsupported protocol");
      } catch {
        errors.push(`Source ${index + 1} URL must be a valid HTTP or HTTPS URL.`);
      }
    }
  });
  return errors;
}

function hasStructuralHeading(markdown: string): boolean {
  const lines = markdown.split(/\r?\n/u);
  let fence: { marker: "`" | "~"; length: number } | undefined;
  let previousLine = "";
  for (const line of lines) {
    const fenceMatch = line.match(/^ {0,3}(`{3,}|~{3,})/u)?.[1];
    if (fenceMatch) {
      const marker = fenceMatch[0] as "`" | "~";
      if (fence?.marker === marker && fenceMatch.length >= fence.length) fence = undefined;
      else if (!fence) fence = { marker, length: fenceMatch.length };
      previousLine = "";
      continue;
    }
    if (fence) continue;
    if (/^ {0,3}#{1,2}(?:[ \t]+|$)/u.test(line)) return true;
    if (previousLine.trim() && /^ {0,3}(?:=+|-+)[ \t]*$/u.test(line)) return true;
    previousLine = line;
  }
  return false;
}

function MarkdownPreview({ label, markdown }: { label: string; markdown: string }): React.JSX.Element {
  return (
    <div className="markdown-preview" data-preview-for={label.toLowerCase()} aria-label={label + " rendered Markdown preview"}>
      <p className="preview-label">Rendered preview</p>
      <Markdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          img: ({ alt }) => <span className="image-placeholder">[Remote image omitted{alt ? ": " + alt : ""}]</span>,
        }}
      >
        {markdown}
      </Markdown>
    </div>
  );
}

function DraftFields({ draft, setField }: {
  draft: ReviewDraft;
  setField: <K extends keyof ReviewDraft>(key: K, value: ReviewDraft[K]) => void;
}): React.JSX.Element {
  const selectedConnectionCount = draft.connections.filter(connection => connection.selected).length;
  return <>
        <section className="panel">
          <label htmlFor="title">Title</label>
          <input id="title" value={draft.title} onChange={(event) => setField("title", event.target.value)} />
          <label htmlFor="categories">Categories <span className="hint">(comma separated)</span></label>
          <input
            id="categories"
            value={draft.categories.join(", ")}
            onChange={(event) => setField("categories", event.target.value.split(",").map((value) => value.trim()).filter(Boolean))}
          />
        </section>

        <section className="panel">
          <label htmlFor="summary">Summary</label>
          <p className="field-copy">Patchouli generated this concise synthesis. Edit it freely before saving.</p>
          <textarea id="summary" rows={5} value={draft.summaryMarkdown} onChange={(event) => setField("summaryMarkdown", event.target.value)} />
          <MarkdownPreview label="Summary" markdown={draft.summaryMarkdown} />
          <label htmlFor="detail">Core</label>
          <p className="field-copy">A concrete, paraphrased explanation from the target conversation. Markdown, headings from ### downward, and Obsidian math with $...$ or $$...$$ are supported.</p>
          <textarea id="detail" rows={12} value={draft.detailMarkdown} onChange={(event) => setField("detailMarkdown", event.target.value)} />
          <MarkdownPreview label="Core" markdown={draft.detailMarkdown} />
          <label htmlFor="fyi">FYI</label>
          <p className="hint">Optional examples, version-dependent figures, and peripheral observations.</p>
          <textarea id="fyi" rows={6} value={draft.fyiMarkdown ?? ""} onChange={(event) => setField("fyiMarkdown", event.target.value)} />
          <MarkdownPreview label="FYI" markdown={draft.fyiMarkdown ?? ""} />
        </section>

        <fieldset className="panel">
          <legend>Evidence</legend>
          {draft.evidence.map((item, index) => (
            <div className="repeat" key={`evidence-${index}`}>
              <label htmlFor={`claim-${index}`}>Paraphrased claim {index + 1}</label>
              <input
                id={`claim-${index}`}
                value={item.claim}
                onChange={(event) => setField("evidence", draft.evidence.map((current, itemIndex) => itemIndex === index ? { ...current, claim: event.target.value } : current))}
              />
              <label htmlFor={`reference-${index}`}>Source reference</label>
              <input
                id={`reference-${index}`}
                value={item.sourceReference}
                onChange={(event) => setField("evidence", draft.evidence.map((current, itemIndex) => itemIndex === index ? { ...current, sourceReference: event.target.value } : current))}
              />
              <button type="button" className="quiet" onClick={() => setField("evidence", draft.evidence.filter((_, itemIndex) => itemIndex !== index))}>Remove evidence</button>
            </div>
          ))}
          <button type="button" className="quiet" onClick={() => setField("evidence", [...draft.evidence, { claim: "", sourceReference: "" }])}>Add evidence</button>
        </fieldset>

        <fieldset className="panel">
          <legend>Sources</legend>
          {draft.sources.map((source, index) => (
            <div className="repeat three" key={`source-${index}`}>
              <label htmlFor={`source-type-${index}`}>Type</label>
              <input id={`source-type-${index}`} value={source.type} onChange={(event) => setField("sources", draft.sources.map((current, itemIndex) => itemIndex === index ? { ...current, type: event.target.value } : current))} />
              <label htmlFor={`source-label-${index}`}>Label</label>
              <input id={`source-label-${index}`} value={source.label} onChange={(event) => setField("sources", draft.sources.map((current, itemIndex) => itemIndex === index ? { ...current, label: event.target.value } : current))} />
              <label htmlFor={`source-url-${index}`}>URL <span className="hint">(optional)</span></label>
              <input id={`source-url-${index}`} inputMode="url" value={source.url ?? ""} onChange={(event) => setField("sources", draft.sources.map((current, itemIndex) => itemIndex === index ? { ...current, url: event.target.value } : current))} />
              <button type="button" className="quiet" onClick={() => setField("sources", draft.sources.filter((_, itemIndex) => itemIndex !== index))}>Remove source</button>
            </div>
          ))}
          <button type="button" className="quiet" onClick={() => setField("sources", [...draft.sources, { type: "", label: "" }])}>Add source</button>
        </fieldset>

        <fieldset className="panel">
          <legend>Connections <span className="hint">({selectedConnectionCount} selected)</span></legend>
          {draft.connections.length === 0 ? <p className="hint">No candidates were proposed.</p> : draft.connections.map((connection, index) => (
            <label className="connection" key={connection.cardRef}>
              <input
                type="checkbox"
                checked={connection.selected}
                onChange={(event) => setField("connections", draft.connections.map((current, itemIndex) => itemIndex === index ? { ...current, selected: event.target.checked } : current))}
              />
              <span><strong>{connection.title}</strong><small>{connection.reason}</small></span>
            </label>
          ))}
        </fieldset>

  </>;
}

function CaptureReview({ initial }: { initial: GroupPreview }): React.JSX.Element {
  const [preview, setPreview] = useState(initial);
  const [cards, setCards] = useState(initial.cards);
  const [relationships, setRelationships] = useState(initial.relationships);
  const [active, setActive] = useState(initial.cards[0]!.key);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<"reviewing" | "busy" | "saved" | "cancelled">("reviewing");
  const [feedback, setFeedback] = useState("");
  const member = cards.find(card => card.key === active)!;
  const editCard = (key: string, update: Partial<GroupMember>) => {
    setCards(current => current.map(card => card.key === key ? { ...card, ...update } : card));
    setDirty(true);
    setFeedback("Changes need a refreshed preview before saving.");
  };
  const refresh = async () => {
    const errors = cards.flatMap(card => validationErrors(card.draft).map(error => `${card.draft.title}: ${error}`));
    if (errors.length) { setFeedback(errors.join(" ")); return; }
    setStatus("busy");
    try {
      const result = await request("tools/call", { name: "preview_capture", arguments: {
        cards: cards.map(({ key, splitReason, selected, draft, cardRef, expectedRevision, checkpointRefs }) => ({ key, splitReason, selected, draft: toCardDraft(draft), ...(cardRef ? { cardRef, expectedRevision } : {}), ...(checkpointRefs ? { checkpointRefs } : {}) })),
        relationships,
      } }) as { structuredContent?: ToolStructuredContent };
      const output = result.structuredContent;
      if (!output?.ok || !output.capturePreview) { setFeedback(output?.error?.message ?? "Preview could not be refreshed."); return; }
      setPreview(output.capturePreview);
      setCards(output.capturePreview.cards);
      setRelationships(output.capturePreview.relationships);
      setDirty(false);
      setFeedback("Preview refreshed. Review the updated titles and connections, then save all selected cards.");
    } catch { setFeedback("The host could not refresh this review. Your edits remain here."); }
    finally { setStatus("reviewing"); }
  };
  const finish = async (action: "save" | "cancel") => {
    if (action === "save" && dirty) return;
    setStatus("busy");
    try {
      const result = await request("tools/call", { name: "save_capture", arguments: { pendingToken: preview.pendingToken, action } }) as { structuredContent?: ToolStructuredContent };
      const output = result.structuredContent;
      if (!output?.ok) { setStatus("reviewing"); setFeedback(output?.error?.message ?? "The group could not be saved. Retry the same review to resume safely."); return; }
      setStatus(action === "save" ? "saved" : "cancelled");
      setFeedback(action === "save" ? `Saved ${output.cards?.length ?? 0} cards.` : "Capture cancelled. Nothing written; private drafts retained.");
    } catch { setStatus("reviewing"); setFeedback("The host did not confirm completion. Retry this same review to avoid duplicates."); }
  };
  return <main className="shell">
    <header><p className="eyebrow">Patchouli · Connected concepts</p><h1>Review this knowledge capture</h1>
      <p>{cards.filter(card => card.selected).length} cards selected. Review each concept and its connections, then save the group once.</p></header>
    <fieldset disabled={status !== "reviewing"} className="panel"><legend>Concepts</legend>
      {cards.map(card => <div key={card.key} className="concept-row">
        <label><input type="checkbox" aria-label={`Include ${card.draft.title}`} checked={card.selected} onChange={event => {
          editCard(card.key, { selected: event.target.checked });
          if (!event.target.checked) setRelationships(current => current.map(link => link.fromKey === card.key || link.toKey === card.key ? { ...link, selected: false } : link));
        }} /> Include</label>
        <button type="button" aria-pressed={active === card.key} onClick={() => setActive(card.key)}>{card.draft.title}</button>
        <p>{card.splitReason}</p><small>{card.cardRef ? "Update" : "New"}: {card.destinationRef}</small>
      </div>)}
    </fieldset>
    <fieldset className="panel" disabled={status !== "reviewing"}><legend>Connections between these concepts</legend>
      {relationships.length === 0 ? <p>No supported peer relationship was proposed.</p> : relationships.map((link, index) => {
        const from = cards.find(card => card.key === link.fromKey)!;
        const to = cards.find(card => card.key === link.toKey)!;
        return <div key={`${link.fromKey}:${link.toKey}`} className="repeat">
          <label><input type="checkbox" checked={link.selected} disabled={!from.selected || !to.selected} onChange={event => { setRelationships(current => current.map((item, i) => i === index ? { ...item, selected: event.target.checked } : item)); setDirty(true); }} />{from.draft.title} → {to.draft.title}</label>
          <label htmlFor={`peer-reason-${index}`}>Relationship reason</label>
          <input id={`peer-reason-${index}`} value={link.reason} onChange={event => { setRelationships(current => current.map((item, i) => i === index ? { ...item, reason: event.target.value } : item)); setDirty(true); }} />
          <small>Peer target: {to.destinationRef}{dirty ? " (refresh to resolve edits)" : ""}</small>
        </div>;
      })}
    </fieldset>
    <fieldset disabled={status !== "reviewing"}><legend>{member.draft.title}</legend>
      <label htmlFor="boundary">Why this is a separate concept</label><input id="boundary" value={member.splitReason} onChange={event => editCard(member.key, { splitReason: event.target.value })} />
      <DraftFields draft={member.draft} setField={(key, value) => editCard(member.key, { draft: { ...member.draft, [key]: value } })} />
    </fieldset>
    <div className="actions">
      <button type="button" disabled={status !== "reviewing"} onClick={() => void finish("cancel")}>Cancel capture</button>
      <button type="button" disabled={!dirty || status !== "reviewing"} onClick={() => void refresh()}>Refresh preview</button>
      <button type="button" className="primary" disabled={dirty || status !== "reviewing"} onClick={() => void finish("save")}>Save all selected cards</button>
    </div><p role="status" aria-live="polite">{feedback}</p>
  </main>;
}

function ReviewApp(): React.JSX.Element {
  const [capturePreview, setCapturePreview] = useState<GroupPreview | null>(() => window.openai?.toolOutput?.capturePreview ?? null);
  const [preview, setPreview] = useState<PreviewPayload | null>(() => window.openai?.toolOutput?.preview ?? null);
  const [draft, setDraft] = useState<ReviewDraft | null>(() => window.openai?.toolOutput?.preview?.draft ?? null);
  const [status, setStatus] = useState<"reviewing" | "saving" | "saved" | "cancelled">("reviewing");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const receive = (event: MessageEvent<JsonRpcResponse>) => {
      if (event.source !== window.parent) return;
      const message = event.data;
      if (!message || message.jsonrpc !== "2.0") return;
      if (message.id !== undefined && pendingRequests.has(message.id)) {
        const pending = pendingRequests.get(message.id);
        pendingRequests.delete(message.id);
        if (message.error) pending?.reject(message.error);
        else pending?.resolve(message.result);
        return;
      }
      if (message.method === "ui/notifications/tool-result") {
        const output = message.params?.structuredContent;
        if (output?.capturePreview) {
          setCapturePreview(output.capturePreview);
        } else if (output?.preview) {
          setCapturePreview(null);
          setPreview(output.preview);
          setDraft(output.preview.draft);
          setStatus("reviewing");
          setFeedback("");
        } else if (output?.error?.message) {
          setFeedback(output.error.message);
        }
      }
    };
    window.addEventListener("message", receive);
    request("ui/initialize", {
      protocolVersion: "2025-06-18",
      appInfo: { name: "patchouli-card-review", version: "2.0.0" },
      appCapabilities: {},
    }).then(() => {
      notify("ui/notifications/initialized", {});
    }).catch(() => {
      // Older compatible hosts can still deliver tool results without the handshake response.
    });
    return () => window.removeEventListener("message", receive);
  }, []);

  const isUpdate = preview?.operation === "update";

  if (capturePreview) return <CaptureReview key={capturePreview.pendingToken} initial={capturePreview} />;

  if (!preview || !draft) {
    return (
      <main className="shell" aria-live="polite">
        <p className="eyebrow">Patchouli</p>
        <h1>Preparing your card review…</h1>
        <p>The editable draft will appear when the preview result arrives.</p>
      </main>
    );
  }

  const setField = <Key extends keyof ReviewDraft>(key: Key, value: ReviewDraft[Key]) => {
    setDraft((current) => current ? { ...current, [key]: value } : current);
  };

  const save = async () => {
    const errors = validationErrors(draft);
    if (errors.length > 0) {
      setFeedback(errors.join(" "));
      return;
    }
    setStatus("saving");
    setFeedback(isUpdate ? "Updating the confirmed card…" : "Saving the confirmed card…");
    try {
      const result = await request("tools/call", {
        name: isUpdate ? "update_card" : "save_card",
        arguments: {
          pendingToken: preview.pendingToken,
          draft: toCardDraft(draft),
        },
      }) as { structuredContent?: ToolStructuredContent };
      const output = result?.structuredContent;
      if (!output?.ok || output.error) {
        setStatus("reviewing");
        setFeedback(output?.error?.message ?? (isUpdate ? "The card could not be updated." : "The card could not be saved."));
        return;
      }
      setStatus("saved");
      setFeedback(`${isUpdate ? "Updated" : "Saved"} ${output.card?.title ?? draft.title}.`);
    } catch {
      setStatus("reviewing");
      setFeedback("The host could not complete the save. You can retry while the preview token is valid.");
    }
  };

  const cancel = () => {
    setStatus("cancelled");
    setFeedback(`${isUpdate ? "Update" : "Draft"} cancelled. Nothing was written to the vault.`);
    request("ui/message", {
      role: "user",
      content: [{ type: "text", text: `Cancel the Patchouli ${isUpdate ? "update" : "draft"} “${draft.title}”. Do not ${isUpdate ? "update" : "save"} it.` }],
    }).catch(() => undefined);
  };

  return (
    <main className="shell">
      <header>
        <p className="eyebrow">Patchouli · Review before {isUpdate ? "updating" : "saving"}</p>
        <h1>{isUpdate ? "Refine this knowledge card" : "Shape this knowledge card"}</h1>
        <p className="lede">Nothing is written until you choose {isUpdate ? "Update" : "Save"}. The token expires {new Date(preview.expiresAt).toLocaleString()}.</p>
        {isUpdate && preview.target ? <p className="hint">Updating {preview.target.cardRef} from the exact revision shown to Patchouli.</p> : null}
        {(isUpdate ? preview.destination?.collision : preview.collision?.exists) ? (
          <p className="warning" role="alert">
            {(isUpdate ? preview.destination?.cardRef : preview.collision?.cardRef)} already exists. Change the title before {isUpdate ? "updating" : "saving"}; Patchouli will safely recheck the final filename.
          </p>
        ) : null}
      </header>

      <form onSubmit={(event) => { event.preventDefault(); void save(); }}>
        <DraftFields draft={draft} setField={setField} />

        <div className="actions">
          <button type="button" className="secondary" onClick={cancel} disabled={status !== "reviewing"}>Cancel</button>
          <button type="submit" className="primary" disabled={status !== "reviewing"}>{status === "saving" ? (isUpdate ? "Updating…" : "Saving…") : (isUpdate ? "Update card" : "Save card")}</button>
        </div>
        <p className={status === "saved" ? "feedback success" : "feedback"} role="status" aria-live="polite">{feedback}</p>
      </form>
    </main>
  );
}

const root = document.getElementById("root");
if (root) createRoot(root).render(<ReviewApp />);
