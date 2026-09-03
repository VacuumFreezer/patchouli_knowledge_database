import { readdir } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

await import("./build.mjs");

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const testsDirectory = path.join(pluginRoot, "tests");
const testFiles = (await readdir(testsDirectory))
  .filter((name) => name.endsWith(".test.mjs"))
  .sort()
  .map((name) => path.join(testsDirectory, name));

const child = spawn(process.execPath, ["--test", ...testFiles], {
  cwd: pluginRoot,
  stdio: "inherit",
});

child.once("error", (error) => {
  throw error;
});

const exitCode = await new Promise((resolve) => {
  child.once("exit", (code) => resolve(code ?? 1));
});
process.exitCode = exitCode;
