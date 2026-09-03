import { builtinModules } from "node:module";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundlePaths = [
  path.join(pluginRoot, "dist", "server.mjs"),
  path.join(pluginRoot, "dist", "core.mjs"),
];
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

console.log(`Bundle verification passed (${bundleSize} bytes across ${bundlePaths.length} files; no external packages).`);
