import path from "node:path";

export function mcpConfiguration(platform = process.platform) {
  if (!["win32", "darwin"].includes(platform)) throw new Error(`Unsupported Patchouli platform: ${platform}`);
  return {
    mcpServers: {
      patchouli: {
        ...(platform === "win32" ? {
          command: "cmd.exe",
          args: ["/d", "/s", "/c", "call", "./scripts/launch-patchouli-mcp.cmd", "./dist/server.mjs"],
        } : {
          command: "/bin/sh",
          args: ["./scripts/launch-patchouli-mcp.sh"],
        }),
        cwd: ".",
        env_vars: [
          "CODEX_MCP_NODE_PATH", "CODEX_BROWSER_USE_NODE_PATH", "CODEX_ELECTRON_RESOURCES_PATH",
          "CODEX_CLI_PATH", "CODEX_THREAD_ID", "CODEX_SESSION_ID", "HOME", "APPDATA", "USERPROFILE",
          "LOCALAPPDATA", "PATH", "PATCHOULI_DATA_ROOT", "PATCHOULI_CHECKPOINT_ROOT", "PATCHOULI_SESSION_ID",
        ],
        startup_timeout_sec: 10,
        tool_timeout_sec: 120,
      },
    },
  };
}

/** Use the exact packaged transport, including when testing an installed copy. */
export function transportOptions(configuration, pluginRoot, env = process.env) {
  const server = configuration.mcpServers.patchouli;
  return { command: server.command, args: server.args, cwd: path.resolve(pluginRoot), env, stderr: "pipe" };
}
