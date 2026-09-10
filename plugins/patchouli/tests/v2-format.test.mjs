import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, readFile, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { VaultCardEngine, normalizeCardDraft, renderCard, parseCard, extractCardUpdatePreservation, ensureCardPresentation, PATCHOULI_SNIPPET, LEGACY_PATCHOULI_SNIPPET, V21_PATCHOULI_SNIPPET } from '../dist/core.mjs';

const draft = (extra = {}) => ({ title: '字符编码', categories: ['基础'], summaryMarkdown: '字符与字节不同。', detailMarkdown: '### 机制\n\nUnicode assigns code points; UTF-8 encodes them. $n=4$\n\n```python\nlen("😀".encode("utf-8"))\n```', evidence: [], sources: [], connections: [], ...extra });

test('owned v2 presentation upgrades once without rewriting cards or appearance preferences', async t => {
  const root = await mkdtemp(path.join(tmpdir(), 'patchouli-style-upgrade-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, '.obsidian/snippets'), { recursive: true });
  const css = path.join(root, '.obsidian/snippets/patchouli-cards-v2.css');
  const appearance = path.join(root, '.obsidian/appearance.json');
  const settings = '{ "theme": "moonstone", "enabledCssSnippets": ["personal", "patchouli-cards-v2"] }';
  await writeFile(css, V21_PATCHOULI_SNIPPET);
  await writeFile(appearance, settings);
  await writeFile(path.join(root, 'card.md'), renderCard(draft()).markdown);
  const original = await readFile(path.join(root, 'card.md'), 'utf8');
  await Promise.all([ensureCardPresentation(root), ensureCardPresentation(root)]);
  assert.equal(await readFile(css, 'utf8'), PATCHOULI_SNIPPET);
  assert.equal(await readFile(appearance, 'utf8'), settings);
  assert.equal(await readFile(path.join(root, 'card.md'), 'utf8'), original);
  await ensureCardPresentation(root);
  assert.equal(await readFile(css, 'utf8'), PATCHOULI_SNIPPET);
});

test('presentation upgrade preserves customized snippets and rejects snippet symlink escapes', async t => {
  const root = await mkdtemp(path.join(tmpdir(), 'patchouli-style-custom-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const vault = path.join(root, 'vault');
  await mkdir(path.join(vault, '.obsidian/snippets'), { recursive: true });
  const css = path.join(vault, '.obsidian/snippets/patchouli-cards-v2.css');
  const custom = LEGACY_PATCHOULI_SNIPPET + '/* user modifications */';
  await writeFile(css, custom);
  await assert.rejects(ensureCardPresentation(vault), { code: 'COLLISION' });
  assert.equal(await readFile(css, 'utf8'), custom);
  await rm(css);
  const outside = path.join(root, 'outside.css');
  await writeFile(outside, LEGACY_PATCHOULI_SNIPPET);
  await symlink(outside, css);
  await assert.rejects(ensureCardPresentation(vault), { code: 'PATH_ESCAPE' });
  assert.equal(await readFile(outside, 'utf8'), LEGACY_PATCHOULI_SNIPPET);
});

test('Core/FYI normalize legacy input, preserve math/code, reject structural injection, and round trip updates', () => {
  assert.equal(normalizeCardDraft(draft()).fyiMarkdown, '');
  assert.throws(() => normalizeCardDraft(draft({ fyiMarkdown: '## Sources\nInjected' })), { code: 'VALIDATION_ERROR' });
  const first = renderCard(draft({ fyiMarkdown: '### Example\n\nGPT vocabulary figure (version-dependent).' }), {
    id: 'stable', createdAt: '2026-01-01T00:00:00Z', frontmatterExtras: { cssclasses: ['personal'], owner: 'user' }, customSectionsMarkdown: '## My notes\n\nKeep me.',
  });
  const preserved = extractCardUpdatePreservation(first.markdown);
  const second = renderCard(draft({ fyiMarkdown: 'Worked example.' }), { ...preserved, id: first.id, createdAt: first.createdAt });
  assert.match(second.markdown, /"personal"/);
  assert.match(second.markdown, /"patchouli-card"/);
  assert.match(second.markdown, /"owner": "user"/);
  assert.match(second.markdown, /## My notes\n\nKeep me/);
  assert.equal(second.markdown.match(/^# /gm).length, 1);
  assert.equal(second.markdown.match(/^## Core$/gm).length, 1);
  assert.equal(second.markdown.match(/^## FYI$/gm).length, 1);
  assert.match(second.markdown, /len\("😀"\.encode\("utf-8"\)\)/);
  assert.equal(parseCard(second.markdown, 'NLP/字符编码.md').id, 'stable');
});

test('presentation is scoped, settings preserved, FYI searchable, and legacy existing configuration upgrades on save', async t => {
  const root = await mkdtemp(path.join(tmpdir(), 'patchouli-v2-format-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const vault = path.join(root, 'vault');
  await mkdir(path.join(vault, '.obsidian'), { recursive: true });
  const appearance = path.join(vault, '.obsidian/appearance.json');
  await writeFile(appearance, JSON.stringify({ theme: 'moonstone', enabledCssSnippets: ['personal'], customFont: '中文' }));
  const config = path.join(root, 'configuration.json');
  await writeFile(config, JSON.stringify({ vaultPath: vault, cardsDirectory: 'NLP' }));
  const engine = new VaultCardEngine({ configurationPath: config });
  const inspected = await engine.inspectDraft(draft());
  assert.equal(inspected.collision.cardRef, 'NLP/字符编码.md');
  assert.deepEqual(JSON.parse(await readFile(appearance, 'utf8')).enabledCssSnippets, ['personal']);
  await engine.writeCard(draft({ fyiMarkdown: 'Rareexample123' }));
  assert.deepEqual(JSON.parse(await readFile(appearance, 'utf8')), { theme: 'moonstone', enabledCssSnippets: ['personal', 'patchouli-cards-v2'], customFont: '中文' });
  const css = await readFile(path.join(vault, '.obsidian/snippets/patchouli-cards-v2.css'), 'utf8');
  assert.match(css, /\.patchouli-card \.metadata-container/);
  assert.match(css, /\.patchouli-card \.inline-title/);
  assert.equal((await engine.searchCards('Rareexample123')).length, 1);
  await engine.configureVault({ vaultPath: vault, cardsDirectory: 'NLP' });
  assert.equal(JSON.parse(await readFile(appearance, 'utf8')).enabledCssSnippets.length, 2);
  await writeFile(appearance, '{ invalid user config');
  await assert.rejects(engine.writeCard(draft({ title: 'Other' })), { code: 'CONFIGURATION_INVALID' });
  assert.equal(await readFile(appearance, 'utf8'), '{ invalid user config');
  await rm(appearance);
  await symlink(path.join(root, 'outside.json'), appearance);
  await writeFile(path.join(root, 'outside.json'), '{}');
  await assert.rejects(engine.writeCard(draft({ title: 'Escape' })), { code: 'PATH_ESCAPE' });
  assert.equal(await readFile(path.join(root, 'outside.json'), 'utf8'), '{}');
});
