import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { Client } from '../../plugins/patchouli/node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js';
import { StdioClientTransport } from '../../plugins/patchouli/node_modules/@modelcontextprotocol/sdk/dist/esm/client/stdio.js';
const plugin = '/Users/tongshen/.codex/plugins/cache/personal/patchouli/2.0.0+codex.20260910020002';
const vault = '/Users/tongshen/Koumakan_Library';
const backup = '/Users/tongshen/Library/Application Support/Patchouli/backups/stage14-20260909';
await fs.mkdir(backup, { recursive: true });
for (const relative of ['.obsidian/appearance.json', '.obsidian/snippets/patchouli-cards-v2.css']) {
  await fs.copyFile(path.join(vault, relative), path.join(backup, path.basename(relative)), fs.constants.COPYFILE_EXCL);
}
const configPath = '/Users/tongshen/Library/Application Support/Patchouli/configuration.json';
const originalConfig = await fs.readFile(configPath, 'utf8');
const isolated = await fs.mkdtemp('/tmp/patchouli-stage14-state-');
const client = new Client({ name: 'stage14-authorized-smoke', version: '1.0.0' });
await client.connect(new StdioClientTransport({ command: '/bin/sh', args: ['./scripts/launch-patchouli-mcp.sh'], cwd: plugin, env: { ...process.env, PATCHOULI_DATA_ROOT: isolated, PATCHOULI_CHECKPOINT_ROOT: path.join(isolated, 'checkpoints'), PATCHOULI_SESSION_ID: 'stage14-smoke' }, stderr: 'pipe' }));
async function call(name, args) {
 const result = await client.callTool({name, arguments:args});
 const out = result.structuredContent;
 assert.equal(out?.ok, true, JSON.stringify(result));
 return out;
}
try {
 await call('configure_vault', { vaultPath: vault, cardsDirectory: 'Engineering' });
 const draft = { title: 'Stage14 Visual Smoke', categories: ['Smoke'], summaryMarkdown: '临时视觉验收卡：检查分区、子标题和窄栏；测试后归档。', detailMarkdown: '### 三级：字符与字节\n\n中文和 emoji 😀 在 UTF-8 中占用不同数量的字节。\n\n#### 四级：编码机制\n\n字符编码将码点转换为字节序列。\n\n##### 五级：边界条件\n\n组合 emoji 可能包含多个码点。\n\n###### 六级：补充细节\n\n👩‍💻 是一个可见字素。行内公式 $n = 3$。\n\n$$\n\\sum_{k=1}^{n} k = \\frac{n(n+1)}{2}\n$$', fyiMarkdown: '### 一个很长的中文示例标题用于检查窄栏下自动换行与边框不会遮挡内容\n\n| 字符 | UTF-8 字节 |\n| --- | --- |\n| A | 1 |\n| 中 | 3 |\n| 😀 | 4 |\n\n```python\nprint(len("😀".encode("utf-8")))\n```\n\n- 列表依然可读。\n- 示例仅供样式验收。', evidence: [], sources: [{type:'text',label:'Stage 14 synthetic visual fixture'}], connections: [] };
 const p = await call('preview_capture', {cards:[{key:'style',splitReason:'Synthetic visual acceptance fixture',draft}],relationships:[]});
 const saved = await call('save_capture', {pendingToken:p.capturePreview.pendingToken});
 assert.equal((await call('save_capture', {pendingToken:p.capturePreview.pendingToken})).idempotentReplay,true);
 const read = await call('get_card', {cardRef:'Engineering/Stage14 Visual Smoke.md'});
 await call('configure_vault', {vaultPath:vault,cardsDirectory:'NLP'});
 const query = await call('search_cards', {query:'Unicode'});
 assert.ok(query.results.length);
 for (const item of query.results) await call('get_card', {cardRef:item.cardRef});
 assert.equal(await fs.readFile(configPath,'utf8'),originalConfig);
 const { PATCHOULI_SNIPPET } = await import(path.join(plugin,'dist/core.mjs'));
 assert.equal(await fs.readFile(path.join(vault,'.obsidian/snippets/patchouli-cards-v2.css'),'utf8'),PATCHOULI_SNIPPET);
 await fs.writeFile(new URL('./installed-smoke.json',import.meta.url),JSON.stringify({plugin,backup,checks:['installed configure upgrades old snippet','group preview/save/read','idempotent save replay','NLP search/read','default configuration unchanged','installed snippet exact'],saved,read},null,2)+'\n');
 console.log('Installed presentation upgrade + preview/save/replay/read + NLP inquiry retrieval passed.');
} finally { await client.close(); await fs.rm(isolated,{recursive:true,force:true}); }
