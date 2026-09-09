# Patchouli development progress

Last updated: 2026-09-09T15:30:16-04:00

## How this tracker is used

- Work on exactly one stage at a time.
- **Not started:** No implementation work has begun.
- **In progress:** The only active development stage.
- **Blocked:** Work cannot continue until the recorded blocker is resolved.
- **Complete:** Every checklist item is done, the exit criterion passed, and evidence is recorded.
- Update this file when a stage starts, becomes blocked, or is completed.
- Record source, configuration, test, UI, and skill changes separately in `CHANGELOG.md`. Bookkeeping-only progress updates do not require recursive changelog entries.

## Stage overview

| Stage | Goal | Status | Started | Completed |
| --- | --- | --- | --- | --- |
| 1. Governance and contracts | Establish tracking, architecture, setup, card format, commands, and change policy. | Complete | 2026-08-26T18:47:37-04:00 | 2026-08-26T18:49:33-04:00 |
| 2. Plugin scaffold and runtime | Produce a validated, bundled local plugin and repo marketplace. | Complete | 2026-08-27T15:06:08-04:00 | 2026-08-27T15:20:12-04:00 |
| 3. Local vault and card engine | Safely configure, scan, search, and atomically write an Obsidian card directory. | Complete | 2026-08-29T02:34:29-04:00 | 2026-08-29T02:49:40-04:00 |
| 4. MCP tools and capture review | Expose the tool contracts and editable inline confirmation workflow. | Complete | 2026-09-04T02:48:41-04:00 | 2026-09-04T03:11:33-04:00 |
| 5. Patchouli agent workflow | Implement capture and inquiry behavior with untrusted-input boundaries. | Complete | 2026-09-06T17:41:22-04:00 | 2026-09-06T17:48:56-04:00 |
| 6. Inquiry, validation, and installation | Validate, install, and smoke-test the personal plugin with Codex and Obsidian. | Complete | 2026-09-08T12:41:10-04:00 | 2026-09-08T13:24:42-04:00 |
| 7. Compaction-safe capture and card evolution | Update existing cards and preserve pre-compaction technical detail through explicitly launched checkpoint drafts. | Complete | 2026-09-08T15:40:04-04:00 | 2026-09-08T16:58:18-04:00 |
| 8. mac build — source and parity tests | Build macOS support and verify the complete Windows feature set before registration or installation. | Complete | 2026-09-09T02:54:11-04:00 | 2026-09-09T10:22:45-04:00 |
| 9. mac build — registration and installation | Register, install, and verify the tested plugin in Codex and Obsidian on this Mac. | Complete | 2026-09-09T10:01:25-04:00 | 2026-09-09T10:46:22-04:00 |

## Active cross-stage revision

**Status:** Complete — started 2026-09-04T13:35:46-04:00; completed 2026-09-04T14:10:23-04:00.

**Goal:** Replace the overlapping annotation, Summary, and My Understanding fields with one editable agent-written Summary, add a substantially more concrete paraphrased Detail section with Obsidian-compatible Markdown/LaTeX math, and carry the revised contract through completed Stages 1, 3, and 4.

**Sequence:** Amend Stage 1 documentation and card template, then Stage 3 draft/rendering contracts, then Stage 4 MCP schemas, conversational fallback, React review UI, distributables, and tests. After implementation, a separate read-only review agent will trace the change from Stage 1 through Stage 4 and report any missed dependencies.

**Result:** Stage 1 contracts and template, Stage 3 draft/rendering safeguards, and Stage 4 MCP/UI contracts now use one editable agent-written Summary plus a concrete paraphrased Detail. A separate read-only review agent traced the revision through Stages 1–4; its findings were resolved with protected structural headings, Detail-aware link suggestions, live Markdown/KaTeX review, strict retired-field rejection, legacy-card compatibility, and expanded regressions.

## Stage 1 — Governance and contracts

**Goal:** Make subsequent implementation decision-complete and auditable before source files are created.

### Tasks

- [x] Create `PROGRESS.md` before source implementation.
- [x] Define the one-entry-per-logical-edit-batch policy in `CHANGELOG.md`.
- [x] Document v1 scope and deferred capabilities.
- [x] Document the plugin, MCP server, inline review, vault, and search architecture.
- [x] Define capture and inquiry flows.
- [x] Define all planned MCP tool inputs and behavior.
- [x] Define `CardDraft` and the Obsidian Markdown card format.
- [x] Document configuration, path safety, collision, and atomic-write rules.
- [x] Document prerequisites and planned development commands.
- [x] Remove the redundant Key Concepts section from the card and interface contracts.
- [x] Merge annotation, Summary, and My Understanding into one editable agent-written Summary and add a required concrete, paraphrased Detail with Markdown/LaTeX support.
- [x] Reserve level-one and level-two headings for the canonical template while allowing lower-level Detail subheadings.
- [x] Verify the documents are present, non-empty, internally consistent, and free of unfinished scaffold markers.

**Exit criterion:** Tracking files and technical contracts are complete and verified.

**Evidence:** `README.md`, `CHANGELOG.md`, `PROGRESS.md`, and `prompts/card_template.md` are present and non-empty. Architecture, setup, commands, MCP tools, card fields, safety rules, motivation, and change records are documented. Local documentation links resolve. The card and README use the same sections. No TODO, TBD, FIXME, or unfinished scaffold markers were found. No Stage 2 source scaffold existed when Stage 1 was completed.

## Stage 2 — Plugin scaffold and runtime

**Goal:** Create a repo-local Patchouli plugin that validates, builds, and starts its bundled MCP server without runtime `node_modules`.

### Planned implementation

- [x] Mark Stage 2 In progress before creating source files.
- [x] Create `.agents/plugins/marketplace.json` as the repository marketplace.
- [x] Add the `patchouli` marketplace entry using source path `./plugins/patchouli`, category `Productivity`, installation `AVAILABLE`, and authentication `ON_INSTALL`.
- [x] Scaffold `plugins/patchouli/.codex-plugin/plugin.json` with name `patchouli`, version `0.1.0`, author `Patchouli Project`, and license `UNLICENSED`.
- [x] Declare `./skills/` and `./.mcp.json` only when their companion files exist.
- [x] Create the TypeScript/pnpm workspace, compiler configuration, build scripts, and test scripts.
- [x] Create the bundled local MCP entry point and stdio transport.
- [x] Create a Windows launcher that prefers the Node runtime supplied by Codex and falls back to `node` on `PATH`.
- [x] Bundle the MCP runtime into a distributable file that does not require production `node_modules`.
- [x] Validate the plugin manifest and marketplace structure.
- [x] Smoke-test MCP initialization and tool-list negotiation.
- [x] Record commands and results below before completing the stage.

**Exit criterion:** Plugin validation passes and the bundled MCP server initializes successfully from the plugin launcher.

**Evidence:** Node `v24.19.0` and pnpm `11.19.0` were used. `pnpm typecheck` passed. `pnpm build` produced `plugins/patchouli/dist/server.mjs` (773,286 bytes). `pnpm test` passed 2/2 scaffold tests. `pnpm validate:plugin` passed the repository manifest and marketplace checks. The built-in plugin-creator validator also passed after its `PyYAML` dependency was supplied in an isolated temporary directory. `pnpm verify:bundle` found no external package imports, proving the server does not require runtime `node_modules`. `pnpm inspect:mcp` launched the bundle through `cmd.exe` and the Codex-aware Node locator, completed MCP initialization, and returned an empty `tools/list` as required for Stage 2. The final structural audit found no missing or empty required artifacts and confirmed Stage 3 tools are absent.

## Stage 3 — Local vault and card engine

**Goal:** Configure one local vault and safely read, search, and create Patchouli cards while keeping Markdown as the only durable database.

### Planned implementation

- [x] Mark Stage 3 In progress after Stage 2 is complete.
- [x] Define and validate the persisted configuration containing one absolute vault path and a relative cards directory defaulting to `Patchouli`.
- [x] Store configuration in the Windows user application-data directory, outside the vault.
- [x] Require an existing writable vault directory and warn, rather than fail, when `.obsidian` is absent.
- [x] Reject absolute card-directory values, traversal, resolved paths outside the vault, and symlink escapes.
- [x] Derive Windows-safe filenames only from card titles; never accept a destination path from the model or UI.
- [x] Parse Markdown and YAML frontmatter defensively, including cards without frontmatter or with malformed metadata.
- [x] Scan only the configured cards directory and build a disposable in-memory lexical index.
- [x] Rank title, category, and body matches deterministically without embeddings.
- [x] Render cards from the canonical Summary/Detail template without Key Concepts, My Understanding, or Annotations sections.
- [x] Preserve Obsidian-compatible inline and display LaTeX and reject draft H1/H2 headings that would collide with canonical sections.
- [x] Keep legacy cards with My Understanding and Annotations searchable and readable without migration.
- [x] Write through a flushed temporary file in the destination directory and complete with an atomic no-replace promotion; avoid overwrite-capable Windows rename semantics.
- [x] Reject existing destination files and prove they remain unchanged.
- [x] Add unit and temporary-vault integration tests for the behavior above.

**Exit criterion:** A temporary vault can be configured, scanned, searched, and written safely, including collision and path-escape tests.

**Evidence:** Node `v24.19.0` and pnpm `11.19.0` were used. `pnpm typecheck` passed. `pnpm test` performed a fresh two-entry build and passed 22/22 tests covering `%APPDATA%` configuration, active-vault replacement, missing `.obsidian` warnings, missing and invalid directories, Windows filename sanitization, YAML escaping, normal/manual/missing/malformed frontmatter, Unicode cards, title/category/body ranking, deterministic ties, category filters and counts, junction escape, traversal, temporary-vault write/scan/search/read, duplicate preservation, collision races, and atomic failure cleanup. The build produced `dist/server.mjs` (773,441 bytes) and `dist/core.mjs` (301,550 bytes). Repository and plugin-creator validation passed. `pnpm verify:bundle` found no external package imports across both distributable bundles. `pnpm inspect:mcp` initialized through the Windows launcher and confirmed zero tools, preserving the Stage 4 boundary. `git diff --check` passed, and the final source audit found no unfinished markers or Stage 4 tool registrations.

## Stage 4 — MCP tools and capture review

**Goal:** Expose the complete MCP interface and require an editable user review before any card is saved.

**Status:** Complete — 2026-09-04.

### Planned implementation

- [x] Mark Stage 4 In progress after Stage 3 is complete.
- [x] Implement `get_configuration()`.
- [x] Implement `configure_vault({ vaultPath, cardsDirectory? })`.
- [x] Implement `list_categories()`.
- [x] Implement `search_cards({ query, categories?, limit? })`.
- [x] Implement `get_card({ cardRef })`.
- [x] Implement `suggest_links({ title, categories, summary, detail, limit? })`.
- [x] Implement `preview_card({ draft })`.
- [x] Implement `save_card({ pendingToken, draft })`.
- [x] Give every tool explicit input/output schemas, structured errors, useful text fallback, and accurate MCP safety annotations.
- [x] Create expiring, single-use preview tokens and make repeated saves idempotent.
- [x] Build an inline React MCP App associated with `preview_card` through `_meta.ui.resourceUri`.
- [x] Allow editing title, categories, Summary, Detail, evidence, sources, and selected connections.
- [x] Render a bundled live Markdown/KaTeX preview for Summary and Detail without external assets.
- [x] Provide explicit Save and Cancel actions with keyboard-accessible validation feedback.
- [x] Keep the full preview-and-confirm workflow usable through conversation when the host does not render UI.
- [x] Test schemas, annotations, error shapes, token expiry, repeated saves, host-bridge calls, and the non-UI fallback.

**Exit criterion:** A reviewed card can be saved end to end through MCP with both the inline UI and conversational fallback.

**Evidence:** Node `v24.19.0` and pnpm `11.19.0` were used. `pnpm typecheck` passed. `pnpm test` rebuilt the distributables and passed 33/33 tests, including the eight-tool catalog, strict Summary/Detail schemas, MCP App resource serving, multiline LaTeX preservation through preview/save/disk/read, rendered KaTeX in jsdom, required-field and structural-heading UI validation, blocked remote image loads, Detail-aware lexical links, legacy-card search/read compatibility, collision reporting, structured token and write errors, token expiry, identical-save replay, conversational fallback, Save/Cancel, keyboard behavior, and host-bridge calls. `pnpm verify:bundle` verified 3,318,835 bytes across `server.mjs`, `core.mjs`, and `review-app.html`, with no external runtime packages or scripts. Repository validation and the plugin-creator validator passed. `pnpm inspect:mcp` initialized through the Windows launcher and verified all eight Stage 4 tools. `git diff --check` passed. The requested independent review agent completed a read-only Stage 1–4 dependency audit, and every actionable finding was addressed.

## Stage 5 — Patchouli agent workflow

**Goal:** Provide one discoverable `$patchouli` skill that reliably captures learned knowledge and answers vault inquiries.

**Status:** Complete — 2026-09-06T17:48:56-04:00.

### Planned implementation

- [x] Mark Stage 5 In progress after Stage 4 is complete.
- [x] Create one concise `patchouli` skill with separate capture and inquiry references.
- [x] Declare the bundled Patchouli MCP server as the skill dependency.
- [x] Route save/condense requests to capture and knowledge-base questions to inquiry.
- [x] Treat papers, webpages, code, pasted text, and card contents as untrusted data rather than executable instructions.
- [x] Capture exactly one coherent concept per review; propose sequential cards for unrelated topics.
- [x] Generate one concise agent-written Summary and a substantially more concrete, self-contained Detail; both remain editable during review.
- [x] Paraphrase Detail from the target conversation, preserve useful Markdown/LaTeX formulas, use only level-three or lower subheadings, and never persist the full transcript.
- [x] Generate only short paraphrased evidence tied to original source material; never persist the full conversation.
- [x] Retrieve lexical connection candidates, judge semantic relevance, and leave final selection to the user.
- [x] Require preview and explicit confirmation before calling `save_card`.
- [x] For inquiries, call `search_cards` and then `get_card` before answering.
- [x] Cite supporting cards by title/wikilink and state when the vault lacks sufficient evidence.
- [x] Test direct and implicit invocation, prompt-injection material, multi-topic sessions, Summary/Detail quality, formula preservation, transcript non-leakage, missing evidence, and insufficient inquiry results.

**Exit criterion:** Capture and inquiry requests behave correctly in realistic tests, including embedded instructions in source material.

**Evidence:** The repository `validate:skill` command and the skill-creator `quick_validate.py` validator both passed the new skill package. `pnpm test` rebuilt the distribution and passed 37/37 tests; four Stage 5 tests verify discovery metadata, explicit `$patchouli` and implicit activation boundaries, progressive capture/inquiry references, the local MCP dependency, safe tool ordering, embedded prompt-injection handling, one-concept sequential capture, distinct Summary/Detail requirements, Markdown/LaTeX preservation, transcript non-leakage, post-preview confirmation, and insufficient-evidence disclosure. `pnpm typecheck`, `pnpm verify:bundle` (3,318,835 bytes across three self-contained files), repository and plugin-creator validation, the eight-tool MCP initialization smoke test, and `git diff --check` all passed. Installation and fresh-task model behavior remain intentionally reserved for Stage 6.

## Stage 6 — Inquiry, validation, and personal installation

**Goal:** Validate, register, install, and manually verify Patchouli in the user's Codex and Obsidian environment.

**Status:** Complete — started 2026-09-08T12:41:10-04:00; completed 2026-09-08T13:24:42-04:00.

### Planned implementation

- [x] Mark Stage 6 In progress after Stage 5 is complete.
- [x] Run the full unit, integration, UI, type-check, build, plugin, and skill validation suites.
- [x] Inspect the bundled server with MCP Inspector and call every tool with representative and invalid inputs.
- [x] Register the repository marketplace with Codex using the supported marketplace command.
- [x] Install Patchouli from the workspace marketplace.
- [x] Start a fresh Codex task and verify both explicit `$patchouli` and natural-language invocation.
- [x] Configure a test Obsidian vault and save a reviewed card.
- [x] Verify the resulting frontmatter, Summary, concrete Detail, source evidence, categories, and selected outgoing wikilinks.
- [x] Verify Obsidian renders Summary/Detail Markdown and inline/display math correctly and derives backlinks without modifying existing cards.
- [x] Run an inquiry that cites the saved card and an inquiry with insufficient evidence.
- [x] Document any remaining Windows-only limitations and installation steps.
- [x] Record final validation evidence before marking v1 complete.

**Exit criterion:** Patchouli v1 is installed and usable for reviewed capture and evidence-backed inquiry in the current Codex and Obsidian environment.

**Evidence:** Node `v24.19.0` and pnpm `11.19.0` were used. A fresh build and `pnpm test` passed 37/37 unit, integration, UI, skill, path-safety, collision, token, and capture/inquiry contract tests; type checking, repository and canonical plugin/skill validation, bundled-runtime verification (3,318,832 bytes across three files with no external runtime packages or scripts), the eight-tool MCP smoke test, and `git diff --check` also passed. MCP Inspector strict mode reported 0 errors and 0 warnings after structured error details were made explicitly JSON-typed; Inspector exercised all eight tools with representative and invalid inputs, including empty results, missing cards, schema failures, prompt-retired fields, UI metadata, and invalid confirmation tokens.

The repository marketplace was registered as `personal` and `patchouli@personal` version `0.1.0` was installed and enabled at `D:\Codex\home\plugins\cache\personal\patchouli\0.1.0`. SHA-256 comparisons proved the installed server, review UI, and skill were byte-identical to the final repository artifacts. Fresh Codex task `01a081f6-9c6c-70e0-9ac3-0b8d1d1d6e58` used natural-language capture and explicit `$patchouli` capture, ignored embedded prompt-injection text, stopped twice for explicit confirmation, and saved two cards to the isolated Stage 6 vault. The second capture called search, category, link-suggestion, and card-read tools before previewing a user-selected connection to the first card.

Disk and MCP reads confirmed two UUID-frontmatter cards with categories, Summary, concrete Detail, concise paraphrased evidence, sources, five display-math blocks, and one outgoing `[[Bayesian belief updating|Bayesian belief updating]]` link; no retired sections, injected instruction text, or transcript were stored. Obsidian v1.5.3 loaded the vault through an isolated profile, opened both cards in reading mode, rendered 25 and 28 MathJax nodes (including four and two display nodes), exposed the outgoing internal link, and derived `Patchouli/Beta–Bernoulli conjugate updating.md` as the backlink to `Patchouli/Bayesian belief updating.md`. Screenshots recorded the rendered properties, headings, inline/display math, and one-backlink indicator. The installed plugin returned both cards from lexical search; a supported inquiry called `search_cards` followed by `get_card` for both results and cited both wikilinks, while an unrelated heliopause inquiry reported that the vault lacked evidence. The README now records the personal install flow and remaining Windows/Obsidian limitations.

## Stage 7 — Compaction-safe capture and card evolution

**Goal:** Allow an explicitly launched Patchouli session to preserve technical knowledge across context compaction, then use the preserved drafts and the continued conversation to safely update existing cards and create newly justified cards.

**Status:** Complete — started 2026-09-08T15:40:04-04:00; completed 2026-09-08T16:58:18-04:00.

### Planned implementation

- [x] Mark Stage 7 In progress only after explicit authorization from the user.
- [x] Begin with a feasibility gate against the installed Codex version: verify that plugins can register a supported pre-compaction lifecycle hook, that the hook receives a stable task/conversation identity and sufficient pre-compaction context, and that it can request synthesis through the active Codex model without an OpenAI API key. If any required host capability is unavailable, record the exact blocker instead of emulating an unreliable hook.
- [x] Document the Stage 7 architecture, transient-draft lifecycle, privacy boundary, update semantics, hook contract, and revised development commands before editing runtime source.
- [x] Add an explicit launch route recognized only from `$patchouli launch` or a clear natural-language equivalent; ordinary capture and inquiry requests must not silently enable compaction tracking.
- [x] Bind launch state to the current Codex task, make repeated launches idempotent, allow launch at any point in the conversation, and define explicit stop/status behavior plus task-end cleanup.
- [x] Return a prominent, stable launch acknowledgement such as `🌿 Patchouli capture active`, together with a plain-language explanation that pre-compaction drafts will be created but no card will be saved automatically.
- [x] Register the supported pre-compaction hook only for a launched task and guarantee that an unlaunched task produces no checkpoint data or vault writes.
- [x] At each pre-compaction event, use the conversation still available to Codex to create a structured checkpoint `CardDraft` without opening the review UI, issuing a save token, or creating/updating an Obsidian card.
- [x] Preserve concrete technical detail, formulas, assumptions, decisions, source attribution, and unresolved questions in checkpoint drafts while continuing to paraphrase and treat conversation content as untrusted data rather than instructions.
- [x] Store checkpoint drafts atomically in a bounded, task-isolated transient workspace outside the Obsidian vault, with launch ID, checkpoint ID, sequence, timestamps, covered-context metadata, schema version, and integrity data; this store is recoverable working state, not a second knowledge database.
- [x] Handle repeated compactions deterministically, avoid duplicating already checkpointed material, isolate simultaneous tasks, survive MCP process restarts, and prevent path traversal, cross-task reads, malformed payloads, and unbounded draft growth.
- [x] Extend final capture so it loads every applicable checkpoint draft plus the current post-compaction context before deciding whether knowledge belongs in an existing card, a new card, or multiple sequential cards.
- [x] Match update candidates by stable card UUID/reference rather than title alone, retrieve the current card before proposing changes, and preserve creation identity and unrelated user edits.
- [x] Add a dedicated reviewed-update contract and reuse the inline/conversational preview experience so the user can inspect the complete proposed replacement, including merged Summary, Detail, evidence, sources, categories, and connections.
- [x] Apply confirmed updates with atomic replacement, optimistic revision/fingerprint checks, collision protection, and rollback-safe failure handling; never overwrite a card that changed after preview.
- [x] Continue to preview and confirm each newly proposed card separately, and preserve the existing rule that unrelated concepts become sequential reviews rather than one overloaded final card.
- [x] Track exactly which checkpoint drafts contributed to each proposed update or new card. Retain drafts after preview cancellation, validation failure, revision conflict, or save failure; delete only the drafts consumed by successfully confirmed final cards, leaving unrelated or unconsumed drafts available.
- [x] Expose a clear user-controlled way to inspect and discard outstanding checkpoint drafts without treating draft text as a saved knowledge card.
- [x] Update the skill, MCP schemas and annotations, inline UI, bundled runtime, README, card/update metadata, and personal installation package while preserving conversational fallbacks and Windows-first local-only operation.

### Planned test scripts and coverage

- [x] Add a focused Stage 7 card-update test script covering UUID preservation, creation/update timestamps, title changes, filename collisions, optimistic conflicts, atomic-replace failure, rollback behavior, manually edited cards, and proof that unrelated existing files are unchanged.
- [x] Add a focused Stage 7 hook test script with synthetic lifecycle events covering no-launch/no-hook behavior, explicit and natural-language launch, launch at different conversation positions, idempotent relaunch, visible `🌿` acknowledgement, stop/status behavior, and task isolation.
- [x] Test that the hook creates drafts but no preview token, UI request, vault card, or card update; verify formulas, technical qualifications, sources, and prompt-injection text are preserved or rejected according to the capture trust boundary without storing a verbatim transcript.
- [x] Test multiple compactions, duplicate event delivery, out-of-order events, process restart, corrupted or oversized checkpoint data, storage bounds, and deterministic recovery.
- [x] Add temporary-vault integration tests for `launch → checkpoint → compacted continuation → update existing card and/or propose new cards → preview → confirm → save → consume drafts`.
- [x] Verify that cancellation and all failed saves retain checkpoint drafts, successful confirmation deletes only consumed drafts, and a later capture cannot read drafts belonging to another task.
- [x] Test mixed outcomes in a multi-topic conversation: an existing card update, a newly justified sequential card, an unchanged unrelated card, and retention of any checkpoint draft not yet represented by a confirmed card.
- [x] Add an installed-plugin smoke script that exercises the real Codex hook when supported, plus a deterministic fixture-based hook inspector for CI; run the complete existing unit, integration, UI, type-check, bundle, manifest, skill, MCP Inspector, and Obsidian-compatibility suites to detect regressions.

**Exit criterion:** After explicit launch in a real Codex task, Patchouli creates no automatic vault card but preserves pre-compaction technical detail in isolated checkpoint drafts; a later capture can safely update an existing reviewed card and create separately reviewed new cards from those drafts plus the continued conversation; consumed drafts are deleted only after successful user confirmation, and the full regression and installed-plugin smoke suites pass.

**Evidence:** Feasibility was confirmed against Codex CLI `0.153.4`: the stable plugin Hook system supports `PreCompact` with `auto|manual` matching and supplies `session_id`, `transcript_path`, `turn_id`, `trigger`, and model context; plugin hooks receive `PLUGIN_ROOT`, and a bundled command hook can invoke an ephemeral, read-only `codex exec` through the signed-in Codex account without a separate OpenAI API key. Patchouli registers `PreCompact` plus bounded `SessionEnd` cleanup in the default `hooks/hooks.json` location and uses the Codex-bundled Node launcher on Windows.

The final implementation exposes fifteen local MCP tools, including explicit launch/status/stop, checkpoint inspection/discard, create review/save, and update review/save. Private state is hashed by task and bounded to 4 MiB/eight coherent drafts with launch/checkpoint IDs, sequence, timestamps, transcript digest, draft revision, duplicate-event suppression, lock-based restart safety, and stale out-of-order completion rejection. Transcript parsing admits only user/assistant message text, removes ambient host blocks, caps input, JSON-encodes the untrusted boundary, and emits a fixed content-free warning if synthesis fails. Updates preserve UUID, `created_at`, custom frontmatter, and custom sections; set `updated_at`; use exact revision checks, atomic replacement/rollback, title-derived filenames, and collision protection. Review tokens bind the operation, task, target revision, and exact checkpoint revisions, which are consumed only after a successful confirmed create/update.

Node `v24.19.0` and pnpm `11.19.0` completed type checking and 46/46 unit, temporary-vault integration, MCP protocol, hook lifecycle, transcript/privacy, update/conflict, packaging, skill, and jsdom UI tests. Repository and canonical plugin-creator validation passed; bundle verification covered four self-contained files with no external runtime packages or scripts; `git diff --check` passed. Official MCP Inspector CLI successfully initialized the installed server and listed all fifteen typed local tools with their annotations and MCP App metadata. The deterministic hook suite covered inactive tasks, repeated/multiple and out-of-order compactions, process boundaries, task isolation, malformed/oversized state, selective consumption, retained previews/failures, and session cleanup. A real-model `pnpm inspect:hook` run against the installed plugin generated one private checkpoint from a tiny temporary transcript, configured no vault, wrote no card, and deleted all temporary state.

The personal marketplace remained `personal`; `patchouli@personal` `0.2.0+codex.stage7-final4` was installed and enabled at `D:\Codex\home\plugins\cache\personal\patchouli\0.2.0+codex.stage7-final4`. Its bundled MCP and real Hook smoke tests passed. Isolated Codex task `01a082c7-2065-7170-bbaa-27b4940fecb6` invoked `$patchouli launch`, returned the prominent `🌿 Patchouli capture active` acknowledgement with `active: true` and zero checkpoints, and created or updated no vault card. Temporary-vault integration then exercised one continued-conversation update plus one sequential new card: the update preserved identity/timestamps, the rename removed the old reference, the first confirmation consumed only its own checkpoint, the second preview retained the unrelated checkpoint until its confirmed save, identical retries were idempotent, and a concurrent manual edit produced `REVISION_CONFLICT` without overwriting the file. The saved Markdown contract remains the Stage 6 Obsidian-compatible Summary/Detail/MathJax/wikilink format. In a newly opened Codex task, the user must review/trust the changed Patchouli Hook when prompted before automatic lifecycle delivery can run.

## V1 acceptance checklist

- [x] The active conversation or pasted text can become one reviewed Markdown card.
- [x] The user controls title, categories, Summary, Detail, evidence, sources, and connections before saving.
- [x] The card contains one concise Summary and one substantially more concrete paraphrased Detail, with no Key Concepts, My Understanding, or Annotations section.
- [x] Markdown/LaTeX formulas render in review and remain Obsidian-compatible after saving.
- [x] Evidence is concise, paraphrased, and tied to original source material rather than copied from the dialogue.
- [x] The vault is the only durable knowledge database.
- [x] Search and link suggestions work locally without embeddings.
- [x] Existing cards cannot be overwritten by new-card capture and can change only through an exact-revision update preview plus explicit confirmation.
- [x] Path traversal and symlink escape cannot write outside the configured cards directory.
- [x] Inquiries cite cards and disclose insufficient evidence.
- [x] The installed plugin works without an OpenAI API key or runtime `node_modules`.

## Deferred beyond v1

- PDF, webpage, repository/code, Xiaohongshu, and YouTube ingestion pipelines.
- Multiple saved vault profiles.
- Hosted MCP, authentication, vector search, and cloud synchronization.
- Linux and WSL launcher support. macOS support is now planned in the mac build stages below.

## Stage 7 follow-up — Retain unsaved checkpoint drafts

**Status:** Complete — implementation, verification, and installed-version activation confirmed at 2026-09-09T01:57:35-04:00.

**Correction:** `SessionEnd` now deactivates capture without deleting its state or drafts. Same-task reads and explicit relaunch preserve checkpoint identity and content. Automatic consumption still requires a successful user-confirmed create/update and removes only the revisions attached to that review.

**Evidence:** Type checking, all 46 tests, repository and canonical plugin/skill validation, and bundle verification passed. The initial full run hit a transient Windows `EPERM` during an existing atomic-replace test; the isolated rerun and full rerun passed. Lifecycle tests cover repeated session termination, fresh store access, inactive pre-compaction events, and relaunch. MCP integration covers session end, failed create retention, and selective successful update/create consumption. The new cached Hook passed all six Stage 7 tests and the cached MCP server listed all fifteen tools; hook/core/server/launch-reference SHA-256 values match the source artifacts.

**Installation:** The earlier cache activation attempts encountered Windows access denial. Follow-up verification at 2026-09-09T01:57:35-04:00 confirmed that `codex plugin list` now reports `0.2.0+codex.20260909054855` installed and enabled, and the current task's skill catalog references that version. SHA-256 comparisons of the installed Hook, core, server, hook configuration, and launch reference all match the verified repository artifacts. The activation blocker is resolved; no further reinstall was needed.

## Latest Windows baseline

Use installed version `0.2.0+codex.20260909060138`, confirmed enabled at 2026-09-09T02:01:57-04:00. The second Hook now uses `Discard draft` as its supported `statusMessage`; `SessionEnd` remains its lifecycle event. Repository and canonical plugin validation passed, the installed label was checked, and its runtime hash matches the tested retention fix. Review/trust the updated Hook if Codex prompts; session end still stops capture while retaining outstanding drafts for later reviewed capture in the same task.

## mac build

**Scope:** Bring the complete implemented Windows feature set to native macOS, including Stage 7 and the subsequent unsaved-checkpoint retention fix. Preserve the existing Windows implementation and Markdown format. The current input boundary is the active Codex conversation or supplied text/Markdown; this port does not add a separate ChatGPT-history import pipeline.

**Planning record:** Source, MCP contracts, review UI, hooks, launchers, build/validation scripts, skill references, and all nine existing test files have been read. The initial planning update changed only `PROGRESS.md`. Implementation of Stages 8 and 9 was subsequently authorized; current status and evidence are recorded below. The previously recorded 46 passing tests are Windows evidence, not Mac validation.

**Sequence:** Complete Stage 8 and record its pre-installation acceptance evidence before starting Stage 9. Registration and installation are not a way to bypass failing source or parity tests. Any runtime or packaging changes made during Stage 9 must pass the affected Stage 8 checks before reinstalling.

### Function inventory and parity baseline

| Function group | Existing implementation | Behavior to preserve on macOS |
| --- | --- | --- |
| Vault configuration | `src/core/configuration.ts`, `src/core/paths.ts`; `get_configuration`, `configure_vault` | One existing writable vault; relative cards directory; persisted configuration outside the vault; non-fatal missing-Obsidian warning; traversal and symlink protection. |
| Cards and local retrieval | `src/core/cards.ts`, `src/core/search.ts`, `src/core/vault.ts`; `list_categories`, `search_cards`, `get_card` | Defensive YAML/Markdown parsing, legacy-card reads, disposable lexical index, deterministic ranking/filtering, category counts, and vault-relative references. |
| Connections and inquiry | `suggest_links`; capture/update/inquiry skill references | Use title, categories, Summary, and Detail for lexical candidates; judge relevance; save selected outgoing wikilinks; let Obsidian derive backlinks; search and read supporting cards before answering with citations or an evidence-gap statement. |
| Reviewed new-card capture | `src/mcp/register-tools.ts`, `src/mcp/schemas.ts`, `src/mcp/pending-previews.ts`; `preview_card`, `save_card` | One coherent concept per review, editable Summary/Detail/evidence/sources/connections, explicit confirmation, expiring tokens, idempotent retries, atomic create without overwriting collisions. |
| Reviewed card evolution | Card preservation and vault update code; `preview_card_update`, `update_card` | Preserve UUID, creation time, custom frontmatter and sections; add update time; check exact revisions; handle title-derived renames, collisions, failure cleanup, and unrelated-card preservation. |
| Task capture lifecycle | `src/core/checkpoints.ts`; `launch_patchouli`, `get_patchouli_status`, `stop_patchouli`, `get_checkpoint_drafts`, `discard_checkpoint_drafts` | Explicit task-scoped launch with the existing visible acknowledgement; bounded private drafts; selective discard/consumption; restart isolation; stop and session end retain unsaved drafts by default. |
| Pre-compaction synthesis | `src/hook.ts`, `src/core/transcript.ts`, `hooks/` | `PreCompact` runs only for launched tasks; use the signed-in Codex account without a separate API key; parse user/assistant text as untrusted data; preserve paraphrased detail and formulas; produce no vault write or review token; continue with a content-free warning on failure. |
| Review interface and distribution | `src/ui/`, `src/server.ts`, `.mcp.json`, `scripts/`, plugin manifest and skill metadata | Editable create/update UI, live Markdown/KaTeX, Save/Update/Cancel and accessible errors, conversational fallback, all 15 typed MCP tools, and four self-contained distributables without runtime `node_modules`. |

Paths in this inventory are relative to `plugins/patchouli` unless otherwise stated. The parity baseline is the current source and its tests, including the latest retention behavior where older completed-stage notes describe draft cleanup.

### Stage 8 — mac build: source and parity tests

**Status:** Complete — reaccepted 2026-09-09T10:22:45-04:00 after correcting request-scoped task identity and validating shared-server isolation. Initial acceptance and the installed-host finding are documented in the evidence.

**Goal:** Produce a macOS-capable source tree and distributable with the same functions as the Windows baseline, and validate it thoroughly before any marketplace registration or plugin installation.

#### Planned implementation

- [x] Mark Stage 8 In progress and record the source revision, macOS version, CPU architecture, filesystem characteristics, Codex/Node/pnpm versions, and available Obsidian version. Verify the installed Mac host's supported MCP launch configuration, hook events, CLI synthesis options, and runtime locations before choosing the platform wiring.
- [x] Keep shared TypeScript logic and the existing public tool contracts. Choose a host-supported cross-platform launcher/configuration strategy, or explicitly generated platform packages if required; do not assume undocumented manifest fields or remove Windows support.
- [x] Add Mac MCP and hook runtime launchers that discover supported Codex-provided Node/CLI executables and use documented fallbacks. Handle GUI-launched Codex with a minimal `PATH`, spaces and Unicode in paths, argument quoting, executable permissions, exit codes, signals, and clean MCP stdout.
- [x] Make root/plugin package commands, MCP smoke scripts, scaffold checks, and plugin validation work on Mac while preserving Windows entry points. Check the declared runtime minimum against the actual build/test dependencies and document any distinct development prerequisite.
- [x] Introduce consistent platform-aware application-data resolution for configuration and checkpoint storage. Plan Mac defaults under `~/Library/Application Support/Patchouli/`, with `configuration.json` and `session-checkpoints`; preserve Windows `%APPDATA%` behavior and existing test overrides. MCP and hooks must resolve the same store, with private file permissions and no vault-resident state.
- [x] Audit `paths.ts` and `vault.ts` for POSIX paths, realpath containment, macOS case sensitivity, Unicode normalization, and filename byte limits. In particular, review unconditional lowercasing in card-directory checks and update destination comparisons. Retain portable title-derived filenames and prevent reads or writes outside the configured cards directory.
- [x] Verify atomic create, replacement, rename, revision checks, and rollback on the Mac filesystem. Correct any portability failures without weakening collision protection or losing manual edits.
- [x] Wire both `PreCompact` and `SessionEnd` through the Mac runtime. Preserve task identity, duplicate/out-of-order handling, bounded checkpoints, content-free failure warnings, and the latest rule that session end deactivates capture while retaining drafts.
- [x] Adapt test fixtures to isolate Mac configuration, checkpoint state, and temporary vaults without modifying real user settings. Replace Windows-only assertions with explicit platform cases while retaining the original behavioral coverage.
- [x] Rebuild `dist/server.mjs`, `dist/core.mjs`, `dist/hook.mjs`, and `dist/review-app.html`; update Mac/Windows setup documentation and record implementation batches in `CHANGELOG.md` when implementation begins.

#### Required pre-installation test coverage

- [x] **Full regression baseline:** Run all 46 existing test cases on Mac after adapting platform assumptions, plus new regression cases. Preserve coverage across cards, paths, search, vault integration, MCP integration, Stage 7 lifecycle, UI, scaffold, and skill tests; do not silence a platform failure by dropping its behavior check.
- [x] **Runtime and packaging:** Exercise actual Mac MCP/hook launchers from both the source tree and an isolated copy of the distributable without `node_modules`. Cover runtime overrides, missing/stale runtime paths, fallback discovery, minimal `PATH`, non-repository working directories, spaces/Unicode in installation paths, process termination, and stderr-only startup failures.
- [x] **Configuration and permissions:** Cover first use without `APPDATA`, the Mac application-data default, shared MCP/hook resolution, Windows resolution as an explicit platform case, configuration reload/replacement, malformed configuration, missing or unwritable vaults/directories, and the missing `.obsidian` warning. Assert that tests do not create configuration or checkpoints in the user's real application-data directory.
- [x] **Mac paths and filenames:** Cover nested paths, spaces, Chinese text, emoji, composed/decomposed Unicode, long UTF-8 filenames, POSIX/Windows absolute-path rejection, traversal, file/directory symlink escapes, and cards-directory boundaries. Exercise case-insensitive and case-sensitive volume behavior using isolated volumes where needed, including case-only renames and sibling directories differing only by case.
- [x] **Card/search/link parity:** Compare deterministic fixtures with the Windows baseline for card sections, metadata, selected wikilinks, category counts, ranking, excerpts, filters, limits, legacy/malformed cards, and inline/display formulas. Fix IDs/timestamps for comparisons and normalize only intentional platform differences such as absolute roots or line endings.
- [x] **Write and update safety:** Cover duplicate creation and collision races, concurrent requests, stale previews after manual edits, create/update token separation, invalid/expired/consumed tokens, identical retries, rename collisions, UUID/creation-time preservation, custom metadata/sections, injected write/promotion failures, rollback, and temporary-file cleanup. Assert original and unrelated files remain unchanged on rejected operations.
- [x] **All 15 MCP tools:** Initialize through the actual Mac launcher; exercise every tool with representative valid and invalid inputs, missing configuration/session context, empty results, schemas, annotations, structured errors, and review-resource delivery. Include real calls to stop/status/discard tools, not just catalog assertions. Run MCP Inspector validation against the staged bundle before installation.
- [x] **Review UI and conversational fallback:** Exercise edits to every field, connection selection, live Markdown/KaTeX, keyboard interaction, Save/Update/Cancel, validation feedback, collisions/conflicts, bridge failures and retry behavior. Verify no write occurs before confirmation, cancellation retains drafts, and the complete review remains usable without inline UI. Supplement jsdom checks with a rendered review in a Mac browser or supported local host harness.
- [x] **Checkpoint and transcript lifecycle:** Cover inactive tasks, repeated launch, auto/manual compaction payloads, repeated/out-of-order events, multiple topics, simultaneous tasks, process restart, stop/relaunch, repeated session end, retained draft identities, selective successful consumption, and cancellation/write/conflict retention. Cover corrupt/oversized state, lock contention, malformed transcripts, ambient-context stripping, untrusted instructions, missing executables, synthesis failure/timeouts, and content-free warnings. Assert hooks never create cards or review tokens.
- [x] **Complete workflow and real synthesis:** In isolated state, run `launch → checkpoint → continued conversation → reviewed existing-card update → separately reviewed new card → selected connection → search/read inquiry`, including an insufficient-evidence inquiry. Run a real signed-in Codex synthesis against a tiny generated transcript from the staged hook, with no vault configured for that smoke test. Verify the staged cards' Markdown/math, outgoing links and derived backlinks in Mac Obsidian before installation. Keep deterministic fixture results separate from actual model and visual evidence.
- [x] **Windows compatibility:** Retain explicit tests for Windows configuration and launch contracts; compare shared behavior against fixed Windows reference fixtures. Run native Windows regression checks when a runner is available and record their provenance; simulated Windows cases on Mac are not a native Windows run. Record the tested Mac architecture without claiming other architectures were exercised.

#### Acceptance gate and evidence

- [x] Pass the Mac-compatible `pnpm typecheck`, `pnpm build`, `pnpm test`, `pnpm validate:skill`, `pnpm validate:plugin`, `pnpm verify:bundle`, `pnpm inspect:mcp`, and `pnpm inspect:hook` commands, plus canonical plugin/skill validation, the additional Mac tests above, and `git diff --check`.
- [x] Record command lines, environment, test totals, results, failure resolutions, fixture/model/UI distinctions, and any unavailable platform coverage. Explain every skip; an unverified required Mac function keeps this stage open. Record the tested source revision or diff and SHA-256 hashes of the final distributables and relevant launch/config/skill files.
- [x] Mark Stage 8 Complete only after the required Mac checks pass and the evidence is recorded. Keep registration and installation untouched throughout Stage 8.

**Exit criterion:** The staged plugin builds and runs natively on this Mac, all 15 tools and all Windows feature groups pass the pre-installation parity checks, the bundle works without development dependencies, and there are no unresolved required Mac test failures. Real installed-host activation and lifecycle delivery remain the Stage 9 checks.

**Evidence:** [Mac build acceptance](validation/mac-build.md) records 70/70 passing tests on each of case-insensitive and case-sensitive APFS, all 15 MCP tools, canonical validators, self-contained bundles, actual browser review, native Obsidian math/backlink inspection, real signed-in checkpoint synthesis and supported/insufficient-evidence inquiries. [Accepted file hashes](validation/mac-build-sha256.json) identify the tested source and artifacts before registration. No tests were skipped; native Windows and Intel Mac execution were unavailable and are not claimed. Registration and installation were untouched until this gate passed.

### Stage 9 — mac build: registration and installation on this Mac

**Status:** Complete — 2026-09-09T10:46:22-04:00. Final installed version `0.2.0+codex.20260909142257` is enabled; installed-host lifecycle, reviewed writes, inquiry, and isolation checks passed.

**Goal:** Register and install the verified Mac package, then prove the installed copy works in this Mac's Codex and Obsidian environment.

#### Planned registration and installation

- [x] Check the Stage 8 evidence and hashes before making installation changes. Inspect this Mac's existing plugin/marketplace state, validate the plugin and marketplace names with supported helpers, and resolve any existing `personal` marketplace collision without overwriting unrelated registrations.
- [x] Confirm that the selected local marketplace points at this repository's verified plugin. For the existing repository marketplace, register `/Users/tongshen/projects/patchouli_knowledge_database` through the supported Codex marketplace command when it is not already registered. Use the validated marketplace name rather than assuming the Windows registration exists on this Mac.
- [x] If cache invalidation is required, use the plugin-creator cachebuster helper, preserving the base version. Revalidate the resulting manifest, install or reinstall with the supported `codex plugin add` flow, and verify that the plugin is enabled. Do not hand-edit installed caches or unrelated Codex configuration.
- [x] Record the installed version and resolved cache path. Compare installed bundle, launchers, MCP/hook configuration, schema, and skill/reference hashes with the accepted Stage 8 artifacts, accounting explicitly for any manifest-only cachebuster change.

#### Installed-host verification

- [x] Open a fresh Codex task so the installed skill, all 15 MCP tools, and hooks are loaded. Complete the host's hook trust flow if it is presented; record any required user action rather than reporting an untrusted hook as operational.
- [x] Use an isolated acceptance vault to verify explicit `$patchouli` and natural-language capture/inquiry, the actual Mac review UI, conversational fallback, editing, cancellation, confirmed creation, confirmed update/rename, connection selection, and idempotent results.
- [x] Verify the installed plugin's saved frontmatter, Summary/Detail, evidence, sources, inline/display math, outgoing wikilinks, and Obsidian-derived backlinks. Run supported and insufficient-evidence inquiries and confirm cited cards were actually read.
- [x] Exercise real host lifecycle delivery after explicit launch: verify the visible acknowledgement, creation of private pre-compaction drafts with no automatic card write, capture after compaction, selective consumption after confirmation, and preservation after session end/reopening the same task. Confirm unlaunched tasks stay inactive and drafts are isolated between tasks.
- [x] Verify configuration/checkpoint persistence across MCP restarts and a fresh task, while keeping task-specific drafts isolated. Rerun installed-copy MCP and real-hook smoke tests through the installed launchers without development dependencies.
- [x] Restore any pre-existing vault configuration used during acceptance tests and remove only disposable test artifacts. Record Mac usage, installation/update instructions, installed-version evidence, screenshots or inspection results, and any actual host limitations. Update `PROGRESS.md` and `CHANGELOG.md` as appropriate.

**Exit criterion:** The tested Mac plugin is registered, installed, enabled, and picked up by a fresh Codex task; capture, updates, connections, inquiry, inline/conversational review, and real checkpoint lifecycle behavior pass in the installed environment. Installed artifacts match the accepted source package, and no required function remains unverified.

**Evidence:** [Mac acceptance report](validation/mac-build.md), [installed package identity](validation/mac-installation.json), and [asserted host results](validation/mac-host-acceptance.json). All 60 accepted plugin files other than the manifest-only cachebuster match the installed copy. A real host compaction produced two private drafts without saving cards; session end and reopening preserved both exactly. Confirmed update consumed one, separately confirmed creation consumed the other, and an identical save retry returned the same card without duplication. Two installed MCP restarts retained configuration while fresh task IDs saw no drafts. Native Obsidian and the bundled review UI passed visual checks; Codex CLI exercised conversational review, while the browser harness exercised the actual MCP App. Native Codex inline rendering, native Windows, and Intel Mac execution are not claimed. Temporary vaults, servers, Obsidian app/profile, and the case-sensitive test volume were cleaned up; disposable execution logs remain under temporary storage. No personal vault was configured or modified.

## Current next action

Stages 8 and 9 are complete. The subsequent Engineering smoke test passed its 11 MCP checks; its visual coverage and limits are in `validation/engineering-smoke-2026-09-09.md`.

**Specified-folder correction complete — 2026-09-09T15:30:16-04:00:** Use the user's named card folder directly, without appending `Patchouli`. Both smoke cards now live directly in `/Users/tongshen/Koumakan_Library/Engineering`, with identical content hashes, identities and links. The empty nested folder was removed, and MCP persisted `cardsDirectory: "Engineering"`. The clarified skill is installed and enabled as `0.2.0+codex.20260909192920`; 12 targeted tests, repository/canonical validators, installed hashes, and actual installed configuration/search/read checks passed. This is a skill/configuration correction; the accepted runtime bundles are unchanged. Evidence: `validation/engineering-folder-correction.json`.

Start a fresh Codex task to load the updated plugin guidance. The vault is already configured; use `$patchouli launch` when you want pre-compaction capture for that task.
