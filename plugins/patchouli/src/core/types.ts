export const DEFAULT_CARDS_DIRECTORY = "Patchouli";

export interface VaultConfiguration {
  vaultPath: string;
  cardsDirectory: string;
}

export interface ConfigurationWarning {
  code: "OBSIDIAN_DIRECTORY_MISSING";
  message: string;
}

export interface ConfigurationStatus {
  configured: boolean;
  configuration?: VaultConfiguration;
  warnings: ConfigurationWarning[];
}

export interface EvidenceDraft {
  claim: string;
  sourceReference: string;
}

export interface SourceDraft {
  type: string;
  label: string;
  url?: string;
}

export interface ConnectionDraft {
  cardRef: string;
  title: string;
  reason: string;
  selected: boolean;
}

export interface CardDraft {
  title: string;
  categories: string[];
  summaryMarkdown: string;
  detailMarkdown: string;
  evidence: EvidenceDraft[];
  sources: SourceDraft[];
  connections: ConnectionDraft[];
}

export interface NormalizedCardDraft extends CardDraft {
  filename: string;
}

export interface DraftCollision {
  exists: boolean;
  cardRef: string;
}

export interface DraftInspection {
  draft: NormalizedCardDraft;
  collision: DraftCollision;
}

export interface CheckpointReference {
  checkpointId: string;
  revision: string;
}

export interface UpdateInspection {
  draft: NormalizedCardDraft;
  target: {
    cardRef: string;
    id?: string;
    title: string;
    revision: string;
  };
  destination: {
    cardRef: string;
    renamed: boolean;
    collision: boolean;
  };
}

export interface CardLink {
  cardRef: string;
  title?: string;
}

export interface ParsedCard {
  id?: string;
  title: string;
  categories: string[];
  createdAt?: string;
  updatedAt?: string;
  sourceTypes: string[];
  markdown: string;
  bodyMarkdown: string;
  bodyText: string;
  links: CardLink[];
  cardRef: string;
  filename: string;
  warnings: string[];
  revision: string;
}

export interface SearchResult {
  cardRef: string;
  title: string;
  categories: string[];
  score: number;
  matchedFields: Array<"title" | "category" | "body">;
  excerpt: string;
}

export interface SearchOptions {
  categories?: string[];
  limit?: number;
}

export interface SavedCard {
  card: ParsedCard;
  absolutePath: string;
  previousCardRef?: string;
}

export interface CheckpointDraft {
  launchId: string;
  checkpointId: string;
  revision: string;
  sequence: number;
  contextDigest: string;
  createdAt: string;
  updatedAt: string;
  trigger: "auto" | "manual";
  turnId: string;
  model: string;
  messageCount: number;
  draft: NormalizedCardDraft;
}

export interface PatchouliSessionStatus {
  active: boolean;
  launchId?: string;
  launchedAt?: string;
  updatedAt?: string;
  checkpointCount: number;
}
