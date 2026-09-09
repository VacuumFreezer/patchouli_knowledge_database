import { builtinModules } from "node:module";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundlePaths = [
  path.join(pluginRoot, "dist", "server.mjs"),
  path.join(pluginRoot, "dist", "core.mjs"),
  path.join(pluginRoot, "dist", "hook.mjs"),
];
const reviewAppPath = path.join(pluginRoot, "dist", "review-app.html");
const metadataPath = path.join(pluginRoot, "dist", "meta.json");
const builtins = new Set([...builtinModules, ...builtinModules.map((name) => `node:${name}`)]);

let bundleSize = 0;
for (const bundlePath of bundlePaths) {
  const bundle = await stat(bundlePath);
  if (!bundle.isFile() || bundle.size === 0) {
    throw new Error(`${path.relative(pluginRoot, bundlePath)} is missing or empty`);
  }
  bundleSize += bundle.size;
}

const reviewApp = await stat(reviewAppPath);
if (!reviewApp.isFile() || reviewApp.size === 0) {
  throw new Error("dist/review-app.html is missing or empty");
}
const reviewHtml = await readFile(reviewAppPath, "utf8");
if (!reviewHtml.includes('id="root"') || !reviewHtml.includes("ui/initialize") || !reviewHtml.includes("tools/call")) {
  throw new Error("dist/review-app.html is missing the React mount or MCP Apps bridge");
}
if (/<script[^>]+src=/iu.test(reviewHtml)) {
  throw new Error("dist/review-app.html must not depend on external scripts");
}

const metadata = JSON.parse(await readFile(metadataPath, "utf8"));
const outputs = Object.values(metadata.outputs).filter((entry) => entry.entryPoint);
if (outputs.length !== bundlePaths.length) throw new Error("esbuild metadata is missing an entry-point output");
const packageImports = outputs.flatMap((output) => output.imports).filter(
  (entry) => entry.external && !builtins.has(entry.path),
);
if (packageImports.length > 0) {
  throw new Error(
    `bundle still requires external packages: ${packageImports.map((entry) => entry.path).join(", ")}`,
  );
}

console.log(`Bundle verification passed (${bundleSize + reviewApp.size} bytes across ${bundlePaths.length + 1} files; no external packages or scripts).`);
