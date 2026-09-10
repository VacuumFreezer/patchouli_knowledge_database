import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import * as core from '../dist/core.mjs';
import { parityScenario } from './fixtures/parity-scenario.mjs';

test('matches the committed Windows card, search, category, legacy and wikilink baseline', async () => {
  const baseline = JSON.parse(await readFile(new URL('./fixtures/windows-parity.json', import.meta.url), 'utf8'));
  // Frozen Windows v1 Markdown is still a read/search contract. V2 deliberately
  // changes rendering, so feed these historical bytes through today's parser.
  let index = 0;
  const legacyCore = { ...core, renderCard: () => {
    const card = baseline.expected.cards[index++];
    return { markdown: card.markdown, draft: { filename: card.filename } };
  } };
  assert.deepEqual(parityScenario(legacyCore), baseline.expected);
});
