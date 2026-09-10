import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { CheckpointStore } from "../dist/core.mjs";
import { mcpConfiguration, transportOptions } from "../scripts/runtime-config.mjs";

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const expectedTools = [
  "configure_vault",
  "discard_checkpoint_drafts",
  "get_card",
  "get_checkpoint_drafts",
  "get_configuration",
  "get_patchouli_status",
  "launch_patchouli",
  "list_categories",
  "preview_capture",
  "preview_card",
  "preview_card_update",
  "save_capture",
  "save_card",
  "search_cards",
  "stop_patchouli",
  "suggest_links",
  "update_card",
];

function draft(title = "Reviewed Capture") {
  return {
    title,
    categories: ["Learning", " Local "],
    summaryMarkdown: "A concise local-first summary.",
    detailMarkdown: "The detailed explanation states that Markdown remains authoritative without copying the source dialogue.\n\n$$\n\\int_0^1 x^2\\,dx = \\frac{1}{3}\n$$",
    evidence: [{ claim: "The workflow requires review", sourceReference: "Test fixture" }],
    sources: [{ type: "text", label: "Fixture" }],
    connections: [],
  };
}

async function fixture(context, ttlMs, environment = {}) {
  const root = await mkdtemp(path.join(tmpdir(), "patchouli-mcp-"));
  const vault = path.join(root, "vault");
  const appData = path.join(root, "appdata");
  const sessionId = `test-${path.basename(root)}`;
  await mkdir(path.join(vault, ".obsidian"), { recursive: true });
  await mkdir(appData, { recursive: true });

  const transport = new StdioClientTransport({
    ...transportOptions(mcpConfiguration(), pluginRoot),
    env: {
      ...process.env,
      APPDATA: appData,
      PATCHOULI_DATA_ROOT: path.join(appData, "Patchouli"),
      PATCHOULI_CHECKPOINT_ROOT: path.join(appData, "Patchouli", "session-checkpoints"),
      PATCHOULI_SESSION_ID: sessionId,
      ...(ttlMs ? { PATCHOULI_PREVIEW_TTL_MS: String(ttlMs) } : {}),
      ...environment,
    },
    stderr: "pipe",
  });
  const client = new Client({ name: "patchouli-mcp-tests", version: "0.1.0" });
  await client.connect(transport);
  context.after(async () => {
    await client.close();
    await rm(root, { recursive: true, force: true });
  });
  return { client, vault, appData, sessionId };
}

function structured(result) {
  assert.equal(typeof result.structuredContent, "object");
  return result.structuredContent;
}

test("connected group MCP previews all fields before writes and saves exactly once, with operation isolation", async context => {
  const { client, vault } = await fixture(context);
  await client.callTool({ name: "configure_vault", arguments: { vaultPath: vault, cardsDirectory: "NLP" } });
  const proposed = {
    cards: [{ key: "nlp", splitReason: "NLP mechanism", draft: { ...draft("Tokenization"), fyiMarkdown: "Model vocabulary example." } }, { key: "encoding", splitReason: "General prerequisite", draft: draft("Unicode 字符") }],
    relationships: [{ fromKey: "nlp", toKey: "encoding", reason: "UTF-8 bytes explain Chinese and emoji tokenization.", selected: true }],
  };
  const previewResult = await client.callTool({ name: "preview_capture", arguments: proposed });
  const preview = structured(previewResult).capturePreview;
  assert.equal(preview.cards.length, 2);
  for (const content of ["Core:", "FYI:", "Model vocabulary example.", "Evidence:", "Sources:", "UTF-8 bytes", "Unicode 字符", "都保存"]) assert.ok(previewResult.content[0].text.includes(content));
  assert.equal(structured(await client.callTool({ name: "search_cards", arguments: { query: "Tokenization" } })).results.length, 0);
  const wrongOperation = structured(await client.callTool({ name: "save_card", arguments: { pendingToken: preview.pendingToken, draft: proposed.cards[0].draft } }));
  assert.equal(wrongOperation.error.code, "TOKEN_INVALID");
  const result = structured(await client.callTool({ name: "save_capture", arguments: { pendingToken: preview.pendingToken } }));
  assert.equal(result.ok, true); assert.equal(result.cards.length, 2);
  assert.match(result.cards[0].markdown, /\[\[Unicode 字符\|Unicode 字符\]\]/);
  assert.equal(structured(await client.callTool({ name: "save_capture", arguments: { pendingToken: preview.pendingToken } })).idempotentReplay, true);
  assert.deepEqual((await readdir(path.join(vault, "NLP"))).sort(), ["Tokenization.md", "Unicode 字符.md"]);
});

test("advertises seventeen explicit contracts, accurate annotations, and the MCP App resource", async (context) => {
  const { client } = await fixture(context);
  const listed = await client.listTools();
  assert.deepEqual(listed.tools.map((tool) => tool.name).sort(), expectedTools);

  for (const tool of listed.tools) {
    assert.equal(tool.inputSchema.type, "object", `${tool.name} input schema`);
    assert.equal(tool.outputSchema.type, "object", `${tool.name} output schema`);
    assert.equal(tool.annotations.openWorldHint, false, `${tool.name} stays local`);
    const detailValues = tool.outputSchema.properties.error.properties.details.additionalProperties;
    assert.ok(
      detailValues.$ref || detailValues.anyOf,
      `${tool.name} error details must declare JSON value types`,
    );
  }
  assert.equal(listed.tools.find((tool) => tool.name === "save_card").annotations.readOnlyHint, false);
  assert.equal(listed.tools.find((tool) => tool.name === "save_card").annotations.idempotentHint, true);
  assert.equal(listed.tools.find((tool) => tool.name === "preview_card").annotations.readOnlyHint, true);
  assert.equal(listed.tools.find((tool) => tool.name === "update_card").annotations.destructiveHint, true);
  assert.equal(listed.tools.find((tool) => tool.name === "discard_checkpoint_drafts").annotations.destructiveHint, true);
  const draftProperties = listed.tools.find((tool) => tool.name === "preview_card")
    .inputSchema.properties.draft.properties;
  assert.ok(draftProperties.summaryMarkdown);
  assert.ok(draftProperties.detailMarkdown);
  assert.equal(listed.tools.find((tool) => tool.name === "preview_card").inputSchema.properties.draft.additionalProperties, false);
  assert.equal("annotation" in draftProperties, false);
  assert.equal("understandingMarkdown" in draftProperties, false);
  assert.equal(
    listed.tools.find((tool) => tool.name === "preview_card")._meta.ui.resourceUri,
    "ui://patchouli/review-card.html",
  );

  const resource = await client.readResource({ uri: "ui://patchouli/review-card.html" });
  assert.equal(resource.contents[0].mimeType, "text/html;profile=mcp-app");
  assert.match(resource.contents[0].text, /ui\/initialize/u);
  assert.match(resource.contents[0].text, /tools\/call/u);
  assert.match(resource.contents[0].text, /Save card/u);
  assert.match(resource.contents[0].text, /Update card/u);
});

test("runs configuration, preview, confirmed save, idempotent replay, search, and read end to end", async (context) => {
  const { client, vault } = await fixture(context);
  const initial = structured(await client.callTool({ name: "get_configuration", arguments: {} }));
  assert.deepEqual(initial, { ok: true, status: { configured: false, warnings: [] } });

  const configured = structured(await client.callTool({
    name: "configure_vault",
    arguments: { vaultPath: vault, cardsDirectory: "Knowledge/Patchouli" },
  }));
  assert.equal(configured.ok, true);
  assert.equal(configured.status.configuration.cardsDirectory, "Knowledge/Patchouli");
  assert.deepEqual(configured.status.warnings, []);

  const previewResult = await client.callTool({
    name: "preview_card",
    arguments: { draft: draft() },
  });
  const preview = structured(previewResult).preview;
  assert.equal(preview.collision.exists, false);
  assert.equal(preview.draft.filename, "Reviewed Capture.md");
  assert.equal(preview.confirmationRequired, true);
  assert.match(previewResult.content[0].text, /Only after explicit confirmation/u);
  assert.match(previewResult.content[0].text, /Core:/u);
  assert.match(previewResult.content[0].text, /FYI:/u);

  const firstSave = structured(await client.callTool({
    name: "save_card",
    arguments: { pendingToken: preview.pendingToken, draft: draft() },
  }));
  assert.equal(firstSave.ok, true);
  assert.equal(firstSave.idempotentReplay, false);
  assert.equal(firstSave.card.cardRef, "Knowledge/Patchouli/Reviewed Capture.md");

  const replay = structured(await client.callTool({
    name: "save_card",
    arguments: { pendingToken: preview.pendingToken, draft: draft() },
  }));
  assert.equal(replay.ok, true);
  assert.equal(replay.idempotentReplay, true);
  assert.equal((await readdir(path.join(vault, "Knowledge", "Patchouli"))).length, 1);

  const categories = structured(await client.callTool({ name: "list_categories", arguments: {} }));
  assert.deepEqual(categories.categories, [
    { name: "Learning", count: 1 },
    { name: "Local", count: 1 },
  ]);
  const search = structured(await client.callTool({
    name: "search_cards",
    arguments: { query: "authoritative", categories: ["local"], limit: 3 },
  }));
  assert.equal(search.results[0].title, "Reviewed Capture");
  const card = structured(await client.callTool({
    name: "get_card",
    arguments: { cardRef: search.results[0].cardRef },
  })).card;
  assert.match(card.markdown, /## Core/u);
  const displayFormula = "$$\n\\int_0^1 x^2\\,dx = \\frac{1}{3}\n$$";
  assert.match(card.markdown, /\$\$\n\\int_0\^1 x\^2\\,dx = \\frac\{1\}\{3\}\n\$\$/u);
  assert.ok((await readFile(path.join(vault, firstSave.card.cardRef), "utf8")).includes(displayFormula));
  assert.doesNotMatch(card.markdown, /Key Concepts|My Understanding|Annotations/u);

  const collision = structured(await client.callTool({
    name: "preview_card",
    arguments: { draft: draft() },
  }));
  assert.equal(collision.preview.collision.exists, true);
  assert.match(await readFile(path.join(vault, collision.preview.collision.cardRef), "utf8"), /Reviewed Capture/u);
});

test("returns lexical link signals and structured validation, token, and collision errors", async (context) => {
  const { client, vault } = await fixture(context);
  await client.callTool({ name: "configure_vault", arguments: { vaultPath: vault } });
  const firstPreview = structured(await client.callTool({
    name: "preview_card",
    arguments: { draft: draft("Local Markdown") },
  })).preview;
  await client.callTool({
    name: "save_card",
    arguments: { pendingToken: firstPreview.pendingToken, draft: draft("Local Markdown") },
  });

  const suggestions = structured(await client.callTool({
    name: "suggest_links",
    arguments: {
      title: "Separate Concept",
      categories: ["Unrelated"],
      summary: "Terse overview.",
      detail: "The source dialogue is the only matching phrase.",
      limit: 5,
    },
  }));
  assert.equal(suggestions.candidates[0].title, "Local Markdown");
  assert.ok(suggestions.candidates[0].score > 0);
  assert.match(suggestions.candidates[0].lexicalReason, /lexical score/u);

  const retiredField = await client.callTool({
    name: "preview_card",
    arguments: { draft: { ...draft("Retired Field"), annotation: "must not be silently discarded" } },
  });
  assert.equal(retiredField.isError, true);
  assert.match(retiredField.content[0].text, /annotation|unrecognized|invalid/iu);

  const invalidToken = await client.callTool({
    name: "save_card",
    arguments: { pendingToken: "x".repeat(40), draft: draft("Never Saved") },
  });
  assert.equal(invalidToken.isError, true);
  assert.equal(structured(invalidToken).error.code, "TOKEN_INVALID");

  const consumed = await client.callTool({
    name: "save_card",
    arguments: {
      pendingToken: firstPreview.pendingToken,
      draft: draft("A Different Final Draft"),
    },
  });
  assert.equal(consumed.isError, true);
  assert.equal(structured(consumed).error.code, "TOKEN_CONSUMED");

  const collisionPreview = structured(await client.callTool({
    name: "preview_card",
    arguments: { draft: draft("Local Markdown") },
  })).preview;
  const collision = await client.callTool({
    name: "save_card",
    arguments: { pendingToken: collisionPreview.pendingToken, draft: draft("Local Markdown") },
  });
  assert.equal(collision.isError, true);
  assert.equal(structured(collision).error.code, "COLLISION");
});

test("expires abandoned preview tokens without writing a card", async (context) => {
  const { client, vault } = await fixture(context, 5);
  await client.callTool({ name: "configure_vault", arguments: { vaultPath: vault } });
  const preview = structured(await client.callTool({
    name: "preview_card",
    arguments: { draft: draft("Expired Draft") },
  })).preview;
  await new Promise((resolve) => setTimeout(resolve, 15));
  const result = await client.callTool({
    name: "save_card",
    arguments: { pendingToken: preview.pendingToken, draft: draft("Expired Draft") },
  });
  assert.equal(result.isError, true);
  assert.equal(structured(result).error.code, "TOKEN_EXPIRED");
  await assert.rejects(readFile(path.join(vault, "Patchouli", "Expired Draft.md"), "utf8"), /ENOENT/u);
});

test("launches task capture, updates an exact card revision, and consumes only confirmed checkpoints", async (context) => {
  const { client, vault, appData, sessionId } = await fixture(context);
  await client.callTool({ name: "configure_vault", arguments: { vaultPath: vault } });

  const launchedResult = await client.callTool({ name: "launch_patchouli", arguments: {} });
  const launched = structured(launchedResult);
  assert.equal(launched.status.active, true);
  assert.equal(launched.indicator, "Patchouli capture active");
  assert.equal(launched.indicatorImagePath, path.join(pluginRoot, "assets/patchouli-launch.png"));
  const icon = launchedResult.content.find(item => item.type === "image");
  assert.equal(icon.mimeType, "image/png");
  assert.deepEqual(Buffer.from(icon.data, "base64"), await readFile(launched.indicatorImagePath));
  assert.match(launchedResult.content[0].text, /Patchouli capture active/u);

  const initialPreview = structured(await client.callTool({
    name: "preview_card",
    arguments: { draft: draft("Evolving Concept") },
  })).preview;
  const initial = structured(await client.callTool({
    name: "save_card",
    arguments: { pendingToken: initialPreview.pendingToken, draft: draft("Evolving Concept") },
  })).card;

  const checkpointStore = new CheckpointStore({
    root: path.join(appData, "Patchouli", "session-checkpoints"),
  });
  const replacement = await checkpointStore.replaceFromCompaction(sessionId, {
    trigger: "auto",
    turnId: "turn-2",
    model: "test-model",
    messageCount: 12,
    transcriptDigest: "a".repeat(64),
    generationStartedAtMs: Date.now(),
    drafts: [draft("Evolving Concept"), draft("A New Topic")],
  });
  const checkpoint = replacement.checkpoints[0];
  const ended = spawnSync(process.execPath, [path.join(pluginRoot, "dist", "hook.mjs"), "session-end"], {
    input: JSON.stringify({ session_id: sessionId }),
    encoding: "utf8",
    env: { ...process.env, PATCHOULI_CHECKPOINT_ROOT: checkpointStore.root },
  });
  assert.equal(ended.status, 0, ended.stderr || ended.stdout);
  assert.equal(ended.stdout, "");
  assert.equal(structured(await client.callTool({ name: "get_patchouli_status", arguments: {} })).status.active, false);
  assert.deepEqual(structured(await client.callTool({ name: "get_checkpoint_drafts", arguments: {} })).checkpoints, replacement.checkpoints);

  // A failed create after session end must retain both the referenced and unrelated drafts.
  const collisionPreview = structured(await client.callTool({
    name: "preview_card",
    arguments: {
      draft: draft("Evolving Concept"),
      checkpointRefs: [{ checkpointId: checkpoint.checkpointId, revision: checkpoint.revision }],
    },
  })).preview;
  const collisionSave = await client.callTool({
    name: "save_card",
    arguments: { pendingToken: collisionPreview.pendingToken, draft: draft("Evolving Concept") },
  });
  assert.equal(collisionSave.isError, true);
  assert.deepEqual(await checkpointStore.list(sessionId), replacement.checkpoints);
  const beforeUpdate = structured(await client.callTool({
    name: "get_card",
    arguments: { cardRef: initial.cardRef },
  })).card;
  const updatedDraft = {
    ...draft("Evolved Concept"),
    summaryMarkdown: "A refined summary after the conversation continued.",
    detailMarkdown: "The prior detail remains, while the checkpoint adds a concrete refinement with $x+1$.",
  };
  const updatePreview = structured(await client.callTool({
    name: "preview_card_update",
    arguments: {
      cardRef: beforeUpdate.cardRef,
      expectedRevision: beforeUpdate.revision,
      draft: updatedDraft,
      checkpointRefs: [{ checkpointId: checkpoint.checkpointId, revision: checkpoint.revision }],
    },
  })).preview;
  assert.equal(updatePreview.operation, "update");
  assert.equal(updatePreview.destination.renamed, true);

  const update = structured(await client.callTool({
    name: "update_card",
    arguments: { pendingToken: updatePreview.pendingToken, draft: updatedDraft },
  }));
  assert.equal(update.ok, true);
  assert.equal(update.previousCardRef, initial.cardRef);
  assert.equal(update.card.id, initial.id);
  assert.equal(update.card.createdAt, initial.createdAt);
  assert.ok(update.card.updatedAt);
  assert.notEqual(update.card.revision, beforeUpdate.revision);
  const remaining = structured(await client.callTool({ name: "get_checkpoint_drafts", arguments: {} })).checkpoints;
  assert.deepEqual(remaining.map((item) => item.draft.title), ["A New Topic"]);
  await assert.rejects(readFile(path.join(vault, initial.cardRef), "utf8"), /ENOENT/u);

  const replay = structured(await client.callTool({
    name: "update_card",
    arguments: { pendingToken: updatePreview.pendingToken, draft: updatedDraft },
  }));
  assert.equal(replay.idempotentReplay, true);

  const newCardDraft = draft("A New Topic");
  newCardDraft.connections = [{ cardRef: update.card.cardRef, title: update.card.title, reason: "The continued conversation connects these concepts.", selected: true }];
  const newPreview = structured(await client.callTool({
    name: "preview_card",
    arguments: {
      draft: newCardDraft,
      checkpointRefs: [{ checkpointId: remaining[0].checkpointId, revision: remaining[0].revision }],
    },
  })).preview;
  assert.equal((structured(await client.callTool({ name: "get_checkpoint_drafts", arguments: {} }))).checkpoints.length, 1);
  const newCard = structured(await client.callTool({
    name: "save_card",
    arguments: { pendingToken: newPreview.pendingToken, draft: newCardDraft },
  })).card;
  assert.equal(newCard.title, "A New Topic");
  assert.equal((structured(await client.callTool({ name: "get_checkpoint_drafts", arguments: {} }))).checkpoints.length, 0);
  const found = structured(await client.callTool({ name: "search_cards", arguments: { query: "A New Topic", limit: 1 } })).results;
  const read = structured(await client.callTool({ name: "get_card", arguments: { cardRef: found[0].cardRef } })).card;
  assert.equal(read.id, newCard.id);
  assert.match(read.markdown, /\[\[Evolved Concept\|Evolved Concept\]\]/u);
  assert.deepEqual(structured(await client.callTool({ name: "search_cards", arguments: { query: "heliopause" } })).results, []);

  const conflictPreview = structured(await client.callTool({
    name: "preview_card_update",
    arguments: {
      cardRef: update.card.cardRef,
      expectedRevision: update.card.revision,
      draft: { ...updatedDraft, summaryMarkdown: "Would overwrite a manual edit." },
    },
  })).preview;
  const updatedPath = path.join(vault, update.card.cardRef);
  await writeFile(updatedPath, `${await readFile(updatedPath, "utf8")}\nManual concurrent note.\n`, "utf8");
  const conflict = await client.callTool({
    name: "update_card",
    arguments: {
      pendingToken: conflictPreview.pendingToken,
      draft: (({ filename: _filename, ...reviewedDraft }) => reviewedDraft)(conflictPreview.draft),
    },
  });
  assert.equal(conflict.isError, true);
  assert.equal(structured(conflict).error.code, "REVISION_CONFLICT");
  assert.match(await readFile(updatedPath, "utf8"), /Manual concurrent note/u);
});

test("missing task context prevents task operations and review without blocking configuration", async (context) => {
  const { client, vault } = await fixture(context, undefined, { PATCHOULI_SESSION_ID: "", CODEX_SESSION_ID: "", CODEX_THREAD_ID: "" });
  assert.equal(structured(await client.callTool({ name: "configure_vault", arguments: { vaultPath: vault } })).ok, true);
  for (const name of ["launch_patchouli", "get_patchouli_status", "stop_patchouli", "get_checkpoint_drafts", "discard_checkpoint_drafts", "preview_card"]) {
    const result = structured(await client.callTool({ name, arguments: name === "preview_card" ? { draft: draft() } : {} }));
    assert.equal(result.error.code, "SESSION_CONTEXT_MISSING", name);
  }
  assert.deepEqual(await readdir(vault), [".obsidian"]);
});

test("shared MCP processes isolate request-scoped checkpoints and preview retries between tasks", async (context) => {
  const { client, vault, appData, sessionId: staleEnvironmentTask } = await fixture(context);
  const call = async (task, name, args = {}) => structured(await client.callTool({ name, arguments: args, _meta: { threadId: task, "x-codex-turn-metadata": { thread_id: task, session_id: task } } }));
  await call("task-a", "configure_vault", { vaultPath: vault });
  const [a, b] = await Promise.all([call("task-a", "launch_patchouli"), call("task-b", "launch_patchouli")]);
  assert.notEqual(a.status.launchId, b.status.launchId);
  const store = new CheckpointStore({ root: path.join(appData, "Patchouli", "session-checkpoints") });
  assert.equal((await store.status(staleEnvironmentTask)).active, false);
  const generated = await store.replaceFromCompaction("task-a", { trigger: "manual", turnId: "one", model: "fixture", messageCount: 2, transcriptDigest: "f".repeat(64), generationStartedAtMs: Date.now(), drafts: [draft("Task A concept")] });
  const checkpointRefs = generated.checkpoints.map(({ checkpointId, revision }) => ({ checkpointId, revision }));
  assert.equal((await call("task-a", "get_checkpoint_drafts")).checkpoints.length, 1);
  assert.deepEqual((await call("task-b", "get_checkpoint_drafts")).checkpoints, []);
  assert.equal((await call("task-b", "discard_checkpoint_drafts", { checkpointRefs })).discardedCount, 0);
  await call("task-b", "stop_patchouli");
  assert.equal((await call("task-a", "get_patchouli_status")).status.active, true);
  const reviewed = draft("Task A concept");
  const preview = (await call("task-a", "preview_card", { draft: reviewed, checkpointRefs })).preview;
  const args = { pendingToken: preview.pendingToken, draft: reviewed };
  assert.equal((await call("task-b", "save_card", args)).error.code, "TOKEN_INVALID");
  assert.equal((await store.list("task-a")).length, 1);
  const [saved, denied] = await Promise.all([call("task-a", "save_card", args), call("task-b", "save_card", args)]);
  assert.equal(saved.ok, true);
  assert.equal(denied.error.code, "TOKEN_INVALID");
  assert.equal((await call("task-a", "save_card", args)).idempotentReplay, true);
  assert.equal((await call("task-b", "save_card", args)).error.code, "TOKEN_INVALID");
  assert.equal((await call("task-a", "update_card", args)).error.code, "TOKEN_INVALID");
  assert.deepEqual(await store.list("task-a"), []);
  const changed = { ...reviewed, summaryMarkdown: "Confirmed task A refinement." };
  const update = (await call("task-a", "preview_card_update", { cardRef: saved.card.cardRef, expectedRevision: saved.card.revision, draft: changed })).preview;
  const updateArgs = { pendingToken: update.pendingToken, draft: changed };
  assert.equal((await call("task-b", "update_card", updateArgs)).error.code, "TOKEN_INVALID");
  assert.equal((await call("task-a", "update_card", updateArgs)).ok, true);
  assert.equal((await call("task-b", "update_card", updateArgs)).error.code, "TOKEN_INVALID");
  assert.equal((await call("task-a", "save_card", updateArgs)).error.code, "TOKEN_INVALID");
});

test("exercises status, stop, discard and invalid inputs through the platform launcher", async (context) => {
  const { client, vault, appData, sessionId } = await fixture(context);
  const call = async (name, args = {}) => structured(await client.callTool({ name, arguments: args }));
  assert.equal((await call("get_patchouli_status")).status.active, false);
  assert.equal((await call("search_cards", { query: "nothing" })).error.code, "CONFIGURATION_MISSING");
  assert.equal((await call("configure_vault", { vaultPath: "relative" })).error.code, "VALIDATION_ERROR");
  await call("configure_vault", { vaultPath: vault });
  assert.deepEqual((await call("search_cards", { query: "unavailable evidence" })).results, []);
  assert.deepEqual((await call("list_categories")).categories, []);
  const launch = await call("launch_patchouli");
  assert.equal((await call("launch_patchouli")).status.launchId, launch.status.launchId);
  const store = new CheckpointStore({ root: path.join(appData, "Patchouli", "session-checkpoints") });
  const generated = await store.replaceFromCompaction(sessionId, { trigger: "manual", turnId: "manual", model: "test", messageCount: 2, transcriptDigest: "e".repeat(64), generationStartedAtMs: Date.now(), drafts: [draft("Keep"), draft("Discard")] });
  assert.equal((await call("stop_patchouli")).status.checkpointCount, 2);
  assert.equal((await call("get_checkpoint_drafts")).checkpoints.length, 2);
  const ref = (({ checkpointId, revision }) => ({ checkpointId, revision }))(generated.checkpoints[1]);
  assert.equal((await call("discard_checkpoint_drafts", { checkpointRefs: [ref] })).discardedCount, 1);
  assert.equal((await call("discard_checkpoint_drafts", { checkpointRefs: [ref] })).discardedCount, 0);
  assert.equal((await call("discard_checkpoint_drafts")).discardedCount, 1);
  assert.equal((await call("get_patchouli_status")).status.checkpointCount, 0);
  assert.equal((await call("stop_patchouli", { discardCheckpointDrafts: true })).status.active, false);
  for (const [name, args] of [
    ["search_cards", { query: "x", limit: 0 }],
    ["get_card", { cardRef: "" }],
    ["suggest_links", { title: "x", categories: [], summary: "s", detail: "d", limit: 21 }],
    ["discard_checkpoint_drafts", { checkpointRefs: [{ checkpointId: "bad", revision: "bad" }] }],
    ["stop_patchouli", { discardCheckpointDrafts: "true" }],
    ["preview_card_update", { cardRef: "x", expectedRevision: "bad", draft: draft() }],
  ]) assert.equal((await client.callTool({ name, arguments: args })).isError, true, name);
});

test("concurrent confirmed saves are idempotent and create/update tokens cannot be swapped", async (context) => {
  const { client, vault } = await fixture(context);
  await client.callTool({ name: "configure_vault", arguments: { vaultPath: vault } });
  const reviewed = { ...draft("Concurrent"), sources: [{ type: "paper", label: "Example reference", url: "https://example.com/real-source" }], connections: [{ cardRef: "Patchouli/Related.md", title: "Related", reason: "Shared concept", selected: true }] };
  const previewResult = await client.callTool({ name: "preview_card", arguments: { draft: reviewed } });
  assert.match(previewResult.content[0].text, /Example reference[\s\S]*https:\/\/example.com\/real-source/u);
  assert.match(previewResult.content[0].text, /\[x\] Related[\s\S]*Shared concept/u);
  const preview = structured(previewResult).preview;
  const wrong = structured(await client.callTool({ name: "update_card", arguments: { pendingToken: preview.pendingToken, draft: reviewed } }));
  assert.equal(wrong.error.code, "TOKEN_INVALID");
  const results = await Promise.all(Array.from({ length: 4 }, () => client.callTool({ name: "save_card", arguments: { pendingToken: preview.pendingToken, draft: reviewed } })));
  assert.equal(results.filter((result) => structured(result).idempotentReplay === false).length, 1);
  const card = structured(results[0]).card;
  const next = { ...reviewed, summaryMarkdown: "Updated." };
  const updatePreview = await client.callTool({ name: "preview_card_update", arguments: { cardRef: card.cardRef, expectedRevision: card.revision, draft: next } });
  assert.match(updatePreview.content[0].text, /Example reference[\s\S]*Shared concept/u);
  assert.equal(structured(await client.callTool({ name: "save_card", arguments: { pendingToken: structured(updatePreview).preview.pendingToken, draft: next } })).error.code, "TOKEN_INVALID");
  assert.equal((await readdir(path.join(vault, "Patchouli"))).length, 1);
});
