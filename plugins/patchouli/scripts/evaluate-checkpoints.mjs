import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CheckpointStore } from '../dist/core.mjs';

const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const plugin = process.env.PATCHOULI_SMOKE_PLUGIN_ROOT || source;
const root = process.env.PATCHOULI_EVAL_ROOT || '/tmp/patchouli-v2-checkpoint-eval';
await mkdir(root, { recursive: true });
const cases = JSON.parse(await readFile(path.join(source, '../../validation/v2/model-cases.json'), 'utf8'));
const scenario = cases.find(item => item.id === (process.argv[2] || 'nlp-unicode'));
const sessionId = `v2-checkpoint-${Date.now()}`;
const store = new CheckpointStore({ root: path.join(root, 'checkpoints') });
await store.launch(sessionId);
const transcript = path.join(root, 'transcript.jsonl');
const row = (role, text) => JSON.stringify({ type: 'response_item', payload: { type: 'message', role, content: [{ type: role === 'user' ? 'input_text' : 'output_text', text }] } });
await writeFile(transcript, [row('user', '请回顾今天学到的知识。'), row('assistant', scenario.conversation)].join('\n'));
async function hook(event, extra = {}) {
  const child = spawn('/bin/sh', [path.join(plugin, 'scripts/launch-patchouli-hook.sh'), event], { cwd: plugin, env: { ...process.env, PLUGIN_ROOT: plugin, PATCHOULI_CHECKPOINT_ROOT: store.root }, stdio: ['pipe', 'pipe', 'pipe'] });
  let stdout = '', stderr = ''; child.stdout.on('data', chunk => stdout += chunk); child.stderr.on('data', chunk => stderr += chunk);
  child.stdin.end(JSON.stringify({ session_id: sessionId, transcript_path: transcript, turn_id: 'v2-eval-turn', trigger: 'manual', ...extra }));
  const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', resolve); });
  assert.equal(code, 0, stderr); assert.equal(stdout, '');
  return { code, stderr };
}
const generated = await hook('precompact');
const drafts = await store.list(sessionId);
assert.ok(drafts.length, generated.stderr || 'No real checkpoint generated');
await hook('session-end');
assert.equal((await store.status(sessionId)).active, false);
assert.deepEqual(await store.list(sessionId), drafts);
await writeFile(path.join(root, 'result.json'), JSON.stringify({ plugin, sessionId, generated, retainedAfterSessionEnd: true, checkpoints: drafts }, null, 2));
console.log(JSON.stringify({ root, count: drafts.length, titles: drafts.map(item => item.draft.title), retainedAfterSessionEnd: true }));
