import assert from "node:assert/strict";
import { link, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { PatchouliError, VaultCardEngine } from "../dist/core.mjs";

function draft(title = "Integration Card") {
  return {
    title,
    categories: ["Testing", "Local"],
    annotation: "Reviewed locally.",
    summaryMarkdown: "Atomic local Markdown storage.",
    understandingMarkdown: "The vault remains the durable database.",
    evidence: [{ claim: "The write was verified", sourceReference: "Integration test" }],
    sources: [{ type: "text", label: "Integration fixture" }],
    connections: [],
  };
}

async function fixture(context, withObsidian = false) {
  const root = await mkdtemp(path.join(tmpdir(), "patchouli-vault-"));
  const vault = path.join(root, "vault");
  const configurationPath = path.join(root, "appdata", "Patchouli", "configuration.json");
  await mkdir(vault);
  if (withObsidian) await mkdir(path.join(vault, ".obsidian"));
  context.after(() => rm(root, { recursive: true, force: true }));
  return { root, vault, configurationPath, engine: new VaultCardEngine({ configurationPath }) };
}

test("configures a writable vault, warns without Obsidian, and handles a missing cards directory", async (context) => {
  const { engine, vault, configurationPath } = await fixture(context);
  assert.deepEqual(await engine.getConfiguration(), { configured: false, warnings: [] });

  const configured = await engine.configureVault({ vaultPath: vault });
  assert.equal(configured.configuration.cardsDirectory, "Patchouli");
  assert.equal(configured.warnings[0].code, "OBSIDIAN_DIRECTORY_MISSING");
  assert.deepEqual(await engine.scanCards(), []);

  const persisted = JSON.parse(await readFile(configurationPath, "utf8"));
  assert.equal(persisted.vaultPath, configured.configuration.vaultPath);
  assert.equal(persisted.cardsDirectory, "Patchouli");
});

test("replaces the single active vault configuration atomically", async (context) => {
  const { engine, root, vault, configurationPath } = await fixture(context);
  const secondVault = path.join(root, "second-vault");
  await mkdir(secondVault);
  await engine.configureVault({ vaultPath: vault });
  const second = await engine.configureVault({ vaultPath: secondVault, cardsDirectory: "Cards" });

  assert.equal(second.configuration.vaultPath, secondVault);
  assert.equal((await engine.getConfiguration()).configuration.vaultPath, secondVault);
  assert.deepEqual(JSON.parse(await readFile(configurationPath, "utf8")), {
    vaultPath: secondVault,
    cardsDirectory: "Cards",
  });
});

test("writes, scans, searches, categorizes, and reads a temporary-vault card", async (context) => {
  const { engine, vault } = await fixture(context, true);
  const configured = await engine.configureVault({ vaultPath: vault, cardsDirectory: "Knowledge/Patchouli" });
  assert.deepEqual(configured.warnings, []);

  const saved = await engine.writeCard(draft(), {
    id: "22222222-2222-4222-8222-222222222222",
    createdAt: "2026-08-29T02:30:00-04:00",
  });
  assert.equal(saved.card.cardRef, "Knowledge/Patchouli/Integration Card.md");
  assert.match(await readFile(saved.absolutePath, "utf8"), /Atomic local Markdown storage/u);
  assert.equal((await engine.scanCards()).length, 1);
  assert.equal((await engine.searchCards("durable database"))[0].title, "Integration Card");
  assert.deepEqual(await engine.listCategories(), [
    { name: "Local", count: 1 },
    { name: "Testing", count: 1 },
  ]);
  assert.equal((await engine.getCard(saved.card.cardRef)).id, "22222222-2222-4222-8222-222222222222");
  assert.equal(engine.index.cards.length, 1);
});

test("rejects duplicate titles and leaves the existing card unchanged", async (context) => {
  const { engine, vault } = await fixture(context);
  await engine.configureVault({ vaultPath: vault });
  const first = await engine.writeCard(draft("Collision"));
  const original = await readFile(first.absolutePath, "utf8");

  await assert.rejects(engine.writeCard(draft("Collision")), (error) => {
    assert.ok(error instanceof PatchouliError);
    assert.equal(error.code, "COLLISION");
    return true;
  });
  assert.equal(await readFile(first.absolutePath, "utf8"), original);
});

test("prevents a collision race without replacing the competing file", async (context) => {
  const { engine, vault } = await fixture(context);
  await engine.configureVault({ vaultPath: vault });
  let destination;
  await assert.rejects(
    engine.writeCard(draft("Race"), {
      atomicOperations: {
        async promote(temporaryPath, destinationPath) {
          destination = destinationPath;
          await writeFile(destinationPath, "competitor", { flag: "wx" });
          await link(temporaryPath, destinationPath);
        },
      },
    }),
    (error) => {
      assert.ok(error instanceof PatchouliError);
      assert.equal(error.code, "COLLISION");
      return true;
    },
  );
  assert.equal(await readFile(destination, "utf8"), "competitor");
});

test("cleans up temporary files after an atomic promotion failure", async (context) => {
  const { engine, vault } = await fixture(context);
  await engine.configureVault({ vaultPath: vault });
  await assert.rejects(
    engine.writeCard(draft("Failure"), {
      atomicOperations: {
        async promote() {
          const error = new Error("simulated promotion failure");
          error.code = "EIO";
          throw error;
        },
      },
    }),
    (error) => {
      assert.ok(error instanceof PatchouliError);
      assert.equal(error.code, "IO_ERROR");
      return true;
    },
  );
  const cardsDirectory = path.join(vault, "Patchouli");
  assert.deepEqual(await readdir(cardsDirectory), []);
});

test("rejects traversal, absolute card directories, missing vaults, and symlink escape", async (context) => {
  const { root, engine, vault } = await fixture(context);
  for (const cardsDirectory of ["../outside", "C:\\outside"]) {
    await assert.rejects(engine.configureVault({ vaultPath: vault, cardsDirectory }), PatchouliError);
  }
  await assert.rejects(
    engine.configureVault({ vaultPath: path.join(root, "missing") }),
    PatchouliError,
  );

  await writeFile(path.join(vault, "not-a-directory"), "file");
  await assert.rejects(
    engine.configureVault({ vaultPath: vault, cardsDirectory: "not-a-directory" }),
    (error) => {
      assert.ok(error instanceof PatchouliError);
      assert.equal(error.code, "VALIDATION_ERROR");
      return true;
    },
  );

  const outside = path.join(root, "outside");
  await mkdir(outside);
  await symlink(outside, path.join(vault, "escape"), "junction");
  await assert.rejects(
    engine.configureVault({ vaultPath: vault, cardsDirectory: "escape" }),
    (error) => {
      assert.ok(error instanceof PatchouliError);
      assert.equal(error.code, "PATH_ESCAPE");
      return true;
    },
  );
});
