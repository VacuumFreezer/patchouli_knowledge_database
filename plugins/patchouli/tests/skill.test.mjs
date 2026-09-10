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

test("routes launch, capture, update, and inquiry through focused references with safe tool ordering", async () => {
  const skill = await readFile(path.join(skillRoot, "SKILL.md"), "utf8");
  const launch = await readFile(path.join(skillRoot, "references", "launch.md"), "utf8");
  const capture = await readFile(path.join(skillRoot, "references", "capture.md"), "utf8");
  const update = await readFile(path.join(skillRoot, "references", "update.md"), "utf8");
  const inquiry = await readFile(path.join(skillRoot, "references", "inquiry.md"), "utf8");

  assert.match(skill, /references\/capture\.md/u);
  assert.match(skill, /references\/launch\.md/u);
  assert.match(skill, /references\/inquiry\.md/u);
  for (const file of ["concepts.md", "capture.md", "update.md", "inquiry.md", "launch.md"]) {
    assert.ok((await readFile(path.join(skillRoot, "references", file), "utf8")).length > 0);
  }
  assert.match(launch, /`launch_patchouli`/u);
  assert.match(launch, /indicatorImagePath/u);
  assert.match(skill, /!\[Patchouli\][\s\S]*# Patchouli capture active/u);
  assert.match(update, /`preview_card_update`[\s\S]*`update_card`/u);
  assert.match(update, /REVISION_CONFLICT/u);
  assert.ok(inquiry.indexOf("`search_cards`") < inquiry.indexOf("`get_card`"));
  assert.doesNotMatch(inquiry, /call `save_card`/iu);
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
  assert.match(description, /\$patchouli launch/iu);
  assert.match(description, /casual mention/iu);
});
