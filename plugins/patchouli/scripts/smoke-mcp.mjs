import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const transport = new StdioClientTransport({
  command: "cmd.exe",
  args: [
    "/d",
    "/s",
    "/c",
    "call",
    "./scripts/launch-patchouli-mcp.cmd",
    "./dist/server.mjs",
  ],
  cwd: pluginRoot,
  stderr: "pipe",
});
const client = new Client({ name: "patchouli-stage-4-smoke", version: "0.1.0" });

try {
  await client.connect(transport);
  const result = await client.listTools();
  if (!Array.isArray(result.tools)) throw new Error("tools/list did not return an array");
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
  const actualTools = result.tools.map((tool) => tool.name).sort();
  if (JSON.stringify(actualTools) !== JSON.stringify(expectedTools)) {
    throw new Error(`Stage 4 tool catalog mismatch: ${actualTools.join(", ")}`);
  }
  console.log("MCP initialization and tools/list passed (8 Stage 4 tools).");
} finally {
  await client.close();
}
