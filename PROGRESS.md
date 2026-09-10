# Patchouli development progress

Last updated: 2026-09-10T01:56:35-04:00

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
| 10. v2 card structure and compatibility | Define reusable concept boundaries and introduce Core/FYI with unobtrusive metadata and one visible title. | Complete | 2026-09-09 | 2026-09-09 |
| 11. v2 connected group review | Preview related new cards and updates together, resolve links before saving, and safely confirm the reviewed group once. | Complete | 2026-09-09 | 2026-09-09 |
| 12. v2 capture workflow and acceptance | Teach capture/checkpoints to separate reusable concepts, verify actual model behavior, and pass full compatibility checks. | Complete | 2026-09-09 | 2026-09-09 |
| 13. v2 installation and final smoke test | Install the accepted package and verify the complete workflow in fresh Codex and native Obsidian. | Complete | 2026-09-09 | 2026-09-09 |
| 14. Card visual hierarchy | Make card sections and subheadings clearly distinguishable in Obsidian, then validate and install the scoped presentation update. | Complete | 2026-09-09 | 2026-09-09 |

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

## Version 2 — connected concepts and readable cards

**Planning status:** Complete — 2026-09-09T19:46:15-04:00. One dedicated planning agent read the existing tracker, README, card types/rendering, MCP schemas and preview tokens, review UI, checkpoint prompt/schema, capture/update skill references, and the last three turns of task `01a087b5-7a12-77e2-8d22-64807bbd763f` through `read_thread`. At the time of that planning-only change, only `PROGRESS.md` was edited and Stages 10–13 had not begun. The completed implementation and evidence are recorded below.

**Observed baseline:** The referenced task, “记录 NLP Tokenization 课程”, produced two cards only after the user requested a split. Both saved drafts had `connections: []`, even though Tokenization's UTF-8/byte representation depends on the separate Unicode concept. Current capture instructions prescribe one concept per review and sequential review of unrelated topics; `suggest_links` searches stored cards, so it cannot discover a peer that exists only as another unsaved draft. `CardDraft` has one undifferentiated `detailMarkdown`, and `renderCard` emits frontmatter followed by an H1 that duplicates Obsidian's inline title. These are baseline findings, not evidence that v2 behavior already works.

**Sequence:** Complete Stages 10 → 11 → 12 → 13, with exactly one stage In progress. Every stage includes focused implementation tests and a recorded exit gate. A failure discovered after installation reopens the affected implementation stage; rebuild and reaccept changed artifacts before reinstalling. Keep the existing single-card interfaces and Windows/macOS functionality while adding a coherent group workflow.

**Acceptance examples:** A Tokenization conversation that develops Unicode/UTF-8 must produce separate reusable cards without a user correction and show a reasoned connection before either card exists on disk. A substantive Transformer explanation in a broader large-model conversation must become an independent foundational card; a passing name-drop or a model-specific example alone must not force an empty card. Byte-level BPE's mechanism belongs in Core; GPT model vocabulary figures and the “20 words, 10 containing s” worked example belong in FYI. Sharing a session is a reason to examine a relationship, not a reason to invent one.

### Stage 10 — v2 card structure and compatibility

**Status:** Complete.

**Goal:** Establish the v2 concept and document contracts, and implement a readable card representation that preserves existing data and platform behavior.

#### Planned implementation and checks

- [x] Mark Stage 10 In progress; record the current source/package identity and read the referenced NLP cards as regression inputs without rewriting them during diagnosis.
- [x] Define when a concept deserves a separate card: a field/topic transition, a more general prerequisite, or a substantively explained foundational concept with independent retrieval value. Define when closely related details stay together and when an incidental example belongs only in FYI. Do not hard-code a fixed card count or split every named term.
- [x] Define a concrete, validated Core/FYI contract across types, normalization, rendering, parsing, search, MCP schemas, review UI, conversational fallback, checkpoint schema, and templates. Prefer retaining `detailMarkdown` as the compatible Core field and adding optional `fyiMarkdown`, rendering them as Core/FYI. Core must retain durable mechanisms, qualifications, formulas, and derivations; FYI must hold optional instances, version-dependent figures, worked examples, and peripheral observations. Specify empty-FYI behavior and avoid retaining competing unsynchronized representations.
- [x] Preserve reads/search of legacy `Detail` cards and outstanding pre-v2 checkpoint drafts. Define an explicit normalization path for legacy input and safe reviewed updates; retain useful old content rather than silently classifying it away or migrating the whole vault.
- [x] Keep stable UUIDs, creation times, custom frontmatter, custom sections, evidence, sources, and selected links through reviewed updates; ensure new canonical sections are not duplicated as custom sections.
- [x] Eliminate duplicate title presentation while preserving standard YAML, the card title, and portable Markdown. Prefer a per-card `cssclasses` marker and a scoped Obsidian snippet that hides Properties and Obsidian's inline title only on Patchouli cards while retaining the body H1. Decide how the configured vault receives/enables the snippet, preserve existing custom classes/settings, and verify existing configured vaults as well as first-time setup. Do not globally hide unrelated vault properties or titles. Prove the chosen behavior in native Obsidian before final acceptance.
- [x] Add focused tests for Core/FYI validation and round trips; old/new cards and checkpoints; math/code preservation; custom fields/sections; search; one rendered title; and metadata visibility contract. Update README, the card template, and CHANGELOG with the chosen representation.

**Exit criterion:** The new format is implemented across its consumers, legacy cards/checkpoints remain readable, reviewed updates retain identity and custom content, and focused type/core/MCP/UI tests pass. The representation and compatibility rules are documented; native Obsidian appearance remains an explicit final smoke requirement.

**Evidence:** `pnpm typecheck` and `pnpm test`: 72/72 passing. Legacy Windows fixture remains byte-for-byte unchanged and is used for parser/search parity. New format tests cover Core/FYI normalization, math/code, custom sections/classes, scoped CSS installation and preserved appearance settings, preview read-only behavior, existing-configuration upgrade on save, invalid settings and symlink containment. Native appearance remains Stage 13. Baseline source: `2f2a423`, package `0.2.0`; both referenced NLP files were read without mutation.

### Stage 11 — v2 connected group review and confirmation

**Status:** Complete (reaccepted after browser-acceptance correction).

**Goal:** Let the user review all proposed concepts and their links together, including peers not yet saved, and confirm the complete reviewed group with one clear action.

#### Planned implementation and checks

- [x] Mark Stage 11 In progress after Stage 10 passes. Define a group contract, provisionally exposed through `preview_capture` / `save_capture`, that can contain new cards and reviewed existing-card updates, while retaining the existing single-card preview/save/update interfaces.
- [x] Give proposed group members stable temporary identities and server-derived destination references. Resolve semantically justified peer connections before saving; distinguish pending peers from existing vault cards, prevent self/dangling/duplicate targets, and show the relationship reason and selected state in the preview.
- [x] Combine relevant existing-card candidates with in-group relationships. Do not require lexical overlap or an already-written file for a true prerequisite relationship; do not manufacture all-to-all links merely because concepts appeared in one conversation.
- [x] Build complete editable group review in the MCP App and conversational fallback, covering every card's title, categories, Summary, Core, FYI, evidence, sources, and selected connections. Title edits or member selection changes must update peer targets consistently before final save; removed members cannot leave selected unresolved links.
- [x] Support one explicit “save all” confirmation for the complete visible reviewed group, including the user's “都保存” phrasing. Preserve single-card review when requested and require a new visible review when substantive conversational revisions change the proposed group; do not impose repeated per-card approval on an already-reviewed group.
- [x] Bind the group token to its task, operation/membership, configuration, target revisions, and checkpoint references. Preserve expiry, cancellation, concurrent same-token coalescing, idempotent retries, and create/update separation, including cached replay checks.
- [x] Preflight every destination, existing target revision, and selected peer link before mutation. Specify and test grouped-write failure semantics: no silent partial success, no overwrite of unrelated/manual edits, safe recovery or rollback, and an identical retry that cannot duplicate already-committed cards. Do not claim cross-file crash atomicity unless implemented and tested.
- [x] Consume a checkpoint revision only when every selected group member that uses it has been saved successfully. Preserve unsaved drafts after cancellation, partial failure, conflicts, or omitted members; handle one checkpoint feeding multiple concepts without early deletion.
- [x] Add meaningful MCP/core/UI integration tests for two new linked cards, mixed update/create, renamed peers, deselection, duplicate destinations, conflict/failure cleanup, shared checkpoints, task/configuration isolation, invalid/expired tokens, concurrent writes, retry, and no write before confirmation. Revalidate existing single-card behavior.

**Exit criterion:** Two previously nonexistent cards can be fully previewed with a selected semantic connection and saved through one confirmed group action; mixed updates retain identity; cancellation/failure/retry and checkpoint retention behave as documented; all focused group and legacy single-card tests pass.

**Evidence:** `pnpm typecheck` and `pnpm test`: initially 82/82 pass; reacceptance 81/81 after removing a prompt-wording test in favor of actual model evaluation. Cancellation after zero-write preflight failure now has a regression assertion. Added real MCP group round trip, seven group-engine scenarios (with multiple conflict/alias/task/config/retry cases), and two group UI interaction tests. New tools are `preview_capture` and `save_capture`; cancellation uses `save_capture(action="cancel")`. Reviewed payloads are immutable server-side; edits require refresh. Writes are individually atomic, with in-process receipts for safe partial retry until token expiry. Restart invalidates tokens; re-read files and review remaining work rather than claiming cross-file crash atomicity. Shared checkpoints survive any group failure or omitted associated member.

### Stage 12 — v2 capture workflow and pre-installation acceptance

**Status:** Complete.

**Goal:** Make autonomous concept splitting, Core/FYI classification, and connected group review work in actual model-driven capture and compaction, then accept the full package before installation.

#### Planned implementation and checks

- [x] Mark Stage 12 In progress after Stage 11 passes. Update skill routing/capture/update/inquiry references and checkpoint synthesis instructions to inventory reusable concepts before drafting, independently evaluate cross-field/general/foundational boundaries, and propose the complete useful set without asking which card to start with.
- [x] For each concept, search and read plausible existing cards, distinguish update from creation, retain existing useful knowledge, and form a connected review group when justified. Explain meaningful conceptual boundaries and connection reasons briefly in the review, without saving a full transcript.
- [x] Apply Core/FYI consistently in active-conversation capture, compaction synthesis, continued-session updates, peer-link reasoning, and inquiry. Preserve the launch indicator, explicit task activation, bounded private drafts, session-end retention, and untrusted-input boundaries.
- [x] Add regression scenarios for the actual Tokenization/Unicode case; a cross-domain tangent; a substantively explained general prerequisite/Transformer; a coherent one-topic conversation; and unrelated topics that should remain unlinked. Include a shared checkpoint that needs multiple final cards, Core/FYI examples, malicious source instructions, and a missing-evidence inquiry.
- [x] Run a real signed-in model capture and real checkpoint synthesis in isolated state against representative learning conversations. Observe the actual tool calls and complete preview content: independent cards must appear without a user-requested split, supported peer connections must be present before writes, and concrete examples must be in FYI. Separate model evidence from fixture/contract tests; correct workflow failures and rerun the affected scenario.
- [x] Run the full regression suite, type checking, fresh build, plugin/skill validators, bundle verification, MCP catalog/schema/valid-error checks, and hook smoke. Retain macOS and Windows launch/configuration coverage, case/Unicode path safety, chosen-folder-without-extra-`Patchouli` behavior, metadata preservation, token concurrency, and lifecycle isolation. Record any unavailable native platform execution accurately.
- [x] Verify the built review UI in a real browser, including the complete group, edited titles, Core/FYI Markdown/math, selected peer connections, confirmation, cancellation, error reporting, and the full conversational fallback.
- [x] Record the release version, tested commands/results and totals, real-model findings, limitations, accepted source/artifact hashes, and CHANGELOG entries before installation. Treat the new tool catalog as an intentional contract change and keep all existing public functions working.

**Exit criterion:** The staged v2 package passes the complete regression/validation gate, real model capture independently separates and connects the representative concepts with correct Core/FYI previews, and checkpoint synthesis retains the same boundaries and content. Accepted artifacts are identified; no required source/runtime failure is deferred to installation.

**Evidence:** `validation/v2/acceptance.md`, `model-results.json`, `checkpoint-result.json` and `accepted-sha256.json`. Five actual model capture runs pass without writes; actual checkpoint synthesis plus SessionEnd retention passes after refining exercise placement. Real browser group edit/refresh/save/error/cancel passes. 81/81 regression tests pass on default and case-sensitive APFS; type/build/bundle/MCP and both validator families pass. Base version `2.0.0`. Native Windows/Intel Mac execution unavailable; native Obsidian reserved for Stage 13.

### Stage 13 — v2 installation and final smoke test

**Status:** Complete.

**Goal:** Install the accepted version and demonstrate the complete workflow with the installed plugin, the user's local Obsidian, and the configured card folder.

#### Planned implementation and checks

- [x] Mark Stage 13 In progress only after Stage 12 acceptance. Inspect current registration/version; use the supported plugin cachebuster/reinstall workflow, preserve unrelated plugins/settings, verify enabled state, and compare installed file hashes with the accepted package.
- [x] Start a fresh Codex context that loads the new skill/tools/hooks. Verify the actual configured vault/cards directory and keep cards directly in the requested folder; do not create an extra `Patchouli` directory.
- [x] Run a final smoke using clearly identified test cards in a disposable acceptance folder or the user-authorized target. Capture the representative learning material without prompting the model to split it; inspect the initial multi-card Core/FYI review and semantic peer link before anything is written.
- [x] Confirm the complete visible review once, verify all selected cards and links are saved, and repeat the identical save to prove no duplication. Exercise cancellation, a reviewed existing-card update, a conflict, and restart/read persistence with preserved IDs/creation times/custom fields and retained unsaved checkpoints.
- [x] In native Obsidian, open the actual generated cards and verify a single visible title, unobtrusive Properties, separate Core/FYI, Chinese/emoji/code/math rendering, working outgoing peer links, and derived backlinks. Do not infer native appearance or backlink behavior from Markdown or jsdom alone.
- [x] Run installed-plugin inquiry that reads and cites the saved related cards, plus an insufficient-evidence inquiry. Exercise actual launched compaction/session-end retention and selective consumption where the new grouped/checkpoint behavior changes that lifecycle.
- [x] Correct the two existing NLP examples named by the user: put durable material in Core and model figures/worked examples in FYI, add justified Tokenization↔Unicode connections, and apply the readable presentation. Back up the exact original files and prepare complete MCP update previews before mutation; the user's current request authorizes these concrete corrections without repeated per-card permission questions. Preserve original conceptual content, identities, creation times, provenance, and manual fields, then report the exact affected paths. Keep the independent smoke data clearly identified, preserve the user's NLP configuration, and do not silently migrate unrelated cards.
- [x] Restore any configuration changed solely for isolated testing, remove only disposable test artifacts, and record the installed version, file paths, test totals, actual model/UI results, and host/platform limits in a final validation report. Mark the stage Complete only when the required installed smoke passes.

**Exit criterion:** The accepted v2 plugin is installed/enabled, a fresh task demonstrates autonomous concept splitting and pre-save peer connections, one confirmed group save produces readable linked cards, and native Obsidian plus inquiry/update/checkpoint checks pass. No required smoke result is assumed from fixtures or a previous plugin version.

**Evidence:** `validation/v2/final-smoke.md`, `smoke-result.json`, `installed.json`, `installed-inquiry.md` and `installed-checkpoint-result.json`. Installed/enabled `2.0.0+codex.20260910002058`; 69 non-manifest installed hashes match acceptance. Fresh installed model capture splits/connects correctly; exact reviewed content saves/replays through the installed local MCP client. Ten installed protocol checks and actual installed hook/SessionEnd retention pass. Native Obsidian verifies one title, hidden Properties, Core/FYI, math/code/Chinese/emoji, outgoing links and named backlinks. Both original NLP cards are backed up and corrected with original IDs/creation times preserved; default NLP config is unchanged; independent smoke cards are archived outside the vault. Host limits are explicit: CLI write tools remain blocked by approval policy `never` (the CLI-only write leg is not claimed as passing), and no native Windows/Intel Mac run occurred. A normal Obsidian restart was needed for its stale renderer; the app was never installed/uninstalled during v2 work.

## Stage 14 — Card visual hierarchy

**Status:** Complete.

**Goal:** Improve the visual hierarchy of Patchouli cards so readers can immediately distinguish Core, FYI and nested explanations without relying only on heading size, while preserving portable Markdown, card content and the user's vault preferences.

### Planned implementation and checks

- [x] Mark Stage 14 In progress before implementation. Record the current scoped snippet, enabled appearance settings and representative NLP card content hashes as the baseline; retain the completed Stage 13 evidence separately.
- [x] Research relevant Obsidian community-marketplace options and their primary documentation alongside native CSS snippets. Compare heading/section styling, per-note scope, reading and Live Preview support, theme compatibility, maintenance and required dependencies. Record the selected approach and why it addresses the hierarchy problem; marketplace research does not itself require installing an additional plugin.
- [x] Define and implement a readable hierarchy for the title, Summary, Core, FYI, supporting sections and H3–H6 subheadings using clear spacing, borders or backgrounds as well as typography. Make Core prominent and FYI visibly secondary without hiding its contents or relying on color alone. Keep one visible title and unobtrusive Properties.
- [x] Scope presentation to `patchouli-card` notes and preserve standard Markdown semantics, text, metadata, custom classes/sections, links and IDs. Ensure ordinary notes and the user's existing CSS/theme choices are not globally restyled. Keep source-mode content editable and portable without a community-plugin dependency unless the evaluated choice explicitly justifies one.
- [x] Implement a safe presentation upgrade from the exact v2-managed snippet already installed: recognize the known previous content, preserve a recoverable original, avoid overwriting user-modified snippet content, and preserve unrelated appearance settings and enabled snippets. Retain path containment, symlink safeguards, malformed-configuration protection, revision checks and repeat-install behavior.
- [x] Verify light and dark themes, narrow panes, long Chinese headings, emoji, lists, code, inline/display math, tables and links. Check heading levels in reading mode and Live Preview; avoid text clipping, illegible contrast or layout shifts that impair editing. Record unsupported third-party-theme behavior honestly.
- [x] Add focused regression tests for managed-snippet upgrades, custom-snippet preservation, scoping, repeated configuration/save, and unchanged card content. Run the full relevant regression suite, type checking, fresh build, plugin/skill validators, bundle verification and MCP smoke; retain the existing capture, Core/FYI, group-review and inquiry contracts.
- [x] Record the chosen design, source references, test results and accepted artifact hashes in a Stage 14 validation report, and update README/CHANGELOG for the actual implementation. Complete the pre-installation checks before installing the changed package.
- [x] Use the supported Codex plugin cachebuster and reinstall flow, verify the enabled version and installed hashes, and test the installed runtime's presentation provisioning. Back up affected user-vault presentation files before applying the update; preserve the configured `NLP` destination and avoid extra `Patchouli` folders.
- [x] Perform the final smoke in the actual installed Obsidian app with the two existing NLP cards and clearly marked disposable fixtures where necessary. Visually inspect the stronger Core/FYI and nested-heading boundaries in light/dark and narrow views, single title/hidden Properties, math/code/tables, outgoing links and backlinks, and verify an ordinary note remains unaffected. Confirm card content hashes stay unchanged for presentation-only updates and exercise an installed preview/save/read or inquiry round trip to catch runtime regressions.
- [x] Restore theme/window settings changed only for testing, remove only disposable fixtures, and record screenshots or equivalent native visual evidence, installed version, affected paths, test totals and any host limits. Mark Stage 14 Complete only after the required installed and native Obsidian smoke passes.

**Exit criterion:** Installed Patchouli cards have a clearly distinguishable, theme-aware section and subheading hierarchy in native Obsidian; the existing v2 snippet upgrades safely; card contents and unrelated notes/settings remain intact; regression and final installed smoke evidence are recorded. Browser or CSS assertions alone do not establish native visual acceptance.

**Evidence:** `validation/visual-hierarchy/acceptance.md`, `baseline.json`, `accepted-sha256.json`, `installed-smoke.json` and `final-checks.json`. 83 regression tests, typecheck, both validator families, bundle/MCP and real isolated hook passed. Installed version `2.0.0+codex.20260910020002` is enabled; 71 installed hashes match. Native Obsidian light/dark, narrow/wide, reading/Live Preview, formula/table/link/backlink and ordinary-note checks pass. Original NLP/Welcome/appearance hashes unchanged; fixture archived, original theme/sidebars restored. Core/FYI-specific accents apply in reading view; general heading hierarchy applies in both views.

## Current next action

Stage 14 is complete; no active development stage remains. The visual update is installed and applied to the user vault. Use a new Codex task for the updated plugin runtime; existing cards already display the new styling. Acceptance and limits are in `validation/visual-hierarchy/acceptance.md`. Stages 1–13 remain complete.

### Previous completed follow-up

Stages 8 and 9 are complete. The subsequent Engineering smoke test passed its 11 MCP checks; its visual coverage and limits are in `validation/engineering-smoke-2026-09-09.md`.

**Specified-folder correction complete — 2026-09-09T15:30:16-04:00:** Use the user's named card folder directly, without appending `Patchouli`. Both smoke cards now live directly in `/Users/tongshen/Koumakan_Library/Engineering`, with identical content hashes, identities and links. The empty nested folder was removed, and MCP persisted `cardsDirectory: "Engineering"`. The clarified skill is installed and enabled as `0.2.0+codex.20260909192920`; 12 targeted tests, repository/canonical validators, installed hashes, and actual installed configuration/search/read checks passed. This is a skill/configuration correction; the accepted runtime bundles are unchanged. Evidence: `validation/engineering-folder-correction.json`.

The vault remains configured to `NLP`. V2 preserves `$patchouli launch` for explicit pre-compaction capture. The historical pre-v2 installation above has been superseded by Stage 13.

### Completed launch-icon follow-up — 2026-09-10T01:56:35-04:00

Replaced the launch leaf with frame 0 of the user-supplied APNG. The packaged transparent PNG is 55×90 pixels; launch returns image content and its installed path, and the skill displays it with text status. 83 tests and validators pass; installed isolated launch/relaunch smoke passes. Installed enabled version: `2.0.0+codex.20260910055552`. Evidence: `validation/launch-icon-smoke.json`. Stages 1–14 remain complete.

### Completed small-icon follow-up — 2026-09-10T02:05:11-04:00

Conversation icon resized to 15×24; all new marked cards show an embedded title badge in native reading/editing views. Installed and applied `2.0.0+codex.20260910060342`; backed up and tagged two legacy Engineering test cards. 83 tests and native visual smoke pass. Evidence: `validation/small-icon-smoke.json`.
