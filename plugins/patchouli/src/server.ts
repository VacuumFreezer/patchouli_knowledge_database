import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new McpServer(
  {
    name: "patchouli",
    version: "0.1.0",
  },
  {
    capabilities: { tools: {} },
    instructions:
      "Patchouli is a local Obsidian knowledge database. This runtime scaffold intentionally exposes no tools until the card engine and reviewed MCP interface are implemented.",
  },
);

server.server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [] }));

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`Patchouli MCP server failed: ${message}\n`);
  process.exitCode = 1;
});
