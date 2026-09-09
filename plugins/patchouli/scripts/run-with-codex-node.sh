#!/bin/sh
# No login-shell setup: desktop launches must work with a minimal PATH.
if [ "$#" -eq 0 ]; then
  printf '%s\n' 'Patchouli could not start Node: missing script or argument.' >&2
  exit 64
fi

for patchouli_node in \
  "${CODEX_MCP_NODE_PATH:-}" \
  "${CODEX_BROWSER_USE_NODE_PATH:-}" \
  "${CODEX_ELECTRON_RESOURCES_PATH:+$CODEX_ELECTRON_RESOURCES_PATH/cua_node/bin/node}" \
  "${CODEX_CLI_PATH:+${CODEX_CLI_PATH%/*}/cua_node/bin/node}" \
  "${HOME:+$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node}" \
  /Applications/Codex.app/Contents/Resources/cua_node/bin/node \
  /Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node \
  "${HOME:+$HOME/Applications/Codex.app/Contents/Resources/cua_node/bin/node}" \
  "${HOME:+$HOME/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node}"
do
  if [ -n "$patchouli_node" ] && [ -f "$patchouli_node" ] && [ -x "$patchouli_node" ]; then
    exec "$patchouli_node" "$@"
  fi
done

if command -v node >/dev/null 2>&1; then
  exec node "$@"
fi
printf '%s\n' 'Patchouli could not find Node. Update Codex or set CODEX_MCP_NODE_PATH to a Node 20.19+ executable.' >&2
exit 127
