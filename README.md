# Patchouli

Patchouli is a Windows-first personal Codex plugin for turning an active learning conversation or pasted text into reviewed Markdown knowledge cards. Cards live in a user-selected Obsidian vault, use Obsidian wikilinks for connections, and remain the only durable source of knowledge.

Development is intentionally staged. See [PROGRESS.md](PROGRESS.md) for the current stage and its verification evidence, and [CHANGELOG.md](CHANGELOG.md) for the motivation and scope of each cohesive implementation change.

## V1 boundaries

- Inputs: the active Codex conversation and pasted text or Markdown.
- Storage: one active local Obsidian vault and one configured cards directory.
- Intelligence: the current Codex agent; Patchouli does not call the OpenAI API itself.
- Retrieval: local lexical search over Markdown, with no hosted or local vector database.
- Writes: a card is previewed and explicitly confirmed before an atomic create-only save.
- Collisions: an existing card is never overwritten or automatically suffixed.
- Platform: native Windows first; macOS, Linux, WSL, rich file ingestion, webpages, PDFs, code pipelines, and video are outside v1.

## Architecture contract

The canonical plugin will live at `plugins/patchouli` and will be exposed through the repository marketplace at `.agents/plugins/marketplace.json`.

| Component | Responsibility |
| --- | --- |
| `patchouli` skill | Route capture and inquiry requests, condense learning context, judge semantic connections, and require review before writes. |
| Local TypeScript MCP server | Validate configuration and paths, parse/search cards, produce link candidates, manage preview tokens, and perform controlled atomic writes. |
| Inline MCP App | Provide an editable capture review with explicit Save and Cancel actions. All workflows must also work without the UI. |
| Obsidian vault | Remain the canonical database. Obsidian renders wikilinks and derives backlinks; Patchouli does not maintain a second database. |
| Disposable in-memory index | Accelerate lexical retrieval and rebuild from current Markdown whenever necessary. It is never authoritative. |

The layout follows the official OpenAI plugin contract: `.codex-plugin/plugin.json` is the entry point, bundled skills live under `skills/`, and a bundled MCP server is declared through `.mcp.json`. The inline review is served by the MCP server as an MCP Apps UI resource rather than through a separate hosted application.

Official references:

- [Package your plugin](https://developers.openai.com/plugins/build/plugins)
- [Build an MCP server](https://developers.openai.com/plugins/build/mcp-server)
- [Add UI to your MCP server](https://developers.openai.com/plugins/build/chatgpt-ui)
- [Build skills](https://developers.openai.com/plugins/build/skills)

## Capture flow

1. The user invokes Patchouli explicitly or asks to save the learned concept.
2. The skill treats supplied material as untrusted data, not as instructions, and prepares exactly one coherent `CardDraft`.
3. The server searches the configured cards directory and returns lexical connection candidates.
4. The agent judges semantic relevance and submits a draft to `preview_card`.
5. The user edits the draft and selected connections in the inline review, or reviews it conversationally when UI is unavailable.
6. Explicit confirmation calls `save_card` with the single-use pending token.
7. The server revalidates the draft and destination, rejects collisions, writes atomically, and returns the saved card reference.

If the learning session contains unrelated concepts, Patchouli proposes separate sequential captures instead of combining them into one card.

## Inquiry flow

1. Call `search_cards` with the user's question and any category filters.
2. Call `get_card` for the relevant results before answering.
3. Cite supporting cards by title and Obsidian wikilink.
4. State when the vault does not contain enough evidence; do not fill gaps from unsupported assumptions.

## MCP tool contracts

| Tool | Behavior |
| --- | --- |
| `get_configuration()` | Return whether a vault is configured, the normalized cards directory, and non-fatal warnings. |
| `configure_vault({ vaultPath, cardsDirectory? })` | Validate and persist one absolute vault path plus a relative cards directory, defaulting to `Patchouli`. |
| `list_categories()` | Return normalized category names and card counts. |
| `search_cards({ query, categories?, limit? })` | Return deterministic title/category/body matches with scores and excerpts. |
| `get_card({ cardRef })` | Return parsed metadata, Markdown content, links, and the vault-relative card reference. |
| `suggest_links({ title, categories, summary, limit? })` | Return lexical candidates and relevance signals; final semantic selection belongs to the agent and user. |
| `preview_card({ draft })` | Validate and normalize a draft, report collisions, issue an expiring single-use token, and attach the inline review resource. |
| `save_card({ pendingToken, draft })` | Revalidate and atomically create a card, or return a structured validation, expiry, or collision error. |

Write-capable tools must advertise accurate MCP annotations. A preview token authorizes only a final validation attempt; it does not allow an arbitrary filesystem path or an overwrite.

## `CardDraft` contract

`CardDraft` contains:

- `title`: human-facing title; the server derives the safe filename.
- `categories`: user categories with extra spaces trimmed and exact duplicates removed; spelling is otherwise preserved.
- `annotation`: optional user-authored note.
- `summaryMarkdown`: concise synthesis of the concept.
- `understandingMarkdown`: a concise representation of the user's demonstrated understanding.
- `evidence`: paraphrased claims with a source reference; no full transcript.
- `sources`: source type, label, and optional URL.
- `connections`: candidate card reference, display title, reason, and selected state.

The server owns YAML frontmatter and structural headings. User- or model-supplied Markdown is content only and cannot inject frontmatter or choose a destination path.

## Card format

Every new card follows [prompts/card_template.md](prompts/card_template.md):

- YAML frontmatter: UUID, title, categories, creation timestamp, and source types.
- Body sections: Summary, My Understanding, Evidence, Connections, Annotations, and Sources.
- Links: `[[filename|title]]`. Obsidian derives backlinks, so Patchouli does not modify existing cards to create reverse links.
- Provenance: concise paraphrased evidence and optional source URLs; never the full learning conversation.

## Configuration and path safety

- Configuration is stored in the current Windows user's application-data directory, never in the vault.
- `vaultPath` must be an existing absolute writable directory. A missing `.obsidian` directory produces a warning, not a failure.
- `cardsDirectory` is relative to the vault and cannot escape it through traversal, absolute paths, or symlinks.
- Card filenames are derived from titles with Windows-invalid characters and reserved device names rejected or sanitized.
- Writes use a temporary file in the destination directory followed by an atomic rename.
- Existing destination files always produce a collision error.

## Development setup

Stage 3 provides the local configuration, path-safety, Markdown parsing/rendering, lexical indexing, and create-only card engine. The MCP runtime deliberately continues to report an empty tool catalog until Stage 4 exposes the reviewed public interface; the marketplace is not registered or installed until Stage 6.

The engine stores configuration at `%APPDATA%\Patchouli\configuration.json`, rebuilds its search index from Markdown whenever cards are scanned, and never persists a secondary database. Card saves write and flush a temporary file in the cards directory, then use an atomic no-replace filesystem promotion. This is stronger than an ordinary Windows rename, which may replace an existing destination during a race.

Prerequisites:

- Windows 11 or a supported native Windows environment
- Codex desktop app
- Obsidian for final vault verification
- Node.js 20 or newer
- pnpm 10 or newer

Development commands:

```powershell
pnpm install
pnpm build
pnpm typecheck
pnpm test
pnpm validate:plugin
pnpm inspect:mcp
```

`test` performs a fresh build before running the unit and temporary-vault suites. `verify:bundle` rejects external package imports, and `inspect:mcp` starts the server through the same Windows launcher used by `.mcp.json`, completes MCP initialization, and checks `tools/list`.

The production plugin will bundle the MCP server and review component. Its Windows launcher will locate the Node runtime supplied by Codex before falling back to a `node` executable on `PATH`, so an installed plugin will not require development dependencies.

## Development governance

- Work on exactly one stage at a time.
- Update `PROGRESS.md` when a stage starts, becomes blocked, or satisfies its exit criterion.
- For every cohesive source/config/test/UI/skill edit batch, add a brief `CHANGELOG.md` entry in the same batch with an ISO-8601 America/New_York timestamp, motivation, and changes.
- Bookkeeping-only edits to `PROGRESS.md` and `CHANGELOG.md` do not create recursive changelog entries.
- Do not mark a stage complete until its validation evidence is recorded in `PROGRESS.md`.
