import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { platformName, invocation, assertClean, verifyInstalled, preserveGenerated } from '../../../scripts/sync-install.mjs';

test('installer selects OS, rejects unsafe batch interpolation, and keeps native args literal', () => {
 assert.equal(platformName('darwin'),'macOS');assert.equal(platformName('win32'),'Windows');assert.throws(()=>platformName('linux'));
 const args=['a b','中文'];
 assert.deepEqual(invocation('/Applications/ChatGPT.app/codex',args,'darwin').args,args);
 const win=invocation('C:\\Program Files\\Corepack\\corepack.cmd',['pnpm','test'],'win32');
 assert.equal(win.windowsVerbatimArguments,true);assert.equal(win.args[3],'""C:\\Program Files\\Corepack\\corepack.cmd" "pnpm" "test""');
 for(const value of ['x&calc','%PATH%','a"b','x\ny','!name!'])assert.throws(()=>invocation('pnpm.cmd',[value],'win32'));
 assert.deepEqual(invocation('codex.exe',['a&b'],'win32').args,['a&b']);
 assert.throws(()=>assertClean(' M file'));assert.throws(()=>assertClean('?? file'));assertClean('');
});

test('installer restores exact generated files after successful install and after validation failure', async t => {
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'patchouli-install-restore-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 const plugin=path.join(root,'plugins/patchouli');await fs.mkdir(path.join(plugin,'.codex-plugin'),{recursive:true});await fs.mkdir(path.join(plugin,'dist'));
 await fs.writeFile(path.join(plugin,'.mcp.json'),'Windows config\r\n');
 await fs.writeFile(path.join(plugin,'.codex-plugin/plugin.json'),'user manifest\n');await fs.writeFile(path.join(plugin,'dist/server.mjs'),'old runtime');
 const mutate=async()=>{await fs.writeFile(path.join(plugin,'.mcp.json'),'Mac config');await fs.writeFile(path.join(plugin,'.codex-plugin/plugin.json'),'new version');await fs.writeFile(path.join(plugin,'dist/server.mjs'),'new runtime');await fs.writeFile(path.join(plugin,'dist/new.mjs'),'extra');};
 await preserveGenerated(root,mutate);
 assert.equal(await fs.readFile(path.join(plugin,'.mcp.json'),'utf8'),'Windows config\r\n');
 let backup;
 await assert.rejects(preserveGenerated(root,async()=>{await mutate();throw new Error('validation failed');}),e=>{assert.match(e.message,/validation failed/);backup=e.message.split('Generated-file backup (retained): ')[1];return true;});
 assert.equal(await fs.readFile(path.join(plugin,'.codex-plugin/plugin.json'),'utf8'),'user manifest\n');
 assert.equal(await fs.readFile(path.join(plugin,'dist/server.mjs'),'utf8'),'old runtime');
 assert.deepEqual(await fs.readdir(path.join(plugin,'dist')),['server.mjs']);
 await fs.rm(backup,{recursive:true,force:true});
});

test('success requires matching enabled installed version', () => {
 const row={pluginId:'patchouli@personal',installed:true,enabled:true,version:'2.0.0+codex.test'};
 verifyInstalled({installed:[row]},'patchouli','personal',row.version);
 for(const change of [{enabled:false},{installed:false},{version:'old'},{pluginId:'other@personal'}]) assert.throws(()=>verifyInstalled({installed:[{...row,...change}]},'patchouli','personal',row.version));
});

test('Windows batch invocation preserves spaces/Unicode and propagates failure', {skip:process.platform!=='win32'}, async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'patchouli installer 中文 '));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 const file=path.join(root,'test shim.cmd');await fs.writeFile(file,'@echo off\r\necho %~1\r\nexit /b 7\r\n');
 const call=invocation(file,['space argument']);
 const result=spawnSync(call.command,call.args,{encoding:'utf8',windowsVerbatimArguments:call.windowsVerbatimArguments});
 assert.equal(result.status,7);assert.match(result.stdout,/space argument/);
});
