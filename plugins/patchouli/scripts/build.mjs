import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDirectory = path.join(pluginRoot, "dist");

await rm(distDirectory, { recursive: true, force: true });
await mkdir(distDirectory, { recursive: true });

const reviewApp = await build({
  entryPoints: [path.join(pluginRoot, "src", "ui", "review-app.tsx")],
  outdir: distDirectory,
  bundle: true,
  platform: "browser",
  format: "iife",
  target: ["chrome120", "safari17"],
  jsx: "automatic",
  write: false,
  loader: {
    ".woff": "dataurl",
    ".woff2": "dataurl",
    ".ttf": "dataurl",
  },
  minify: true,
  legalComments: "none",
  define: {
    "process.env.NODE_ENV": "\"production\"",
  },
  logLevel: "info",
});
const reviewScript = reviewApp.outputFiles.find((file) => file.path.endsWith(".js"))?.text;
if (!reviewScript) throw new Error("Review app JavaScript bundle was not produced.");
const bundledReviewStyles = reviewApp.outputFiles.find((file) => file.path.endsWith(".css"))?.text ?? "";
const customReviewStyles = await readFile(path.join(pluginRoot, "src", "ui", "review-app.css"), "utf8");
const reviewStyles = bundledReviewStyles + "\n" + customReviewStyles;
const reviewHtml = [
  "<!doctype html>",
  '<html lang="en">',
  "<head>",
  '<meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1">',
  "<title>Review Patchouli card</title>",
  `<style>${reviewStyles}</style>`,
  "</head>",
  "<body>",
  '<div id="root"></div>',
  `<script>${reviewScript.replaceAll("</script", "<" + "\\/script")}</script>`,
  "</body>",
  "</html>",
].join("\n");
await writeFile(path.join(distDirectory, "review-app.html"), reviewHtml, "utf8");

const result = await build({
  entryPoints: {
    server: path.join(pluginRoot, "src", "server.ts"),
    core: path.join(pluginRoot, "src", "core", "index.ts"),
  },
  outdir: distDirectory,
  entryNames: "[name]",
  outExtension: { ".js": ".mjs" },
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  minifyWhitespace: true,
  legalComments: "none",
  banner: {
    js: 'import { createRequire as __patchouliCreateRequire } from "node:module"; const require = __patchouliCreateRequire(import.meta.url);',
  },
  sourcemap: true,
  metafile: true,
  logLevel: "info",
});

await writeFile(
  path.join(distDirectory, "meta.json"),
  `${JSON.stringify(result.metafile, null, 2)}\n`,
  "utf8",
);
