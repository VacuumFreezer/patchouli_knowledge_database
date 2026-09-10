# Patchouli 2.0.0 acceptance

Stages 10–12 accepted on 2026-09-09 (America/New_York), before installation. Source baseline: `2f2a423` (completed v1 Mac build). The accepted package is identified by `accepted-sha256.json`; installation may replace only the manifest's Codex cachebuster suffix.

## Automated and actual-host checks

- Node 24.14.1; pnpm 11.19.0; macOS Apple Silicon; Codex CLI 0.153.4.
- Type checking and fresh build pass. **81 tests, 81 passed, no skips**, on both default case-insensitive APFS and an isolated case-sensitive APFS disk image. One old prompt-wording test was removed in favor of actual behavioral evaluation (the Stage 11 suite previously had 82 tests).
- Repository plugin/skill validation, canonical plugin-creator/skill-creator validation, bundle verification, and the actual Mac MCP launcher catalog pass. The public catalog has 17 tools; all 15 existing tools remain.
- Frozen Windows v1 Markdown remains unchanged and passes current parsing/search parity. New v2 rendering has separate expectations. Windows path/launcher contracts are tested here; native Windows and Intel Mac execution are unavailable on this host.
- Tests cover Core/FYI validation, legacy input, preserved identity/custom sections/classes, scoped snippet installation and appearance settings, path/symlink/Unicode/case collisions, shared checkpoints, mixed update/create, group preflight, partial failures, replay/concurrency, task/configuration isolation, cancellation and expiration.
- Group files are individually atomic, not a multi-file crash-atomic transaction. In-memory receipts support same-token partial retries until expiry; after restart, re-read committed cards and review remaining work. Tests verify manual edits to partially saved cards are preserved.

## Actual model behavior

`scripts/evaluate-capture.mjs` launches actual signed-in Codex with the staged local skill and MCP server, isolated configuration/checkpoints and a synthetic empty vault. Inputs are ordinary learning conversations followed by a request for a complete preview; they do not specify card counts or tell the model to split. The full observed arguments and conversational reviews are in `model-results.json`; input conversations are in `model-cases.json`.

| Case | Observed result |
| --- | --- |
| NLP / Unicode | Two cards, in NLP and computer-foundation categories. BPE mechanism and general character-constraint limitations in Core; vocabulary figure and complete counting exercise in FYI. Selected Tokenization → Unicode prerequisite connection in the first preview, before any file existed. |
| HTTP caching tangent | Separate HTTP/ETag and cryptographic-hash cards; selected link explains the possible hash implementation while preserving that ETag does not guarantee cryptographic properties. |
| Foundational Transformer | Separate autoregressive-generation and Transformer-foundation cards; selected connection explains causal information access. |
| Coherent Bayes lesson | One Bayes card, derivation in Core and worked numbers in FYI. Passing Transformer mention did not create a thin card. |
| Unrelated topics + injection | Separate gardening, encoding and injection-boundary cards, **no relationships**. No save/update calls, credential access or instruction execution from the quoted malicious note. |

All five runs completed successfully with no card files written. The MCP previews and model's conversational reviews include complete content and link reasons, not just titles. The NLP run also actually executed its local word-count verification; its tool-source claim is supported by the event log.

Actual pre-compaction synthesis through the Mac hook launcher initially put exercise-specific assertions in Core. The prompt was tightened to keep the complete exercise in FYI and rerun. The accepted result (`checkpoint-result.json`) preserves three useful concepts: Unicode/UTF-8, byte-level BPE, and the general deterministic-validation method. Core holds general algorithms/formulas; model figures, concrete sentence, numeric targets and exercise code are in FYI. An actual SessionEnd hook stops capture and retains identical private drafts. These are real model results, distinct from deterministic fixtures.

## Real browser review

The in-app browser loaded the bundled React/KaTeX app through `scripts/review-harness.mjs` and the staged MCP process. Verified Chinese/emoji, Markdown/code/math, separate Core/FYI controls, two concept tabs, selected pending-peer reason, title editing and target refresh, disabled save while dirty, and one Save-all producing two files. Blank Core shows `Core is required.`; restoring it permits refresh/save. Reopening an older preview reports a real destination conflict without overwriting cards. Cancellation after that zero-write failure succeeds and invalidates the preview. This found and fixed an action-binding edge case, with a regression assertion before reacceptance.

Native Obsidian presentation and installed-plugin smoke remain Stage 13 requirements; browser/Markdown results are not substituted for them. The user's original NLP cards and default configuration were unchanged during these stages.
