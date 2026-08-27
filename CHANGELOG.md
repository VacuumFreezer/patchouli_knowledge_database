# Changelog

Patchouli records each cohesive source, configuration, test, UI, or skill edit batch here. Entries use an ISO-8601 timestamp with the America/New_York UTC offset and briefly state motivation and changes. Bookkeeping-only updates to this file or `PROGRESS.md` do not require recursive entries.

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
