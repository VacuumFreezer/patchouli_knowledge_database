# Changelog

Patchouli records each cohesive source, configuration, test, UI, or skill edit batch here. Entries use an ISO-8601 timestamp with the America/New_York UTC offset and briefly state motivation and changes. Bookkeeping-only updates to this file or `PROGRESS.md` do not require recursive entries.

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
