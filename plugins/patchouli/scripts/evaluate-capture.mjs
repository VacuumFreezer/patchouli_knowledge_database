// Behavioral acceptance: actual signed-in Codex, staged skill + MCP, synthetic data only.
import { spawn } from 'node:child_process';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const plugin = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repository = path.resolve(plugin, '../..');
const cases = JSON.parse(await readFile(path.join(repository, 'validation/v2/model-cases.json'), 'utf8'));
const selected = process.argv[2];
const outputRoot = process.env.PATCHOULI_EVAL_ROOT || '/tmp/patchouli-v2-evals';
const codex = process.env.CODEX_CLI_PATH || 'codex';
const installed = process.env.PATCHOULI_EVAL_INSTALLED === '1';
for (const scenario of cases.filter(item => !selected || item.id === selected)) {
  const root = path.join(outputRoot, scenario.id);
  const data = path.join(root, 'data');
  const vault = process.env.PATCHOULI_EVAL_VAULT || path.join(root, 'vault');
  await mkdir(data, { recursive: true }); await mkdir(path.join(vault, '.obsidian'), { recursive: true });
  await mkdir(path.join(root, '.agents/skills'), { recursive: true });
  if (!installed) await cp(path.join(plugin, 'skills/patchouli'), path.join(root, '.agents/skills/patchouli'), { recursive: true });
  await writeFile(path.join(data, 'configuration.json'), JSON.stringify({ vaultPath: vault, cardsDirectory: process.env.PATCHOULI_EVAL_CARDS_DIRECTORY || 'Cards' }));
  const prefix = process.env.PATCHOULI_EVAL_TITLE_PREFIX;
  const prompt = `请使用 $patchouli，将以下学习对话的知识整理到已经配置的知识库。先给我完整预览，我看过以后再确认。${prefix ? `这是开发 smoke test 的虚构学习材料，卡片标题以「${prefix}」开头，来源如实标为合成测试材料。` : ''}\n\n<learning_conversation>\n${scenario.conversation}\n</learning_conversation>`;
  await writeFile(path.join(root, 'request.txt'), prompt);
  const env = { ...process.env };
  for (const name of ['CODEX_THREAD_ID', 'CODEX_SESSION_ID', 'PATCHOULI_SESSION_ID']) delete env[name];
  env.PATCHOULI_DATA_ROOT = data; env.PATCHOULI_CHECKPOINT_ROOT = path.join(data, 'checkpoints');
  const args = ['exec', ...(!installed ? ['--ignore-user-config'] : []), '--disable', 'hooks', ...(process.env.PATCHOULI_EVAL_PERSIST === '1' ? [] : ['--ephemeral']), '--sandbox', 'read-only', '--skip-git-repo-check', '--json', '--cd', root,
    ...(!installed ? [
    '-c', `mcp_servers.patchouli.command=${JSON.stringify(process.execPath)}`,
    '-c', `mcp_servers.patchouli.args=${JSON.stringify([path.join(plugin, 'dist/server.mjs')])}`,
    '-c', `mcp_servers.patchouli.env={PATCHOULI_DATA_ROOT=${JSON.stringify(data)},PATCHOULI_CHECKPOINT_ROOT=${JSON.stringify(path.join(data, 'checkpoints'))}}`] : []),
    '--output-last-message', path.join(root, 'final.md'), '-'];
  let stdout = '', stderr = '';
  const child = spawn(codex, args, { cwd: root, env, stdio: ['pipe', 'pipe', 'pipe'] });
  child.stdout.on('data', chunk => stdout += chunk); child.stderr.on('data', chunk => stderr += chunk);
  child.stdin.end(prompt);
  const timer = setTimeout(() => child.kill('SIGTERM'), 360000);
  const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', resolve); });
  clearTimeout(timer);
  await writeFile(path.join(root, 'events.jsonl'), stdout); await writeFile(path.join(root, 'stderr.log'), stderr);
  const events = stdout.split('\n').filter(Boolean).map(line => { try { return JSON.parse(line); } catch { return {}; } });
  const calls = events.filter(event => event.type === 'item.completed' && event.item?.type === 'mcp_tool_call').map(event => event.item);
  console.log(JSON.stringify({ case: scenario.id, exitCode: code, root, calls: calls.map(item => ({ tool: item.tool, status: item.status })) }));
  if (code !== 0) process.exitCode = 1;
}
