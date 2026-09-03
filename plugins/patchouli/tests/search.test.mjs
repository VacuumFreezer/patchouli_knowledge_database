import assert from "node:assert/strict";
import test from "node:test";

import { CardIndex, listCategories, parseCard } from "../dist/core.mjs";

function card(ref, title, categories, body) {
  return parseCard(
    `---\ntitle: ${JSON.stringify(title)}\ncategories: ${JSON.stringify(categories)}\n---\n# ${title}\n\n${body}`,
    ref,
  );
}

const cards = [
  card("Patchouli/Zeta.md", "Quantum", ["Physics"], "Entanglement and measurement."),
  card("Patchouli/Alpha.md", "A category match", ["Quantum", "Research"], "A separate topic."),
  card("Patchouli/Beta.md", "A body match", ["Research"], "Quantum appears twice: quantum."),
  card("Patchouli/Gamma.md", "Gamma", ["Research"], "A deterministic tie token."),
  card("Patchouli/Delta.md", "Delta", ["research"], "A deterministic tie token."),
];

test("ranks title, category, and body matches in deterministic order", () => {
  const results = new CardIndex(cards).search("quantum");
  assert.deepEqual(results.slice(0, 3).map((result) => result.title), [
    "Quantum",
    "A category match",
    "A body match",
  ]);
  assert.deepEqual(results[0].matchedFields, ["body", "title"]);
  assert.ok(results[0].score > results[1].score);
  assert.ok(results[1].score > results[2].score);
});

test("applies category filters and limits", () => {
  const results = new CardIndex(cards).search("quantum", { categories: ["research"], limit: 1 });
  assert.equal(results.length, 1);
  assert.equal(results[0].title, "A category match");
});

test("sorts equal scores by title then card reference", () => {
  const results = new CardIndex(cards).search("deterministic tie");
  assert.deepEqual(results.map((result) => result.title), ["Delta", "Gamma"]);
});

test("counts categories case-insensitively and deterministically", () => {
  assert.deepEqual(listCategories(cards), [
    { name: "Physics", count: 1 },
    { name: "Quantum", count: 1 },
    { name: "Research", count: 4 },
  ]);
});
