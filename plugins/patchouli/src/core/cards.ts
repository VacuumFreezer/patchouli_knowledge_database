import path from "node:path";
import { randomUUID } from "node:crypto";
import { parseDocument, stringify } from "yaml";

import { PatchouliError } from "./errors.js";
import { sanitizeTitleToFilename } from "./paths.js";
import type {
  CardDraft,
  CardLink,
  NormalizedCardDraft,
  ParsedCard,
  SourceDraft,
} from "./types.js";

function normalizeInline(value: string, field: string, allowEmpty = false): string {
  if (typeof value !== "string") {
    throw new PatchouliError("VALIDATION_ERROR", `${field} must be a string.`, { field });
  }
  const normalized = value.replace(/\s+/gu, " ").trim();
  if (!allowEmpty && normalized.length === 0) {
    throw new PatchouliError("VALIDATION_ERROR", `${field} must not be empty.`, { field });
  }
  return normalized;
}

function normalizeMarkdown(value: string, field: string, allowEmpty = false): string {
  if (typeof value !== "string") {
    throw new PatchouliError("VALIDATION_ERROR", `${field} must be a string.`, { field });
  }
  const normalized = value.trim();
  if (!allowEmpty && normalized.length === 0) {
    throw new PatchouliError("VALIDATION_ERROR", `${field} must not be empty.`, { field });
  }
  return normalized;
}

function uniqueTrimmed(values: string[], field: string): string[] {
  if (!Array.isArray(values)) {
    throw new PatchouliError("VALIDATION_ERROR", `${field} must be an array.`, { field });
  }
  const result: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const normalized = normalizeInline(value, field, true);
    if (normalized.length > 0 && !seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }
  return result;
}

function normalizeSource(source: SourceDraft, index: number): SourceDraft {
  const normalized: SourceDraft = {
    type: normalizeInline(source.type, `sources[${index}].type`),
    label: normalizeInline(source.label, `sources[${index}].label`),
  };
  if (source.url !== undefined && source.url.trim().length > 0) {
    let parsed: URL;
    try {
      parsed = new URL(source.url);
    } catch (error: unknown) {
      throw new PatchouliError("VALIDATION_ERROR", `sources[${index}].url must be a valid URL.`, {
        field: `sources[${index}].url`,
      }, { cause: error });
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new PatchouliError("VALIDATION_ERROR", `sources[${index}].url must use http or https.`, {
        field: `sources[${index}].url`,
      });
    }
    normalized.url = parsed.toString();
  }
  return normalized;
}

export function normalizeCardDraft(draft: CardDraft): NormalizedCardDraft {
  if (typeof draft !== "object" || draft === null) {
    throw new PatchouliError("VALIDATION_ERROR", "draft must be an object.", { field: "draft" });
  }
  const title = normalizeInline(draft.title, "title");
  const categories = uniqueTrimmed(draft.categories, "categories");
  const evidence = draft.evidence.map((item, index) => ({
    claim: normalizeInline(item.claim, `evidence[${index}].claim`),
    sourceReference: normalizeInline(item.sourceReference, `evidence[${index}].sourceReference`),
  }));
  const sources = draft.sources.map(normalizeSource);
  const connections = draft.connections.map((item, index) => ({
    cardRef: normalizeInline(item.cardRef, `connections[${index}].cardRef`),
    title: normalizeInline(item.title, `connections[${index}].title`),
    reason: normalizeInline(item.reason, `connections[${index}].reason`),
    selected: Boolean(item.selected),
  }));

  return {
    title,
    filename: sanitizeTitleToFilename(title),
    categories,
    annotation: normalizeMarkdown(draft.annotation, "annotation", true),
    summaryMarkdown: normalizeMarkdown(draft.summaryMarkdown, "summaryMarkdown"),
    understandingMarkdown: normalizeMarkdown(draft.understandingMarkdown, "understandingMarkdown"),
    evidence,
    sources,
    connections,
  };
}

function escapeMarkdownLabel(value: string): string {
  return value.replace(/([\\\[\]])/gu, "\\$1");
}

function safeWikiValue(value: string): string {
  return value.replace(/[\[\]|\r\n]+/gu, "-").trim();
}

function renderSources(sources: SourceDraft[]): string {
  if (sources.length === 0) return "_None._";
  return sources
    .map((source) => {
      const prefix = `${source.type}: `;
      return source.url
        ? `- ${prefix}[${escapeMarkdownLabel(source.label)}](${source.url})`
        : `- ${prefix}${source.label}`;
    })
    .join("\n");
}

export function renderCard(
  draft: CardDraft,
  options: { id?: string; createdAt?: string } = {},
): { markdown: string; draft: NormalizedCardDraft; id: string; createdAt: string } {
  const normalized = normalizeCardDraft(draft);
  const id = options.id ?? randomUUID();
  const createdAt = options.createdAt ?? new Date().toISOString();
  if (Number.isNaN(Date.parse(createdAt))) {
    throw new PatchouliError("VALIDATION_ERROR", "createdAt must be an ISO-8601 timestamp.", {
      field: "createdAt",
    });
  }

  const sourceTypes = uniqueTrimmed(normalized.sources.map((source) => source.type), "sourceTypes");
  const frontmatter = stringify(
    {
      id,
      title: normalized.title,
      categories: normalized.categories,
      created_at: createdAt,
      source_types: sourceTypes,
    },
    {
      defaultStringType: "QUOTE_DOUBLE",
      doubleQuotedAsJSON: true,
      lineWidth: 0,
    },
  ).trimEnd();

  const evidence = normalized.evidence.length === 0
    ? "_None._"
    : normalized.evidence
      .map((item) => `- ${item.claim} — ${item.sourceReference}`)
      .join("\n");
  const selectedConnections = normalized.connections.filter((connection) => connection.selected);
  const connections = selectedConnections.length === 0
    ? "_None._"
    : selectedConnections.map((connection) => {
      const normalizedRef = connection.cardRef.replace(/\\/gu, "/");
      const filename = path.posix.basename(normalizedRef).replace(/\.md$/iu, "");
      return `- [[${safeWikiValue(filename)}|${safeWikiValue(connection.title)}]] — ${connection.reason}`;
    }).join("\n");

  const markdown = [
    "---",
    frontmatter,
    "---",
    "",
    `# ${normalized.title}`,
    "",
    "## Summary",
    "",
    normalized.summaryMarkdown,
    "",
    "## My Understanding",
    "",
    normalized.understandingMarkdown,
    "",
    "## Evidence",
    "",
    evidence,
    "",
    "## Connections",
    "",
    connections,
    "",
    "## Annotations",
    "",
    normalized.annotation || "_None._",
    "",
    "## Sources",
    "",
    renderSources(normalized.sources),
    "",
  ].join("\n");

  return { markdown, draft: normalized, id, createdAt };
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string | number | boolean => ["string", "number", "boolean"].includes(typeof item))
      .map((item) => String(item).trim())
      .filter(Boolean);
  }
  if (["string", "number", "boolean"].includes(typeof value)) {
    const normalized = String(value).trim();
    return normalized ? [normalized] : [];
  }
  return [];
}

function splitFrontmatter(markdown: string): {
  frontmatter?: string;
  body: string;
  warnings: string[];
} {
  const source = markdown.replace(/^\uFEFF/u, "");
  const lines = source.split(/\r?\n/u);
  if (lines[0]?.trim() !== "---") return { body: source, warnings: [] };
  const closingIndex = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
  if (closingIndex < 0) {
    return {
      body: source,
      warnings: ["Frontmatter opening delimiter has no closing delimiter."],
    };
  }
  return {
    frontmatter: lines.slice(1, closingIndex).join("\n"),
    body: lines.slice(closingIndex + 1).join("\n").replace(/^\s*\n/u, ""),
    warnings: [],
  };
}

function markdownToText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/gu, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/gu, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, "$1")
    .replace(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/gu, "$2 $1")
    .replace(/<[^>]+>/gu, " ")
    .replace(/[#>*_`~\-]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function extractLinks(markdown: string): CardLink[] {
  const links: CardLink[] = [];
  const seen = new Set<string>();
  const pattern = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/gu;
  for (const match of markdown.matchAll(pattern)) {
    const cardRef = match[1].trim();
    const title = match[2]?.trim();
    const key = `${cardRef}\u0000${title ?? ""}`;
    if (!seen.has(key)) {
      seen.add(key);
      links.push({ cardRef, ...(title ? { title } : {}) });
    }
  }
  return links;
}

export function parseCard(markdown: string, cardRef: string): ParsedCard {
  const split = splitFrontmatter(markdown);
  const warnings = [...split.warnings];
  let metadata: Record<string, unknown> = {};

  if (split.frontmatter !== undefined) {
    try {
      const document = parseDocument(split.frontmatter, {
        prettyErrors: false,
        strict: false,
        uniqueKeys: false,
      });
      warnings.push(...document.errors.map((error) => `Frontmatter: ${error.message}`));
      warnings.push(...document.warnings.map((warning) => `Frontmatter: ${warning.message}`));
      const parsed = document.toJS({ maxAliasCount: 20 });
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        metadata = parsed as Record<string, unknown>;
      } else if (parsed !== null) {
        warnings.push("Frontmatter is not a mapping.");
      }
    } catch (error: unknown) {
      warnings.push(`Frontmatter could not be parsed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const normalizedRef = cardRef.replace(/\\/gu, "/");
  const filename = path.posix.basename(normalizedRef);
  const heading = split.body.match(/^#\s+(.+)$/mu)?.[1]?.trim();
  const metadataTitle = typeof metadata.title === "string" ? metadata.title.trim() : "";
  const title = metadataTitle || heading || filename.replace(/\.md$/iu, "");
  const id = typeof metadata.id === "string" && metadata.id.trim() ? metadata.id.trim() : undefined;
  const createdAt = typeof metadata.created_at === "string" && metadata.created_at.trim()
    ? metadata.created_at.trim()
    : undefined;

  return {
    ...(id ? { id } : {}),
    title,
    categories: toStringArray(metadata.categories),
    ...(createdAt ? { createdAt } : {}),
    sourceTypes: toStringArray(metadata.source_types),
    markdown,
    bodyMarkdown: split.body,
    bodyText: markdownToText(split.body),
    links: extractLinks(split.body),
    cardRef: normalizedRef,
    filename,
    warnings,
  };
}
