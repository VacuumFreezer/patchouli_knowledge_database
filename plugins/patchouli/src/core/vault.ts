import * as fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import {
  extractCardUpdatePreservation,
  normalizeCardDraft,
  parseCard,
  renderCard,
} from "./cards.js";
import { ConfigurationStore } from "./configuration.js";
import { PatchouliError, isNodeError } from "./errors.js";
import {
  ensureContainedDirectory,
  isPathInside,
  normalizeRelativePath,
  resolveContainedPath,
  toPosixRelativePath,
} from "./paths.js";
import { CardIndex, listCategories } from "./search.js";
import type {
  CardDraft,
  ConfigurationStatus,
  DraftInspection,
  ParsedCard,
  SavedCard,
  SearchOptions,
  SearchResult,
  UpdateInspection,
  VaultConfiguration,
} from "./types.js";

export interface AtomicCreateOperations {
  promote(temporaryPath: string, destinationPath: string): Promise<void>;
}

export interface AtomicReplaceOperations {
  promote(temporaryPath: string, destinationPath: string): Promise<void>;
}

const defaultAtomicCreateOperations: AtomicCreateOperations = {
  async promote(temporaryPath, destinationPath) {
    await fs.link(temporaryPath, destinationPath);
  },
};

const defaultAtomicReplaceOperations: AtomicReplaceOperations = {
  async promote(temporaryPath, destinationPath) {
    await fs.rename(temporaryPath, destinationPath);
  },
};

export async function atomicCreateFile(
  destinationPath: string,
  contents: string,
  operations: AtomicCreateOperations = defaultAtomicCreateOperations,
): Promise<void> {
  const directory = path.dirname(destinationPath);
  const temporaryPath = path.join(directory, `.patchouli-${randomUUID()}.tmp`);
  let handle: fs.FileHandle | undefined;
  let promoted = false;
  try {
    handle = await fs.open(temporaryPath, "wx", 0o600);
    await handle.writeFile(contents, "utf8");
    await handle.sync();
    await handle.close();
    handle = undefined;
    await operations.promote(temporaryPath, destinationPath);
    promoted = true;
  } catch (error: unknown) {
    if (isNodeError(error) && error.code === "EEXIST") {
      throw new PatchouliError("COLLISION", "A card with this title-derived filename already exists.", {
        destinationPath,
      }, { cause: error });
    }
    if (error instanceof PatchouliError) throw error;
    throw new PatchouliError("IO_ERROR", "The card could not be written atomically.", {
      destinationPath,
    }, { cause: error });
  } finally {
    await handle?.close().catch(() => undefined);
    await fs.unlink(temporaryPath).catch((error: unknown) => {
      if (!promoted && (!isNodeError(error) || error.code !== "ENOENT")) throw error;
    });
  }
}

export async function atomicReplaceFile(
  destinationPath: string,
  contents: string,
  operations: AtomicReplaceOperations = defaultAtomicReplaceOperations,
): Promise<void> {
  const directory = path.dirname(destinationPath);
  const temporaryPath = path.join(directory, `.patchouli-${randomUUID()}.tmp`);
  let handle: fs.FileHandle | undefined;
  try {
    handle = await fs.open(temporaryPath, "wx", 0o600);
    await handle.writeFile(contents, "utf8");
    await handle.sync();
    await handle.close();
    handle = undefined;
    await operations.promote(temporaryPath, destinationPath);
  } catch (error: unknown) {
    throw new PatchouliError("IO_ERROR", "The card update could not be committed atomically.", {
      destinationPath,
    }, { cause: error });
  } finally {
    await handle?.close().catch(() => undefined);
    await fs.unlink(temporaryPath).catch(() => undefined);
  }
}

export const LEGACY_PATCHOULI_SNIPPET = `/* Patchouli card presentation v2 — scoped to generated cards. */
.patchouli-card .metadata-container,
.patchouli-card .inline-title { display: none !important; }
`;

/** Keep note text portable; theme variables provide contrast in both light and dark themes. */
export const V21_PATCHOULI_SNIPPET = `/* Patchouli card presentation v2.1 — scoped to generated cards. */
.patchouli-card .metadata-container,
.patchouli-card .inline-title { display: none !important; }
.patchouli-card {
  --patchouli-rule: var(--background-modifier-border);
  --patchouli-accent: var(--text-accent);
}
.patchouli-card :is(h1, h2, h3, h4, h5, h6) {
  overflow-wrap: anywhere;
  line-height: 1.45;
}
.patchouli-card h1 {
  padding-bottom: .6em;
  border-bottom: 3px double var(--patchouli-rule);
}
/* Section bars: a strong boundary even without color perception. */
.patchouli-card h2,
.patchouli-card .cm-line.HyperMD-header-2 {
  margin-top: 1.8em;
  margin-bottom: .8em;
  padding: .45em .7em;
  border: 1px solid var(--patchouli-rule);
  border-inline-start: 5px solid var(--patchouli-accent);
  border-radius: 5px;
  background: var(--background-secondary);
  color: var(--text-normal);
  font-size: 1.2em;
  font-weight: 700;
}
.patchouli-card h2[data-heading="Core"] {
  border-inline-start-width: 7px;
  background: color-mix(in srgb, var(--patchouli-accent) 10%, var(--background-primary));
}
.patchouli-card h2[data-heading="FYI"] {
  border-style: dashed;
  border-inline-start: 5px double var(--text-muted);
}
/* Concepts: an underline; nested detail: a progressively lighter side rule. */
.patchouli-card h3,
.patchouli-card .cm-line.HyperMD-header-3 {
  margin-top: 1.5em;
  margin-bottom: .6em;
  padding-bottom: .3em;
  border-bottom: 2px solid var(--patchouli-rule);
  color: var(--text-normal);
  font-size: 1.1em;
  font-weight: 650;
}
.patchouli-card h4,
.patchouli-card .cm-line.HyperMD-header-4 {
  margin-top: 1.2em;
  padding-inline-start: .65em;
  border-inline-start: 3px solid var(--patchouli-accent);
  font-size: 1em;
}
.patchouli-card h5,
.patchouli-card .cm-line.HyperMD-header-5 {
  margin-top: 1.1em;
  padding-inline-start: .65em;
  border-inline-start: 2px dashed var(--text-muted);
  font-size: 1em;
}
.patchouli-card h6,
.patchouli-card .cm-line.HyperMD-header-6 {
  margin-top: 1em;
  padding-inline-start: .65em;
  border-inline-start: 2px dotted var(--text-muted);
  font-size: 1em;
}
/* Editor spans must inherit the line hierarchy rather than the theme's sizes. */
.patchouli-card .cm-line :is(.cm-header-2, .cm-header-3, .cm-header-4, .cm-header-5, .cm-header-6) {
  font-size: inherit;
  color: var(--text-normal);
}
@media print {
  .patchouli-card h2 { background: transparent; border-color: currentColor; }
  .patchouli-card :is(h1, h2, h3, h4, h5, h6) { break-after: avoid; }
}
`;

export const PATCHOULI_SNIPPET = V21_PATCHOULI_SNIPPET + `
/* Small title badge: embedded so vaults need no extra image attachments. */
.patchouli-card h1,
.patchouli-card .cm-line.HyperMD-header-1 {
  padding-inline-start: 24px;
  background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAYCAYAAAAlBadpAAAEgUlEQVR42nVUa0yTZxR+3u/7Wtra8tFagQKtFEGKQDapc7qo3RxhmkmMF3Auuok/9IfRLc65H2arzP1Y9muLc1mc2cXEbaHRzGii8xYZ8+68USxyERi0XAuUllv7fe/ZD5yZl51fJyfnec6TnHMeYCoYEQmP8sIdJSW1rwIeAGD4/xABCOQlxl5jvHrpqopK9xsHM1K1JUUvzCtTxfw8Ccn+gVhX5Pk8UyXpm7INZ/t+/4uGztfT/vXrlRPVX9HXb39KdlPBewDggUd6GiotM2dm6RLq7sUFxaX3Lt2hq80t1NNuFxs644pOGKckHh4AgFTU0tNgIaGqL5fmLdh+5kGrcuDQUTTUcwE6PcLhZkxoLRqD3jILAPo8nmdki45pzuj45LDlWGPANN1gmx5K9PAMU5heybMKv1w+eWdAGdkTmxyOVHVUPTu5dtDf9WPwXpVeb4sPKwrSWTLWrVhKb761nOXKls7eyN9t8IIBeAYsETizwmBLEpMzR9UJmHQvsqM/nxM61ROkGopKob2btxd7WwEIjwgekwgMjNKMlDPHkZ+SFB8lJdbMbsR06BoK8ww2ZFidbS+vrq7mNRU10tPTBQBIS124XDbItGNtmTp36Txo9TI2L3qdaeMjfJBn7gKMcyp9lXEAuidkAxCsKfkeLRtjo8lmNjOWQLIuiP72sJA+167aZ8+3Oe8XHcjPndF068rV9Jpa30oiYowxYjKSsret3nuLTTLz6Yu/0sfvvMscRfn4/rsvcbM3AJ1R5larXdBqGG43B5Y0drfV0ZRiLhU7nEX2GUZzQ0OQW9KcwumbV2D238C9bj9Mei31hPupLdgbHYvzj/qVcF0FKkQffCoAiDOgMRqZqUogVUqZpgfXc+hZD6JjY+gdjCDdYmOVC8tGCs2Gs3Wdrf4ACyj/HjUDIJQ73BdGJycLNaIgT4Ak32cf8FiJW7xw6Ah0MYIztxiRkQSarp869f7F8+uIBmKMMYgAKCkRqR8ZDl4JicoJtyVzTWwoIpSuKoc1cyZcK5ZAdtpInpWTSJPTXWP+y9E1O7fXeT0eSQSAvkSiewBomGcvTCNRfCnwsONa7O792VyNk5zjZFqRmKjXIfiHH+GOdrGuv+3wxU3tU3t2w60BIBBRSpx4+8lgffnW4z9tCLQ85EmixDtvNyJwsIZpNKrgdBU4AEjiPpELAJCDHA6AKwlSJVGSAGDf8pUFGz/cJuoGQiQpE7Asmc9SXdkwZmXYrUA2J8KjB/cBADSkCN1dofFD3s93Vm2q3NPd2avKiVHRak8Fd+Uxm1GvGs2qdu2xmYu/7eponvKtigqAMfBYxJGRZZuzZuPaLyLR8fhEexszLlrMVa2ei7GoKskmSrWno3LX7k8AGAUA8Pl8KnHOBtXhH0RX3uaOQEt39EGLlmskAeFhYTIYEmRFESOhXum346dCjT191wHwJ9yBMQYiwkp3afGihQuWnTt25PaWLVu9E0Nhx2A0dqmpqfXw/j/PXAMw9Dw3ZV6vV/hvwWV12XL1lqzHDQIDETEA+AeMO/Wdtz7KmgAAAABJRU5ErkJggg==");
  background-repeat: no-repeat;
  background-position: left .2em;
  background-size: 15px 24px;
}
`;

const presentationLocks = new Map<string, Promise<void>>();

/** Install only in an existing Obsidian vault, never change global title/property preferences. */
export async function ensureCardPresentation(vaultPath: string): Promise<void> {
  const previous = presentationLocks.get(vaultPath) ?? Promise.resolve();
  const pending = previous.catch(() => undefined).then(async () => {
    try {
      await resolveContainedPath(vaultPath, ".obsidian", { mustExist: true });
    } catch (error: unknown) {
      if ((isNodeError(error) && error.code === "ENOENT") || (error instanceof PatchouliError && error.code === "NOT_FOUND")) return;
      throw error;
    }
    const snippets = await ensureContainedDirectory(vaultPath, ".obsidian/snippets");
    const snippetPath = await resolveContainedPath(vaultPath, ".obsidian/snippets/patchouli-cards-v2.css");
    let snippet: string | undefined;
    try { snippet = await fs.readFile(snippetPath, "utf8"); }
    catch (error: unknown) { if (!isNodeError(error) || error.code !== "ENOENT") throw error; }
    if (snippet !== undefined && snippet !== PATCHOULI_SNIPPET && snippet !== LEGACY_PATCHOULI_SNIPPET && snippet !== V21_PATCHOULI_SNIPPET) {
      throw new PatchouliError("COLLISION", "The Patchouli display snippet already contains different content; preserve it and resolve the filename conflict before saving.", { snippetPath });
    }
    if (snippet === undefined) await atomicCreateFile(path.join(snippets, "patchouli-cards-v2.css"), PATCHOULI_SNIPPET);
    else if (snippet === LEGACY_PATCHOULI_SNIPPET || snippet === V21_PATCHOULI_SNIPPET) {
      if (await fs.readFile(snippetPath, "utf8") !== snippet) throw new PatchouliError("REVISION_CONFLICT", "The display snippet changed during upgrade. Retry to preserve the latest content.");
      await atomicReplaceFile(snippetPath, PATCHOULI_SNIPPET);
    }
    const appearancePath = await resolveContainedPath(vaultPath, ".obsidian/appearance.json");
    let original: string | undefined;
    try { original = await fs.readFile(appearancePath, "utf8"); }
    catch (error: unknown) { if (!isNodeError(error) || error.code !== "ENOENT") throw error; }
    let appearance: Record<string, unknown>;
    try {
      const parsed: unknown = original === undefined ? {} : JSON.parse(original);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("object required");
      appearance = parsed as Record<string, unknown>;
      if (appearance.enabledCssSnippets !== undefined && (!Array.isArray(appearance.enabledCssSnippets) || appearance.enabledCssSnippets.some((item: unknown) => typeof item !== "string"))) throw new Error("snippet list required");
    } catch {
      throw new PatchouliError("CONFIGURATION_INVALID", "Obsidian appearance.json is invalid; it was not replaced.", { appearancePath });
    }
    const enabled = (appearance.enabledCssSnippets ?? []) as string[];
    if (enabled.includes("patchouli-cards-v2")) return;
    const contents = `${JSON.stringify({ ...appearance, enabledCssSnippets: [...enabled, "patchouli-cards-v2"] }, null, 2)}\n`;
    if (original === undefined) await atomicCreateFile(appearancePath, contents);
    else {
      if (await fs.readFile(appearancePath, "utf8") !== original) throw new PatchouliError("REVISION_CONFLICT", "Obsidian appearance settings changed. Retry to preserve the latest settings.");
      await atomicReplaceFile(appearancePath, contents);
    }
  });
  presentationLocks.set(vaultPath, pending);
  try { await pending; }
  finally { if (presentationLocks.get(vaultPath) === pending) presentationLocks.delete(vaultPath); }
}

async function scanDirectory(
  directory: string,
  vaultRoot: string,
  cards: ParsedCard[],
): Promise<void> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name, "en-US"));

  for (const entry of entries) {
    const candidate = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      const resolved = await fs.realpath(candidate);
      if (!isPathInside(vaultRoot, resolved)) {
        throw new PatchouliError("PATH_ESCAPE", "A cards subdirectory resolves outside the vault.", {
          candidate,
          resolved,
        });
      }
      await scanDirectory(resolved, vaultRoot, cards);
    } else if (entry.isFile() && entry.name.toLocaleLowerCase("en-US").endsWith(".md")) {
      const resolved = await fs.realpath(candidate);
      if (!isPathInside(vaultRoot, resolved)) {
        throw new PatchouliError("PATH_ESCAPE", "A card resolves outside the vault.", {
          candidate,
          resolved,
        });
      }
      const markdown = await fs.readFile(resolved, "utf8");
      cards.push(parseCard(markdown, toPosixRelativePath(vaultRoot, resolved)));
    }
  }
}

export class VaultCardEngine {
  readonly configurationStore: ConfigurationStore;
  #index = new CardIndex([]);

  constructor(options: { configurationPath?: string } = {}) {
    this.configurationStore = new ConfigurationStore(options.configurationPath);
  }

  get index(): CardIndex {
    return this.#index;
  }

  async getConfiguration(): Promise<ConfigurationStatus> {
    return this.configurationStore.getStatus();
  }

  async configureVault(input: { vaultPath: string; cardsDirectory?: string }): Promise<ConfigurationStatus> {
    const status = await this.configurationStore.configure(input);
    if (status.configuration) await ensureCardPresentation(status.configuration.vaultPath);
    this.#index = new CardIndex([]);
    return status;
  }

  async scanCards(): Promise<ParsedCard[]> {
    const configuration = await this.configurationStore.requireConfiguration();
    const cardsDirectory = await resolveContainedPath(
      configuration.vaultPath,
      configuration.cardsDirectory,
      { fieldName: "cardsDirectory" },
    );
    try {
      const stats = await fs.stat(cardsDirectory);
      if (!stats.isDirectory()) {
        throw new PatchouliError("CONFIGURATION_INVALID", "The configured cardsDirectory is not a directory.", {
          cardsDirectory,
        });
      }
    } catch (error: unknown) {
      if (isNodeError(error) && error.code === "ENOENT") {
        this.#index = new CardIndex([]);
        return [];
      }
      throw error;
    }

    const cards: ParsedCard[] = [];
    await scanDirectory(cardsDirectory, configuration.vaultPath, cards);
    cards.sort((left, right) => left.cardRef.localeCompare(right.cardRef, "en-US"));
    this.#index = new CardIndex(cards);
    return cards;
  }

  async searchCards(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    await this.scanCards();
    return this.#index.search(query, options);
  }

  async listCategories(): Promise<Array<{ name: string; count: number }>> {
    const cards = await this.scanCards();
    return listCategories(cards);
  }

  async getCard(cardRef: string): Promise<ParsedCard> {
    const configuration = await this.configurationStore.requireConfiguration();
    const normalizedRef = normalizeRelativePath(cardRef, "cardRef");
    const cardsRoot = await resolveContainedPath(configuration.vaultPath, configuration.cardsDirectory, {
      fieldName: "cardsDirectory", mustExist: true,
    });
    const resolved = await resolveContainedPath(configuration.vaultPath, normalizedRef, {
      fieldName: "cardRef",
      mustExist: true,
    });
    if (!isPathInside(cardsRoot, resolved)) {
      throw new PatchouliError("PATH_ESCAPE", "cardRef must remain inside the configured cardsDirectory.", { cardRef });
    }
    const stats = await fs.stat(resolved);
    if (!stats.isFile() || !resolved.toLocaleLowerCase("en-US").endsWith(".md")) {
      throw new PatchouliError("NOT_FOUND", "cardRef does not identify a Markdown card.", { cardRef });
    }
    return parseCard(await fs.readFile(resolved, "utf8"), toPosixRelativePath(configuration.vaultPath, resolved));
  }

  async inspectDraft(draft: CardDraft): Promise<DraftInspection> {
    const configuration = await this.configurationStore.requireConfiguration();
    const normalizedDraft = normalizeCardDraft(draft);
    const cardRef = [configuration.cardsDirectory, normalizedDraft.filename].join("/");
    const destinationPath = await resolveContainedPath(configuration.vaultPath, cardRef, {
      fieldName: "draft.title",
    });
    let exists = false;
    try {
      await fs.lstat(destinationPath);
      exists = true;
    } catch (error: unknown) {
      if (!isNodeError(error) || error.code !== "ENOENT") throw error;
    }
    return {
      draft: normalizedDraft,
      collision: { exists, cardRef },
    };
  }

  async inspectCardUpdate(cardRef: string, expectedRevision: string, draft: CardDraft): Promise<UpdateInspection> {
    const configuration = await this.configurationStore.requireConfiguration();
    const target = await this.getCard(cardRef);
    if (target.revision !== expectedRevision) {
      throw new PatchouliError(
        "REVISION_CONFLICT",
        "The card changed after it was read. Reload it and prepare the update again.",
        { cardRef: target.cardRef, expectedRevision, actualRevision: target.revision },
      );
    }
    const normalizedDraft = normalizeCardDraft(draft);
    const derivedDestinationRef = path.posix.join(path.posix.dirname(target.cardRef), normalizedDraft.filename);
    let destinationRef = derivedDestinationRef;
    const destinationPath = await resolveContainedPath(configuration.vaultPath, destinationRef, {
      fieldName: "draft.title",
    });
    let collision = false;
    if (destinationRef !== target.cardRef) {
      try {
        const destinationStats = await fs.stat(destinationPath);
        const targetPath = await resolveContainedPath(configuration.vaultPath, target.cardRef, { mustExist: true });
        const targetStats = await fs.stat(targetPath);
        // Preserve the current filename when the volume resolves a case/Unicode alias
        // to the same file. On case-sensitive volumes a distinct file is a collision.
        if (destinationStats.dev === targetStats.dev && destinationStats.ino === targetStats.ino) {
          destinationRef = target.cardRef;
        } else collision = true;
      } catch (error: unknown) {
        if (!isNodeError(error) || error.code !== "ENOENT") throw error;
      }
    }
    return {
      draft: normalizedDraft,
      target: {
        cardRef: target.cardRef,
        ...(target.id ? { id: target.id } : {}),
        title: target.title,
        revision: target.revision,
      },
      destination: {
        cardRef: destinationRef,
        renamed: destinationRef !== target.cardRef,
        collision,
      },
    };
  }

  async writeCard(
    draft: CardDraft,
    options: { id?: string; createdAt?: string; atomicOperations?: AtomicCreateOperations } = {},
  ): Promise<SavedCard> {
    const configuration: VaultConfiguration = await this.configurationStore.requireConfiguration();
    const cardsDirectory = await ensureContainedDirectory(
      configuration.vaultPath,
      configuration.cardsDirectory,
    );
    const rendered = renderCard(draft, { id: options.id, createdAt: options.createdAt });
    const destinationPath = path.join(cardsDirectory, rendered.draft.filename);
    if (!isPathInside(cardsDirectory, destinationPath)) {
      throw new PatchouliError("PATH_ESCAPE", "The derived card filename escapes cardsDirectory.", {
        filename: rendered.draft.filename,
      });
    }

    try {
      await fs.lstat(destinationPath);
      throw new PatchouliError("COLLISION", "A card with this title-derived filename already exists.", {
        filename: rendered.draft.filename,
      });
    } catch (error: unknown) {
      if (error instanceof PatchouliError) throw error;
      if (!isNodeError(error) || error.code !== "ENOENT") throw error;
    }

    await ensureCardPresentation(configuration.vaultPath);
    await atomicCreateFile(destinationPath, rendered.markdown, options.atomicOperations);
    const card = parseCard(
      rendered.markdown,
      toPosixRelativePath(configuration.vaultPath, destinationPath),
    );
    this.#index = new CardIndex([]);
    return { card, absolutePath: destinationPath };
  }

  async updateCard(
    cardRef: string,
    expectedRevision: string,
    draft: CardDraft,
    options: { atomicOperations?: AtomicReplaceOperations } = {},
  ): Promise<SavedCard> {
    const configuration = await this.configurationStore.requireConfiguration();
    const inspection = await this.inspectCardUpdate(cardRef, expectedRevision, draft);
    if (inspection.destination.collision) {
      throw new PatchouliError("COLLISION", "The updated title would overwrite another card.", {
        cardRef: inspection.destination.cardRef,
      });
    }
    const targetPath = await resolveContainedPath(configuration.vaultPath, inspection.target.cardRef, {
      fieldName: "cardRef",
      mustExist: true,
    });
    const currentMarkdown = await fs.readFile(targetPath, "utf8");
    const current = parseCard(currentMarkdown, inspection.target.cardRef);
    if (current.revision !== expectedRevision) {
      throw new PatchouliError(
        "REVISION_CONFLICT",
        "The card changed after preview. No update was written.",
        { cardRef: current.cardRef, expectedRevision, actualRevision: current.revision },
      );
    }
    const preservation = extractCardUpdatePreservation(currentMarkdown);
    const rendered = renderCard(inspection.draft, {
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
      ...preservation,
    });
    const destinationPath = await resolveContainedPath(configuration.vaultPath, inspection.destination.cardRef, {
      fieldName: "draft.title",
    });

    await ensureCardPresentation(configuration.vaultPath);
    if (!inspection.destination.renamed) {
      await atomicReplaceFile(targetPath, rendered.markdown, options.atomicOperations);
    } else {
      await atomicCreateFile(destinationPath, rendered.markdown);
      try {
        const latest = parseCard(await fs.readFile(targetPath, "utf8"), inspection.target.cardRef);
        if (latest.revision !== expectedRevision) {
          throw new PatchouliError(
            "REVISION_CONFLICT",
            "The card changed while its renamed update was being saved. No update was kept.",
            { cardRef: latest.cardRef, expectedRevision, actualRevision: latest.revision },
          );
        }
        await fs.unlink(targetPath);
      } catch (error: unknown) {
        await fs.unlink(destinationPath).catch(() => undefined);
        throw error;
      }
    }

    const card = parseCard(rendered.markdown, inspection.destination.cardRef);
    this.#index = new CardIndex([]);
    return {
      card,
      absolutePath: destinationPath,
      ...(inspection.destination.renamed ? { previousCardRef: inspection.target.cardRef } : {}),
    };
  }
}
