import assert from "node:assert/strict";
import test from "node:test";

import { parseCard, renderCard } from "../dist/core.mjs";

function draft(overrides = {}) {
  return {
    title: "YAML: Safety & Unicode 量子",
    categories: [" Research ", "Research", "量子"],
    annotation: "A personal note.",
    summaryMarkdown: "A concise **summary**.",
    understandingMarkdown: "The user's current understanding.",
    evidence: [{ claim: "The claim is paraphrased", sourceReference: "Session note" }],
    sources: [{ type: "markdown", label: "Source [one]", url: "https://example.com/source?q=1" }],
    connections: [
      { cardRef: "Patchouli/Related.md", title: "Related | Card", reason: "Shared idea", selected: true },
      { cardRef: "Patchouli/Hidden.md", title: "Hidden", reason: "Not selected", selected: false },
    ],
    ...overrides,
  };
}

test("renders canonical YAML and Markdown without a Key Concepts section", () => {
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
  assert.match(rendered.markdown, /## My Understanding/u);
  assert.doesNotMatch(rendered.markdown, /Key Concepts/u);
  assert.match(rendered.markdown, /\[\[Related\|Related - Card\]\] — Shared idea/u);
  assert.doesNotMatch(rendered.markdown, /Hidden/u);
  assert.equal(parsed.links[0].cardRef, "Related");
});

test("keeps model content below server-owned frontmatter", () => {
  const rendered = renderCard(draft({
    title: "---\ntitle: injected",
    summaryMarkdown: "---\nid: not-frontmatter\n---",
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
  const rendered = renderCard(draft({ annotation: "", evidence: [], sources: [], connections: [] }));
  assert.equal((rendered.markdown.match(/_None\._/gu) ?? []).length, 4);
});
