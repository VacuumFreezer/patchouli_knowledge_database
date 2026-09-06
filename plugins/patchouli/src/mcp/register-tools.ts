import path from "node:path";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { normalizeCardDraft } from "../core/cards.js";
import { PatchouliError } from "../core/errors.js";
import { sanitizeTitleToFilename } from "../core/paths.js";
import type { SavedCard } from "../core/types.js";
import type { VaultCardEngine } from "../core/vault.js";
import type { PendingPreviewStore } from "./pending-previews.js";
import {
  baseOutputShape,
  cardDraftSchema,
  configurationStatusSchema,
  linkCandidateSchema,
  normalizedCardDraftSchema,
  parsedCardSchema,
  searchResultSchema,
  toolErrorSchema,
} from "./schemas.js";

export const REVIEW_RESOURCE_URI = "ui://patchouli/review-card.html";

interface ToolContext {
  engine: VaultCardEngine;
  previews: PendingPreviewStore<SavedCard>;
}

interface StructuredError {
  code: string;
  message: string;
  details: Record<string, unknown>;
}

function asStructuredError(error: unknown): StructuredError {
  if (error instanceof PatchouliError) {
    return { code: error.code, message: error.message, details: { ...error.details } };
  }
  return {
    code: "INTERNAL_ERROR",
    message: "Patchouli encountered an unexpected local error.",
    details: {},
  };
}

function success(fields: Record<string, unknown>, text: string): CallToolResult {
  return {
    structuredContent: { ok: true, ...fields },
    content: [{ type: "text", text }],
  };
}

function failure(error: unknown): CallToolResult {
  const structured = asStructuredError(error);
  return {
    isError: true,
    structuredContent: { ok: false, error: structured },
    content: [{ type: "text", text: `Patchouli could not complete the request: ${structured.message}` }],
  };
}

async function safely(action: () => Promise<CallToolResult>): Promise<CallToolResult> {
  try {
    return await action();
  } catch (error: unknown) {
    return failure(error);
  }
}

function previewFallbackText(
  draft: ReturnType<typeof normalizeCardDraft>,
  collision: { exists: boolean; cardRef: string },
  expiresAt: string,
): string {
  const categories = draft.categories.length > 0 ? draft.categories.join(", ") : "None";
  const selected = draft.connections.filter((connection) => connection.selected);
  return [
    `Review Patchouli card “${draft.title}” (${draft.filename}).`,
    `Categories: ${categories}.`,
    `Summary:\n${draft.summaryMarkdown}`,
    `Detail:\n${draft.detailMarkdown}`,
    `Evidence items: ${draft.evidence.length}; sources: ${draft.sources.length}; selected connections: ${selected.length}.`,
    collision.exists
      ? `Collision: ${collision.cardRef} already exists. Edit the title and preview again before saving.`
      : `Destination is available: ${collision.cardRef}.`,
    `This preview expires at ${expiresAt}. Ask the user to confirm or revise it. Only after explicit confirmation, call save_card with the pending token and final reviewed draft.`,
  ].join("\n\n");
}

export function registerPatchouliTools(server: McpServer, context: ToolContext): void {
  const readAnnotations = {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  };

  server.registerTool(
    "get_configuration",
    {
      title: "Get Patchouli configuration",
      description: "Check whether a local Obsidian vault is configured and return any non-fatal warnings.",
      inputSchema: {},
      outputSchema: {
        ...baseOutputShape,
        status: configurationStatusSchema.optional(),
      },
      annotations: readAnnotations,
    },
    async () => safely(async () => {
      const status = await context.engine.getConfiguration();
      return success(
        { status },
        status.configured
          ? `Patchouli uses ${status.configuration?.vaultPath} with cards in ${status.configuration?.cardsDirectory}.`
          : "Patchouli does not have a configured vault.",
      );
    }),
  );

  server.registerTool(
    "configure_vault",
    {
      title: "Configure Patchouli vault",
      description: "Validate and persist one active local Obsidian vault and optional relative cards directory.",
      inputSchema: {
        vaultPath: z.string().trim().min(1),
        cardsDirectory: z.string().trim().min(1).optional(),
      },
      outputSchema: {
        ...baseOutputShape,
        status: configurationStatusSchema.optional(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (input) => safely(async () => {
      const status = await context.engine.configureVault(input);
      const warningText = status.warnings.length > 0
        ? ` Warning: ${status.warnings.map((warning) => warning.message).join(" ")}`
        : "";
      return success(
        { status },
        `Configured Patchouli at ${status.configuration?.vaultPath}/${status.configuration?.cardsDirectory}.${warningText}`,
      );
    }),
  );

  server.registerTool(
    "list_categories",
    {
      title: "List Patchouli categories",
      description: "List category names and card counts from the configured local Markdown vault.",
      inputSchema: {},
      outputSchema: {
        ...baseOutputShape,
        categories: z.array(z.object({ name: z.string(), count: z.number().int().nonnegative() })).optional(),
      },
      annotations: readAnnotations,
    },
    async () => safely(async () => {
      const categories = await context.engine.listCategories();
      return success(
        { categories },
        categories.length > 0
          ? `Found ${categories.length} Patchouli categories.`
          : "No Patchouli categories were found.",
      );
    }),
  );

  server.registerTool(
    "search_cards",
    {
      title: "Search Patchouli cards",
      description: "Search local card titles, categories, and bodies with deterministic lexical ranking.",
      inputSchema: {
        query: z.string().trim().min(1).max(2_000),
        categories: z.array(z.string().trim().min(1).max(2_000)).max(32).optional(),
        limit: z.number().int().min(1).max(100).optional(),
      },
      outputSchema: {
        ...baseOutputShape,
        results: z.array(searchResultSchema).optional(),
      },
      annotations: readAnnotations,
    },
    async ({ query, categories, limit }) => safely(async () => {
      const results = await context.engine.searchCards(query, { categories, limit });
      return success(
        { results },
        results.length > 0
          ? `Found ${results.length} matching Patchouli cards: ${results.map((result) => `[[${path.posix.basename(result.cardRef, ".md")}|${result.title}]]`).join(", ")}.`
          : "No Patchouli cards matched the query.",
      );
    }),
  );

  server.registerTool(
    "get_card",
    {
      title: "Get Patchouli card",
      description: "Read one card by its vault-relative reference and return parsed metadata, Markdown, and wikilinks.",
      inputSchema: {
        cardRef: z.string().trim().min(1).max(1_024),
      },
      outputSchema: {
        ...baseOutputShape,
        card: parsedCardSchema.optional(),
      },
      annotations: readAnnotations,
    },
    async ({ cardRef }) => safely(async () => {
      const card = await context.engine.getCard(cardRef);
      return success({ card }, `Loaded [[${path.posix.basename(card.cardRef, ".md")}|${card.title}]].`);
    }),
  );

  server.registerTool(
    "suggest_links",
    {
      title: "Suggest Patchouli links",
      description: "Return deterministic lexical card candidates and signals; the agent and user decide semantic relevance.",
      inputSchema: {
        title: z.string().trim().min(1).max(240),
        categories: z.array(z.string().trim().min(1).max(2_000)).max(32),
        summary: z.string().trim().min(1).max(50_000),
        detail: z.string().trim().min(1).max(50_000),
        limit: z.number().int().min(1).max(20).optional(),
      },
      outputSchema: {
        ...baseOutputShape,
        candidates: z.array(linkCandidateSchema).optional(),
      },
      annotations: readAnnotations,
    },
    async ({ title, categories, summary, detail, limit = 8 }) => safely(async () => {
      const filename = sanitizeTitleToFilename(title).toLocaleLowerCase("en-US");
      const query = [title, ...categories, summary, detail].join("\n");
      const candidates = (await context.engine.searchCards(query, { limit: Math.min(limit + 1, 100) }))
        .filter((candidate) => path.posix.basename(candidate.cardRef).toLocaleLowerCase("en-US") !== filename)
        .slice(0, limit)
        .map((candidate) => ({
          ...candidate,
          lexicalReason: `Matched ${candidate.matchedFields.join(", ")} with lexical score ${candidate.score}.`,
        }));
      return success(
        { candidates },
        candidates.length > 0
          ? `Found ${candidates.length} lexical link candidates. Judge semantic relevance before selecting any connection.`
          : "No lexical link candidates were found.",
      );
    }),
  );

  server.registerTool(
    "preview_card",
    {
      title: "Preview Patchouli card",
      description: "Normalize one draft, check its destination, issue an expiring review token, and show the optional editable review app.",
      inputSchema: {
        draft: cardDraftSchema,
      },
      outputSchema: {
        ...baseOutputShape,
        preview: z.object({
          draft: normalizedCardDraftSchema,
          collision: z.object({ exists: z.boolean(), cardRef: z.string() }),
          pendingToken: z.string(),
          expiresAt: z.string(),
          confirmationRequired: z.literal(true),
        }).optional(),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      _meta: {
        ui: { resourceUri: REVIEW_RESOURCE_URI },
        "openai/outputTemplate": REVIEW_RESOURCE_URI,
        "openai/toolInvocation/invoking": "Preparing card review…",
        "openai/toolInvocation/invoked": "Card ready for review.",
      },
    },
    async ({ draft }) => safely(async () => {
      const inspection = await context.engine.inspectDraft(draft);
      const pending = context.previews.issue();
      const preview = {
        ...inspection,
        ...pending,
        confirmationRequired: true as const,
      };
      return success(
        { preview },
        previewFallbackText(inspection.draft, inspection.collision, pending.expiresAt),
      );
    }),
  );

  server.registerTool(
    "save_card",
    {
      title: "Save reviewed Patchouli card",
      description: "After explicit user confirmation, atomically create the final reviewed card using its pending preview token.",
      inputSchema: {
        pendingToken: z.string().trim().min(1).max(128),
        draft: cardDraftSchema,
      },
      outputSchema: {
        ...baseOutputShape,
        card: parsedCardSchema.optional(),
        idempotentReplay: z.boolean().optional(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: {
        "openai/toolInvocation/invoking": "Saving reviewed card…",
        "openai/toolInvocation/invoked": "Reviewed card saved.",
      },
    },
    async ({ pendingToken, draft }) => safely(async () => {
      const normalizedDraft = normalizeCardDraft(draft);
      const resolution = await context.previews.save(
        pendingToken,
        normalizedDraft,
        () => context.engine.writeCard(normalizedDraft),
      );
      const { card } = resolution.value;
      return success(
        { card, idempotentReplay: resolution.idempotentReplay },
        resolution.idempotentReplay
          ? `The confirmed save was already completed as [[${path.posix.basename(card.cardRef, ".md")}|${card.title}]]; no duplicate was created.`
          : `Saved [[${path.posix.basename(card.cardRef, ".md")}|${card.title}]] to ${card.cardRef}.`,
      );
    }),
  );
}

export { toolErrorSchema };
