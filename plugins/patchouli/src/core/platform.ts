import os from "node:os";
import path from "node:path";

import { PatchouliError } from "./errors.js";

/** Configuration and hooks must agree on this directory, including in test processes. */
export function getApplicationDataDirectory(
  environment: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
  homeDirectory = os.homedir(),
): string {
  const paths = platform === "win32" ? path.win32 : path.posix;
  const override = environment.PATCHOULI_DATA_ROOT?.trim();
  if (override) {
    if (!paths.isAbsolute(override)) {
      throw new PatchouliError("CONFIGURATION_INVALID", "PATCHOULI_DATA_ROOT must be an absolute directory.");
    }
    return override;
  }
  if (platform === "win32") {
    const appData = environment.APPDATA?.trim();
    if (!appData || !paths.isAbsolute(appData)) {
      throw new PatchouliError("CONFIGURATION_INVALID", "APPDATA must identify the current Windows user's application-data directory.", {
        environmentVariable: "APPDATA",
      });
    }
    return paths.join(appData, "Patchouli");
  }
  if (platform === "darwin") {
    const home = environment.HOME?.trim() || homeDirectory;
    if (!paths.isAbsolute(home)) {
      throw new PatchouliError("CONFIGURATION_INVALID", "The Mac home directory must be absolute.");
    }
    return paths.join(home, "Library", "Application Support", "Patchouli");
  }
  throw new PatchouliError("CONFIGURATION_INVALID", "Patchouli currently supports native macOS and Windows.");
}
