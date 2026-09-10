# Changelog

### 2026-09-10T02:05:11-04:00 — Small conversation and card icons

- Resize the user-supplied frame to transparent 15×24 PNG. Embed it in scoped Obsidian CSS at the title’s left edge in reading/Live Preview; no attachment files or Markdown body changes.
- Recognize exact v2.1 CSS for safe upgrades alongside original v2; preserve custom CSS. Back up the user stylesheet and add the style class to the two known legacy Engineering smoke cards.
- 83 tests, typecheck, plugin/skill and bundle validators pass. Installed `2.0.0+codex.20260910060342` assets/runtime match source; native reading/editing narrow-card badge checks pass after normal app restart. See `validation/small-icon-smoke.json`.

### 2026-09-10T01:56:35-04:00 — Custom launch indicator

- **Motivation:** Replace the launch leaf emoji with the user-provided `patchouli_knowledge.apng`.
- **Changes:** Extract frame 0 as transparent 55×90 PNG, bundle `assets/patchouli-launch.png`, and return it as MCP image content with a relocatable absolute `indicatorImagePath`. Update launch skill/reference to display the PNG plus accessible text status after successful activation.
- **Validation:** 83 tests, typecheck, plugin/skill validators and bundle checks pass. Installed `2.0.0+codex.20260910055552` is enabled; isolated installed launch/relaunch verifies image bytes, path and activation identity. Evidence: `validation/launch-icon-smoke.json`. No vault or current-task activation occurred.

### 2026-09-09T22:02:00-04:00 — Card visual hierarchy (Stage 14)

- **Motivation:** Distinguish card sections and nested explanations beyond font size.
- **Changes:** Add scoped theme-aware section bars, Core/FYI reading accents and H3–H6 rules in reading/editing views. Atomically upgrade exact shipped v2 CSS while preserving customized snippets, card bytes and appearance preferences. No community plugin dependency.
- **Validation:** 83 regression tests, typecheck, both validator families, bundle/MCP checks and real isolated pre-compaction hook pass. Initial sandboxed real-hook attempt could not reach synthesis; authorized network-enabled rerun passed. Installed `2.0.0+codex.20260910020002` with 71 matching files; native light/dark reading/editing, narrow/wide and original NLP link checks pass. Original card/settings hashes unchanged; temporary fixture archived. Native/installed details and view-specific styling limits are recorded in the Stage 14 acceptance report.

### 2026-09-09T20:36:49-04:00 — Install and verify v2 (Stage 13)

- **Motivation:** Deliver the accepted Mac plugin and repair the user-provided NLP examples with actual installed/native evidence.
- **Changes:** Install `2.0.0+codex.20260910002058`; verify package hashes, fresh model previews, installed MCP group writes/replays/updates/conflicts/checkpoints and native Obsidian presentation/backlinks. Back up and update the two original NLP cards; archive only independent smoke notes and keep the NLP configuration.
- **Limits:** CLI write-tool approval remains separate from content confirmation; its `never` policy blocked the CLI-only write leg. The unchanged reviewed payload passed through the installed local MCP client. Obsidian needed a normal restart for a stale renderer; no application install/uninstall occurred. Native Windows/Intel Mac were unavailable.

### 2026-09-09T20:36:49-04:00 — 2.0.0 concept-aware capture (Stage 12)

- **Motivation:** Preserve independently useful concepts and stop treating examples as equally important mechanisms.

- Inventory domain transitions, general prerequisites and substantive foundations before drafting; review the complete useful set and connect unsaved peers.
- Explain mechanisms in Core; keep model/version figures and complete worked exercises in FYI. Update inquiry and legacy-card evolution guidance.
- Real signed-in model evaluations cover five learning conversations, full conversational previews, injection resistance and actual private checkpoint synthesis with SessionEnd retention. Static prompt-wording checks are not used as behavioral evidence.
- Verification: 81 regression tests on both default and case-sensitive APFS, real browser editing/save/error/cancel, plugin/skill validators, type checking and 17-tool MCP catalog.

### 2026-09-09T20:36:49-04:00 — V2 connected capture (Stage 11)

- **Motivation:** Review unsaved peers and their relationships together and honor one complete-group confirmation.

- Add complete multi-card preview and one-confirmation group save, including new peers and existing-card updates.
- Bind immutable group reviews to task/configuration/revisions; preflight writes, coalesce retries, report partial results, preserve unsaved checkpoints, and resume without duplicate cards.
- Add editable concept navigation, Core/FYI, relationship reasons, member selection, refresh after edits and cancellation.
- Verification: 82 tests and type checking pass. Group writes are individually atomic; restart invalidates pending reviews.

### 2026-09-09T20:36:49-04:00 — V2 card structure (Stage 10)

- **Motivation:** Make knowledge cards readable without losing legacy content, metadata or custom sections.

- Separate durable Core (`detailMarkdown`) from optional FYI, including checkpoints and editable Markdown/math review. Preserve legacy reads and reviewed-update identity/custom content.
- Scope Obsidian Properties and inline-title hiding to marked cards; preserve the portable H1 and existing vault appearance settings.
- Retain the frozen Windows v1 fixture as a legacy parsing/search regression; v2 rendering has explicit new expectations.


Patchouli records each cohesive source, configuration, test, UI, or skill edit batch here. Entries use an ISO-8601 timestamp with the America/New_York UTC offset and briefly state motivation and changes. Bookkeeping-only updates to this file or `PROGRESS.md` do not require recursive entries.

## 2026-09-09

### 2026-09-09T15:27:32-04:00 — Honor an explicitly selected card folder

- **Motivation:** The Engineering smoke test unnecessarily added a `Patchouli` subfolder to the user's selected destination.
- **Changes:** Clarify the packaged skill and setup instructions: use the specified folder directly as `cardsDirectory`, without appending another folder. Move the two existing smoke-test cards to `Engineering`, preserving their contents and links, and update the active configuration through MCP. Keep the existing default only for requests without a specified card folder.

### 2026-09-09T10:46:22-04:00 — Accept and install the Mac build

- **Motivation:** Complete Stages 8 and 9 with source parity and actual installed-host evidence.
- **Changes:** Register the repository marketplace and enable `0.2.0+codex.20260909142257`; record 70 passing tests on each APFS volume type, verified installed hashes, trusted host compaction/session-end delivery, retained-draft recovery, separately confirmed update/create, idempotent retry, inquiry, and Mac review/Obsidian inspection. Remove isolated acceptance fixtures and document platform/host coverage limits.

### 2026-09-09T10:20:00-04:00 — Resolve task identity from the Mac host’s MCP requests

- **Motivation:** Fresh installed-host testing showed that Mac Codex supplies task IDs per request, leaving environment-only launch detection missing or inherited from a parent task.
- **Changes:** Prefer verified Codex request metadata for every task and preview operation, retain legacy environment fallbacks, and reject inconsistent identities. Bind token validation to both task and operation before initial saves, concurrent retries, and completed replays. Add real-protocol task-isolation regressions and revalidate before reinstalling.

### 2026-09-09T10:00:00-04:00 — Verify Mac behavior and complete fallback reviews

- **Motivation:** Demonstrate Windows feature parity before installation, including real Mac filesystem, protocol, review, and checkpoint behavior.
- **Changes:** Add platform and frozen-baseline regressions, actual-launcher MCP/hook checks, task-context and concurrency coverage, review-error retry coverage, and a disposable browser review harness. Complete conversational previews with evidence, sources, and connection choices; handle generator startup/timeout failures promptly with private warnings. Document Mac packaging, runtime requirements, data locations, and test commands.

### 2026-09-09T02:57:48-04:00 — Build native Mac runtime and storage support

- **Motivation:** Port the full Windows feature set to macOS while retaining shared behavior and Windows launchers.
- **Changes:** Add explicit platform MCP packaging, Mac runtime discovery, portable development commands, shared application-data resolution, private state directories, UTF-8 filename limits, and filesystem-based card/update containment.

### 2026-09-09T02:01:38-04:00 — Label the second Hook Discard draft

- **Motivation:** Apply the requested name to the second Hook without changing the confirmed draft-retention behavior.
- **Changes:** Set the SessionEnd handler's supported statusMessage to `Discard draft` and refresh the plugin cachebuster for installation; the lifecycle event and retention logic remain unchanged.

### 2026-09-09T01:49:10-04:00 — Package the retention fix

- **Motivation:** Ensure the installed plugin uses the corrected session lifecycle.
- **Changes:** Rebuilt the runtime bundles, refreshed the manifest cachebuster, and enabled deterministic lifecycle tests against the installed Hook bundle.

### 2026-09-09T01:47:00-04:00 — Retain drafts across session termination

- **Motivation:** Session end is not user confirmation of a successful card save; deleting its checkpoints could lose unsaved knowledge.
- **Changes:** Replaced destructive session cleanup with capture deactivation, removed the session-delete API, documented same-task draft recovery, and added hook/restart/relaunch and MCP failed-save/selective-consumption regressions.

## 2026-09-08

### 2026-09-08T16:52:30-04:00 — Exercise the real compaction hook safely

- **Motivation:** Verify the production Codex synthesis path and ensure a failed hook can never echo source conversation content into its warning.
- **Changes:** Added a temporary-state real hook smoke command, corrected strict structured-output handling for nullable source URLs, normalized generated URL values, made failure messages content-free while allowing compaction to continue, rejected stale out-of-order hook completions, documented the command, and added privacy/order regressions.

### 2026-09-08T16:46:15-04:00 — Enforce the launch indicator

- **Motivation:** An installed-plugin smoke task activated Patchouli correctly but paraphrased away the user-required visible launch icon.
- **Changes:** Made the exact `# 🌿 Patchouli capture active` heading mandatory in the launch workflow, added a stable structured indicator to `launch_patchouli`, and covered both behaviors with protocol and skill regressions.

### 2026-09-08T16:42:00-04:00 — Validate and package Stage 7

- **Motivation:** Ship compaction-safe capture as an independently verifiable personal plugin update rather than relying on source-tree behavior.
- **Changes:** Added hook/transcript/update/storage/UI regressions, expanded protocol and packaging checks to fifteen tools, bundled and verified the hook entry point, bumped Patchouli to `0.2.0`, applied the Stage 7 cachebuster, and made the smoke client able to test the installed runtime.

### 2026-09-08T16:42:00-04:00 — Teach the Patchouli agent to launch and evolve cards

- **Motivation:** Make activation non-trivial and ensure continued conversations refine matching knowledge while separating genuinely new topics.
- **Changes:** Added explicit launch and card-update references, checkpoint-aware capture routing, existing-card retrieval and merge rules, exact confirmation/conflict behavior, selective draft consumption guidance, and updated skill discovery metadata.

### 2026-09-08T16:42:00-04:00 — Connect pre-compaction capture to reviewed updates

- **Motivation:** Preserve detailed learning before context compaction without creating unreviewed vault content, then safely use it in later final capture.
- **Changes:** Added bundled `PreCompact` and `SessionEnd` hooks, read-only ephemeral Codex draft synthesis, structured bounded checkpoint output, task lifecycle MCP tools, operation-bound review tokens, update preview/save tools, and an update-aware inline review app.

### 2026-09-08T16:04:45-04:00 — Add task checkpoints and safe card updates

- **Motivation:** Give launched Patchouli tasks a durable bridge across compaction and let reviewed knowledge evolve without overwriting concurrent or user-authored changes.
- **Changes:** Added a task-isolated transient checkpoint store, defensive Codex transcript parsing, stable card revisions, optimistic update inspection, atomic update/rename writes, and preservation of card identity, timestamps, custom frontmatter, and custom sections.

### 2026-09-08T15:51:32-04:00 — Define compaction-safe updates

- **Motivation:** Preserve technical learning across Codex context compaction and allow a continued conversation to refine existing cards without weakening review or vault safety.
- **Changes:** Documented explicit `$patchouli launch` activation, the trusted `PreCompact` checkpoint lifecycle, transient task-isolated drafts, reviewed optimistic card updates, selective draft consumption, new MCP contracts, Hook trust requirements, and Stage 7 validation scope.

### 2026-09-08T13:22:16-04:00 — Document personal installation and Windows constraints

- **Motivation:** Make the validated personal release reproducible and set accurate expectations for local plugin caching, vault registration, and Obsidian automation.
- **Changes:** Added the marketplace/install/new-task workflow plus native-Windows, single-vault, conversational fallback, Markdown/MathJax, Obsidian vault-registration, and CLI-version notes.

### 2026-09-08T12:56:24-04:00 — Make MCP error schemas portable

- **Motivation:** MCP Inspector strict validation found that free-form error-detail values were emitted as untyped schemas across all eight tools.
- **Changes:** Constrained structured error details to JSON values and added a protocol regression that rejects untyped detail schemas.

## 2026-09-06

### 2026-09-06T17:44:32-04:00 — Implement the Patchouli agent workflow

- **Motivation:** Make the reviewed local card engine reliably usable through both explicit and natural-language capture and inquiry requests.
- **Changes:** Added one discoverable `patchouli` skill with focused capture/inquiry references, local MCP dependency metadata, prompt-injection and transcript boundaries, single-card review and confirmation rules, evidence-backed inquiry behavior, a reusable skill validator, scenario-oriented contract tests, and README usage commands.

## 2026-09-04

### 2026-09-04T14:08:16-04:00 — Keep Markdown review local

- **Motivation:** Untrusted Markdown image syntax must not cause the inline review app to fetch remote content automatically.
- **Changes:** Replaced preview images with accessible text placeholders while retaining Markdown and KaTeX rendering, and added a jsdom regression proving remote image elements are not created.

### 2026-09-04T13:57:43-04:00 — Complete the Summary and Detail review path

- **Motivation:** Ensure the richer Detail content contributes to discovery, renders mathematical notation during review, and cannot silently lose retired draft fields.
- **Changes:** Added Detail to lexical link suggestions, made the card draft schema strict, bundled a live Markdown/KaTeX preview with no external runtime assets, validated reserved headings in the UI, and expanded protocol/UI tests for multiline formulas, required Summary/Detail, retired-field rejection, and rendered math.

### 2026-09-04T13:53:22-04:00 — Protect the revised card structure

- **Motivation:** Let Detail use helpful Markdown without allowing draft content to collide with the server-owned card sections, while preserving access to cards created under the earlier format.
- **Changes:** Reserved level-one and level-two headings in Summary and Detail outside fenced code, allowed lower-level explanatory subheadings, and added regressions for structural-heading rejection and search/read compatibility with legacy My Understanding and Annotations cards.

### 2026-09-04T13:41:21-04:00 — Update the reviewed MCP card shape

- **Motivation:** Keep preview, confirmation, and UI editing consistent with the revised Summary/Detail card contract.
- **Changes:** Replaced old annotation and understanding fields in MCP schemas and fallback text, added editable Summary and Detail controls with math guidance, and updated protocol and jsdom tests to reject the retired fields.

### 2026-09-04T13:39:11-04:00 — Carry Summary and Detail into card rendering

- **Motivation:** Make the revised card contract authoritative in the Stage 3 engine rather than documentation-only.
- **Changes:** Replaced annotation and understanding draft fields with required Detail Markdown, rendered Summary and Detail as the leading card sections, preserved inline and display LaTeX verbatim, and updated renderer and temporary-vault tests.

### 2026-09-04T13:36:46-04:00 — Revise the card content contract

- **Motivation:** Remove overlap among annotation, Summary, and My Understanding while giving future readers a concrete explanation that can preserve mathematical notation.
- **Changes:** Replaced the three overlapping fields with one editable agent-written Summary, added a required paraphrased Detail with Obsidian-compatible Markdown/LaTeX math, and aligned the card template, product overview, capture flow, and README contract.

### 2026-09-04T03:11:33-04:00 — Implement reviewed MCP capture

- **Motivation:** Expose Patchouli's local engine through a safe, confirm-before-write workflow that remains usable without custom UI.
- **Changes:** Added eight schema-backed MCP tools with local safety annotations and structured fallbacks, expiring idempotent preview tokens, collision inspection, a bundled accessible React review app with MCP Apps bridge calls, and protocol/UI/end-to-end tests.

## 2026-08-29

### 2026-08-29T02:48:49-04:00 — Cover the configuration lifecycle

- **Motivation:** Verify the Windows storage location and one-active-vault replacement contract directly.
- **Changes:** Added tests for `%APPDATA%` configuration placement, missing environment state, and atomic replacement of the persisted active vault.

### 2026-08-29T02:48:09-04:00 — Align the MCP smoke label with Stage 3

- **Motivation:** Keep runtime diagnostics accurate after the card engine became part of the bundle.
- **Changes:** Updated server instructions and smoke-test labels to describe the bundled Stage 3 engine and the intentionally deferred Stage 4 tool catalog.

### 2026-08-29T02:47:03-04:00 — Reject invalid existing card-directory targets

- **Motivation:** Fail configuration immediately when a selected card location cannot serve as a writable directory.
- **Changes:** Added existing-target directory and write-access validation, covered file targets in the temporary-vault suite, and corrected the documented `%APPDATA%` path.

### 2026-08-29T02:46:21-04:00 — Refine filename and search expectations

- **Motivation:** Keep sanitized filenames readable and make ranking evidence accurately report title text that also appears in a card heading.
- **Changes:** Collapsed repeated invalid-character separators and aligned the search test with body-and-title matching of canonical H1 headings.

### 2026-08-29T02:45:51-04:00 — Bridge bundled YAML to the ESM runtime

- **Motivation:** The bundled YAML parser requires Node's CommonJS loader even though Patchouli ships as ESM.
- **Changes:** Added a bundle-local `createRequire` bridge so the self-contained core loads YAML without runtime `node_modules` or dynamic-require failures.

### 2026-08-29T02:44:02-04:00 — Verify the Stage 3 safety contracts

- **Motivation:** Prove that the local engine remains deterministic and cannot escape or overwrite the configured Markdown vault.
- **Changes:** Added unit and temporary-vault tests for filename and YAML safety, defensive parsing, search ranking, configuration warnings, missing paths, junction escape, collision races, create-only writes, and atomic failure cleanup.

### 2026-08-29T02:38:15-04:00 — Implement the local vault and card engine

- **Motivation:** Provide the safe local persistence and retrieval foundation required before exposing Patchouli's MCP tools.
- **Changes:** Added `%APPDATA%` vault configuration, real-path containment and Windows filename safety, defensive Markdown/YAML parsing, canonical card rendering, disposable lexical search, create-only atomic writes, bundled core output, and Stage 3 runtime documentation.

## 2026-08-27

### 2026-08-27T15:19:14-04:00 — Document the runnable Stage 2 scaffold

- **Motivation:** Keep setup instructions accurate now that the planned development commands and runtime exist.
- **Changes:** Documented the empty Stage 2 tool catalog, deferred installation boundary, command ordering, bundle verification, and launcher-based MCP smoke test.

### 2026-08-27T15:18:29-04:00 — Keep the distributable server bundle

- **Motivation:** The local marketplace must contain the built MCP entry point even when development dependencies are absent.
- **Changes:** Kept `dist/server.mjs` as a distributable artifact while continuing to ignore generated source maps and esbuild metadata.

### 2026-08-27T15:17:02-04:00 — Advertise an empty Stage 2 tool catalog

- **Motivation:** MCP initialization succeeded, but `tools/list` was unavailable until a handler existed; adding a fake product tool would violate the planned interface.
- **Changes:** Advertised the tools capability and added an explicit empty `tools/list` response so clients can negotiate the scaffold without exposing out-of-scope tools.

### 2026-08-27T15:14:22-04:00 — Make development commands runtime-independent

- **Motivation:** Codex supplies Node outside `PATH`, so ordinary package scripts could not start the compiler or build helpers.
- **Changes:** Added a reusable Codex-aware Node runner, delegated the MCP launcher to it, and routed build, test, type-check, validation, bundle, and smoke commands through that runtime.

### 2026-08-27T15:06:08-04:00 — Scaffold the local plugin runtime

- **Motivation:** Establish the validated, distributable Codex plugin foundation required before vault behavior is implemented.
- **Changes:** Added the repo marketplace and Patchouli manifest, pnpm/TypeScript workspace, bundled stdio MCP server, Windows Codex-runtime launcher, scaffold validation, bundle verification, and MCP initialization smoke test.

### 2026-08-27T02:06:36-04:00 — Simplify the card and expand stage tracking

- **Motivation:** Remove the redundant Key Concepts section and make development progress as detailed as the agreed implementation plan.
- **Changes:** Removed Key Concepts from the card and README contracts, clarified category cleanup language, and expanded every stage in `PROGRESS.md` with tasks, exit criteria, and evidence requirements.

## 2026-08-26

### 2026-08-26T18:47:37-04:00 — Establish Stage 1 governance and contracts

- **Motivation:** Define the product, safety, storage, interface, and staged-development contracts before source implementation.
- **Changes:** Added progress tracking; documented architecture, setup, tool and card contracts, development commands, and changelog policy; defined the canonical card template.
