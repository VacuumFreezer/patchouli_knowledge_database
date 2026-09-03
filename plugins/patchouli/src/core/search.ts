import { PatchouliError } from "./errors.js";
import type { ParsedCard, SearchOptions, SearchResult } from "./types.js";

function fold(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US");
}

function tokenize(value: string): string[] {
  return Array.from(new Set(fold(value).match(/[\p{L}\p{N}]+/gu) ?? []));
}

function occurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let offset = 0;
  while ((offset = haystack.indexOf(needle, offset)) >= 0) {
    count += 1;
    offset += needle.length;
  }
  return count;
}

function excerpt(bodyText: string, queryTerms: string[]): string {
  if (bodyText.length <= 220) return bodyText;
  const folded = fold(bodyText);
  const positions = queryTerms
    .map((term) => folded.indexOf(term))
    .filter((position) => position >= 0);
  const center = positions.length > 0 ? Math.min(...positions) : 0;
  const start = Math.max(0, center - 70);
  const end = Math.min(bodyText.length, start + 220);
  return `${start > 0 ? "…" : ""}${bodyText.slice(start, end).trim()}${end < bodyText.length ? "…" : ""}`;
}

export class CardIndex {
  readonly cards: readonly ParsedCard[];

  constructor(cards: readonly ParsedCard[]) {
    this.cards = [...cards];
  }

  search(query: string, options: SearchOptions = {}): SearchResult[] {
    if (typeof query !== "string" || query.trim().length === 0) {
      throw new PatchouliError("VALIDATION_ERROR", "query must not be empty.", { field: "query" });
    }
    const limit = options.limit ?? 10;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new PatchouliError("VALIDATION_ERROR", "limit must be an integer from 1 through 100.", {
        field: "limit",
      });
    }

    const foldedQuery = fold(query.trim());
    const queryTerms = tokenize(foldedQuery);
    const categoryFilters = (options.categories ?? []).map((category) => fold(category.trim())).filter(Boolean);
    const results: SearchResult[] = [];

    for (const card of this.cards) {
      const title = fold(card.title);
      const categories = card.categories.map(fold);
      if (categoryFilters.length > 0 && !categoryFilters.some((filter) => categories.includes(filter))) continue;
      const body = fold(card.bodyText);
      const matchedFields = new Set<"title" | "category" | "body">();
      let score = 0;

      if (title === foldedQuery) {
        score += 120;
        matchedFields.add("title");
      } else if (title.includes(foldedQuery)) {
        score += 50;
        matchedFields.add("title");
      }

      for (const term of queryTerms) {
        if (title.includes(term)) {
          score += 18;
          matchedFields.add("title");
        }
        for (const category of categories) {
          if (category === term) score += 24;
          else if (category.includes(term)) score += 10;
          if (category.includes(term)) matchedFields.add("category");
        }
        const bodyOccurrences = Math.min(occurrences(body, term), 8);
        if (bodyOccurrences > 0) {
          score += bodyOccurrences * 2;
          matchedFields.add("body");
        }
      }

      if (score > 0) {
        results.push({
          cardRef: card.cardRef,
          title: card.title,
          categories: [...card.categories],
          score,
          matchedFields: [...matchedFields].sort(),
          excerpt: excerpt(card.bodyText, queryTerms),
        });
      }
    }

    return results
      .sort((left, right) =>
        right.score - left.score ||
        left.title.localeCompare(right.title, "en-US", { sensitivity: "base" }) ||
        left.cardRef.localeCompare(right.cardRef, "en-US"),
      )
      .slice(0, limit);
  }
}

export function listCategories(cards: readonly ParsedCard[]): Array<{ name: string; count: number }> {
  const categories = new Map<string, { name: string; count: number }>();
  for (const card of cards) {
    const seenForCard = new Set<string>();
    for (const name of card.categories) {
      const key = fold(name);
      if (!key || seenForCard.has(key)) continue;
      seenForCard.add(key);
      const current = categories.get(key);
      if (current) current.count += 1;
      else categories.set(key, { name, count: 1 });
    }
  }
  return [...categories.values()].sort((left, right) =>
    left.name.localeCompare(right.name, "en-US", { sensitivity: "base" }),
  );
}
