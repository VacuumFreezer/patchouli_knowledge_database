#!/usr/bin/env node
import * as fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function platformName(platform) {
  if (!['darwin', 'win32'].includes(platform)) throw new Error(`Unsupported OS: ${platform}. Use macOS or Windows.`);
  return platform === 'darwin' ? 'macOS' : 'Windows';
}

// Native executables use argument arrays. Only batch shims need cmd.exe;
// reject shell expansion characters rather than guessing their escaping.
export function invocation(command, args, platform = process.platform) {
  if (platform !== 'win32' || !/\.(cmd|bat)$/i.test(command)) return { command, args, windowsVerbatimArguments: false };
  const quote = value => {
    if (/["%!^&|<>\r\n]/.test(value)) throw new Error('Unsafe character in Windows batch command; use an .exe or a path without shell metacharacters.');
    return `"${value}"`;
  };
  return { command: process.env.ComSpec || 'cmd.exe', args: ['/d', '/s', '/c', `"${[command, ...args].map(quote).join(' ')}"`], windowsVerbatimArguments: true };
}

export function assertClean(status) {
  if (status.trim()) throw new Error('Repository has uncommitted/untracked files. Commit or move them before syncing; nothing was stashed or discarded. After reviewing local changes, use --no-pull to install them without syncing.');
}

export function verifyInstalled(list, name, marketplace, version) {
  const installed = list.installed?.find(x => x.pluginId === `${name}@${marketplace}`);
  if (!installed?.installed || !installed.enabled || installed.version !== version) throw new Error('Installed version/enabled state did not match; installation is NOT confirmed.');
  return installed;
}

export async function preserveGenerated(repo, action) {
  const files = ['plugins/patchouli/.mcp.json', 'plugins/patchouli/.codex-plugin/plugin.json', 'plugins/patchouli/dist'];
  const backup = await fs.mkdtemp(path.join(os.tmpdir(), 'patchouli-install-backup-'));
  const present = [];
  let completed = false;
  try {
    for (const [index, name] of files.entries()) {
      const source = path.join(repo, name);
      if (existsSync(source)) { await fs.cp(source, path.join(backup, String(index)), { recursive: true }); present.push(index); }
    }
    // Do not touch outputs until every backup succeeded.
    let result;
    try { result = await action(); }
    finally {
      for (const [index, name] of files.entries()) {
        const target = path.join(repo, name);
        await fs.rm(target, { recursive: true, force: true });
        if (present.includes(index)) await fs.cp(path.join(backup, String(index)), target, { recursive: true });
      }
    }
    completed = true;
    return result;
  } catch (error) {
    error.message += `\nGenerated-file backup (retained): ${backup}`;
    throw error;
  }
  finally {
    if (completed) await fs.rm(backup, { recursive: true, force: true });
  }
}

function findExecutable(names, extra = []) {
  const paths = (process.env.PATH || '').split(path.delimiter);
  for (const candidate of [...extra, ...names.flatMap(name => paths.flatMap(dir => process.platform === 'win32'
    ? [path.join(dir, `${name}.exe`), path.join(dir, `${name}.cmd`), path.join(dir, name)]
    : [path.join(dir, name)]))]) {
    if (candidate && existsSync(candidate)) return candidate;
  }
  return undefined;
}

function run(command, args, { cwd = root, env = process.env, capture = false } = {}) {
  const call = invocation(command, args);
  const result = spawnSync(call.command, call.args, { cwd, env, windowsVerbatimArguments: call.windowsVerbatimArguments, stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit', encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error(`${path.basename(command)} ${args.join(' ')} failed (${result.status ?? result.error?.code}).\n${result.stderr || result.error?.message || ''}`);
  return result.stdout?.trim() || '';
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log('Usage: node scripts/sync-install.mjs [--no-pull]\nDefault: require a clean repository, git pull --ff-only, build/test for this OS, install and verify.\n--no-pull: install this checkout (including your reviewed local changes) without git pull.\nRequires Node 20.19+, Git, Python 3, pnpm or Corepack, and Codex/ChatGPT with plugin-creator installed.\nSet CODEX_CLI_PATH if codex is not on PATH.'); return;
  }
  if (args.some(x => x !== '--no-pull')) throw new Error('Unknown option. Run with --help.');
  const platform = platformName(process.platform);
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major < 20 || (major === 20 && minor < 19)) throw new Error('Node 20.19 or newer is required.');
  const git = findExecutable(['git']);
  if (!git) throw new Error('Git not found on PATH.');
  if (!args.includes('--no-pull')) {
    assertClean(run(git, ['status', '--porcelain', '--untracked-files=normal'], { capture: true }));
    console.log('[1/5] Syncing repository (fast-forward only)...');
    run(git, ['pull', '--ff-only']);
    // Re-enter the newly pulled installer, not this stale in-memory version.
    run(process.execPath, [path.join(root, 'scripts/sync-install.mjs'), '--no-pull']);
    return;
  }
  console.log(`[1/5] Installing current checkout for ${platform}; git pull skipped.`);
  const codex = findExecutable(['codex'], [process.env.CODEX_CLI_PATH,
    '/Applications/ChatGPT.app/Contents/Resources/codex', '/Applications/Codex.app/Contents/Resources/codex']);
  if (!codex) throw new Error('Codex CLI not found. Set CODEX_CLI_PATH to your codex executable (not the desktop app).');
  const python = findExecutable(['python3', 'python', 'py']);
  if (!python) throw new Error('Python 3 not found; required by the official plugin-creator installation helpers.');
  const pythonArgs = /^py(?:\.exe)?$/i.test(path.basename(python)) ? ['-3'] : [];
  const corepack = findExecutable(['corepack']);
  const pnpm = corepack || findExecutable(['pnpm']);
  if (!pnpm) throw new Error('pnpm/Corepack not found. Install the pnpm version declared in package.json.');
  const pnpmArgs = corepack ? ['pnpm'] : [];
  const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
  const helpers = path.join(codexHome, 'skills/.system/plugin-creator/scripts');
  for (const name of ['read_marketplace_name.py', 'update_plugin_cachebuster.py']) if (!existsSync(path.join(helpers, name))) throw new Error(`Missing official helper ${name}; update Codex/plugin-creator first.`);
  const marketFile = path.join(root, '.agents/plugins/marketplace.json');
  const marketplace = run(python, [...pythonArgs, path.join(helpers, 'read_marketplace_name.py'), '--marketplace-path', marketFile], { capture: true });
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(marketplace)) throw new Error('Invalid marketplace name from helper.');
  const catalog = JSON.parse(await fs.readFile(marketFile, 'utf8'));
  const entry = catalog.plugins?.find(x => x.name === 'patchouli');
  if (entry?.source?.source !== 'local' || path.resolve(root, entry.source.path) !== path.join(root, 'plugins/patchouli')) throw new Error('Marketplace Patchouli entry must point to this checkout’s plugins/patchouli.');
  const markets = JSON.parse(run(codex, ['plugin', 'marketplace', 'list', '--json'], { capture: true }));
  const existing = markets.marketplaces?.find(x => x.name === marketplace);
  if (existing && await fs.realpath(existing.root) !== await fs.realpath(root)) throw new Error(`Marketplace ${marketplace} points elsewhere (${existing.root}); resolve the collision before installing. No registration changed.`);
  const manifest = JSON.parse(await fs.readFile(path.join(root, 'plugins/patchouli/.codex-plugin/plugin.json'), 'utf8'));
  if (manifest.name !== 'patchouli') throw new Error('Unexpected plugin name.');
  const lock = path.join(root, '.patchouli-install.lock');
  let lockHandle;
  try { lockHandle = await fs.open(lock, 'wx'); }
  catch { throw new Error('Another installer is active, or .patchouli-install.lock remains from an interruption. Verify no installer is running before removing that file.'); }
  await lockHandle.writeFile(String(process.pid));
  // Ignore a caller's cross-build override: local install always targets this OS.
  const env = { ...process.env, PATCHOULI_BUILD_PLATFORM: process.platform, CODEX_MCP_NODE_PATH: process.execPath, CI: 'true' };
  try {
    let version;
    await preserveGenerated(root, async () => {
      console.log('[2/5] Installing locked dependencies and running build/tests...');
      run(pnpm, [...pnpmArgs, 'install', '--frozen-lockfile', '--ignore-scripts'], { env });
      for (const script of ['test', 'typecheck', 'validate:plugin', 'validate:skill', 'verify:bundle', 'inspect:mcp']) run(pnpm, [...pnpmArgs, script], { env });
      const cfg = JSON.parse(await fs.readFile(path.join(root, 'plugins/patchouli/.mcp.json'), 'utf8'));
      if (cfg.mcpServers.patchouli.command !== (process.platform === 'win32' ? 'cmd.exe' : '/bin/sh')) throw new Error('Build generated the wrong OS entry point.');
      console.log('[3/5] Preparing verified package and marketplace...');
      run(python, [...pythonArgs, path.join(helpers, 'update_plugin_cachebuster.py'), path.join(root, 'plugins/patchouli')]);
      version = JSON.parse(await fs.readFile(path.join(root, 'plugins/patchouli/.codex-plugin/plugin.json'), 'utf8')).version;
      if (!existing) run(codex, ['plugin', 'marketplace', 'add', root]);
      console.log('[4/5] Installing Patchouli...');
      run(codex, ['plugin', 'add', `patchouli@${marketplace}`]);
      const list = JSON.parse(run(codex, ['plugin', 'list', '--marketplace', marketplace, '--json'], { capture: true }));
      verifyInstalled(list, 'patchouli', marketplace, version);
      const installedRoot = path.join(codexHome, 'plugins/cache', marketplace, 'patchouli', version);
      console.log('[5/5] Checking installed MCP startup...');
      run(process.execPath, [path.join(root, 'plugins/patchouli/scripts/smoke-mcp.mjs')], { env: { ...env, PATCHOULI_SMOKE_PLUGIN_ROOT: installedRoot } });
      for (const file of ['.mcp.json', '.codex-plugin/plugin.json', 'dist/server.mjs', 'dist/core.mjs', 'dist/hook.mjs', 'dist/review-app.html']) {
        const source = await fs.readFile(path.join(root, 'plugins/patchouli', file));
        if (!source.equals(await fs.readFile(path.join(installedRoot, file)))) throw new Error(`Installed file mismatch: ${file}`);
      }
    });
    console.log(`\nSUCCESS: Patchouli installed and verified on ${platform}.\nVersion: ${version}\nMCP: 17 tools available\nRepository generated files restored. Start a new Codex task to load this version.\n安装成功：已验证本机平台及 MCP 启动。请开启新会话使用。`);
  } finally { await lockHandle.close(); await fs.rm(lock, { force: true }); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(`\nFAILED: ${error.message}\n安装未确认成功。修复上述错误后重试；脚本不会丢弃你的源码改动。`); process.exitCode = 1; });
}
