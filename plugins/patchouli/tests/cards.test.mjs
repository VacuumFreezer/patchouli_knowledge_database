import assert from "node:assert/strict";
import test from "node:test";

import { parseCard, renderCard } from "../dist/core.mjs";

function draft(overrides = {}) {
  return {
    title: "YAML: Safety & Unicode 量子",
    categories: [" Research ", "Research", "量子"],
    summaryMarkdown: "A concise **summary**.",
    detailMarkdown: "A concrete explanation with inline math $E = mc^2$ and display math:\n\n$$\n\\int_0^1 x^2\\,dx = \\frac{1}{3}\n$$",
    evidence: [{ claim: "The claim is paraphrased", sourceReference: "Session note" }],
    sources: [{ type: "markdown", label: "Source [one]", url: "https://example.com/source?q=1" }],
    connections: [
      { cardRef: "Patchouli/Related.md", title: "Related | Card", reason: "Shared idea", selected: true },
      { cardRef: "Patchouli/Hidden.md", title: "Hidden", reason: "Not selected", selected: false },
    ],
    ...overrides,
  };
}

test("renders canonical Summary and Detail Markdown with Obsidian-compatible math", () => {
  const rendered = renderCard(draft(), {
    id: "11111111-1111-4111-8111-111111111111",
    createdAt: "2026-08-29T02:00:00-04:00",
  });
  const parsed = parseCard(rendered.markdown, `Patchouli/${rendered.draft.filename}`);

  assert.equal(parsed.id, "11111111-1111-4111-8111-111111111111");
  assert.equal(parsed.title, "YAML: Safety & Unicode 量子");
  assert.deepEqual(parsed.categories, ["Research", "量子"]);
  assert.deepEqual(parsed.sourceTypes, ["markdown"]);
  assert.match(rendered.markdown, /## Summary/u);
  assert.match(rendered.markdown, /## Core/u);
  assert.match(rendered.markdown, /## FYI/u);
  assert.match(rendered.markdown, /\$E = mc\^2\$/u);
  assert.match(rendered.markdown, /\$\$\n\\int_0\^1 x\^2\\,dx = \\frac\{1\}\{3\}\n\$\$/u);
  assert.doesNotMatch(rendered.markdown, /My Understanding|Annotations/u);
  assert.doesNotMatch(rendered.markdown, /Key Concepts/u);
  assert.match(rendered.markdown, /\[\[Related\|Related - Card\]\] — Shared idea/u);
  assert.doesNotMatch(rendered.markdown, /Hidden/u);
  assert.equal(parsed.links[0].cardRef, "Related");
});

test("keeps model content below server-owned frontmatter", () => {
  const rendered = renderCard(draft({
    title: "---\ntitle: injected",
    summaryMarkdown: "```yaml\n---\nid: not-frontmatter\n---\n```",
  }));
  const parsed = parseCard(rendered.markdown, `Patchouli/${rendered.draft.filename}`);
  assert.equal(parsed.title, "--- title: injected");
  assert.equal(rendered.markdown.match(/^---$/gmu)?.length, 4);
  assert.equal(parsed.warnings.length, 0);
});

test("parses manually edited and missing-frontmatter cards", () => {
  const manual = parseCard("---\ntitle: Manual\ncategories: research\n---\n# Changed heading\nBody", "Patchouli/Manual.md");
  assert.equal(manual.title, "Manual");
  assert.deepEqual(manual.categories, ["research"]);

  const plain = parseCard("# Unicode 标题\n\nPlain body with [[Other Card]].", "Patchouli/Fallback.md");
  assert.equal(plain.title, "Unicode 标题");
  assert.equal(plain.links[0].cardRef, "Other Card");
  assert.deepEqual(plain.categories, []);
});

test("reports malformed frontmatter without failing card parsing", () => {
  const missingDelimiter = parseCard("---\ntitle: Broken\n# Body", "Patchouli/Broken.md");
  assert.equal(missingDelimiter.title, "Body");
  assert.match(missingDelimiter.warnings[0], /no closing delimiter/u);

  const malformedYaml = parseCard("---\ntitle: [broken\n---\n# Fallback\nBody", "Patchouli/Malformed.md");
  assert.equal(malformedYaml.title, "Fallback");
  assert.ok(malformedYaml.warnings.some((warning) => warning.startsWith("Frontmatter:")));
});

test("renders predictable placeholders for optional empty sections", () => {
  const rendered = renderCard(draft({ evidence: [], sources: [], connections: [] }));
  assert.equal((rendered.markdown.match(/_None\._/gu) ?? []).length, 4);
});

test("requires both Summary and Detail", () => {
  for (const field of ["summaryMarkdown", "detailMarkdown"]) {
    assert.throws(
      () => renderCard(draft({ [field]: " " })),
      (error) => error.code === "VALIDATION_ERROR" && error.details.field === field,
    );
  }
});

test("reserves level-one and level-two headings while allowing Detail subheadings and fenced examples", () => {
  for (const [field, value] of [
    ["summaryMarkdown", "## Evidence\nInjected structure"],
    ["detailMarkdown", "Injected structure\n---"],
  ]) {
    assert.throws(
      () => renderCard(draft({ [field]: value })),
      (error) => error.code === "VALIDATION_ERROR" && error.details.field === field,
    );
  }

  const rendered = renderCard(draft({
    summaryMarkdown: "```markdown\n## This is inert example text\n```",
    detailMarkdown: "### Derivation\n\nA server-safe subsection.",
  }));
  assert.match(rendered.markdown, /### Derivation/u);
  assert.match(rendered.markdown, /## This is inert example text/u);
});
