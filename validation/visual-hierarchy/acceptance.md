# Stage 14 — card visual hierarchy

## Decision and sources (2026-09-09)

Reviewed the [official community registry](https://raw.githubusercontent.com/obsidianmd/obsidian-releases/master/community-plugins.json) and these primary project descriptions:

- [Heading Decorator](https://github.com/dragonish/obsidian-heading-decorator): heading-level decorations in reading/editing/outline without changing note contents. Useful for numbering, but adds a runtime and per-vault settings dependency for a small presentation change.
- [Style Settings](https://github.com/obsidian-community/obsidian-style-settings): exposes CSS variables as controls; it still needs a designed stylesheet.
- [Contextual Typography](https://github.com/mgmeyers/obsidian-contextual-typography): adds contextual attributes to preview blocks; supplies no styles itself.
- [Obsidian native snippets](https://obsidian.md/help/snippets): support local CSS without a community plugin.

Selected native CSS scoped by the existing `patchouli-card` class. No community plugin is required or installed. Markdown stays portable; no card migration is needed. Main sections use filled bars and thick leading borders; H3 uses an underline; H4/H5/H6 use solid/dashed/dotted leading rules. Reading-view Core has an accent tint and stronger border; FYI has a dashed outline/double leading border. Live Preview and source editing share the section/subheading hierarchy; text-specific Core/FYI accents are reading-view only, because native editor lines do not expose heading text as CSS attributes. Theme text/background variables maintain contrast; color is supplemented by shape. No generated labels, indentation of body content, fixed widths, opacity on text, or code/math/table overrides.

## Provisioning

The filename remains `patchouli-cards-v2.css`. Exact shipped v2 CSS upgrades atomically; already-current CSS is unchanged. Unknown/user-modified content produces the existing collision error and is preserved. Snippet path containment, in-process serialization and a pre-replace revision check remain enforced. Enabled snippet order, unrelated appearance preferences, other snippets and all card bytes are preserved. Turn off the snippet to revert its presentation; older v2 styling can also be restored from backup.

## Pre-install validation

- Fresh build plus 83/83 tests passed on this Mac's default APFS.
- Two added behavioral tests cover legacy upgrade, idempotency/concurrency, unchanged cards/settings, customized CSS preservation and symlink escape rejection.
- Typecheck, repository and canonical plugin/skill validators, bundle verification, 17-tool MCP smoke and actual isolated model hook passed. The first sandboxed real-hook run failed to synthesize; an authorized network-enabled rerun passed (one private draft, no vault writes).
- This change adds no tools, schema, model prompts or capture semantics; the Stage 12 real-model results remain the semantic baseline.
- Native Windows, Intel Mac, third-party themes and mobile Obsidian are not available in this environment. Native desktop narrow-view coverage is recorded separately; no mobile claim.

## Installed/native smoke

Completed with installed `2.0.0+codex.20260910020002`, enabled from the existing personal marketplace. All 71 accepted installed file hashes match (`accepted-sha256.json`, `final-checks.json`).

Installed MCP checks (`smoke.mjs`, `installed-smoke.json`): old snippet provisioning upgrade, complete synthetic group preview/save, identical save replay without duplication, saved card read, original NLP search and retrieval. The default Patchouli configuration was byte-identical throughout; the isolated smoke configuration did not replace it.

Native visual evidence: CUA screenshots and accessibility observations from `/Applications/Obsidian.app` 1.13.7, viewed during this task (not stored as PNG artifacts):

| Check | Observed result |
| --- | --- |
| Light, ~300 px content column, Live Preview | Section bars, H3 underline and H4/H5/H6 solid/dashed/dotted leading rules visible; one title, hidden Properties. |
| Light, narrow reading | Core tinted bar and stronger leading edge; FYI dashed frame and double edge; long Chinese H3 wraps cleanly above its rule. |
| Dark, narrow reading | H4–H6 rules, inline/display math, FYI frame and Chinese/emoji table remain legible. |
| Dark, wide reading (~670 px content) | Original Tokenization and Unicode cards show clear title/section/concept hierarchy without clipping. |
| Dark, narrow Live Preview | Same structural heading rules visible, with editable note text and normal table/math widgets. |
| Links | Clicked Tokenization's outgoing Unicode link and observed the Unicode card open; native Linked mentions showed Tokenization with the original link reason. |
| Ordinary note | Welcome retained its native inline title and ordinary layout with no Patchouli borders. |
| Restoration | Original light appearance, both sidebars, Tokenization card and Live Preview restored; temporary fixture absent from file explorer. |

Obsidian sometimes retained stale renderer contents after external file/theme changes. Normal quit/relaunch refreshed the UI both before inspection and at final restoration. No Obsidian app installation/uninstallation or security-setting change occurred. Native acceptance uses the refreshed visible UI, not the stale view.

Backups and the archived synthetic card are in `/Users/tongshen/Library/Application Support/Patchouli/backups/stage14-20260909`. Both original NLP cards, Welcome and appearance.json have the exact baseline hashes. Only the managed CSS changed in the vault. The fixture was created directly in Engineering, then archived outside the vault; no extra Patchouli folder was created.

The Core/FYI-specific accent distinction is reading-view only; editing views retain the general hierarchy bars/rules. Third-party themes, mobile, native Windows/Intel Mac and print output were not visually tested. No claim of universal theme compatibility or new real-model capture evaluation is made for this CSS-only stage.
