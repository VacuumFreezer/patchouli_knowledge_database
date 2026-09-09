import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mcpConfiguration } from "../plugins/patchouli/scripts/runtime-config.mjs";

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const marketplacePath = path.join(workspaceRoot, ".agents", "plugins", "marketplace.json");
const pluginRoot = path.join(workspaceRoot, "plugins", "patchouli");
const manifestPath = path.join(pluginRoot, ".codex-plugin", "plugin.json");
const hooksPath = path.join(pluginRoot, "hooks", "hooks.json");

const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

async function readJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    failures.push(`${path.relative(workspaceRoot, filePath)}: ${error.message}`);
    return {};
  }
}

async function exists(relativePath) {
  try {
    await access(path.join(pluginRoot, relativePath));
    return true;
  } catch {
    return false;
  }
}

const manifest = await readJson(manifestPath);
const marketplace = await readJson(marketplacePath);
const hooks = await readJson(hooksPath);
const mcp = await readJson(path.join(pluginRoot, ".mcp.json"));
const packagedPlatform = mcp.mcpServers?.patchouli?.command === "cmd.exe" ? "win32" : "darwin";
check(JSON.stringify(mcp) === JSON.stringify(mcpConfiguration(packagedPlatform)), "MCP entry point must match a supported platform package");

check(manifest.name === "patchouli", "manifest name must be patchouli");
check(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(manifest.version ?? ""), "manifest version must be strict semver");
check(typeof manifest.description === "string" && manifest.description.length > 0, "manifest description is required");
check(manifest.author?.name === "Patchouli Project", "manifest author must be Patchouli Project");
check(manifest.license === "UNLICENSED", "manifest license must be UNLICENSED");
check(manifest.interface?.displayName === "Patchouli", "interface displayName must be Patchouli");
check(manifest.interface?.category === "Productivity", "interface category must be Productivity");
check(manifest.skills === "./skills/", "manifest skills path must be ./skills/");
check(manifest.mcpServers === "./.mcp.json", "manifest MCP path must be ./.mcp.json");
check(!Object.hasOwn(manifest, "apps"), "apps must be omitted until .app.json exists");
check(!Object.hasOwn(manifest, "hooks"), "unsupported hooks manifest field must be omitted");
check(Array.isArray(hooks.hooks?.PreCompact), "default hooks/hooks.json must register PreCompact");
check(Array.isArray(hooks.hooks?.SessionEnd), "default hooks/hooks.json must register SessionEnd cleanup");
const preCompactHook = hooks.hooks?.PreCompact?.[0]?.hooks?.[0];
check(preCompactHook?.type === "command", "PreCompact must use a command hook");
check(/launch-patchouli-hook\.cmd/iu.test(preCompactHook?.commandWindows ?? ""), "PreCompact must use the bundled Windows runtime launcher");
check(await exists("hooks/checkpoint-drafts.schema.json"), "checkpoint output schema must exist");
check(await exists("scripts/launch-patchouli-hook.cmd"), "Windows hook launcher must exist");
check(/launch-patchouli-hook\.sh/u.test(preCompactHook?.command ?? ""), "PreCompact must use the Mac runtime launcher");
for (const launcher of ["run-with-codex-node.sh", "launch-patchouli-mcp.sh", "launch-patchouli-hook.sh"]) {
  check(await exists(`scripts/${launcher}`), `Mac launcher ${launcher} must exist`);
}

for (const field of ["skills", "mcpServers"]) {
  const target = manifest[field]?.replace(/^\.\//, "");
  check(Boolean(target) && (await exists(target)), `manifest ${field} target must exist`);
}

const serializedManifest = JSON.stringify(manifest);
check(!serializedManifest.includes("[TODO:"), "manifest contains an unfinished scaffold placeholder");

check(typeof marketplace.name === "string" && marketplace.name.length > 0, "marketplace name is required");
check(typeof marketplace.interface?.displayName === "string", "marketplace displayName is required");
const entry = marketplace.plugins?.find((plugin) => plugin.name === "patchouli");
check(Boolean(entry), "marketplace must contain patchouli");
check(entry?.source?.source === "local", "marketplace source must be local");
check(entry?.source?.path === "./plugins/patchouli", "marketplace source path must be ./plugins/patchouli");
check(entry?.policy?.installation === "AVAILABLE", "installation policy must be AVAILABLE");
check(entry?.policy?.authentication === "ON_INSTALL", "authentication policy must be ON_INSTALL");
check(entry?.category === "Productivity", "marketplace category must be Productivity");

if (failures.length > 0) {
  console.error(`Plugin validation failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("Plugin and marketplace validation passed.");
}
