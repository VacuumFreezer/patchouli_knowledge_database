import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { CaptureStore, VaultCardEngine, CheckpointStore } from '../dist/core.mjs';

const draft = title => ({ title, categories: ['Testing'], summaryMarkdown: 'Reusable knowledge.', detailMarkdown: 'Durable mechanism.', fyiMarkdown: 'Optional example.', evidence: [], sources: [], connections: [] });
const input = () => ({ cards: [{ key: 'tokens', splitReason: 'NLP segmentation mechanism', draft: draft('Tokenization') }, { key: 'unicode', splitReason: 'General character encoding prerequisite', draft: draft('Unicode 字符') }], relationships: [{ fromKey: 'tokens', toKey: 'unicode', reason: 'UTF-8 bytes explain Chinese and emoji segmentation in byte-level BPE.', selected: true }] });
async function setup(t, ttl = 900000, now = Date.now) {
  const root = await mkdtemp(path.join(tmpdir(), 'patchouli-v2-capture-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const vault = path.join(root, 'vault'); await mkdir(vault);
  const engine = new VaultCardEngine({ configurationPath: path.join(root, 'config.json') });
  await engine.configureVault({ vaultPath: vault, cardsDirectory: 'NLP' });
  const checkpoints = new CheckpointStore({ root: path.join(root, 'checkpoints') });
  const store = new CaptureStore(engine, checkpoints, ttl, now);
  return { root, vault, engine, checkpoints, store };
}
async function sharedCheckpoint(checkpoints) {
  await checkpoints.launch('task');
  const { checkpoints: [checkpoint] } = await checkpoints.replaceFromCompaction('task', { trigger: 'manual', turnId: 'turn', model: 'fixture', messageCount: 4, transcriptDigest: 'abc', generationStartedAtMs: Date.now(), drafts: [draft('Shared pre-v2 concept')] });
  return { checkpointId: checkpoint.checkpointId, revision: checkpoint.revision };
}

test('new peers resolve before writes; one save preserves shared checkpoint until all writes, concurrent retry is idempotent', async t => {
  const { store, engine, checkpoints } = await setup(t);
  const ref = await sharedCheckpoint(checkpoints);
  const data = input(); data.cards.forEach(card => card.checkpointRefs = [ref]);
  const preview = await store.preview(data, 'task');
  assert.equal((await engine.scanCards()).length, 0);
  assert.equal(preview.cards[0].resolvedDraft.connections[0].cardRef, 'NLP/Unicode 字符.md');
  const realWrite = engine.writeCard.bind(engine); let calls = 0;
  engine.writeCard = async (...args) => { assert.equal((await checkpoints.list('task')).length, 1); calls++; return realWrite(...args); };
  const results = await Promise.all([store.save(preview.pendingToken, 'task'), store.save(preview.pendingToken, 'task')]);
  assert.equal(calls, 2); assert.equal(results.filter(r => r.idempotentReplay).length, 1);
  assert.equal((await checkpoints.list('task')).length, 0);
  assert.match(results[0].result.cards[0].card.markdown, /\[\[Unicode 字符\|Unicode 字符\]\]/);
  assert.equal((await store.save(preview.pendingToken, 'task')).idempotentReplay, true);
  assert.equal((await engine.scanCards()).length, 2);
  await assert.rejects(store.save(preview.pendingToken, 'other'), { code: 'TOKEN_INVALID' });
});

test('preflight collisions/manual revisions prevent every group write; partial failure retains checkpoints and retry resumes', async t => {
  const { store, engine, checkpoints, vault } = await setup(t);
  const ref = await sharedCheckpoint(checkpoints);
  const data = input(); data.cards.forEach(card => card.checkpointRefs = [ref]);
  const preview = await store.preview(data, 'task');
  const realWrite = engine.writeCard.bind(engine); let calls = 0;
  engine.writeCard = async (...args) => { if (++calls === 2) throw new Error('injected disk failure'); return realWrite(...args); };
  await assert.rejects(store.save(preview.pendingToken, 'task'), error => error.details.savedCards.length === 1 && error.details.retainedCheckpointRefs.length === 1);
  assert.equal((await checkpoints.list('task')).length, 1);
  const first = await engine.getCard('NLP/Tokenization.md');
  const resumed = await store.save(preview.pendingToken, 'task');
  assert.equal(resumed.result.cards.length, 2); assert.equal(calls, 3);
  assert.equal((await engine.getCard(first.cardRef)).revision, first.revision);
  assert.equal((await checkpoints.list('task')).length, 0);
  const next = input(); next.cards.forEach(card => card.draft.title += ' New');
  const blocked = await store.preview(next, 'task');
  await writeFile(path.join(vault, blocked.cards[1].destinationRef), 'Manual competing file');
  await assert.rejects(store.save(blocked.pendingToken, 'task'), error => error.code === 'COLLISION' && error.details.savedCards.length === 0);
  assert.equal((await engine.scanCards()).length, 3);
  assert.equal((await store.save(blocked.pendingToken, 'task', 'cancel')).result.cancelled, true);
  await assert.rejects(store.save(blocked.pendingToken, 'task'), { code: 'TOKEN_CONSUMED' });
});

test('partial receipts protect later manual edits and survive retry without duplication', async t => {
  const { store, engine } = await setup(t); const preview = await store.preview(input(), 'task');
  const original = engine.writeCard.bind(engine); let calls = 0;
  engine.writeCard = async (...args) => { if (++calls === 2) throw new Error('disk'); return original(...args); };
  await assert.rejects(store.save(preview.pendingToken, 'task'));
  const first = await engine.getCard('NLP/Tokenization.md');
  await engine.updateCard(first.cardRef, first.revision, { ...draft('Tokenization'), detailMarkdown: 'Manual revised mechanism.' });
  await assert.rejects(store.save(preview.pendingToken, 'task'), { code: 'REVISION_CONFLICT' });
  assert.match((await engine.getCard(first.cardRef)).markdown, /Manual revised/);
  assert.equal((await engine.scanCards()).length, 1);
});

test('mixed update/new and renamed peers preserve identity, metadata and exact links', async t => {
  const { store, engine } = await setup(t);
  const saved = await engine.writeCard(draft('Old encoding'));
  await writeFile(saved.absolutePath, saved.card.markdown.replace('---\n', '---\nowner: personal\n') + '\n## My annotation\nKeep me.\n');
  const current = await engine.getCard(saved.card.cardRef);
  const data = input(); Object.assign(data.cards[1], { cardRef: current.cardRef, expectedRevision: current.revision });
  data.cards[1].draft.title = 'Unicode renamed';
  const preview = await store.preview(data, 'task');
  assert.equal(preview.cards[0].resolvedDraft.connections[0].cardRef, 'NLP/Unicode renamed.md');
  const { result } = await store.save(preview.pendingToken, 'task');
  assert.equal(result.cards[1].card.id, current.id); assert.equal(result.cards[1].card.createdAt, current.createdAt);
  assert.match(result.cards[1].card.markdown, /My annotation/); assert.match(result.cards[1].card.markdown, /personal/);
  assert.match(result.cards[0].card.markdown, /\[\[Unicode renamed\|Unicode renamed\]\]/);
  const conflictData = input(); conflictData.cards[0].draft.title = 'Other'; Object.assign(conflictData.cards[1], { draft: draft('Unicode renamed'), cardRef: result.cards[1].card.cardRef, expectedRevision: result.cards[1].card.revision });
  const conflict = await store.preview(conflictData, 'task');
  await writeFile(result.cards[1].absolutePath, result.cards[1].card.markdown + 'Manual edit');
  await assert.rejects(store.save(conflict.pendingToken, 'task'), error => error.code === 'REVISION_CONFLICT' && error.details.savedCards.length === 0);
});

test('omitted member deselects peers and retains a shared checkpoint; cancellation invalidates token', async t => {
  const { store, engine, checkpoints } = await setup(t);
  const ref = await sharedCheckpoint(checkpoints); const data = input(); data.cards.forEach(card => card.checkpointRefs = [ref]);
  const cancelled = await store.preview(data, 'task');
  assert.equal((await store.save(cancelled.pendingToken, 'task', 'cancel')).result.cancelled, true);
  await assert.rejects(store.save(cancelled.pendingToken, 'task'), { code: 'TOKEN_CONSUMED' });
  assert.equal((await engine.scanCards()).length, 0);
  data.cards[1].selected = false;
  const preview = await store.preview(data, 'task'); assert.equal(preview.relationships[0].selected, false);
  const { result } = await store.save(preview.pendingToken, 'task');
  assert.equal(result.cards.length, 1); assert.deepEqual(result.retainedCheckpointRefs, [ref]);
  assert.equal(result.cards[0].card.links.length, 0); assert.equal((await checkpoints.list('task')).length, 1);
});

test('rejects duplicate keys, portable destination aliases, self/unknown/duplicate/dangling peers', async t => {
  const { store } = await setup(t);
  for (const mutate of [
    data => data.cards[1].key = data.cards[0].key,
    data => data.cards[1].draft.title = 'TOKENIZATION',
    data => data.relationships[0].toKey = 'tokens',
    data => data.relationships[0].toKey = 'missing',
    data => data.relationships.push(data.relationships[0]),
    data => data.cards[0].draft.connections.push({ cardRef: 'NLP/Missing.md', title: 'Missing', reason: 'Must exist', selected: true }),
    data => data.cards[0].draft.connections.push({ cardRef: 'NLP/Unicode 字符.md', title: 'Unicode', reason: 'Duplicate peer', selected: true }),
  ]) { const data = input(); mutate(data); await assert.rejects(store.preview(data, 'task')); }
});

test('task/config/expiry checks apply to unused, in-flight and completed group tokens; single-card tokens rejected', async t => {
  let now = 1000; const { store, engine, vault } = await setup(t, 100, () => now);
  const preview = await store.preview(input(), 'task');
  await assert.rejects(store.save('a'.repeat(43), 'task'), { code: 'TOKEN_INVALID' });
  await assert.rejects(store.save(preview.pendingToken, 'other'), { code: 'TOKEN_INVALID' });
  await engine.configureVault({ vaultPath: vault, cardsDirectory: 'Different' });
  await assert.rejects(store.save(preview.pendingToken, 'task'), { code: 'CONFIGURATION_INVALID' });
  await engine.configureVault({ vaultPath: vault, cardsDirectory: 'NLP' });
  await store.save(preview.pendingToken, 'task');
  await engine.configureVault({ vaultPath: vault, cardsDirectory: 'Different' });
  await assert.rejects(store.save(preview.pendingToken, 'task'), { code: 'CONFIGURATION_INVALID' });
  now = 1100; await assert.rejects(store.save(preview.pendingToken, 'task'), { code: 'TOKEN_EXPIRED' });
});
