# Cross-platform sync/install acceptance

- Command: `node scripts/sync-install.mjs --no-pull` on macOS, using the real Codex CLI and the existing personal marketplace.
- Result: SUCCESS, installed/enabled `2.0.0+codex.20260917033500`, installed 17-tool MCP initialization passed, installed manifest/config/runtime bytes matched the built package before repository restoration.
- Full suite: 94 tests, 90 passed, 0 failed, 4 Windows-native skips. Typecheck, plugin/skill validation and bundle checks passed. Full transcript: `macos.log`.
- Default sync command on this intentionally dirty development checkout returned FAILED before pull or install. No source changes were discarded. A real remote pull was not run because this checkout contains uncommitted user/development work.
- Focused tests exercise supported/rejected platforms, Windows batch quoting with spaces, shell metacharacter rejection, literal native executable arguments, enabled/version verification and byte-exact generated-file restoration on success and injected failure. Native Windows batch smoke is included and runs on Windows.
- Both Windows and Mac launchers are preserved. Each host runs its own platform tests and native MCP launch before installation, then checks the actual installed MCP entry point. Windows-native execution is not available on this Mac; no native Windows end-to-end success is claimed.
- Rebuild ignores PATCHOULI_BUILD_PLATFORM supplied by the caller so a local installer cannot accidentally install a cross-build. Source/manifest/dist snapshots restore after handled failure; abrupt termination requires the documented backup/lock recovery.
- No user vault or conversation checkpoint was written; only normal dependencies and the installed local plugin cache changed.
