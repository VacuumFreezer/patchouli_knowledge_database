# Mac build acceptance evidence

Stage 8 initially accepted on 2026-09-09 before marketplace registration, then reopened and reaccepted after the installed-host test exposed a task-identity gap. The final source passed before reinstalling. Base revision: `6829a7ef29b0cbd21495178be42bbe2657bf238d`; the working-tree source, tests, launchers, configuration, schemas, skills, and four distributables are identified by [mac-build-sha256.json](mac-build-sha256.json). Stage 9 may change only the manifest cachebuster without invalidating these runtime hashes.

## Environment and packaging

- macOS 15.7.9 (24G830), Apple Silicon arm64; Node 24.14.1, pnpm 11.19.0, Codex CLI 0.153.4.
- Default APFS volume is case-insensitive. A disposable case-sensitive APFS sparse image mounted at `/private/tmp/patchouli-case-volume` supplied `TMPDIR` for a second full run.
- Obsidian 1.13.7, downloaded from the official release and run from a temporary copy with an isolated profile and generated test vault.
- `.mcp.json` is generated for the build target (`darwin` here; `PATCHOULI_BUILD_PLATFORM=win32` retains the Windows package configuration). Both launcher families remain packaged. Hooks use the supported default `command` and Windows `commandWindows` fields.
- Tests use isolated configuration/checkpoint roots. Neither `~/Library/Application Support/Patchouli/configuration.json` nor its `session-checkpoints` directory existed after Stage 8.

## Commands and results

| Check | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Passed; lockfile unchanged. |
| `pnpm typecheck` | Passed. |
| `pnpm build` / fresh build performed by `pnpm test` | Four distributables rebuilt; native Mac MCP configuration generated. |
| `pnpm test` | **70 passed, 0 failed, 0 skipped**, including all 46 original cases. |
| `TMPDIR=/private/tmp/patchouli-case-volume pnpm test` | **70 passed, 0 failed, 0 skipped** on case-sensitive APFS fixtures. |
| `pnpm validate:skill` / `pnpm validate:plugin` | Both passed. |
| Canonical `plugin-creator/scripts/validate_plugin.py` and `skill-creator/scripts/quick_validate.py` | Both passed with PyYAML isolated under `/tmp/patchouli-validator-python`. |
| `pnpm verify:bundle` | Passed: 3,557,495 bytes across four files; no external runtime packages/scripts. |
| `pnpm inspect:mcp` | Actual Mac launcher initializes and lists all **15** tools. |
| MCP Inspector CLI `--method tools/list --strict --format json` against `/bin/sh …/launch-patchouli-mcp.sh` | Exit 0; 15 typed tools; empty diagnostic output. Representative calls and error paths are exercised through the same launcher by the integration suite. |
| `pnpm inspect:hook` | Real signed-in Codex synthesis through the Mac hook launcher produced one private draft, with no configured vault or card write. |
| `git diff --check` | Passed. |

The final full-run logs were `/tmp/patchouli-tests-metadata.log` and `/tmp/patchouli-tests-metadata-sensitive.log`; real-hook output was `/tmp/patchouli-real-hook-launcher.log`. They are disposable execution logs, not required package files.

## Functional coverage

| Area | Evidence |
| --- | --- |
| Runtime and storage | `platform.test.mjs`: actual shell launchers, literal quoted arguments, exit codes/signals, minimal PATH and stale hints, relocated Unicode/space paths without `node_modules`, stderr-only startup failures, shared MCP/hook storage, private 0700 directories/0600 files, malformed configuration, permissions, explicit Windows paths. |
| Files and card parity | Existing card/path/search/vault tests plus Mac regressions: realpath boundaries, traversal and symlink escapes, case-only updates and distinct case-sensitive files, Unicode normalization, long UTF-8 names, duplicate/concurrent creates, deterministic categories/ranking/filtering, legacy parsing, metadata, selected links and formulas. |
| Windows baseline comparison | `parity.test.mjs` compares exact fixed-ID/time output with `tests/fixtures/windows-parity.json`. The reference was generated from the committed Windows-version `dist/core.mjs` at the base revision, executed on this Mac. This is a shared-code baseline comparison, **not a native Windows execution**. |
| Reviewed writes and inquiry | MCP tests call all 15 tools, validate schemas/errors/resources, missing configuration/task context, preview-only behavior, creation/update token separation, expiration, conflicts, identical/concurrent retries and rollback. The lifecycle scenario launches capture, creates checkpoints, updates/renames an existing card, selectively consumes its draft, separately reviews/saves a linked new card, searches/reads it, and checks an unrelated query returns no evidence. |
| Review | jsdom covers every draft group, connection selection, Markdown/KaTeX, keyboard submission, required/structural validation, create/update/cancel, host failure and retry. Full conversational fallbacks include evidence, source URLs and selected/unselected connections. |
| Checkpoints | Stage 7 and MCP/platform tests cover inactive/repeated launches, auto/manual events, duplicate/out-of-order completion, multiple topics/tasks, locks, restarts, stop/relaunch, repeated SessionEnd retaining draft identities, selective discard/consumption, rejected-write retention, corrupt/oversized state, malformed/ambient transcript data, missing generator, timeout and content-free warning. Hooks never call vault or preview APIs. |

## Actual model and visual checks

The local browser harness loaded the real bundled MCP review UI and connected to the staged server. Keyboard Save created `Arithmetic series`; Update retained its UUID/creation time and added the reviewed summary refinement. A blank Summary showed `Summary is required.`; Cancel reported that nothing was written. Status still showed exactly two generated cards, one selected outgoing link, one supported search match and zero heliopause matches.

The generated card contains inline/display arithmetic-series formulas, categories, evidence and a conversation source. Native Mac Obsidian loaded the card properties and rendered the MathJax formulas. Opening `Pairing terms` showed **1 backlink**, derived from `[[Pairing terms|Pairing terms]]` in `Arithmetic series`. A stale accessibility snapshot required restarting only the isolated Obsidian process; an incidental empty test note outside the cards directory is disposable and excluded from the card count.

A real read-only Codex inquiry called `get_configuration`, `search_cards` for arithmetic-series and heliopause queries, then `get_card` for `Patchouli/Arithmetic series.md`. It explained the pairing derivation with a card wikilink and explicitly stated that the vault lacked heliopause evidence. The first attempt hit a model-capacity error; the retry completed successfully. Separately, actual Codex checkpoint synthesis passed against a tiny synthetic transcript with no vault configured. These model and UI checks are separate from deterministic fixtures; host-delivered lifecycle events and installed-plugin activation belong to Stage 9.

## Resolved failures and coverage limits

- The initial Mac baseline had a test-only `/var` versus `/private/var` expectation mismatch; canonical realpaths fixed the assertion while retaining containment checks.
- Unicode filename byte limits and unconditional lowercase containment/update comparisons were corrected and exercised on both volume types.
- Failed generator startup and timeouts now release timers/processes promptly; concise warnings do not expose the transcript. Non-UI previews now show every review field.
- Local listening sockets, temporary-volume mounting, dependency downloads, signed-in synthesis and the native test app required sandbox escalation; approved runs supplied the evidence above.
- No native Windows runner or Intel Mac was available. Windows launch/configuration contracts and frozen shared-code output were tested on arm64 macOS. Native Windows and Intel Mac execution are not claimed. Node 24 was the tested development/runtime version; other supported Node versions were not independently run.

## Installed-host finding resolved in Stage 8

The first nested CLI test inherited the parent task ID; clearing the environment then exposed the actual issue: fresh Mac MCP requests identify the task through `_meta.threadId` and `x-codex-turn-metadata`, rather than startup environment variables. A metadata-only wire probe confirmed the format, consistent with the [Codex MCP request builder](https://github.com/openai/codex/blob/main/codex-rs/core/src/mcp_tool_call.rs). The source now prefers these request IDs, rejects inconsistent IDs, and checks task/operation ownership before initial or replayed saves. Two new regressions bring each volume run to 70/70. A real clean CLI task successfully launched and read its own status with the staged server. That temporary manual server override omitted the data-root allowlist and created one empty activation record in the default directory; the exact synthetic record was removed, restoring the pre-test state. No real vault was configured or written.

## Stage 9

The repository marketplace `personal` was absent on this Mac and was registered through `codex plugin marketplace add /Users/tongshen/projects/patchouli_knowledge_database`. `codex plugin add patchouli@personal` installed the final revalidated version **0.2.0+codex.20260909142257**. The plugin-creator cachebuster helper preserved the `0.2.0` base version. No unrelated registration was replaced.

[mac-installation.json](mac-installation.json) records the final cache location and manifest hash. All **60** accepted plugin files other than the cachebuster-only manifest matched their Stage 8 hashes; the installed manifest matched the source manifest. The cache has four unused development command shims under `node_modules/.bin`, but no runtime dependency packages. The actual installed MCP launcher lists all 15 tools, and the final installed hook's real synthesis smoke passed again. The dependency-free relocated-package test and bundle validation independently prove no runtime `node_modules` dependency.

The normal CLI hook-review interface showed precisely the Patchouli `PreCompact` and `SessionEnd` shell commands. Each was reviewed and trusted individually; `/hooks` then showed one active hook for each event. No trust-bypass flag or manual trust-state edit was used.

Fresh explicit `$patchouli` capture discovered the installed skill/references, searched/read related cards, suggested a relevant connection, and produced a complete odd-integer-sum preview without saving. A natural-language inquiry against the installed acceptance vault searched/read both supporting cards, cited their wikilinks, and reported no heliopause evidence. The inquiry was initially rejected by automatic approval review over possible sensitive vault data; read-only inspection and exact hashes established that the vault contained only the two generated arithmetic fixtures, after which the guarded test was approved and passed.

The installed review UI created `Arithmetic series` and then confirmed a rename to `Arithmetic series reviewed`, preserving UUID `5f992766-81fb-4e84-b02f-7b36c11e08dc` and its creation time. Cancel left two cards, one selected link, one supported query result and zero heliopause matches. Native Obsidian displayed the updated properties, inline/display math, paraphrased evidence, conversation source and connection; `Pairing terms` showed one derived backlink. These visual checks used the byte-identical review bundle from the first installed candidate; the final backend's task-bound confirmation/retry paths were additionally covered by the 70-test rerun.

Final lifecycle acceptance used a clean task, `01a0868d-6bd3-7212-90f9-9977e15f754d`, with only synthetic arithmetic-series and binary-search discussion. The final installed server recorded activation under that exact host ID. An actual `/compact` event produced **two private drafts** while the vault still contained only its original two fixture cards. Closing the task delivered `SessionEnd`: capture became inactive and both checkpoint objects remained byte-for-byte equivalent. Reopening the same task recovered both drafts without relaunching capture.

The first read-only interactive confirmation was interrupted before its MCP write began; the card and checkpoints stayed unchanged. Resuming with the host's automatic approval reviewer completed the reviewed update. A process restart correctly invalidated its in-memory preview token, so the model reissued an identical preview under the existing explicit confirmation. Read-back assertions verified the exact reviewed body, UUID and creation-time preservation, and the selected Pairing terms connection. Only the arithmetic checkpoint was consumed; the binary checkpoint remained exactly unchanged.

The remaining checkpoint received a separate complete binary-search card review and explicit confirmation. The saved card matched that review. Repeating the identical `save_card` call returned `idempotentReplay: true`, the same UUID and Markdown, and no duplicate. The vault ended with three cards and zero checkpoints, with capture inactive. The installed task then read the new card and cited it when explaining binary search's absence condition. These checks are recorded in [mac-host-acceptance.json](mac-host-acceptance.json), together with synthetic card hashes and the inspected model-tool assertions.

Two separate installed MCP processes retained the acceptance vault configuration while new task IDs each reported inactive capture and zero drafts. The final `codex plugin list --marketplace personal --json` confirmed the installed version, enabled state, and this repository's marketplace source. Accepted source and installed-file hashes were checked again after all host tests; only the documented manifest cachebuster differed from Stage 8.

The CLI exercises complete conversational review. The actual bundled MCP App was rendered and operated in the local browser harness, and saved cards were inspected in native Obsidian; native Codex inline rendering is not asserted. Both temporary review servers were stopped, their synthetic vaults removed, the temporary Obsidian app/profile removed, and the case-sensitive test volume detached and deleted. Disposable execution logs remain under temporary storage. The real default Patchouli configuration and checkpoint directory remain absent, so no personal vault or capture state was changed. Stage 9 completed at **2026-09-09T10:46:22-04:00**.
