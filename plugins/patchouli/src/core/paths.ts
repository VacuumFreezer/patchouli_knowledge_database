import * as fs from "node:fs/promises";
import path from "node:path";

import { PatchouliError, isNodeError } from "./errors.js";
import type { ConfigurationWarning } from "./types.js";

const WINDOWS_INVALID_COMPONENT = /[<>:"|?*\u0000-\u001F\u007F]/u;
const WINDOWS_INVALID_FILENAME = /[<>:"/\\|?*\u0000-\u001F\u007F]+/gu;
const WINDOWS_RESERVED_NAME = /^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\..*)?$/iu;

function comparablePath(value: string): string {
  const normalized = path.resolve(value);
  return process.platform === "win32" ? normalized.toLocaleLowerCase("en-US") : normalized;
}

export function isPathInside(root: string, candidate: string): boolean {
  const comparableRoot = comparablePath(root);
  const comparableCandidate = comparablePath(candidate);
  const relative = path.relative(comparableRoot, comparableCandidate);
  return relative === "" || (!path.isAbsolute(relative) && relative !== ".." && !relative.startsWith(`..${path.sep}`));
}

export function normalizeRelativePath(value: string, fieldName = "path"): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new PatchouliError("VALIDATION_ERROR", `${fieldName} must be a non-empty relative path.`, {
      field: fieldName,
    });
  }

  const trimmed = value.trim();
  if (
    path.isAbsolute(trimmed) ||
    path.win32.isAbsolute(trimmed) ||
    path.posix.isAbsolute(trimmed) ||
    /^[A-Za-z]:/u.test(trimmed)
  ) {
    throw new PatchouliError("PATH_ESCAPE", `${fieldName} must be relative.`, {
      field: fieldName,
      value,
    });
  }

  const segments = trimmed.split(/[\\/]+/u);
  for (const segment of segments) {
    if (
      segment.length === 0 ||
      segment === "." ||
      segment === ".." ||
      segment.endsWith(" ") ||
      segment.endsWith(".") ||
      WINDOWS_INVALID_COMPONENT.test(segment)
    ) {
      throw new PatchouliError("PATH_ESCAPE", `${fieldName} contains an unsafe path component.`, {
        field: fieldName,
        value,
        component: segment,
      });
    }
  }

  return segments.join("/");
}

export async function resolveContainedPath(
  root: string,
  relativePath: string,
  options: { mustExist?: boolean; fieldName?: string } = {},
): Promise<string> {
  const fieldName = options.fieldName ?? "path";
  const normalizedRelative = normalizeRelativePath(relativePath, fieldName);
  const rootRealPath = await fs.realpath(root);
  const segments = normalizedRelative.split("/");
  let current = rootRealPath;

  for (let index = 0; index < segments.length; index += 1) {
    const candidate = path.join(current, segments[index]);
    try {
      await fs.lstat(candidate);
      const realCandidate = await fs.realpath(candidate);
      if (!isPathInside(rootRealPath, realCandidate)) {
        throw new PatchouliError("PATH_ESCAPE", `${fieldName} resolves outside the configured vault.`, {
          field: fieldName,
          value: relativePath,
          resolvedPath: realCandidate,
        });
      }
      current = realCandidate;
    } catch (error: unknown) {
      if (error instanceof PatchouliError) throw error;
      if (!isNodeError(error) || error.code !== "ENOENT") throw error;
      if (options.mustExist) {
        throw new PatchouliError("NOT_FOUND", `${fieldName} does not exist.`, {
          field: fieldName,
          value: relativePath,
        }, { cause: error });
      }
      const unresolved = path.join(current, ...segments.slice(index));
      if (!isPathInside(rootRealPath, unresolved)) {
        throw new PatchouliError("PATH_ESCAPE", `${fieldName} escapes the configured vault.`, {
          field: fieldName,
          value: relativePath,
        });
      }
      return unresolved;
    }
  }

  return current;
}

export async function validateVaultDirectory(vaultPath: string): Promise<{
  vaultPath: string;
  warnings: ConfigurationWarning[];
}> {
  if (typeof vaultPath !== "string" || vaultPath.trim().length === 0 || !path.isAbsolute(vaultPath.trim())) {
    throw new PatchouliError("VALIDATION_ERROR", "vaultPath must be an absolute path.", {
      field: "vaultPath",
    });
  }

  let realVaultPath: string;
  try {
    realVaultPath = await fs.realpath(vaultPath.trim());
    const stats = await fs.stat(realVaultPath);
    if (!stats.isDirectory()) {
      throw new PatchouliError("VALIDATION_ERROR", "vaultPath must identify a directory.", {
        field: "vaultPath",
        value: vaultPath,
      });
    }
    await fs.access(realVaultPath, fs.constants.W_OK);
  } catch (error: unknown) {
    if (error instanceof PatchouliError) throw error;
    throw new PatchouliError("VALIDATION_ERROR", "vaultPath must be an existing writable directory.", {
      field: "vaultPath",
      value: vaultPath,
    }, { cause: error });
  }

  const warnings: ConfigurationWarning[] = [];
  try {
    const obsidianStats = await fs.stat(path.join(realVaultPath, ".obsidian"));
    if (!obsidianStats.isDirectory()) throw new Error(".obsidian is not a directory");
  } catch {
    warnings.push({
      code: "OBSIDIAN_DIRECTORY_MISSING",
      message: "The directory is writable, but no .obsidian directory was found.",
    });
  }

  return { vaultPath: realVaultPath, warnings };
}

export async function ensureContainedDirectory(root: string, relativePath: string): Promise<string> {
  const candidate = await resolveContainedPath(root, relativePath, {
    fieldName: "cardsDirectory",
  });
  await fs.mkdir(candidate, { recursive: true });
  const resolved = await resolveContainedPath(root, relativePath, {
    fieldName: "cardsDirectory",
    mustExist: true,
  });
  const stats = await fs.stat(resolved);
  if (!stats.isDirectory()) {
    throw new PatchouliError("VALIDATION_ERROR", "cardsDirectory must identify a directory.", {
      field: "cardsDirectory",
      value: relativePath,
    });
  }
  await fs.access(resolved, fs.constants.W_OK);
  return resolved;
}

export function sanitizeTitleToFilename(title: string): string {
  if (typeof title !== "string" || title.trim().length === 0) {
    throw new PatchouliError("VALIDATION_ERROR", "title must be a non-empty string.", {
      field: "title",
    });
  }

  let stem = title
    .normalize("NFKC")
    .replace(WINDOWS_INVALID_FILENAME, "-")
    .replace(/\s+/gu, " ")
    .replace(/-+/gu, "-")
    .replace(/(?:-\s*){2,}/gu, "-")
    .replace(/^[.\s-]+|[.\s-]+$/gu, "");

  if (stem.length === 0) {
    throw new PatchouliError("VALIDATION_ERROR", "title does not contain any filename-safe characters.", {
      field: "title",
    });
  }

  if (WINDOWS_RESERVED_NAME.test(stem)) stem = `_${stem}`;
  stem = Array.from(stem).slice(0, 116).join("").replace(/[.\s]+$/gu, "");
  // APFS and other Unix filesystems limit UTF-8 filename bytes, not JS characters.
  while (Buffer.byteLength(stem, "utf8") > 236) {
    stem = Array.from(stem).slice(0, -1).join("");
  }
  stem = stem.replace(/[.\s]+$/gu, "");
  if (stem.length === 0) {
    throw new PatchouliError("VALIDATION_ERROR", "title does not produce a valid filename.", {
      field: "title",
    });
  }
  return `${stem}.md`;
}

export function toPosixRelativePath(root: string, candidate: string): string {
  if (!isPathInside(root, candidate)) {
    throw new PatchouliError("PATH_ESCAPE", "Resolved path is outside the configured vault.", {
      root,
      candidate,
    });
  }
  return path.relative(root, candidate).split(path.sep).join("/");
}
