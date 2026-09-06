import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const expectedTools = [
  "configure_vault",
  "get_card",
  "get_configuration",
  "list_categories",
  "preview_card",
  "save_card",
  "search_cards",
  "suggest_links",
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

async function fixture(context, ttlMs) {
  const root = await mkdtemp(path.join(tmpdir(), "patchouli-mcp-"));
  const vault = path.join(root, "vault");
  const appData = path.join(root, "appdata");
  await mkdir(path.join(vault, ".obsidian"), { recursive: true });
  await mkdir(appData, { recursive: true });

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.join(pluginRoot, "dist", "server.mjs")],
    cwd: pluginRoot,
    env: {
      ...process.env,
      APPDATA: appData,
      ...(ttlMs ? { PATCHOULI_PREVIEW_TTL_MS: String(ttlMs) } : {}),
    },
    stderr: "pipe",
  });
  const client = new Client({ name: "patchouli-mcp-tests", version: "0.1.0" });
  await client.connect(transport);
  context.after(async () => {
    await client.close();
    await rm(root, { recursive: true, force: true });
  });
  return { client, vault };
}

function structured(result) {
  assert.equal(typeof result.structuredContent, "object");
  return result.structuredContent;
}

test("advertises eight explicit contracts, accurate annotations, and the MCP App resource", async (context) => {
  const { client } = await fixture(context);
  const listed = await client.listTools();
  assert.deepEqual(listed.tools.map((tool) => tool.name).sort(), expectedTools);

  for (const tool of listed.tools) {
    assert.equal(tool.inputSchema.type, "object", `${tool.name} input schema`);
    assert.equal(tool.outputSchema.type, "object", `${tool.name} output schema`);
    assert.equal(tool.annotations.openWorldHint, false, `${tool.name} stays local`);
  }
  assert.equal(listed.tools.find((tool) => tool.name === "save_card").annotations.readOnlyHint, false);
  assert.equal(listed.tools.find((tool) => tool.name === "save_card").annotations.idempotentHint, true);
  assert.equal(listed.tools.find((tool) => tool.name === "preview_card").annotations.readOnlyHint, true);
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
  assert.match(previewResult.content[0].text, /Detail:/u);

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
  assert.match(card.markdown, /## Detail/u);
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
