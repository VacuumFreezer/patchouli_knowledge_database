#!/bin/sh
patchouli_scripts=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd) || exit 1
exec /bin/sh "$patchouli_scripts/run-with-codex-node.sh" "$patchouli_scripts/../dist/hook.mjs" "$@"
