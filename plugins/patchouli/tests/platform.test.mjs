import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { chmod, cp, mkdir, mkdtemp, readFile, readdir, realpath, rm, stat, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { CheckpointStore, ConfigurationStore, VaultCardEngine, currentPatchouliSessionId, getApplicationDataDirectory, getDefaultConfigurationPath, normalizeRelativePath, sanitizeTitleToFilename } from "../dist/core.mjs";
import { mcpConfiguration, transportOptions } from "../scripts/runtime-config.mjs";

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mac = { skip: process.platform !== "darwin" };
const draft = (title = "Mac 知识 🌿") => ({ title, categories: ["Parity"], summaryMarkdown: "A concise summary.", detailMarkdown: "### Formula\n\nThe detail preserves $x^2$ and\n\n$$\nx = \\frac{2}{1}\n$$", evidence: [{ claim: "A paraphrased claim", sourceReference: "Fixture" }], sources: [], connections: [] });
async function fixture(t) {
  const root = await realpath(await mkdtemp(path.join(tmpdir(), "patchouli-platform-")));
  t.after(() => rm(root, { recursive: true, force: true }));
  const vault = path.join(root, "vault 空格");
  await mkdir(vault);
  const engine = new VaultCardEngine({ configurationPath: path.join(root, "private", "configuration.json") });
  await engine.configureVault({ vaultPath: vault });
  return { root, vault, engine };
}
const code = (expected) => (error) => error?.code === expected;

test("Codex request metadata identifies the task and rejects inconsistent identities", () => {
  assert.equal(currentPatchouliSessionId({ threadId: "request-task" }), "request-task");
  assert.equal(currentPatchouliSessionId({ "x-codex-turn-metadata": { thread_id: "request-task", session_id: "request-task" } }), "request-task");
  assert.equal(currentPatchouliSessionId({ threadId: "request-task", "x-codex-turn-metadata": { session_id: "request-task" } }), "request-task");
  for (const meta of [{ threadId: 7 }, { threadId: " " }, { threadId: "one", "x-codex-turn-metadata": { thread_id: "two" } }]) {
    assert.throws(() => currentPatchouliSessionId(meta), code("SESSION_CONTEXT_MISSING"));
  }
});

test("resolves Mac and Windows data directories independently of the test host", () => {
  assert.equal(getDefaultConfigurationPath({ HOME: "/Users/姓名", APPDATA: "ignored" }, "darwin"), "/Users/姓名/Library/Application Support/Patchouli/configuration.json");
  assert.equal(getApplicationDataDirectory({ APPDATA: "C:\\Users\\Name\\AppData\\Roaming" }, "win32"), "C:\\Users\\Name\\AppData\\Roaming\\Patchouli");
  assert.equal(getApplicationDataDirectory({}, "darwin", "/Users/fallback"), "/Users/fallback/Library/Application Support/Patchouli");
  assert.equal(getApplicationDataDirectory({ PATCHOULI_DATA_ROOT: "/private/tmp/isolated" }, "darwin"), "/private/tmp/isolated");
  for (const platform of ["darwin", "win32"]) assert.throws(() => getApplicationDataDirectory({ PATCHOULI_DATA_ROOT: "../escape" }, platform), code("CONFIGURATION_INVALID"));
  assert.throws(() => getApplicationDataDirectory({ HOME: "relative" }, "darwin"), code("CONFIGURATION_INVALID"));
  assert.throws(() => getApplicationDataDirectory({}, "linux"), code("CONFIGURATION_INVALID"));
});

test("stores Mac configuration privately and reports malformed stored configuration", mac, async (t) => {
  const { engine } = await fixture(t);
  const location = engine.configurationStore.configurationPath;
  assert.equal((await stat(location)).mode & 0o777, 0o600);
  assert.equal((await stat(path.dirname(location))).mode & 0o777, 0o700);
  await writeFile(location, "{broken");
  await assert.rejects(engine.getConfiguration(), code("CONFIGURATION_INVALID"));
  await writeFile(location, JSON.stringify({ vaultPath: 1 }));
  await assert.rejects(engine.getConfiguration(), code("CONFIGURATION_INVALID"));
});

test("rejects an unwritable Mac vault and an unwritable cards directory", mac, async (t) => {
  const { root, vault, engine } = await fixture(t);
  const locked = path.join(root, "locked");
  await mkdir(locked); await chmod(locked, 0o500);
  try { await assert.rejects(engine.configureVault({ vaultPath: locked }), code("VALIDATION_ERROR")); }
  finally { await chmod(locked, 0o700); }
  await mkdir(path.join(vault, "locked")); await chmod(path.join(vault, "locked"), 0o500);
  try { await assert.rejects(engine.configureVault({ vaultPath: vault, cardsDirectory: "locked" }), code("VALIDATION_ERROR")); }
  finally { await chmod(path.join(vault, "locked"), 0o700); }
});

test("long Chinese and emoji titles fit the filesystem byte limit and round-trip", async (t) => {
  const { engine } = await fixture(t);
  const title = "知识🌿".repeat(50);
  const filename = sanitizeTitleToFilename(title);
  assert.ok(Buffer.byteLength(filename) <= 240);
  const saved = await engine.writeCard(draft(title));
  assert.equal((await engine.getCard(saved.card.cardRef)).title, title);
});

test("rejects POSIX, Windows, UNC and drive-relative path escapes", () => {
  for (const value of ["/tmp/x", "C:\\x", "C:x", "\\\\server\\share", "../x", "Cards/../x", "Cards/./x", "Cards//../x"]) assert.throws(() => normalizeRelativePath(value), code("PATH_ESCAPE"));
});

test("rejects card symlinks outside the cards directory even inside the vault", async (t) => {
  const { vault, engine } = await fixture(t);
  await mkdir(path.join(vault, "Patchouli"));
  await writeFile(path.join(vault, "private.md"), "Private note");
  await symlink(path.join(vault, "private.md"), path.join(vault, "Patchouli", "escape.md"));
  await assert.rejects(engine.getCard("Patchouli/escape.md"), code("PATH_ESCAPE"));
  assert.deepEqual(await engine.scanCards(), []);
});

test("case-sensitive siblings cannot bypass the configured cards boundary", async (t) => {
  const { vault, engine } = await fixture(t);
  await mkdir(path.join(vault, "Patchouli"));
  let caseSensitive = true;
  try { await mkdir(path.join(vault, "patchouli")); } catch (error) { if (error.code === "EEXIST") caseSensitive = false; else throw error; }
  t.diagnostic(`Filesystem is case-${caseSensitive ? "sensitive" : "insensitive"}.`);
  if (caseSensitive) {
    await writeFile(path.join(vault, "patchouli", "outside.md"), "Outside configured cards.");
    await assert.rejects(engine.getCard("patchouli/outside.md"), code("PATH_ESCAPE"));
  } else {
    const saved = await engine.writeCard(draft("Inside"));
    assert.equal((await engine.getCard("patchouli/Inside.md")).id, saved.card.id);
  }
});

test("case-only updates and distinct destinations respect the volume's file identity", async (t) => {
  const { vault, engine } = await fixture(t);
  const saved = await engine.writeCard(draft("Alpha"));
  const lower = path.join(vault, "Patchouli", "alpha.md");
  let sameFile = true;
  try { await stat(lower); } catch (error) { if (error.code === "ENOENT") sameFile = false; else throw error; }
  if (!sameFile) {
    await writeFile(lower, "Distinct card");
    await assert.rejects(engine.updateCard(saved.card.cardRef, saved.card.revision, draft("alpha")), code("COLLISION"));
    assert.equal(await readFile(lower, "utf8"), "Distinct card");
    await rm(lower);
  }
  const updated = await engine.updateCard(saved.card.cardRef, saved.card.revision, draft("alpha"));
  assert.equal(updated.card.id, saved.card.id);
  assert.equal(updated.card.cardRef, sameFile ? "Patchouli/Alpha.md" : "Patchouli/alpha.md");
  assert.equal((await engine.scanCards()).length, 1);
});

test("canonically equivalent Unicode titles collide without losing the original", async (t) => {
  const { engine } = await fixture(t);
  const saved = await engine.writeCard(draft("Café"));
  await assert.rejects(engine.writeCard(draft("Cafe\u0301")), code("COLLISION"));
  assert.equal((await engine.getCard(saved.card.cardRef)).markdown, saved.card.markdown);
});

test("simultaneous creates produce one card and one collision", async (t) => {
  const { engine } = await fixture(t);
  const outcomes = await Promise.allSettled([engine.writeCard(draft()), engine.writeCard(draft())]);
  assert.equal(outcomes.filter((x) => x.status === "fulfilled").length, 1);
  assert.equal(outcomes.find((x) => x.status === "rejected").reason.code, "COLLISION");
  assert.equal((await engine.scanCards()).length, 1);
});

test("checkpoint locks serialize concurrent launches and retain private file permissions", mac, async (t) => {
  const { root } = await fixture(t);
  const store = new CheckpointStore({ root: path.join(root, "checkpoints") });
  const launched = await Promise.all(Array.from({ length: 8 }, () => store.launch("shared")));
  assert.equal(new Set(launched.map((x) => x.launchId)).size, 1);
  const dirs = await readdir(store.root);
  assert.equal((await stat(path.join(store.root, dirs[0], "state.json"))).mode & 0o777, 0o600);
  assert.equal((await stat(path.join(store.root, dirs[0]))).mode & 0o777, 0o700);
});

test("Mac Node launcher preserves arguments, exit codes and paths with spaces", mac, async (t) => {
  const { root } = await fixture(t);
  const nodeAlias = path.join(root, "node 空格"); await symlink(process.execPath, nodeAlias);
  const script = path.join(root, "arguments 中文.mjs");
  await writeFile(script, 'console.log(JSON.stringify(process.argv.slice(2))); process.exitCode=23;');
  const args = ["two words", "中文🌿", "$(do-not-execute)", "semi;colon", "single'quote", 'double"quote'];
  const run = spawnSync("/bin/sh", [path.join(pluginRoot, "scripts/run-with-codex-node.sh"), script, ...args], { encoding: "utf8", env: { PATH: "/usr/bin:/bin", CODEX_MCP_NODE_PATH: nodeAlias } });
  assert.equal(run.status, 23, run.stderr);
  assert.deepEqual(JSON.parse(run.stdout), args);
});

test("Mac runtime discovery tolerates stale hints and missing login-shell PATH", mac, () => {
  const run = spawnSync("/bin/sh", [path.join(pluginRoot, "scripts/run-with-codex-node.sh"), "--version"], { encoding: "utf8", env: { HOME: tmpdir(), PATH: "/usr/bin:/bin", CODEX_MCP_NODE_PATH: "/missing/node" } });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /^v\d+/u);
  const missingArgument = spawnSync("/bin/sh", [path.join(pluginRoot, "scripts/run-with-codex-node.sh")], { encoding: "utf8" });
  assert.equal(missingArgument.status, 64); assert.equal(missingArgument.stdout, "");
});

test("packaged MCP and hooks run from a relocated path without node_modules", mac, async (t) => {
  const { root } = await fixture(t);
  const copy = path.join(root, "package 空格", "patchouli");
  await mkdir(copy, { recursive: true });
  for (const entry of ["dist", "scripts", "hooks", ".mcp.json"]) await cp(path.join(pluginRoot, entry), path.join(copy, entry), { recursive: true });
  await assert.rejects(stat(path.join(copy, "node_modules")), code("ENOENT"));
  const env = { HOME: root, PATH: "/usr/bin:/bin", CODEX_MCP_NODE_PATH: process.execPath, PATCHOULI_DATA_ROOT: path.join(root, "state"), PATCHOULI_SESSION_ID: "relocated" };
  const configuration = JSON.parse(await readFile(path.join(copy, ".mcp.json"), "utf8"));
  // An absolute launcher path also works when a host starts outside the plugin root.
  const transport = new StdioClientTransport({ ...transportOptions(configuration, copy, env), cwd: root, args: [path.join(copy, "scripts/launch-patchouli-mcp.sh")] });
  const client = new Client({ name: "relocation-test", version: "1" });
  try {
    await client.connect(transport);
    assert.equal((await client.listTools()).tools.length, 15);
    assert.equal((await client.callTool({ name: "get_configuration", arguments: {} })).structuredContent.status.configured, false);
    await client.callTool({ name: "launch_patchouli", arguments: {} });
  } finally { await client.close(); }
  const hook = spawnSync("/bin/sh", [path.join(copy, "scripts/launch-patchouli-hook.sh"), "session-end"], { cwd: root, input: JSON.stringify({ session_id: "relocated" }), encoding: "utf8", env });
  assert.equal(hook.status, 0, hook.stderr); assert.equal(hook.stdout, "");
  assert.equal((await new CheckpointStore({ root: path.join(root, "state/session-checkpoints") }).status("relocated")).active, false);
});

test("launcher propagates termination and MCP startup errors stay on stderr", mac, async (t) => {
  const { root } = await fixture(t);
  const child = spawn("/bin/sh", [path.join(pluginRoot, "scripts/run-with-codex-node.sh"), "-e", 'process.stdout.write("ready");setInterval(()=>{},1000)'], { env: { ...process.env, CODEX_MCP_NODE_PATH: process.execPath }, stdio: ["ignore", "pipe", "pipe"] });
  t.after(() => { if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL"); });
  await new Promise((resolve, reject) => { child.stdout.once("data", resolve); child.once("error", reject); });
  const ended = new Promise((resolve) => child.once("exit", (code, signal) => resolve({ code, signal })));
  child.kill("SIGTERM"); assert.equal((await ended).signal, "SIGTERM");
  const failed = spawnSync("/bin/sh", [path.join(pluginRoot, "scripts/launch-patchouli-mcp.sh")], { encoding: "utf8", env: { HOME: root, CODEX_MCP_NODE_PATH: process.execPath, PATCHOULI_DATA_ROOT: "relative" } });
  assert.notEqual(failed.status, 0); assert.equal(failed.stdout, ""); assert.match(failed.stderr, /must be an absolute directory/u);
});
