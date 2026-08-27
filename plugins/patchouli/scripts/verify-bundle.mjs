import { builtinModules } from "node:module";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundlePath = path.join(pluginRoot, "dist", "server.mjs");
const metadataPath = path.join(pluginRoot, "dist", "meta.json");
const builtins = new Set([...builtinModules, ...builtinModules.map((name) => `node:${name}`)]);

const bundle = await stat(bundlePath);
if (!bundle.isFile() || bundle.size === 0) {
  throw new Error("dist/server.mjs is missing or empty");
}

const metadata = JSON.parse(await readFile(metadataPath, "utf8"));
const output = Object.values(metadata.outputs).find((entry) => entry.entryPoint);
if (!output) throw new Error("esbuild metadata has no entry-point output");

const packageImports = output.imports.filter(
  (entry) => entry.external && !builtins.has(entry.path),
);
if (packageImports.length > 0) {
  throw new Error(
    `bundle still requires external packages: ${packageImports.map((entry) => entry.path).join(", ")}`,
  );
}

console.log(`Bundle verification passed (${bundle.size} bytes; no external packages).`);
