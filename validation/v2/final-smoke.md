# V2 installed smoke and NLP correction

Completed 2026-09-09 on this Apple Silicon Mac. Installed and enabled: **`2.0.0+codex.20260910002058`** from `patchouli@personal`. All 69 accepted non-manifest plugin files match their installed SHA-256 values; the manifest differs only by its recorded cachebuster.

## Results

- A fresh Codex task loaded `skills/patchouli/SKILL.md` from the installed cache, not a staged skill copy. It independently proposed two cards from the synthetic NLP conversation, with a selected Tokenization → Unicode prerequisite link already present in `preview_capture`. BPE/representation/constraint mechanisms stayed in Core; vocabulary figures and the complete counting exercise were in FYI. The model also performed the cited local Python checks.
- The complete preview was reviewed and its content/connection set confirmed once. The unchanged model-produced payload was submitted through the installed local MCP client: two cards saved, and identical-token replay returned the existing result without duplicates.
- A separate installed-launcher protocol run passed ten grouped checks: 17-tool catalog; launch/status; no-write connected preview; cancellation/token invalidation; one group save and shared-checkpoint consumption; update identity preservation; manual revision conflict and checkpoint retention; restart/read persistence; missing-evidence search; and installed SessionEnd retention. It used actual installed-hook draft output as its private checkpoint input.
- Actual installed pre-compaction synthesis produced three independently useful concepts with Core/FYI separation. Actual SessionEnd stopped capture and preserved the drafts byte-for-byte at the API level. This is direct installed-hook execution; no claim is made that the v2 test forced a host-delivered compaction event.
- A fresh read-only installed-plugin inquiry retrieved both saved cards, cited their wikilinks, distinguished Core from FYI and disclosed synthetic provenance. Its heliopause queries returned no evidence, which the answer explicitly stated. See [installed-inquiry.md](installed-inquiry.md).

## Native Obsidian 1.13.7

Verified in the actual desktop app, using both the independent smoke cards and the corrected NLP notes:

- One body title; no duplicate inline title and no visible Properties block.
- Separate Core/FYI, Chinese and emoji, UTF-8 tables, syntax-highlighted Python and rendered Zipf math.
- Clicking the smoke Tokenization card's outgoing link opens the Unicode card. Its **Backlinks → Linked mentions** panel explicitly names the Tokenization source and shows the relationship line.
- The actual NLP Unicode → Tokenization link also opens the correct note; both original NLP cards show one derived backlink.

The previously open Obsidian renderer kept stale content after the files changed. Force Reload left that window blank; a normal Quit and relaunch loaded the updated cards and the new scoped snippet. No Obsidian installation, uninstallation or replacement was performed. The snippet is now enabled in this vault. Other appearance preferences were preserved; unrelated notes do not have the `patchouli-card` class.

## Original cards and cleanup

Both original filenames remain directly in `NLP/`:

- `Tokenization-共享词表、Byte-level BPE 与字符级约束.md` — ID `e4018f70-1712-45f0-88d7-9c72bf819e7b`, created `2026-09-09T20:40:03.060Z`.
- `Unicode 与 UTF-8-字符、码点和字节.md` — ID `94e7a06b-dea1-4e11-8c0c-5caf8a122f4c`, created `2026-09-09T20:40:42.046Z`.

The full originals, pre-change appearance/configuration, complete MCP update preview and update results are backed up under `/Users/tongshen/Library/Application Support/Patchouli/backups/v2-20260909/`. Updates retained identities, creation times, concepts and provenance. Unicode's categories now reflect computer foundations/character encoding. Both notes have justified explicit connections; vocabulary figures and counting exercises are in FYI.

The two independent `Engineering/V2 Smoke Test/` notes were verified against their saved content, moved into the backup's `smoke/` directory, and their empty test folder removed. Earlier Engineering notes were untouched. The default Patchouli configuration is byte-for-byte unchanged and still targets `NLP`. Test browser servers were stopped, the temporary tab closed, and the case-sensitive test image detached and removed. Obsidian is left showing the corrected Tokenization note.

## Host limits

Codex CLI recognized the “都保存” confirmation but rejected the write MCP call because its approval policy was `never`; switching its filesystem sandbox to workspace-write did not change that tool policy. No approval policy was weakened or changed. Consequently, **the CLI-only write leg was not accepted as a passing end-to-end model test**. Actual writes/replay were verified through the installed local MCP client using the exact reviewed payload. An interactive host must permit the plugin's write tools in addition to the user's content confirmation.

Native Windows and Intel Mac execution were unavailable. Shared Windows contracts and the preserved v1 read/search baseline pass on this Mac; that is not a substitute for a native Windows run. Group writes are individually atomic, not a multi-file crash-atomic transaction.

Machine-readable outcomes, paths and hashes are in [smoke-result.json](smoke-result.json) and [installed.json](installed.json). Pre-installation evidence is in [acceptance.md](acceptance.md).
