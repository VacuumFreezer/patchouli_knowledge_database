import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skillRoot = path.join(pluginRoot, "skills", "patchouli");
const skillPath = path.join(skillRoot, "SKILL.md");
const metadataPath = path.join(skillRoot, "agents", "openai.yaml");
const mcpPath = path.join(pluginRoot, ".mcp.json");
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

function frontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u);
  if (!match) throw new Error("SKILL.md is missing YAML frontmatter.");
  return parse(match[1]);
}

const [skill, metadataSource, mcpSource] = await Promise.all([
  readFile(skillPath, "utf8"),
  readFile(metadataPath, "utf8"),
  readFile(mcpPath, "utf8"),
]);
const skillMetadata = frontmatter(skill);
const metadata = parse(metadataSource);
const mcp = JSON.parse(mcpSource);

check(skillMetadata.name === "patchouli", "skill name must be patchouli");
check(typeof skillMetadata.description === "string" && skillMetadata.description.length >= 80, "skill description must identify both workflows and their boundary");
check(/capture|save|condense/iu.test(skillMetadata.description), "skill description must cover capture intent");
check(/launch/iu.test(skillMetadata.description), "skill description must cover explicit launch intent");
check(/answer|question|knowledge vault/iu.test(skillMetadata.description), "skill description must cover inquiry intent");
check(/Do not use/iu.test(skillMetadata.description), "skill description must exclude ordinary non-vault summarization");
check(metadata.interface?.display_name === "Patchouli", "skill display name must be Patchouli");
check(typeof metadata.interface?.short_description === "string" && metadata.interface.short_description.length >= 25 && metadata.interface.short_description.length <= 64, "short description must be 25–64 characters");
check(metadata.interface?.default_prompt?.includes("$patchouli"), "default prompt must mention $patchouli");
check(metadata.policy?.allow_implicit_invocation === true, "implicit invocation must remain enabled");
check(metadata.dependencies?.tools?.some((tool) => tool.type === "mcp" && tool.value === "patchouli"), "skill must depend on the patchouli MCP server");
check(Object.hasOwn(mcp.mcpServers ?? {}, "patchouli"), "declared patchouli MCP server must exist");

const referenceLinks = [...skill.matchAll(/\]\((references\/[^)]+)\)/gu)].map((match) => match[1]);
check(referenceLinks.length === 3, "SKILL.md must route to exactly three top-level focused references");
for (const reference of referenceLinks) {
  try {
    await access(path.join(skillRoot, reference));
  } catch {
    failures.push(`missing skill reference: ` + reference);
  }
}

for (const marker of ["[TODO:", "TBD", "FIXME"]) {
  check(!skill.includes(marker) && !metadataSource.includes(marker), `skill contains unfinished marker: ` + marker);
}

if (failures.length > 0) {
  console.error(`Patchouli skill validation failed (` + failures.length + "):");
  for (const failure of failures) console.error("- " + failure);
  process.exitCode = 1;
} else {
  console.log("Patchouli skill validation passed.");
}
