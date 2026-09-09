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
    const cardsPrefix = `${configuration.cardsDirectory}/`.toLocaleLowerCase("en-US");
    const foldedRef = normalizedRef.toLocaleLowerCase("en-US");
    if (foldedRef !== configuration.cardsDirectory.toLocaleLowerCase("en-US") && !foldedRef.startsWith(cardsPrefix)) {
      throw new PatchouliError("PATH_ESCAPE", "cardRef must remain inside the configured cardsDirectory.", {
        cardRef,
      });
    }
    const resolved = await resolveContainedPath(configuration.vaultPath, normalizedRef, {
      fieldName: "cardRef",
      mustExist: true,
    });
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
    const destinationRef = derivedDestinationRef.toLocaleLowerCase("en-US") === target.cardRef.toLocaleLowerCase("en-US")
      ? target.cardRef
      : derivedDestinationRef;
    const destinationPath = await resolveContainedPath(configuration.vaultPath, destinationRef, {
      fieldName: "draft.title",
    });
    let collision = false;
    if (destinationRef.toLocaleLowerCase("en-US") !== target.cardRef.toLocaleLowerCase("en-US")) {
      try {
        await fs.lstat(destinationPath);
        collision = true;
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

    await atomicCreateFile(destinationPath, rendered.markdown, options.atomicOperations);
    const card = parseCard(
      rendered.markdown,
      toPosixRelativePath(configuration.vaultPath, destinationPath),
    );
    await this.scanCards();
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
    await this.scanCards();
    return {
      card,
      absolutePath: destinationPath,
      ...(inspection.destination.renamed ? { previousCardRef: inspection.target.cardRef } : {}),
    };
  }
}
