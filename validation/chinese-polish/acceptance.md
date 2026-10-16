# Chinese card polishing acceptance — 2026-10-16

## Implementation

Bundled the user's local `humanizer-zh` Codex adaptation unchanged, including MIT attribution, UI metadata, both references, fixtures and the read-only structure checker. Capture and update workflows now read `chinese-polish.md`, which invokes the sibling packaged skill before preview. It covers new cards, merged updates, checkpoint-derived cards, and conversational revisions. Private compact drafts remain factual intermediate material; polishing happens when producing reviewable cards. Direct UI edits and confirmed payloads are not silently rewritten.

The model capture evaluator now stages both skills, and skill validation checks the local documentation graph and the bundled editor's metadata/license. The READMEs describe the integration. No runtime or card-schema change was needed.

## Checks

- Fresh build and regression suite: 94 tests, 90 passed, 4 Windows-only skips, zero failures. Invoked `node plugins/patchouli/scripts/test.mjs`; the pnpm wrapper attempted a dependency refresh and stopped in the sandbox, so existing dependencies were used directly.
- TypeScript `tsc --noEmit`, plugin/marketplace validator, skill validator, self-contained bundle verification and 17-tool MCP enumeration passed.
- Official skill-creator `quick_validate.py` passed for both skills. PyYAML was installed only under `/tmp/patchouli-validator-python` for this check.
- Actual signed-in model smoke used the bundled skill with synthetic Markdown, with hooks disabled and a read-only sandbox. See `input.md` and `output.md`. The upstream structure checker passed all eight protected categories: frontmatter, fenced code, inline code, headings, link targets, table rows, ordered steps and explicit IDs.
- Manual semantic review: the model removed empty introductions and praise while retaining CSV/JSON/Markdown support, PDF exclusion, the 10 MB limit, uncertain permissions diagnosis, 256 byte values, partial-character qualification, the formula, and the unverified attributed FYI example. Instruction-like text inside the code block remained data. This is one focused semantic smoke case, not exhaustive proof of editing quality or a complete model-driven capture test.

## Installed verification

The older installer depends on plugin-creator helpers no longer present on this host. Used the current `codex plugin add patchouli@personal --json` CLI after validation, with a temporary timestamped manifest version restored afterward. Did not change the installer or installed caches by hand.

Installed and enabled version: `2.0.0+codex.20261016070856`. All 17 packaged skill files match source hashes recorded in `result.json`; the installed MCP initializes and exposes all 17 tools. Build-only changes in the tracked runtime bundles were restored before installation; the retained bundles also passed verification and MCP smoke. No user vault was read or modified. A new Codex task is needed to load the updated skill instructions.
