import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspaceRoot = path.resolve(pluginRoot, "..", "..");

test("manifest and marketplace identify the same local plugin", async () => {
  const manifest = JSON.parse(
    await readFile(path.join(pluginRoot, ".codex-plugin", "plugin.json"), "utf8"),
  );
  const marketplace = JSON.parse(
    await readFile(path.join(workspaceRoot, ".agents", "plugins", "marketplace.json"), "utf8"),
  );
  const entry = marketplace.plugins.find((plugin) => plugin.name === manifest.name);

  assert.equal(path.basename(pluginRoot), "patchouli");
  assert.equal(manifest.name, "patchouli");
  assert.equal(manifest.version, "0.1.0");
  assert.equal(manifest.license, "UNLICENSED");
  assert.equal(manifest.skills, "./skills/");
  assert.equal(manifest.mcpServers, "./.mcp.json");
  assert.equal(entry.source.path, "./plugins/patchouli");
  assert.equal(entry.policy.installation, "AVAILABLE");
  assert.equal(entry.policy.authentication, "ON_INSTALL");
});

test("MCP configuration launches the bundled server through the Windows runtime locator", async () => {
  const configuration = JSON.parse(
    await readFile(path.join(pluginRoot, ".mcp.json"), "utf8"),
  );
  const server = configuration.mcpServers.patchouli;

  assert.equal(server.command, "cmd.exe");
  assert.deepEqual(server.args.slice(-2), [
    "./scripts/launch-patchouli-mcp.cmd",
    "./dist/server.mjs",
  ]);
  assert.equal(server.cwd, ".");
  assert.ok(server.env_vars.includes("CODEX_MCP_NODE_PATH"));
  assert.ok((await stat(path.join(pluginRoot, "scripts", "launch-patchouli-mcp.cmd"))).isFile());
  assert.ok((await stat(path.join(pluginRoot, "dist", "server.mjs"))).size > 0);
});
