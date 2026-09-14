# Stage 15 — Windows v2 installation and native acceptance

## Decision

Patchouli v2 is accepted for native Windows installation. Version `2.0.0+codex.20260913211226` is installed and enabled from the repository's local `personal` marketplace. Its installed MCP entry point is `cmd.exe`, all 75 packaged files match the accepted source, the installed MCP and Hook run without development dependencies, and both deterministic installed workflows and a fresh Codex host task passed.

The pre-stage installation was not usable on Windows because both the source artifact and installed `2.0.0+codex.20260910060342` cache contained the Mac `/bin/sh` MCP entry point. The native Stage 15 build regenerated `.mcp.json` for `win32` before the cachebuster and reinstall.

## Environment

- Microsoft Windows 11 Home Chinese, version `10.0.26200`, x64.
- Node `v24.19.0`, pnpm `11.19.0`, Codex CLI `0.154.0-alpha.6.2`.
- Native Obsidian `1.5.3`, launched with an isolated temporary `user-data-dir` and synthetic vault.
- Base repository revision `70a52f6964d628036c0fc2b1f437ad47377f8894`; Stage 15 changes were validated from the working tree before installation.

## Source and regression gate

- `pnpm test`: **88 tests, 78 passed, 0 failed, 10 skipped**. Seven skips are Mac-only permissions/launcher tests. Three are file-symlink escape fixtures that require Windows Developer Mode or elevated symlink privilege; each now reports that exact reason. Windows directory-junction escape protection remains exercised and passes.
- New native tests exercise the Windows runtime launcher, arguments and exit codes, stderr-only startup failures, a Unicode/space/shell-character runtime path, and a relocated package with no `node_modules`. The relocated package initializes all 17 tools and its SessionEnd Hook correctly.
- Type checking, skill validation, repository/plugin validation, self-contained bundle verification, `git diff --check`, 17-tool MCP initialization and the real isolated PreCompact Hook smoke pass.
- An earlier pre-stage full run encountered one transient Windows `EPERM` during atomic replacement. The same update test then passed five consecutive isolated reruns, a 50-operation replacement probe passed, and both Stage 15 full runs exercised the path successfully. No persistent replacement defect was reproduced and no unsafe retry that could widen the revision-check race was added.

## Installation

The configured local marketplace is `personal` and points to this repository. The plugin-creator Python helpers could not run because this Windows host has only the Microsoft Store Python alias and no Python runtime. The equivalent validated rules were applied directly: marketplace and plugin identifiers were checked against the helper regexes, the base `2.0.0` version was preserved, the old suffix was replaced by the single UTC cachebuster `+codex.20260913211226`, and `codex plugin add patchouli@personal` performed the reinstall. No marketplace file or Codex configuration was hand-edited.

`codex plugin list --marketplace personal --json` reports the new version installed and enabled. Source and installed trees contain 75 files each after excluding development `node_modules`; every relative path and SHA-256 hash matches. Installed-copy MCP reports 17 tools and the real Hook creates one private checkpoint without configuring or writing a vault.

## Installed workflow

`installed-smoke.mjs` uses the installed Windows launcher and an isolated temporary data root/vault. Request metadata identifies one synthetic task. The run proves:

- group preview exposes two related Core/FYI cards while the cards directory is empty;
- one `save_capture` writes both selected cards and their wikilink, and an identical retry is idempotent;
- a deterministic installed Hook creates one checkpoint, SessionEnd deactivates capture while preserving it, and the reviewed update consumes it;
- the update preserves the card UUID, replay is idempotent, and a stale preview cannot overwrite a manual concurrent edit;
- search/read returns both relevant cards; the managed Obsidian snippet and appearance setting are provisioned.

A separate ephemeral Codex task `01a09ca2-4a5e-7861-959d-3a4644498d5e` loaded the installed skill and MCP through the actual host, called `launch_patchouli` and `get_patchouli_status`, and reported capture active with zero drafts. Its indicator path points into the new installed cache. The task had an isolated data root; no vault was configured and no card was written.

## Native Obsidian

Obsidian loaded exactly the two synthetic cards from the isolated vault. Reading view showed one H1 plus Summary, Core, FYI, Evidence, Connections and Sources; Chinese, emoji, fenced code and eight math-rendering nodes were present. Scoped CSS hid Properties and the inline title only for the marked card. The Tokenization card's selected internal link resolved to the Unicode card. Opening the Unicode card showed one native Linked mentions backlink from Tokenization, and the metadata cache reported the same single incoming link.

All five processes belonging to the isolated Obsidian profile were stopped, and the temporary profile, vault, configuration and checkpoint state were removed. The user's real Patchouli configuration and knowledge vault were neither read nor modified.

## Evidence files

- `accepted-sha256.json`: accepted environment and key source/artifact hashes.
- `installed.json`: installed identity, complete package hash comparison and fresh-host result.
- `installed-smoke.json`: deterministic installed MCP/Hook/vault workflow assertions.
- `obsidian-native.json`: native Windows Obsidian rendering/link/backlink checks and cleanup.
- `installed-smoke.mjs`: reproducible isolated installed-copy workflow.
