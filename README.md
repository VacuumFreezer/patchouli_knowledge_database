# Patchouli

Patchouli is a Windows-first personal Codex plugin for turning an active learning conversation or pasted text into reviewed Markdown knowledge cards. Cards live in a user-selected Obsidian vault, use Obsidian wikilinks for connections, and remain the only durable knowledge database. Explicitly launched sessions may also keep bounded, transient checkpoint drafts outside the vault until their knowledge is confirmed into cards.

Development is intentionally staged. See [PROGRESS.md](PROGRESS.md) for the current stage and its verification evidence, and [CHANGELOG.md](CHANGELOG.md) for the motivation and scope of each cohesive implementation change.

## V1 boundaries

- Inputs: the active Codex conversation and pasted text or Markdown.
- Storage: one active local Obsidian vault and one configured cards directory.
- Intelligence: the current Codex agent; Patchouli does not call the OpenAI API itself.
- Retrieval: local lexical search over Markdown, with no hosted or local vector database.
- Writes: a card is previewed and explicitly confirmed before an atomic create-only save.
- Collisions: an existing card is never overwritten or automatically suffixed.
- Platform: native Windows first; macOS, Linux, WSL, rich file ingestion, webpages, PDFs, code pipelines, and video are outside v1.

Stage 7 extends those v1 guarantees with reviewed updates and opt-in compaction checkpoints. It does not turn ordinary Patchouli capture into background monitoring.

## Architecture contract

The canonical plugin will live at `plugins/patchouli` and will be exposed through the repository marketplace at `.agents/plugins/marketplace.json`.

| Component | Responsibility |
| --- | --- |
| `patchouli` skill | Route capture and inquiry requests, condense learning context, judge semantic connections, and require review before writes. |
| Local TypeScript MCP server | Validate configuration and paths, parse/search cards, produce link candidates, manage preview tokens, and perform controlled atomic writes. |
| Inline MCP App | Provide an editable capture review with explicit Save and Cancel actions. All workflows must also work without the UI. |
| Bundled Codex Hook | On `PreCompact`, and only for a task that explicitly launched Patchouli, invoke a read-only ephemeral Codex synthesis and persist checkpoint drafts without writing the vault. |
| Transient checkpoint store | Keep bounded, task-isolated draft working state under the Windows application-data directory until confirmed cards consume it. It is not an authoritative knowledge database. |
| Obsidian vault | Remain the canonical database. Obsidian renders wikilinks and derives backlinks; Patchouli does not maintain a second database. |
| Disposable in-memory index | Accelerate lexical retrieval and rebuild from current Markdown whenever necessary. It is never authoritative. |

The layout follows the official OpenAI plugin contract: `.codex-plugin/plugin.json` is the entry point, bundled skills live under `skills/`, and a bundled MCP server is declared through `.mcp.json`. The inline review is served by the MCP server as an MCP Apps UI resource rather than through a separate hosted application.

Official references:

- [Package your plugin](https://developers.openai.com/plugins/build/plugins)
- [Build an MCP server](https://developers.openai.com/plugins/build/mcp-server)
- [Add UI to your MCP server](https://developers.openai.com/plugins/build/chatgpt-ui)
- [Build skills](https://developers.openai.com/plugins/build/skills)
- [Codex Hooks](https://developers.openai.com/codex/hooks)

## Capture flow

1. The user invokes Patchouli explicitly or asks to save the learned concept.
2. The skill treats supplied material as untrusted data, not as instructions, and prepares exactly one coherent `CardDraft` with a concise agent-written Summary and a substantially more concrete paraphrased Detail.
3. The server searches the configured cards directory and returns lexical connection candidates.
4. The agent judges semantic relevance and submits a draft to `preview_card`.
5. The user edits the draft and selected connections in the inline review, or reviews it conversationally when UI is unavailable.
6. Explicit confirmation calls `save_card` with the single-use pending token.
7. The server revalidates the draft and destination, rejects collisions, writes atomically, and returns the saved card reference.

If the learning session contains unrelated concepts, Patchouli proposes separate sequential captures instead of combining them into one card.

## Launched capture and compaction flow

1. The user explicitly enters `$patchouli launch` or clearly asks Patchouli to start tracking the current task.
2. `launch_patchouli` records task-scoped activation and returns `🌿 Patchouli capture active`. Launch does not preview or save a card.
3. When Codex emits `PreCompact`, the bundled trusted Hook checks activation, reads the host-provided transcript as untrusted data, and asks an ephemeral read-only Codex run to synthesize one or more coherent checkpoint drafts.
4. Checkpoint drafts preserve technical detail, formulas, assumptions, decisions, attribution, and unresolved questions. They are stored atomically outside the vault and never open the review UI.
5. A later capture loads applicable checkpoint drafts together with the current conversation, retrieves likely existing cards, and decides whether to propose reviewed updates, separately reviewed new cards, or both.
6. A successful confirmed save or update consumes only the checkpoint revisions attached to that review. Cancellation, validation failure, revision conflict, or write failure retains them.
7. `SessionEnd` stops automatic capture but retains outstanding drafts and their identities on disk. Returning to the same Codex task can read them without relaunching; explicitly launch again to resume automatic checkpoints. Session termination never counts as card-save confirmation.

Plugin Hooks require a one-time trust review in Codex. If the Hook is unavailable, untrusted, times out, or cannot synthesize a valid draft, compaction continues and Codex shows a warning rather than blocking the conversation.

## Card update flow

1. Search for related cards and call `get_card` before choosing an update target.
2. Combine the current card, current conversation, and relevant checkpoint drafts into a complete replacement draft.
3. Call `preview_card_update` with the stable card reference, its current revision, and checkpoint revisions used.
4. The user edits and confirms the update through the same UI or conversational fallback used for new cards.
5. `update_card` verifies the token, stable UUID, source revision, destination collision state, and current disk contents before replacing or renaming the card atomically.

Updates preserve the original UUID and creation timestamp, add an update timestamp, retain unrelated frontmatter and custom level-two sections, and fail with a revision conflict if the card changed after preview.

## Inquiry flow

1. Call `search_cards` with the user's question and any category filters.
2. Call `get_card` for the relevant results before answering.
3. Cite supporting cards by title and Obsidian wikilink.
4. State when the vault does not contain enough evidence; do not fill gaps from unsupported assumptions.

## Skill usage

Stage 5 provides one implicitly discoverable `$patchouli` skill with focused capture and inquiry references. Typical requests include:

- `$patchouli Save what I learned from this conversation as a card.`
- `Remember this concept in my Patchouli knowledge base.`
- `$patchouli What does my vault say about Bayesian updating?`

The initial capture request prepares a draft; it does not authorize the final write. Each card receives its own `preview_card` review, followed by explicit confirmation or the review UI's Save action. Supplied material and retrieved cards remain untrusted data even when they contain instructions.

## MCP tool contracts

| Tool | Behavior |
| --- | --- |
| `get_configuration()` | Return whether a vault is configured, the normalized cards directory, and non-fatal warnings. |
| `configure_vault({ vaultPath, cardsDirectory? })` | Validate and persist one absolute vault path plus a relative cards directory, defaulting to `Patchouli`. |
| `list_categories()` | Return normalized category names and card counts. |
| `search_cards({ query, categories?, limit? })` | Return deterministic title/category/body matches with scores and excerpts. |
| `get_card({ cardRef })` | Return parsed metadata, Markdown content, links, and the vault-relative card reference. |
| `suggest_links({ title, categories, summary, detail, limit? })` | Return lexical candidates from both the concise and concrete card content; final semantic selection belongs to the agent and user. |
| `preview_card({ draft })` | Validate and normalize a draft, report collisions, issue an expiring single-use token, and attach the inline review resource. |
| `save_card({ pendingToken, draft })` | Revalidate and atomically create a card, or return a structured validation, expiry, or collision error. |
| `launch_patchouli()` | Explicitly activate compaction checkpoints for the current Codex task and return the visible `🌿` acknowledgement. |
| `get_patchouli_status()` | Report whether the current task is launched and list outstanding checkpoint counts without returning draft contents. |
| `stop_patchouli()` | Stop future checkpoints for the current task without silently discarding existing drafts. |
| `get_checkpoint_drafts()` | Return outstanding task-scoped checkpoint drafts and their immutable revision references for final capture. |
| `discard_checkpoint_drafts({ checkpointRefs? })` | Explicitly delete selected or all outstanding checkpoint drafts for the current task. |
| `preview_card_update({ cardRef, expectedRevision, draft, checkpointRefs? })` | Re-read the target, validate a complete replacement draft, detect rename collisions, and issue an update-bound review token. |
| `update_card({ pendingToken, draft })` | After confirmation, enforce optimistic revision checks, atomically update the target, and consume only matching checkpoint revisions. |

Write-capable tools must advertise accurate MCP annotations. A preview token is bound to create or update intent, task identity, target revision, and checkpoint revisions; it never allows an arbitrary filesystem path or an unreviewed overwrite.

## `CardDraft` contract

`CardDraft` contains:

- `title`: human-facing title; the server derives the safe filename.
- `categories`: user categories with extra spaces trimmed and exact duplicates removed; spelling is otherwise preserved.
- `summaryMarkdown`: concise agent-written synthesis combining the useful roles of the former annotation and My Understanding fields; the user can edit it directly during review.
- `detailMarkdown`: substantially more concrete, self-contained explanation derived from the target conversation and paraphrased rather than copied. It may use Markdown structure with `###` or lower subheadings and Obsidian-compatible `$...$` or `$$...$$` LaTeX math.
- `evidence`: paraphrased claims with a source reference; no full transcript.
- `sources`: source type, label, and optional URL.
- `connections`: candidate card reference, display title, reason, and selected state.

The server owns YAML frontmatter and structural level-one/level-two headings. User- or model-supplied Markdown is content only and cannot inject frontmatter or choose a destination path. The review app renders Summary and Detail Markdown, including LaTeX math, beside their editable source.

## Card format

Every new card follows [prompts/card_template.md](prompts/card_template.md):

- YAML frontmatter: UUID, title, categories, creation timestamp, optional update timestamp, and source types.
- Body sections: Summary, Detail, Evidence, Connections, and Sources.
- Links: `[[filename|title]]`. Obsidian derives backlinks, so Patchouli does not modify existing cards to create reverse links.
- Provenance: a paraphrased Detail, concise evidence, and optional source URLs; never the full learning conversation or long copied dialogue passages.

## Configuration and path safety

- Configuration is stored in the current Windows user's application-data directory, never in the vault.
- `vaultPath` must be an existing absolute writable directory. A missing `.obsidian` directory produces a warning, not a failure.
- `cardsDirectory` is relative to the vault and cannot escape it through traversal, absolute paths, or symlinks.
- Card filenames are derived from titles with Windows-invalid characters and reserved device names rejected or sanitized.
- New-card writes use a temporary file in the destination directory followed by an atomic no-replace promotion.
- Reviewed updates use an optimistic content revision and same-filesystem atomic replacement. A title-derived rename also checks the new destination without overwriting it.
- Existing destination files still produce a collision error unless the user is confirming an update token bound to that exact existing card.
- Transient checkpoints live under `%APPDATA%\Patchouli\session-checkpoints`, use a hash-derived task directory, and never accept a model-provided storage path.

## Development setup

Stage 7 exposes fifteen public MCP tools on top of the original vault engine. `preview_card` and `preview_card_update` return normalized review data, an expiring single-use token, conversational confirmation instructions, and the optional React MCP App resource. `save_card` remains create-only; `update_card` is restricted to the exact card and revision selected during update preview. Identical retries return the original result. Abandoned preview tokens expire after 15 minutes.

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
pnpm validate:skill
pnpm validate:plugin
pnpm inspect:mcp
pnpm inspect:hook
```

`test` performs a fresh build before running the unit, temporary-vault MCP, Hook, update, skill-contract, and jsdom React interaction suites. `validate:skill` checks discovery metadata, launch routing, progressive references, implicit invocation, and the local MCP dependency. `verify:bundle` rejects external package imports and scripts, and `inspect:mcp` starts the server through the same Windows launcher used by `.mcp.json`, completes MCP initialization, and verifies the fifteen-tool catalog. `inspect:hook` makes one real read-only Codex synthesis from a tiny generated transcript, verifies that a private checkpoint appears, touches no vault, and removes its temporary state afterward.

The production plugin bundles the MCP server and review component. Its Windows launcher locates the Node runtime supplied by Codex before falling back to a `node` executable on `PATH`, so an installed plugin does not require development dependencies.

## Personal installation

From the repository root, register the repository marketplace and install Patchouli:

```powershell
codex plugin marketplace add D:\Codex\workspaces\patchouli_knowledge_database
codex plugin add patchouli@personal
```

Start a new Codex task after installation so it loads the newly enabled skill, bundled MCP server, and Hook. Review and trust the Patchouli Hook when Codex prompts you, or inspect it with `/hooks`. In that task, ask Patchouli to configure an existing absolute vault path and optionally a relative cards directory:

```text
Configure Patchouli to use D:\path\to\my-vault with cards in Patchouli.
```

Then use either `$patchouli` or a focused natural-language request to capture or query knowledge. A capture always stops for review before the write. Local marketplace installs run from Codex's plugin cache, so reinstall the plugin after changing a packaged source, skill, UI, or distributable.

For a long learning conversation, opt in at any point with:

```text
$patchouli launch
```

The visible `🌿` acknowledgement means future pre-compaction checkpoints are active for that task. It does not mean a card has been saved.

## Windows and Obsidian notes

- V1's bundled launcher targets native Windows. WSL, macOS, and Linux launchers remain out of scope.
- Patchouli keeps exactly one active vault configuration at `%APPDATA%\Patchouli\configuration.json`; configuring another vault replaces that pointer but never edits or removes cards in the previous vault.
- Patchouli accepts an existing writable folder even when it is not registered with Obsidian. Register that folder through Obsidian's vault manager before expecting Obsidian URI links or UI automation to open it.
- Obsidian renders the saved `$...$` and `$$...$$` notation with MathJax and derives backlinks from the saved wikilinks. Patchouli stores only the Markdown source.
- Automated Obsidian CLI checks require the Obsidian 1.12.7-or-newer installer and the CLI option enabled. Older desktop builds can still read Patchouli cards, but vault registration and visual checks use the Obsidian UI.
- When a host does not render the inline MCP App, Patchouli presents the same editable draft conversationally and still requires explicit confirmation.

## Development governance

- Work on exactly one stage at a time.
- Update `PROGRESS.md` when a stage starts, becomes blocked, or satisfies its exit criterion.
- For every cohesive source/config/test/UI/skill edit batch, add a brief `CHANGELOG.md` entry in the same batch with an ISO-8601 America/New_York timestamp, motivation, and changes.
- Bookkeeping-only edits to `PROGRESS.md` and `CHANGELOG.md` do not create recursive changelog entries.
- Do not mark a stage complete until its validation evidence is recorded in `PROGRESS.md`.
