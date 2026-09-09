// Local development harness: real MCP review/save with an isolated disposable vault.
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { mkdir, mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { VaultCardEngine } from "../dist/core.mjs";
import { transportOptions } from "./runtime-config.mjs";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pluginRoot = path.resolve(process.env.PATCHOULI_SMOKE_PLUGIN_ROOT || sourceRoot);
const root = await mkdtemp(path.join(os.tmpdir(), "patchouli-review-"));
const vault = path.join(root, "vault");
const dataRoot = path.join(root, "data");
await mkdir(path.join(vault, ".obsidian"), { recursive: true });
const engine = new VaultCardEngine({ configurationPath: path.join(dataRoot, "configuration.json") });
await engine.configureVault({ vaultPath: vault });
const draft = {
  title: "Arithmetic series", categories: ["Mathematics"],
  summaryMarkdown: "Pairing terms gives the arithmetic-series formula $S_n=n(n+1)/2$.",
  detailMarkdown: "### Derivation\n\nPair the first and last terms. Every pair totals $n+1$. Counting both copies gives\n\n$$\n2S_n = n(n+1), \\qquad S_n = \\frac{n(n+1)}{2}.\n$$\n\nFor $n=4$, the sum is $1+2+3+4=10$. This argument applies to positive integer $n$.",
  evidence: [{ claim: "The endpoints have a constant paired sum.", sourceReference: "Synthetic acceptance conversation" }],
  sources: [{ type: "conversation", label: "Synthetic acceptance conversation" }],
  connections: [{ cardRef: "Patchouli/Pairing terms.md", title: "Pairing terms", reason: "The pairing method proves the series formula.", selected: true }],
};
await engine.writeCard({ ...draft, title: "Pairing terms", summaryMarkdown: "Pairing symmetric terms makes a sum easier to count.", connections: [] });
const config = JSON.parse(await readFile(path.join(pluginRoot, ".mcp.json"), "utf8"));
const client = new Client({ name: "patchouli-review-harness", version: "1" });
await client.connect(new StdioClientTransport(transportOptions(config, pluginRoot, {
  ...process.env, PATCHOULI_DATA_ROOT: dataRoot, PATCHOULI_CHECKPOINT_ROOT: path.join(dataRoot, "session-checkpoints"), PATCHOULI_SESSION_ID: "review-harness",
})));
const secret = randomBytes(24).toString("hex");
let latestRef;
const html = `<!doctype html><html><head><meta charset="utf-8"><title>Patchouli Mac acceptance</title><style>body{font:16px system-ui;margin:24px;background:#f5f7f3}button{padding:10px;margin:6px}iframe{width:100%;height:1000px;border:0}pre{white-space:pre-wrap}</style></head><body>
<h1>Patchouli Mac acceptance</h1><button id="create">Review a new card</button><button id="update">Review saved card update</button><button id="status">Read vault status</button><pre id="result">Ready. One fixture card exists.</pre><iframe id="review" src="/review" title="Patchouli card review"></iframe>
<script>
const frame=document.getElementById('review');const result=document.getElementById('result');
async function api(route,body){const r=await fetch(route,{method:'POST',headers:{'Content-Type':'application/json','X-Patchouli-Review':${JSON.stringify(secret)}},body:JSON.stringify(body||{})});return r.json()}
async function preview(mode){const out=await api('/preview',{mode});frame.contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/tool-result',params:{structuredContent:out.structuredContent}},location.origin);result.textContent=out.content?.[0]?.text||JSON.stringify(out)}
document.getElementById('create').onclick=()=>preview('create');document.getElementById('update').onclick=()=>preview('update');document.getElementById('status').onclick=async()=>{result.textContent=JSON.stringify(await api('/status'),null,2)};
window.addEventListener('message',async e=>{if(e.source!==frame.contentWindow||e.origin!==location.origin)return;const m=e.data;if(!m.id)return;let response;if(m.method==='ui/initialize')response={protocolVersion:'2025-06-18',hostInfo:{name:'Patchouli test harness',version:'1'},hostCapabilities:{}};else if(m.method==='tools/call'){response=await api('/call',m.params);result.textContent=response.content?.[0]?.text||JSON.stringify(response)}else if(m.method==='ui/message'){result.textContent='Cancelled. No write requested.';response={}}else return;frame.contentWindow.postMessage({jsonrpc:'2.0',id:m.id,result:response},location.origin)});
</script></body></html>`;
const server = createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/") { res.setHeader("Content-Type", "text/html"); res.end(html); return; }
    if (req.method === "GET" && req.url === "/review") { res.setHeader("Content-Type", "text/html"); res.end(await readFile(path.join(pluginRoot, "dist/review-app.html"))); return; }
    if (req.method !== "POST" || req.headers["x-patchouli-review"] !== secret) { res.writeHead(403); res.end(); return; }
    let raw = ""; for await (const chunk of req) { raw += chunk; if (raw.length > 500_000) throw new Error("Oversized request"); }
    const body = JSON.parse(raw || "{}"); let output;
    if (req.url === "/preview") {
      if (body.mode === "update" && latestRef) {
        const current = await engine.getCard(latestRef);
        output = await client.callTool({ name: "preview_card_update", arguments: { cardRef: current.cardRef, expectedRevision: current.revision, draft: { ...draft, summaryMarkdown: draft.summaryMarkdown + " The reviewed update retains the derivation." } } });
      } else output = await client.callTool({ name: "preview_card", arguments: { draft } });
    } else if (req.url === "/call" && ["save_card", "update_card"].includes(body.name)) {
      output = await client.callTool(body); if (output.structuredContent?.card) latestRef = output.structuredContent.card.cardRef;
    } else if (req.url === "/status") {
      const cards = await engine.scanCards();
      const matches = await client.callTool({ name: "search_cards", arguments: { query: "arithmetic" } });
      const absent = await client.callTool({ name: "search_cards", arguments: { query: "heliopause" } });
      output = { cardCount: cards.length, cards: cards.map(({ title, cardRef, links }) => ({ title, cardRef, links })), supportedMatches: matches.structuredContent.results.length, insufficientEvidenceMatches: absent.structuredContent.results.length };
    } else throw new Error("Unsupported request");
    res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(output));
  } catch (error) { res.writeHead(400, { "Content-Type": "application/json" }); res.end(JSON.stringify({ error: error.message })); }
});
server.listen(0, "127.0.0.1", () => console.log(JSON.stringify({ url: `http://127.0.0.1:${server.address().port}`, root, vault, pluginRoot })));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => { void client.close().finally(() => server.close(() => process.exit(0))); });
