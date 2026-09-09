export function parityScenario(core) {
  const { renderCard, parseCard, CardIndex, listCategories } = core;
  const cards = ["Bayesian Updating", "概率与推断"].map((title, index) => {
    const rendered = renderCard({ title, categories: index ? ["Mathematics", "统计"] : ["Probability"], summaryMarkdown: "Bayesian updating combines prior knowledge with observed evidence.", detailMarkdown: "### Derivation\n\nNormalize the prior and likelihood:\n\n$$\np(H|E)=\\frac{p(E|H)p(H)}{p(E)}\n$$\n\nThe denominator must be positive.", evidence: [{ claim: "Posterior odds incorporate the likelihood ratio.", sourceReference: "Parity fixture" }], sources: [{ type: "text", label: "Parity source", url: "https://example.com/source" }], connections: [{ cardRef: "Patchouli/Bayesian Updating.md", title: "Bayesian Updating", reason: "Same method", selected: Boolean(index) }] }, { id: `11111111-1111-4111-8111-11111111111${index}`, createdAt: "2026-09-09T00:00:00.000Z" });
    return parseCard(rendered.markdown, `Patchouli/${rendered.draft.filename}`);
  });
  cards.push(parseCard("---\ntitle: Legacy\ncategories: Archive\n---\n# Legacy\n\n## My Understanding\n\nLegacy Bayesian interpretation.\n\n## Annotations\n\nKeep this.", "Patchouli/Legacy.md"));
  const index = new CardIndex(cards);
  return { cards, categories: listCategories(cards), search: index.search("Bayesian"), filtered: index.search("prior", { categories: ["mathematics"], limit: 1 }), absent: index.search("heliopause") };
}
