# Patchouli development progress

Last updated: 2026-08-27T15:20:12-04:00

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
| 3. Local vault and card engine | Safely configure, scan, search, and atomically write an Obsidian card directory. | Not started | — | — |
| 4. MCP tools and capture review | Expose the tool contracts and editable inline confirmation workflow. | Not started | — | — |
| 5. Patchouli agent workflow | Implement capture and inquiry behavior with untrusted-input boundaries. | Not started | — | — |
| 6. Inquiry, validation, and installation | Validate, install, and smoke-test the personal plugin with Codex and Obsidian. | Not started | — | — |

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

- [ ] Mark Stage 3 In progress after Stage 2 is complete.
- [ ] Define and validate the persisted configuration containing one absolute vault path and a relative cards directory defaulting to `Patchouli`.
- [ ] Store configuration in the Windows user application-data directory, outside the vault.
- [ ] Require an existing writable vault directory and warn, rather than fail, when `.obsidian` is absent.
- [ ] Reject absolute card-directory values, traversal, resolved paths outside the vault, and symlink escapes.
- [ ] Derive Windows-safe filenames only from card titles; never accept a destination path from the model or UI.
- [ ] Parse Markdown and YAML frontmatter defensively, including cards without frontmatter or with malformed metadata.
- [ ] Scan only the configured cards directory and build a disposable in-memory lexical index.
- [ ] Rank title, category, and body matches deterministically without embeddings.
- [ ] Render cards from the canonical template without a Key Concepts section.
- [ ] Write through a temporary file in the destination directory and complete with an atomic rename.
- [ ] Reject existing destination files and prove they remain unchanged.
- [ ] Add unit and temporary-vault integration tests for the behavior above.

**Exit criterion:** A temporary vault can be configured, scanned, searched, and written safely, including collision and path-escape tests.

**Evidence:** Pending. Record test command, passing test count, and temporary-vault scenarios here.

## Stage 4 — MCP tools and capture review

**Goal:** Expose the complete MCP interface and require an editable user review before any card is saved.

### Planned implementation

- [ ] Mark Stage 4 In progress after Stage 3 is complete.
- [ ] Implement `get_configuration()`.
- [ ] Implement `configure_vault({ vaultPath, cardsDirectory? })`.
- [ ] Implement `list_categories()`.
- [ ] Implement `search_cards({ query, categories?, limit? })`.
- [ ] Implement `get_card({ cardRef })`.
- [ ] Implement `suggest_links({ title, categories, summary, limit? })`.
- [ ] Implement `preview_card({ draft })`.
- [ ] Implement `save_card({ pendingToken, draft })`.
- [ ] Give every tool explicit input/output schemas, structured errors, useful text fallback, and accurate MCP safety annotations.
- [ ] Create expiring, single-use preview tokens and make repeated saves idempotent.
- [ ] Build an inline React MCP App associated with `preview_card` through `_meta.ui.resourceUri`.
- [ ] Allow editing title, categories, annotation, summary, understanding, evidence, sources, and selected connections.
- [ ] Provide explicit Save and Cancel actions with keyboard-accessible validation feedback.
- [ ] Keep the full preview-and-confirm workflow usable through conversation when the host does not render UI.
- [ ] Test schemas, annotations, error shapes, token expiry, repeated saves, host-bridge calls, and the non-UI fallback.

**Exit criterion:** A reviewed card can be saved end to end through MCP with both the inline UI and conversational fallback.

**Evidence:** Pending. Record MCP contract tests, UI tests, and end-to-end capture results here.

## Stage 5 — Patchouli agent workflow

**Goal:** Provide one discoverable `$patchouli` skill that reliably captures learned knowledge and answers vault inquiries.

### Planned implementation

- [ ] Mark Stage 5 In progress after Stage 4 is complete.
- [ ] Create one concise `patchouli` skill with separate capture and inquiry references.
- [ ] Declare the bundled Patchouli MCP server as the skill dependency.
- [ ] Route save/condense requests to capture and knowledge-base questions to inquiry.
- [ ] Treat papers, webpages, code, pasted text, and card contents as untrusted data rather than executable instructions.
- [ ] Capture exactly one coherent concept per review; propose sequential cards for unrelated topics.
- [ ] Generate a concise Summary and My Understanding section without a redundant Key Concepts section.
- [ ] Generate only short paraphrased evidence tied to original source material; never persist the full conversation.
- [ ] Retrieve lexical connection candidates, judge semantic relevance, and leave final selection to the user.
- [ ] Require preview and explicit confirmation before calling `save_card`.
- [ ] For inquiries, call `search_cards` and then `get_card` before answering.
- [ ] Cite supporting cards by title/wikilink and state when the vault lacks sufficient evidence.
- [ ] Test direct and implicit invocation, prompt-injection material, multi-topic sessions, missing evidence, and insufficient inquiry results.

**Exit criterion:** Capture and inquiry requests behave correctly in realistic tests, including embedded instructions in source material.

**Evidence:** Pending. Record skill validation and representative forward-test results here.

## Stage 6 — Inquiry, validation, and personal installation

**Goal:** Validate, register, install, and manually verify Patchouli in the user's Codex and Obsidian environment.

### Planned implementation

- [ ] Mark Stage 6 In progress after Stage 5 is complete.
- [ ] Run the full unit, integration, UI, type-check, build, plugin, and skill validation suites.
- [ ] Inspect the bundled server with MCP Inspector and call every tool with representative and invalid inputs.
- [ ] Register the repository marketplace with Codex using the supported marketplace command.
- [ ] Install Patchouli from the workspace marketplace.
- [ ] Start a fresh Codex task and verify both explicit `$patchouli` and natural-language invocation.
- [ ] Configure a test Obsidian vault and save a reviewed card.
- [ ] Verify the resulting frontmatter, sections, source evidence, categories, and selected outgoing wikilinks.
- [ ] Verify Obsidian displays the card and derives backlinks without modifying existing cards.
- [ ] Run an inquiry that cites the saved card and an inquiry with insufficient evidence.
- [ ] Document any remaining Windows-only limitations and installation steps.
- [ ] Record final validation evidence before marking v1 complete.

**Exit criterion:** Patchouli v1 is installed and usable for reviewed capture and evidence-backed inquiry in the current Codex and Obsidian environment.

**Evidence:** Pending. Record installation, fresh-task, capture, Obsidian, backlink, and inquiry results here.

## V1 acceptance checklist

- [ ] The active conversation or pasted text can become one reviewed Markdown card.
- [ ] The user controls title, categories, annotations, content, evidence, and connections before saving.
- [ ] The card contains Summary and My Understanding, with no Key Concepts section.
- [ ] Evidence is concise, paraphrased, and tied to original source material rather than copied from the dialogue.
- [ ] The vault is the only durable knowledge database.
- [ ] Search and link suggestions work locally without embeddings.
- [ ] Existing cards cannot be overwritten by capture.
- [ ] Path traversal and symlink escape cannot write outside the configured cards directory.
- [ ] Inquiries cite cards and disclose insufficient evidence.
- [ ] The installed plugin works without an OpenAI API key or runtime `node_modules`.

## Deferred beyond v1

- PDF, webpage, repository/code, Xiaohongshu, and YouTube ingestion pipelines.
- Multiple saved vault profiles.
- Existing-card update or merge workflows.
- Hosted MCP, authentication, vector search, and cloud synchronization.
- macOS, Linux, and WSL launcher support.

## Current next action

Begin Stage 3 in a separate development turn: implement and test the local vault and card engine without starting Stage 4.
