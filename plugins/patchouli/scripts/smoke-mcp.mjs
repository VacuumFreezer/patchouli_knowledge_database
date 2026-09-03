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
const client = new Client({ name: "patchouli-stage-3-smoke", version: "0.1.0" });

try {
  await client.connect(transport);
  const result = await client.listTools();
  if (!Array.isArray(result.tools)) throw new Error("tools/list did not return an array");
  if (result.tools.length !== 0) {
    throw new Error(`Stage 3 runtime unexpectedly exposes ${result.tools.length} tools`);
  }
  console.log("MCP initialization and tools/list passed (0 tools, as expected before Stage 4). ");
} finally {
  await client.close();
}
