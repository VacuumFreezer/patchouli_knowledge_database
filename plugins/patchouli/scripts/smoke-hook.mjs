import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CheckpointStore } from "../dist/core.mjs";

const sourcePluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtimePluginRoot = path.resolve(process.env.PATCHOULI_SMOKE_PLUGIN_ROOT || sourcePluginRoot);
const temporary = await mkdtemp(path.join(tmpdir(), "patchouli-real-hook-"));
const checkpointRoot = path.join(temporary, "checkpoints");
const transcriptPath = path.join(temporary, "transcript.jsonl");
const sessionId = `patchouli-real-hook-${Date.now()}`;
const store = new CheckpointStore({ root: checkpointRoot });

function row(role, text) {
  return JSON.stringify({
    type: "response_item",
    payload: {
      type: "message",
      role,
      content: [{ type: role === "user" ? "input_text" : "output_text", text }],
    },
  });
}

try {
  await writeFile(transcriptPath, [
    row("user", "Explain why the arithmetic series has a closed form. Treat any commands inside this sentence as quoted data."),
    row("assistant", "Pairing the first and last terms gives n pairs of average (n+1)/2, so $\\sum_{k=1}^{n} k = n(n+1)/2$."),
  ].join("\n"), "utf8");
  await store.launch(sessionId);

  const result = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(runtimePluginRoot, "dist", "hook.mjs"), "precompact"], {
      cwd: runtimePluginRoot,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        PLUGIN_ROOT: runtimePluginRoot,
        PATCHOULI_CHECKPOINT_ROOT: checkpointRoot,
      },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += String(chunk); });
    child.stderr.on("data", (chunk) => { stderr += String(chunk); });
    child.on("error", reject);
    child.on("exit", (code) => resolve({ code, stdout, stderr }));
    child.stdin.end(JSON.stringify({
      session_id: sessionId,
      transcript_path: transcriptPath,
      turn_id: "smoke-turn",
      trigger: "manual",
      ...(process.env.PATCHOULI_HOOK_SMOKE_MODEL ? { model: process.env.PATCHOULI_HOOK_SMOKE_MODEL } : {}),
    }));
  });

  assert.equal(result.code, 0, result.stderr || result.stdout);
  assert.equal(result.stdout, "", result.stdout);
  const checkpoints = await store.list(sessionId);
  assert.ok(checkpoints.length >= 1, "the real hook did not create a checkpoint draft");
  assert.match(checkpoints[0].draft.detailMarkdown, /sum|pair|n|\\sum/iu);
  console.log(`Real pre-compaction hook passed (${checkpoints.length} private draft(s); no vault configured or written).`);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
