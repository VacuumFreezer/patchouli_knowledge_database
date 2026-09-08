# Patchouli development progress

Last updated: 2026-09-08T13:24:42-04:00

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

## V1 acceptance checklist

- [x] The active conversation or pasted text can become one reviewed Markdown card.
- [x] The user controls title, categories, Summary, Detail, evidence, sources, and connections before saving.
- [x] The card contains one concise Summary and one substantially more concrete paraphrased Detail, with no Key Concepts, My Understanding, or Annotations section.
- [x] Markdown/LaTeX formulas render in review and remain Obsidian-compatible after saving.
- [x] Evidence is concise, paraphrased, and tied to original source material rather than copied from the dialogue.
- [x] The vault is the only durable knowledge database.
- [x] Search and link suggestions work locally without embeddings.
- [x] Existing cards cannot be overwritten by capture.
- [x] Path traversal and symlink escape cannot write outside the configured cards directory.
- [x] Inquiries cite cards and disclose insufficient evidence.
- [x] The installed plugin works without an OpenAI API key or runtime `node_modules`.

## Deferred beyond v1

- PDF, webpage, repository/code, Xiaohongshu, and YouTube ingestion pipelines.
- Multiple saved vault profiles.
- Existing-card update or merge workflows.
- Hosted MCP, authentication, vector search, and cloud synchronization.
- macOS, Linux, and WSL launcher support.

## Current next action

Patchouli personal v1 is complete. Use it from a new Codex task with `$patchouli` or a focused natural-language capture/inquiry request; pursue deferred ingestion and cross-platform work only as later stages.
