import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { Client } from "../../plugins/patchouli/node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js";
import { StdioClientTransport } from "../../plugins/patchouli/node_modules/@modelcontextprotocol/sdk/dist/esm/client/stdio.js";

const installedRootValue = process.env.PATCHOULI_INSTALLED_ROOT?.trim();
if (!installedRootValue) throw new Error("PATCHOULI_INSTALLED_ROOT must identify the installed plugin root.");
const installedRoot = path.resolve(installedRootValue);
const keepTemporary = process.env.PATCHOULI_KEEP_ACCEPTANCE_TEMP === "1";
const temporary = await mkdtemp(path.join(tmpdir(), "patchouli-windows-installed-"));
const vault = path.join(temporary, "vault 空格");
const dataRoot = path.join(temporary, "appdata", "Patchouli");
const checkpointRoot = path.join(dataRoot, "session-checkpoints");
const sessionId = `windows-installed-${Date.now()}`;
const cardsDirectory = path.join(vault, "Windows Acceptance");
const configuration = JSON.parse(await readFile(path.join(installedRoot, ".mcp.json"), "utf8"));
const server = configuration.mcpServers.patchouli;
assert.equal(server.command, "cmd.exe");

const environment = {
  ...process.env,
  APPDATA: path.join(temporary, "appdata"),
  PATCHOULI_DATA_ROOT: dataRoot,
  PATCHOULI_CHECKPOINT_ROOT: checkpointRoot,
  PATCHOULI_SESSION_ID: sessionId,
};
const client = new Client({ name: "patchouli-windows-installed-acceptance", version: "2.0.0" });
const transport = new StdioClientTransport({
  command: server.command,
  args: server.args,
  cwd: installedRoot,
  env: environment,
  stderr: "pipe",
});
const metadata = {
  threadId: sessionId,
  "x-codex-turn-metadata": { thread_id: sessionId, session_id: sessionId },
};
const call = (name, argumentsValue = {}) => client.callTool({ name, arguments: argumentsValue, _meta: metadata });
const structured = (result) => {
  assert.equal(typeof result.structuredContent, "object", `${result} must have structuredContent`);
  return result.structuredContent;
};
const draft = (title, extra = {}) => ({
  title,
  categories: ["Windows", "Acceptance"],
  summaryMarkdown: "Windows installed-package validation for readable connected concepts.",
  detailMarkdown: "### Mechanism\n\nUTF-8 represents Unicode code points as bytes. Byte-level tokenization may group those bytes differently. $n=4$\n\n$$\n2 + 2 = 4\n$$",
  fyiMarkdown: "### Example\n\n中文 and emoji 😀 exercise portable filenames and rendering.\n\n```text\nWindows v2\n```",
  evidence: [{ claim: "The installed Windows package completed the isolated MCP workflow.", sourceReference: "Stage 15 synthetic fixture" }],
  sources: [{ type: "text", label: "Stage 15 synthetic fixture" }],
  connections: [],
  ...extra,
});
const transcriptRow = (role, text) => JSON.stringify({
  type: "response_item",
  payload: { type: "message", role, content: [{ type: role === "user" ? "input_text" : "output_text", text }] },
});

const report = {
  platform: process.platform,
  architecture: process.arch,
  node: process.version,
  installedRoot,
  mcpCommand: server.command,
  sessionId,
  ...(keepTemporary ? { temporaryRoot: temporary, vault } : {}),
};

try {
  await mkdir(path.join(vault, ".obsidian"), { recursive: true });
  await client.connect(transport);
  const tools = (await client.listTools()).tools.map((tool) => tool.name).sort();
  assert.equal(tools.length, 17);
  report.toolCount = tools.length;
  assert.equal(structured(await call("get_configuration")).status.configured, false);
  assert.equal(structured(await call("launch_patchouli")).status.active, true);
  await call("configure_vault", { vaultPath: vault, cardsDirectory: "Windows Acceptance" });

  const group = {
    cards: [
      { key: "tokens", splitReason: "NLP segmentation mechanism", draft: draft("Windows Tokenization") },
      { key: "unicode", splitReason: "General encoding prerequisite", draft: draft("Windows Unicode 字符") },
    ],
    relationships: [{
      fromKey: "tokens",
      toKey: "unicode",
      reason: "UTF-8 bytes connect character encoding to byte-level tokenization.",
      selected: true,
    }],
  };
  const previewResult = await call("preview_capture", group);
  const preview = structured(previewResult).capturePreview;
  assert.equal(preview.cards.length, 2);
  const beforeSave = await readdir(cardsDirectory).catch((error) => error.code === "ENOENT" ? [] : Promise.reject(error));
  assert.deepEqual(beforeSave, []);
  const saved = structured(await call("save_capture", { pendingToken: preview.pendingToken }));
  assert.equal(saved.ok, true);
  assert.equal(saved.cards.length, 2);
  assert.match(saved.cards[0].markdown, /\[\[Windows Unicode 字符\|Windows Unicode 字符\]\]/u);
  assert.equal(structured(await call("save_capture", { pendingToken: preview.pendingToken })).idempotentReplay, true);

  const transcriptPath = path.join(temporary, "transcript.jsonl");
  const fixturePath = path.join(temporary, "checkpoint.json");
  await writeFile(transcriptPath, [
    transcriptRow("user", "Explain why UTF-8 byte length and token count are different."),
    transcriptRow("assistant", "Encoding produces bytes first; a tokenizer then applies its vocabulary and merge rules."),
  ].join("\n"), "utf8");
  await writeFile(fixturePath, JSON.stringify({ drafts: [draft("Checkpoint refinement")] }), "utf8");
  const hookEnvironment = { ...environment, NODE_ENV: "test", PLUGIN_ROOT: installedRoot, PATCHOULI_HOOK_DRAFT_FIXTURE_PATH: fixturePath };
  const runHook = (mode) => spawnSync("cmd.exe", [
    "/d", "/s", "/c", "call",
    path.join(installedRoot, "scripts", "launch-patchouli-hook.cmd"),
    path.join(installedRoot, "dist", "hook.mjs"),
    mode,
  ], {
    cwd: installedRoot,
    input: JSON.stringify({ session_id: sessionId, transcript_path: transcriptPath, turn_id: "stage-15", trigger: "manual", model: "fixture" }),
    encoding: "utf8",
    windowsHide: true,
    env: hookEnvironment,
  });
  const compacted = runHook("precompact");
  assert.equal(compacted.status, 0, compacted.stderr || compacted.stdout);
  assert.equal(compacted.stdout, "");
  const checkpoints = structured(await call("get_checkpoint_drafts")).checkpoints;
  assert.equal(checkpoints.length, 1);
  const ended = runHook("session-end");
  assert.equal(ended.status, 0, ended.stderr || ended.stdout);
  const endedStatus = structured(await call("get_patchouli_status")).status;
  assert.equal(endedStatus.active, false);
  assert.equal(endedStatus.checkpointCount, 1);

  const current = structured(await call("get_card", { cardRef: saved.cards[0].cardRef })).card;
  const updatedDraft = draft("Windows Tokenization", {
    summaryMarkdown: "The reviewed Windows update retains identity and consumes its selected checkpoint.",
    connections: [{
      cardRef: saved.cards[1].cardRef,
      title: saved.cards[1].title,
      reason: "UTF-8 bytes connect character encoding to byte-level tokenization.",
      selected: true,
    }],
  });
  const updatePreview = structured(await call("preview_card_update", {
    cardRef: current.cardRef,
    expectedRevision: current.revision,
    draft: updatedDraft,
    checkpointRefs: [{ checkpointId: checkpoints[0].checkpointId, revision: checkpoints[0].revision }],
  })).preview;
  const updated = structured(await call("update_card", { pendingToken: updatePreview.pendingToken, draft: updatedDraft }));
  assert.equal(updated.ok, true);
  assert.equal(updated.card.id, current.id);
  assert.equal(structured(await call("update_card", { pendingToken: updatePreview.pendingToken, draft: updatedDraft })).idempotentReplay, true);
  assert.equal(structured(await call("get_checkpoint_drafts")).checkpoints.length, 0);

  const stalePreview = structured(await call("preview_card_update", {
    cardRef: updated.card.cardRef,
    expectedRevision: updated.card.revision,
    draft: { ...updatedDraft, summaryMarkdown: "This stale preview must not overwrite a manual edit." },
  })).preview;
  const updatedPath = path.join(vault, updated.card.cardRef);
  await writeFile(updatedPath, `${await readFile(updatedPath, "utf8")}\nManual concurrent note.\n`, "utf8");
  const conflict = structured(await call("update_card", {
    pendingToken: stalePreview.pendingToken,
    draft: { ...updatedDraft, summaryMarkdown: "This stale preview must not overwrite a manual edit." },
  }));
  assert.equal(conflict.error.code, "REVISION_CONFLICT");

  const matches = structured(await call("search_cards", { query: "UTF-8 tokenization" })).results;
  assert.ok(matches.length >= 2);
  const readBack = structured(await call("get_card", { cardRef: updated.card.cardRef })).card;
  assert.match(readBack.markdown, /Manual concurrent note/u);
  const appearance = JSON.parse(await readFile(path.join(vault, ".obsidian", "appearance.json"), "utf8"));
  assert.ok(appearance.enabledCssSnippets.includes("patchouli-cards-v2"));
  const snippet = await readFile(path.join(vault, ".obsidian", "snippets", "patchouli-cards-v2.css"), "utf8");
  assert.match(snippet, /\.patchouli-card/u);
  assert.deepEqual((await readdir(cardsDirectory)).sort(), ["Windows Tokenization.md", "Windows Unicode 字符.md"]);

  Object.assign(report, {
    configuredCardsDirectory: "Windows Acceptance",
    previewCardCount: preview.cards.length,
    savedCardCount: saved.cards.length,
    idempotentReplay: true,
    checkpointCountAfterCompact: checkpoints.length,
    sessionEndRetainedCheckpoint: endedStatus.checkpointCount === 1,
    checkpointCountAfterUpdate: 0,
    updatePreservedId: updated.card.id === current.id,
    revisionConflictProtectedManualEdit: conflict.error.code === "REVISION_CONFLICT",
    searchResultCount: matches.length,
    presentationProvisioned: true,
    cards: (await readdir(cardsDirectory)).sort(),
  });
  console.log(JSON.stringify(report, null, 2));
} finally {
  await client.close().catch(() => undefined);
  if (!keepTemporary) await rm(temporary, { recursive: true, force: true });
}
