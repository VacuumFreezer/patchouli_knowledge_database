// Local-only acceptance harness. Its MCP process is restricted to an isolated fixture vault.
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
const plugin = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = process.env.PATCHOULI_REVIEW_HARNESS_ROOT || '/tmp/patchouli-v2-browser';
await mkdir(path.join(root, 'vault/.obsidian'), { recursive: true });
const client = new Client({ name: 'v2-browser-acceptance', version: '2.0.0' });
await client.connect(new StdioClientTransport({ command: process.execPath, args: [path.join(plugin, 'dist/server.mjs')], env: { ...process.env, PATCHOULI_DATA_ROOT: path.join(root, 'data'), PATCHOULI_CHECKPOINT_ROOT: path.join(root, 'checkpoints') }, stderr: 'pipe' }));
const call = (name, args) => client.callTool({ name, arguments: args, _meta: { threadId: 'v2-browser-acceptance' } });
await call('configure_vault', { vaultPath: path.join(root, 'vault'), cardsDirectory: 'Cards' });
const draft = title => ({ title, categories: ['Acceptance'], summaryMarkdown: '字符、码点与字节 🌿', detailMarkdown: '### Core mechanism\n\nByte-level BPE operates on UTF-8 bytes. $n=4$\n\n$$\nf(x)=x^2\n$$\n\n```python\nlen("😀".encode("utf-8"))\n```', fyiMarkdown: '### Worked example\n\nGPT vocabulary figures are examples.', evidence: [{ claim: 'Synthetic acceptance example', sourceReference: 'Local harness' }], sources: [{ type: 'text', label: 'Synthetic acceptance fixture' }], connections: [] });
const initial = await call('preview_capture', { cards: [{ key: 'tokens', splitReason: 'NLP mechanism', draft: draft('Browser Tokenization') }, { key: 'encoding', splitReason: 'General prerequisite', draft: draft('Browser Unicode') }], relationships: [{ fromKey: 'tokens', toKey: 'encoding', reason: 'UTF-8 bytes explain Chinese and emoji segmentation.', selected: true }] });
const html = `<!doctype html><meta charset="utf-8"><title>Patchouli v2 review acceptance</title><style>body{margin:0;font-family:system-ui}iframe{border:0;width:100%;height:96vh}</style><iframe src="/review"></iframe><script>
const frame=document.querySelector('iframe');
window.addEventListener('message',async event=>{
 if(event.source!==frame.contentWindow||!event.data?.id)return;
 const m=event.data;let result={};
 if(m.method==='tools/call')result=await fetch('/call',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(m.params)}).then(r=>r.json());
 frame.contentWindow.postMessage({jsonrpc:'2.0',id:m.id,result},'*');
 if(m.method==='ui/initialize')frame.contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/tool-result',params:${JSON.stringify(initial)}},'*');
});</script>`;
const server = createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/review') { res.setHeader('Content-Type', 'text/html'); res.end(await readFile(path.join(plugin, 'dist/review-app.html'))); }
    else if (req.method === 'GET' && req.url === '/') { res.setHeader('Content-Type', 'text/html'); res.end(html); }
    else if (req.method === 'POST' && req.url === '/call') {
      let body = ''; for await (const chunk of req) { body += chunk; if (body.length > 500000) throw new Error('oversized'); }
      const message = JSON.parse(body);
      if (!['preview_capture', 'save_capture'].includes(message.name)) throw new Error('unsupported harness operation');
      const result = await call(message.name, message.arguments);
      res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(result));
      await writeFile(path.join(root, 'last-result.json'), JSON.stringify(result, null, 2));
    } else { res.statusCode = 404; res.end(); }
  } catch (error) { res.statusCode = 500; res.end(JSON.stringify({ error: String(error) })); }
});
server.listen(0, '127.0.0.1', async () => {
  const url = `http://127.0.0.1:${server.address().port}`;
  await writeFile(path.join(root, 'harness.json'), JSON.stringify({ url, root, pid: process.pid })); console.log(url);
});
process.on('SIGTERM', async () => { server.close(); await client.close(); process.exit(); });
