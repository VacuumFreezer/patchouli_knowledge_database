import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  PatchouliError,
  getDefaultConfigurationPath,
  normalizeRelativePath,
  resolveContainedPath,
  sanitizeTitleToFilename,
} from "../dist/core.mjs";

test("places the default configuration beneath the Windows application-data directory", () => {
  const appData = "C:\\Users\\Example\\AppData\\Roaming";
  assert.equal(
    getDefaultConfigurationPath({ APPDATA: appData }, "win32"),
    path.win32.join(appData, "Patchouli", "configuration.json"),
  );
  assert.throws(() => getDefaultConfigurationPath({}, "win32"), (error) => {
    assert.ok(error instanceof PatchouliError);
    assert.equal(error.code, "CONFIGURATION_INVALID");
    return true;
  });
});

test("sanitizes titles into deterministic Windows-safe filenames", () => {
  assert.equal(sanitizeTitleToFilename('  Research: "A/B"?  '), "Research-A-B.md");
  assert.equal(sanitizeTitleToFilename("CON"), "_CON.md");
  assert.equal(sanitizeTitleToFilename("量子纠缠 🌿"), "量子纠缠 🌿.md");
  assert.throws(() => sanitizeTitleToFilename("<>:*?"), (error) => {
    assert.ok(error instanceof PatchouliError);
    assert.equal(error.code, "VALIDATION_ERROR");
    return true;
  });
});

test("normalizes safe relative paths and rejects absolute or traversal paths", () => {
  assert.equal(normalizeRelativePath("Notes\\Patchouli", "cardsDirectory"), "Notes/Patchouli");
  for (const unsafe of ["../outside", "Notes/../outside", "C:\\outside", "/outside", "Notes./"]) {
    assert.throws(() => normalizeRelativePath(unsafe, "cardsDirectory"), PatchouliError);
  }
});

test("rejects a configured directory that escapes through a junction", async (context) => {
  const root = await mkdtemp(path.join(tmpdir(), "patchouli-paths-"));
  const vault = path.join(root, "vault");
  const outside = path.join(root, "outside");
  await mkdir(vault);
  await mkdir(outside);
  context.after(() => rm(root, { recursive: true, force: true }));
  await symlink(outside, path.join(vault, "escape"), "junction");

  await assert.rejects(
    resolveContainedPath(vault, "escape", { fieldName: "cardsDirectory" }),
    (error) => {
      assert.ok(error instanceof PatchouliError);
      assert.equal(error.code, "PATH_ESCAPE");
      return true;
    },
  );
});
