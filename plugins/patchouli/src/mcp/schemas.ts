import { z } from "zod";

const inlineText = z.string().max(2_000);
const requiredInlineText = inlineText.trim().min(1);
const markdown = z.string().max(50_000);
const requiredMarkdown = markdown.trim().min(1);

export const evidenceDraftSchema = z.strictObject({
  claim: requiredInlineText,
  sourceReference: requiredInlineText,
});

export const sourceDraftSchema = z.strictObject({
  type: requiredInlineText,
  label: requiredInlineText,
  url: z.string().trim().url().max(4_096).optional(),
});

export const connectionDraftSchema = z.strictObject({
  cardRef: z.string().trim().min(1).max(1_024),
  title: requiredInlineText,
  reason: requiredInlineText,
  selected: z.boolean(),
});

export const cardDraftSchema = z.strictObject({
  title: z.string().trim().min(1).max(240),
  categories: z.array(requiredInlineText).max(32),
  summaryMarkdown: requiredMarkdown,
  detailMarkdown: requiredMarkdown,
  evidence: z.array(evidenceDraftSchema).max(100),
  sources: z.array(sourceDraftSchema).max(100),
  connections: z.array(connectionDraftSchema).max(100),
});

export const normalizedCardDraftSchema = cardDraftSchema.extend({
  filename: z.string().min(1),
});

export const warningSchema = z.object({
  code: z.string(),
  message: z.string(),
});

export const configurationSchema = z.object({
  vaultPath: z.string(),
  cardsDirectory: z.string(),
});

export const configurationStatusSchema = z.object({
  configured: z.boolean(),
  configuration: configurationSchema.optional(),
  warnings: z.array(warningSchema),
});

export const cardLinkSchema = z.object({
  cardRef: z.string(),
  title: z.string().optional(),
});

export const parsedCardSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  categories: z.array(z.string()),
  createdAt: z.string().optional(),
  sourceTypes: z.array(z.string()),
  markdown: z.string(),
  bodyMarkdown: z.string(),
  bodyText: z.string(),
  links: z.array(cardLinkSchema),
  cardRef: z.string(),
  filename: z.string(),
  warnings: z.array(z.string()),
});

export const searchResultSchema = z.object({
  cardRef: z.string(),
  title: z.string(),
  categories: z.array(z.string()),
  score: z.number(),
  matchedFields: z.array(z.enum(["title", "category", "body"])),
  excerpt: z.string(),
});

export const linkCandidateSchema = searchResultSchema.extend({
  lexicalReason: z.string(),
});

export const toolErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.json()),
});

export const baseOutputShape = {
  ok: z.boolean(),
  error: toolErrorSchema.optional(),
};
