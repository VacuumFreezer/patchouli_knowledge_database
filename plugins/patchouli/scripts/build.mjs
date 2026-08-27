import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDirectory = path.join(pluginRoot, "dist");

await rm(distDirectory, { recursive: true, force: true });
await mkdir(distDirectory, { recursive: true });

const result = await build({
  entryPoints: [path.join(pluginRoot, "src", "server.ts")],
  outfile: path.join(distDirectory, "server.mjs"),
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  sourcemap: true,
  metafile: true,
  logLevel: "info",
});

await writeFile(
  path.join(distDirectory, "meta.json"),
  `${JSON.stringify(result.metafile, null, 2)}\n`,
  "utf8",
);
