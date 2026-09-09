import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { transportOptions } from "./runtime-config.mjs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const sourcePluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pluginRoot = path.resolve(process.env.PATCHOULI_SMOKE_PLUGIN_ROOT || sourcePluginRoot);
const configuration = JSON.parse(await readFile(path.join(pluginRoot, ".mcp.json"), "utf8"));
const transport = new StdioClientTransport(transportOptions(configuration, pluginRoot));
const client = new Client({ name: "patchouli-stage-4-smoke", version: "0.1.0" });

try {
  await client.connect(transport);
  const result = await client.listTools();
  if (!Array.isArray(result.tools)) throw new Error("tools/list did not return an array");
  const expectedTools = [
    "configure_vault",
    "discard_checkpoint_drafts",
    "get_card",
    "get_checkpoint_drafts",
    "get_configuration",
    "get_patchouli_status",
    "launch_patchouli",
    "list_categories",
    "preview_card",
    "preview_card_update",
    "save_card",
    "search_cards",
    "stop_patchouli",
    "suggest_links",
    "update_card",
  ];
  const actualTools = result.tools.map((tool) => tool.name).sort();
  if (JSON.stringify(actualTools) !== JSON.stringify(expectedTools)) {
    throw new Error(`Stage 7 tool catalog mismatch: ${actualTools.join(", ")}`);
  }
  console.log("MCP initialization and tools/list passed (15 Stage 7 tools).");
} finally {
  await client.close();
}
