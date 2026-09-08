import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skillRoot = path.join(pluginRoot, "skills", "patchouli");

test("validates the discoverable skill package and local MCP dependency", () => {
  const validation = spawnSync(process.execPath, [path.join(pluginRoot, "scripts", "validate-skill.mjs")], {
    cwd: pluginRoot,
    encoding: "utf8",
  });
  assert.equal(validation.status, 0, validation.stderr);
  assert.match(validation.stdout, /validation passed/u);
});

test("routes capture and inquiry through focused references with safe tool ordering", async () => {
  const skill = await readFile(path.join(skillRoot, "SKILL.md"), "utf8");
  const capture = await readFile(path.join(skillRoot, "references", "capture.md"), "utf8");
  const inquiry = await readFile(path.join(skillRoot, "references", "inquiry.md"), "utf8");

  assert.match(skill, /references\/capture\.md/u);
  assert.match(skill, /references\/inquiry\.md/u);
  assert.ok(capture.indexOf("`suggest_links`") < capture.indexOf("`preview_card`"));
  assert.ok(capture.indexOf("`preview_card`") < capture.indexOf("`save_card`"));
  assert.ok(inquiry.indexOf("`search_cards`") < inquiry.indexOf("`get_card`"));
  assert.doesNotMatch(inquiry, /call `save_card`/iu);
});

test("encodes representative safety and content-quality decisions", async () => {
  const capture = await readFile(path.join(skillRoot, "references", "capture.md"), "utf8");
  const inquiry = await readFile(path.join(skillRoot, "references", "inquiry.md"), "utf8");
  const combined = capture + "\n" + inquiry;

  assert.match(combined, /untrusted|as data/iu, "embedded prompt injection is treated as source data");
  assert.match(capture, /exactly one coherent concept per review/iu, "unrelated topics split into sequential cards");
  assert.match(capture, /summaryMarkdown[\s\S]*detailMarkdown/u, "Summary and Detail are distinct");
  assert.match(capture, /substantially more concrete[\s\S]*paraphrase/iu, "Detail is concrete and paraphrased");
  assert.match(capture, /\$\.\.\.\$[\s\S]*\$\$\.\.\.\$\$/u, "inline and display math are preserved");
  assert.match(capture, /Never persist the full conversation/iu, "full transcript storage is forbidden");
  assert.match(capture, /not final save confirmation/iu, "initial capture intent is not final confirmation");
  assert.match(inquiry, /does not contain sufficient evidence/iu, "missing vault evidence is disclosed");
});

test("metadata supports direct and implicit invocation without broad activation", async () => {
  const skill = await readFile(path.join(skillRoot, "SKILL.md"), "utf8");
  const metadataSource = await readFile(path.join(skillRoot, "agents", "openai.yaml"), "utf8");
  const metadata = parse(metadataSource);
  const description = skill.match(/^---\r?\n([\s\S]*?)\r?\n---/u)?.[1] ?? "";

  assert.equal(metadata.policy.allow_implicit_invocation, true);
  assert.match(metadata.interface.default_prompt, /\$patchouli/u);
  assert.match(description, /save|condense|remember/iu);
  assert.match(description, /knowledge base|knowledge vault/iu);
  assert.match(description, /Do not use for an ordinary summary/iu);
});
