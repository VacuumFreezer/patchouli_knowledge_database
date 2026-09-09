import { createHash } from "node:crypto";
import * as fs from "node:fs/promises";

import { PatchouliError } from "./errors.js";

export interface TranscriptMessage {
  role: "user" | "assistant";
  text: string;
}

export interface ParsedTranscript {
  messages: TranscriptMessage[];
  digest: string;
  truncated: boolean;
}

const MAX_TRANSCRIPT_BYTES = 16 * 1024 * 1024;
const MAX_MESSAGE_CHARACTERS = 100_000;
const MAX_TOTAL_CHARACTERS = 1_200_000;

function removeAmbientContext(value: string): string {
  return value
    .replace(/<in-app-browser-context\b[^>]*>[\s\S]*?<\/in-app-browser-context>/giu, "")
    .replace(/<recommended_plugins>[\s\S]*?<\/recommended_plugins>/giu, "")
    .replace(/<environment_context>[\s\S]*?<\/environment_context>/giu, "")
    .trim();
}

export async function parseCodexTranscript(transcriptPath: string): Promise<ParsedTranscript> {
  const stats = await fs.stat(transcriptPath);
  if (!stats.isFile()) {
    throw new PatchouliError("VALIDATION_ERROR", "The hook transcript path is not a file.");
  }
  if (stats.size > MAX_TRANSCRIPT_BYTES) {
    throw new PatchouliError("VALIDATION_ERROR", "The task transcript is too large for a safe checkpoint pass.", {
      size: stats.size,
    });
  }
  const lines = (await fs.readFile(transcriptPath, "utf8")).split(/\r?\n/u);
  const messages: TranscriptMessage[] = [];
  let totalCharacters = 0;
  let truncated = false;
  for (const line of lines) {
    if (!line.trim()) continue;
    let row: unknown;
    try {
      row = JSON.parse(line);
    } catch {
      continue;
    }
    if (typeof row !== "object" || row === null) continue;
    const envelope = row as { type?: unknown; payload?: unknown };
    if (envelope.type !== "response_item" || typeof envelope.payload !== "object" || envelope.payload === null) continue;
    const payload = envelope.payload as { type?: unknown; role?: unknown; content?: unknown };
    if (payload.type !== "message" || (payload.role !== "user" && payload.role !== "assistant") || !Array.isArray(payload.content)) continue;
    const contentType = payload.role === "user" ? "input_text" : "output_text";
    const raw = payload.content
      .filter((item): item is { type: string; text: string } => (
        typeof item === "object" && item !== null
        && (item as { type?: unknown }).type === contentType
        && typeof (item as { text?: unknown }).text === "string"
      ))
      .map((item) => item.text)
      .join("\n");
    const cleaned = removeAmbientContext(raw);
    if (!cleaned) continue;
    const remaining = MAX_TOTAL_CHARACTERS - totalCharacters;
    if (remaining <= 0) {
      truncated = true;
      break;
    }
    const text = cleaned.slice(0, Math.min(MAX_MESSAGE_CHARACTERS, remaining));
    if (text.length < cleaned.length) truncated = true;
    messages.push({ role: payload.role, text });
    totalCharacters += text.length;
  }
  const digest = createHash("sha256").update(JSON.stringify(messages), "utf8").digest("hex");
  return { messages, digest, truncated };
}

export function transcriptAsUntrustedText(messages: TranscriptMessage[]): string {
  return JSON.stringify(messages);
}
