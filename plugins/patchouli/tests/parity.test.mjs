import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import * as core from '../dist/core.mjs';
import { parityScenario } from './fixtures/parity-scenario.mjs';

test('matches the committed Windows card, search, category, legacy and wikilink baseline', async () => {
  const baseline = JSON.parse(await readFile(new URL('./fixtures/windows-parity.json', import.meta.url), 'utf8'));
  assert.deepEqual(parityScenario(core), baseline.expected);
});
