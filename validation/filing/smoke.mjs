import * as fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { Client } from '../../plugins/patchouli/node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js';
import { StdioClientTransport } from '../../plugins/patchouli/node_modules/@modelcontextprotocol/sdk/dist/esm/client/stdio.js';
const plugin='/Users/tongshen/.codex/plugins/cache/personal/patchouli/2.0.0+codex.20260913221729';
const root=await fs.mkdtemp('/tmp/patchouli-filing-installed-');
const client=new Client({name:'filing-smoke',version:'1'});
const draft=title=>({title,categories:[],summaryMarkdown:'Test',detailMarkdown:'Durable test concept.',evidence:[],sources:[],connections:[]});
async function call(name,args){const r=(await client.callTool({name,arguments:args})).structuredContent;assert.equal(r?.ok,true,JSON.stringify(r));return r;}
try {
 await client.connect(new StdioClientTransport({command:'/bin/sh',args:['./scripts/launch-patchouli-mcp.sh'],cwd:plugin,env:{...process.env,PATCHOULI_DATA_ROOT:root+'/data',PATCHOULI_CHECKPOINT_ROOT:root+'/checkpoints',PATCHOULI_SESSION_ID:'filing-smoke'}}));
 await fs.mkdir(root+'/vault');
 await call('configure_vault',{vaultPath:root+'/vault',cardsDirectory:'Market',captureDate:'2026-09-13'});
 let p=await call('preview_capture',{cards:[{key:'a',splitReason:'test',draft:draft('A')}],relationships:[]});
 assert.equal(p.capturePreview.cards[0].destinationRef,'Market/Sep_13_26/A.md');
 await call('save_capture',{pendingToken:p.capturePreview.pendingToken});
 await call('configure_vault',{vaultPath:root+'/vault',cardsDirectory:'Market',captureDate:'2026-09-14',topic:'tokenization'});
 p=await call('preview_capture',{cards:[{key:'b',splitReason:'test',draft:draft('B')}],relationships:[]});
 assert.equal(p.capturePreview.cards[0].destinationRef,'Market/tokenization_Sep1426/B.md');
 await call('save_capture',{pendingToken:p.capturePreview.pendingToken});
 assert.equal((await call('get_card',{cardRef:'Market/Sep_13_26/A.md'})).card.title,'A');
 await call('configure_vault',{vaultPath:'/Users/tongshen/Koumakan_Library',cardsDirectory:'Market',captureDate:'2026-09-13'});
 const plan=JSON.parse(await fs.readFile('validation/filing/market-plan.json','utf8'));
 for(const ref of Object.values(plan.mapping))await call('get_card',{cardRef:ref});
 const found=await call('search_cards',{query:'Delta'});assert.ok(found.results.length>0);
 await fs.writeFile('validation/filing/smoke-result.json',JSON.stringify({version:plugin.split('/').at(-1),checks:['installed daily preview/save','installed topic preview/save','prior-day read after date change','13 moved Market cards readable','Market Delta search'],groups:plan.groups},null,2)+'\n');
 console.log('Installed daily/topic create and cross-date retrieval passed; all 13 Market cards readable.');
}finally{await client.close();await fs.rm(root,{recursive:true,force:true});}
