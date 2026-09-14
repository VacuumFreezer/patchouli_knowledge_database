import * as fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { PatchouliError, isNodeError } from "./errors.js";
import { getApplicationDataDirectory } from "./platform.js";
import { normalizeRelativePath, resolveContainedPath, validateVaultDirectory } from "./paths.js";
import {
  DEFAULT_CARDS_DIRECTORY,
  type ConfigurationStatus,
  type VaultConfiguration,
} from "./types.js";

export interface ConfigureVaultInput {
  vaultPath: string;
  cardsDirectory?: string;
  captureDate?: string;
  topic?: string;
}

/** Explicit local calendar date keeps previews stable across midnight and time zones. */
export function captureFolderForDate(date: string, topic?: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) {
    throw new PatchouliError("VALIDATION_ERROR", "captureDate must be a valid local calendar date (YYYY-MM-DD).");
  }
  const [year, month, day] = date.split("-") as [string, string, string];
  const mon = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(month) - 1];
  if (topic !== undefined) {
    const name = normalizeRelativePath(topic, "topic");
    if (name.includes("/") || /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i.test(name)) throw new PatchouliError("VALIDATION_ERROR", "topic must be one safe folder name.");
    return `${name}_${mon}${day}${year.slice(-2)}`;
  }
  return `${mon}_${day}_${year.slice(-2)}`;
}

async function validateCardsDirectory(vaultPath: string, cardsDirectory: string): Promise<void> {
  const resolved = await resolveContainedPath(vaultPath, cardsDirectory, {
    fieldName: "cardsDirectory",
  });
  try {
    const stats = await fs.stat(resolved);
    if (!stats.isDirectory()) {
      throw new PatchouliError("VALIDATION_ERROR", "cardsDirectory must identify a directory when it exists.", {
        field: "cardsDirectory",
        value: cardsDirectory,
      });
    }
    await fs.access(resolved, fs.constants.W_OK);
  } catch (error: unknown) {
    if (error instanceof PatchouliError) throw error;
    if (isNodeError(error) && error.code === "ENOENT") return;
    throw new PatchouliError("VALIDATION_ERROR", "cardsDirectory must be writable when it exists.", {
      field: "cardsDirectory",
      value: cardsDirectory,
    }, { cause: error });
  }
}

export function getDefaultConfigurationPath(
  environment: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
): string {
  const paths = platform === "win32" ? path.win32 : path.posix;
  return paths.join(getApplicationDataDirectory(environment, platform), "configuration.json");
}

async function writeJsonAtomically(filePath: string, value: unknown): Promise<void> {
  const directory = path.dirname(filePath);
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  const temporaryPath = path.join(directory, `.configuration-${randomUUID()}.tmp`);
  let handle: fs.FileHandle | undefined;
  try {
    handle = await fs.open(temporaryPath, "wx", 0o600);
    await handle.writeFile(`${JSON.stringify(value, null, 2)}\n`, "utf8");
    await handle.sync();
    await handle.close();
    handle = undefined;
    await fs.rename(temporaryPath, filePath);
  } catch (error: unknown) {
    await handle?.close().catch(() => undefined);
    await fs.unlink(temporaryPath).catch(() => undefined);
    throw new PatchouliError("IO_ERROR", "Could not persist the Patchouli configuration.", {
      configurationPath: filePath,
    }, { cause: error });
  }
}

export class ConfigurationStore {
  readonly configurationPath: string;

  constructor(configurationPath = getDefaultConfigurationPath()) {
    this.configurationPath = path.resolve(configurationPath);
  }

  async configure(input: ConfigureVaultInput): Promise<ConfigurationStatus> {
    const validatedVault = await validateVaultDirectory(input.vaultPath);
    const cardsDirectory = normalizeRelativePath(
      input.cardsDirectory ?? DEFAULT_CARDS_DIRECTORY,
      "cardsDirectory",
    );
    await validateCardsDirectory(validatedVault.vaultPath, cardsDirectory);

    if (input.topic !== undefined && input.captureDate === undefined) throw new PatchouliError("VALIDATION_ERROR", "topic requires captureDate.");
    const captureFolder = input.captureDate === undefined ? undefined : captureFolderForDate(input.captureDate, input.topic);
    const configuration: VaultConfiguration = {
      vaultPath: validatedVault.vaultPath,
      cardsDirectory,
      ...(captureFolder ? { captureFolder } : {}),
    };
    await writeJsonAtomically(this.configurationPath, configuration);
    return {
      configured: true,
      configuration,
      warnings: validatedVault.warnings,
    };
  }

  async getStatus(): Promise<ConfigurationStatus> {
    let raw: string;
    try {
      raw = await fs.readFile(this.configurationPath, "utf8");
    } catch (error: unknown) {
      if (isNodeError(error) && error.code === "ENOENT") {
        return { configured: false, warnings: [] };
      }
      throw new PatchouliError("IO_ERROR", "Could not read the Patchouli configuration.", {
        configurationPath: this.configurationPath,
      }, { cause: error });
    }

    let stored: unknown;
    try {
      stored = JSON.parse(raw);
    } catch (error: unknown) {
      throw new PatchouliError("CONFIGURATION_INVALID", "The persisted Patchouli configuration is malformed.", {
        configurationPath: this.configurationPath,
      }, { cause: error });
    }

    if (
      typeof stored !== "object" ||
      stored === null ||
      !("vaultPath" in stored) ||
      !("cardsDirectory" in stored) ||
      typeof stored.vaultPath !== "string" ||
      typeof stored.cardsDirectory !== "string"
    ) {
      throw new PatchouliError("CONFIGURATION_INVALID", "The persisted Patchouli configuration has invalid fields.", {
        configurationPath: this.configurationPath,
      });
    }

    const validatedVault = await validateVaultDirectory(stored.vaultPath);
    const cardsDirectory = normalizeRelativePath(stored.cardsDirectory, "cardsDirectory");
    await validateCardsDirectory(validatedVault.vaultPath, cardsDirectory);
    const captureFolder = "captureFolder" in stored ? normalizeRelativePath(stored.captureFolder as string, "captureFolder") : undefined;
    if (captureFolder?.includes("/")) throw new PatchouliError("CONFIGURATION_INVALID", "captureFolder must be one directory layer.");
    return {
      configured: true,
      configuration: {
        vaultPath: validatedVault.vaultPath,
        cardsDirectory,
        ...(captureFolder ? { captureFolder } : {}),
      },
      warnings: validatedVault.warnings,
    };
  }

  async requireConfiguration(): Promise<VaultConfiguration> {
    const status = await this.getStatus();
    if (!status.configured || !status.configuration) {
      throw new PatchouliError("CONFIGURATION_MISSING", "Configure a vault before using the card engine.");
    }
    return status.configuration;
  }
}
