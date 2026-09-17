<p><a href="README.md"><kbd><b>English</b></kbd></a> &nbsp; <a href="README.zh-CN.md"><kbd>简体中文</kbd></a></p>

# ![Patchouli](plugins/patchouli/assets/patchouli-launch.png) Patchouli

**Turn what you learn in conversation into knowledge worth revisiting.**

Patchouli is a **Codex plugin for macOS and Windows**. It reads your conversation with ChatGPT / Codex in the current session, distills concepts and key points, preserves useful questions and clarifications, and saves reviewed knowledge cards to a local Obsidian vault.

Use it when a discussion has helped you begin to understand a subject and you want to keep that understanding, reasoning, and remaining questions somewhere you can review, search, and connect to what you already know.

> Discuss and understand → Distill concepts → Review cards and connections → Confirm and save → Revisit in Obsidian

**Native macOS / Windows · Local Markdown · Multiple concepts per session · Linked knowledge · Long-conversation checkpoints**

## 📦 Installation and updates

Install Patchouli **in Codex**. Obsidian is where you read and organize the generated cards; no additional Obsidian community plugin is required.

### Prerequisites

| Dependency | Requirement |
| --- | --- |
| Codex | A Codex environment with plugin and Hook support, including the official `plugin-creator` installation helpers |
| Node.js | Node.js 24 recommended; the installer requires at least 20.19 |
| pnpm | `11.19.0`, or Corepack configured to run that version |
| Git | `git` available in your terminal |
| Python | Python 3, available as `python3`, `python`, or `py` on Windows |
| Obsidian | A local vault for reading cards, links, and backlinks |

If pnpm is not installed, run:

```sh
npm install --global pnpm@11.19.0
```

### First installation

Run the same commands in **macOS Terminal** or **Windows PowerShell**:

```sh
git clone https://github.com/VacuumFreezer/patchouli_knowledge_database.git
cd patchouli_knowledge_database
node scripts/sync-install.mjs --no-pull
```

The installer detects your operating system, installs dependencies, builds the plugin for your platform, runs tests and validation, then registers, installs, and verifies the MCP service. There are no platform paths to edit manually.

A successful installation prints the following message; on Windows, the first line ends with `Windows`:

```text
SUCCESS: Patchouli installed and verified on macOS.
Version: ...
MCP: 17 tools available
...
安装成功：已验证本机平台及 MCP 启动。请开启新会话使用。
```

**Start a new Codex session after installation to use Patchouli.** If Codex asks you to review the bundled Hook, enable it to use long-conversation checkpoints.

### Sync and update

From the repository directory, run:

```sh
node scripts/sync-install.mjs
```

The script checks your working tree, runs `git pull --ff-only`, then rebuilds, tests, and installs for the current machine. You can sync the same repository between Mac and Windows and run the installer locally on each.

If you have already run `git pull`, or want to install local changes you have reviewed, use:

```sh
node scripts/sync-install.mjs --no-pull
```

The default sync mode stops when it finds uncommitted or untracked files; it does not discard or stash your changes. Installation restores the repository's generated platform files and installation version markers to reduce conflicts when syncing between platforms.

<details>
<summary>Codex CLI or installation helpers not found?</summary>

The installer looks for the Codex CLI on `PATH` and checks common macOS application locations. If it cannot find the CLI, specify the executable path and run the installer again.

macOS Terminal:

```sh
export CODEX_CLI_PATH="/path/to/codex"
node scripts/sync-install.mjs --no-pull
```

Windows PowerShell:

```powershell
$env:CODEX_CLI_PATH = 'C:\path\to\codex.exe'
node scripts/sync-install.mjs --no-pull
```

Replace the example with your actual CLI path. If a `plugin-creator` helper is missing, update or repair the system skills bundled with Codex. The installer uses `$CODEX_HOME/skills/.system/plugin-creator/scripts`, under `.codex` in your home directory by default.

To view installer options:

```sh
node scripts/sync-install.mjs --help
```

</details>

## 📝 Your first capture

Tell Patchouli where your vault is and what you want to keep, directly in your Codex conversation:

```text
$patchouli Turn what I have understood in this conversation into cards for review.
My vault is /Users/me/Koumakan_Library; save the cards under NLP.
Keep my key questions and clarifications, and put specific exercises and examples in FYI.
```

On Windows, use a local path such as `C:\Users\me\Koumakan_Library`. Patchouli also accepts clear natural-language requests, so you do not need to memorize tool names.

1. **Discuss a subject.** Learn, ask follow-up questions, and check your understanding in the current session. You can also provide learning notes to organize.
2. **Request a capture.** Patchouli identifies independent concepts, searches existing cards, and proposes new cards or updates.
3. **Review them together.** Inspect the full card group, destinations, and connection reasons. Edit content, titles, and selected links.
4. **Confirm the save.** Say “save all” after reviewing, or use the save button in the review interface.
5. **Open Obsidian.** Read your cards and follow their links to revisit related concepts.

Previewing does not write to the vault. If the review interface is unavailable, you can review and confirm in the conversation instead.

### One conversation can produce several cards

If a discussion of tokenization explores Unicode in depth, Patchouli separates the concepts: one card explains tokenization, another covers character encoding, and a connection explains their relationship.

Topic shifts, more general prerequisites, and important foundations that receive substantial explanation may each deserve a card. The deciding factor is whether a concept is independently reusable, rather than conversation length or the number of terms mentioned.

## What goes into a card?

Cards preserve understanding and reasoning in a structure that separates essentials from supporting detail:

| Content | Purpose |
| --- | --- |
| **Summary** | A concise statement of the most useful takeaway |
| **Core · Key points** | A self-contained explanation of mechanisms, conditions, distinctions, formulas, and essential reasoning |
| **Core · Your questions and clarifications** | Optional subsections organized around what confused you, how it was clarified, and what remains unresolved |
| **FYI · Examples and extras** | Specific exercises, examples, model- or version-specific figures, and secondary applications |
| **Evidence / Sources** | Supporting evidence and references you can revisit |
| **Connections** | Links to related cards, with an explanation of each relationship |

For example, a tokenization card could use the following body structure. A complete card also includes evidence and sources:

```markdown
# Byte-level BPE

## Summary
Byte-level BPE starts from bytes and builds tokens by merging frequent adjacent pieces.

## Core
### Key points
Text is encoded as UTF-8 bytes, then combined into tokens using learned merge rules.
A token can span multiple characters or cover only part of a character's bytes.

### My questions and clarifications
**Why isn't one emoji necessarily one token?**
Characters, UTF-8 bytes, and tokens have different boundaries, so visible character
counts do not directly determine token counts.

## FYI
### Exercises and examples
Keep the sample strings, tokenization results, and verification steps from this discussion here.

## Connections
- [[Unicode and UTF-8]] — Understanding how characters become bytes helps explain byte-level tokenization.
```

Your questions can be retained as a Core subsection; they are not a separate fixed metadata field. Cards support formulas, code blocks, and tables. In Obsidian's reading view, properties and duplicate inline titles are hidden to keep the focus on the content.

## 🔎 Search and knowledge questions

Ask questions directly against your knowledge base:

```text
$patchouli Based on my vault, why does character count differ from token count?
Please cite the relevant cards.
```

Patchouli searches for cards, reads the relevant content, and builds an answer with references to supporting cards. When the vault does not contain enough evidence, it makes that gap explicit.

Search uses local keyword matching across titles, categories, and body text, with no vector database required. The current Codex agent explains concepts and judges their relationships.

## 🔗 Connections and evolving knowledge

Patchouli considers both **existing vault cards** and **unsaved cards in the current capture**. During preview, it proposes prerequisite, explanation, application, or contrast relationships with specific reasons. You can keep or deselect these connections.

Connections use native Obsidian `[[wikilinks]]`, making them available through links, backlinks, and the graph view. Concepts from the same conversation are checked for relationships, without forcing a connection between every pair.

When new understanding belongs to an existing concept, update its card:

```text
$patchouli Use our latest discussion to expand the existing Byte-level BPE card.
Show me a preview of the update first.
```

Updates also require review and confirmation. They preserve the card's identity, creation time, and unrelated custom content. If another edit changes a card after preview, Patchouli reports a conflict instead of overwriting changes you have not reviewed.

## 📚 Obsidian integration and folders

Cards are Markdown files in your chosen vault and base folder. Patchouli adds one folder level for newly created cards, using the current local date:

| What you specify | Example destination |
| --- | --- |
| A vault and base folder, without an explicit topic | `Market/Sep_13_26/` |
| An explicit topic of `tokenization` | `NLP/tokenization_Sep1326/` |

“Daily update” alone does not count as an explicit topic, and category tags do not automatically become topics. No extra `Patchouli` directory is added beneath your chosen base folder. Updates keep existing cards in their original folders, and search covers the configured base folder and its subfolders.

In a vault with an existing `.obsidian` configuration, Patchouli installs and enables a dedicated CSS snippet that provides:

- Clear section and subsection hierarchy, with distinct Core and FYI styling.
- A small Patchouli icon to the left of the title.
- Hidden properties and duplicate titles in reading view, while metadata remains in the Markdown file.

Styles are scoped to cards with the `patchouli-card` class. No additional theme or community plugin is required. The vault's Markdown files remain the durable knowledge store, editable in Obsidian or any text editor.

## 🧠 Long conversations and the Compact Hook

At the start of a longer learning discussion, explicitly launch Patchouli:

```text
$patchouli launch
```

The small Patchouli icon and **Patchouli capture active** indicate that checkpoints are active for the current task. When Codex emits `PreCompact` before compressing context, the enabled and trusted Hook distills private drafts from the session transcript, aiming to retain important mechanisms, formulas, judgments, and unresolved questions.

These drafts stay outside your vault. When you later request a capture, Patchouli combines them with the current conversation to prepare a review. Nothing is saved to Obsidian until you confirm.

- **Launch is scoped to the task.** Start it separately for a new learning session. Ordinary card capture does not require a prior launch.
- **Ending the session stops automatic checkpoints.** Outstanding drafts remain available in the original task; launch again to resume automatic checkpoints.
- **The Hook depends on host support and trust settings.** A timeout or failure produces a warning without blocking normal context compaction.

Checkpoints preserve knowledge you can continue organizing; they are not a complete, verbatim conversation backup.

## Skill and MCP tools

For everyday use, a single **`patchouli` skill** routes requests into launch, capture/update, or knowledge inquiry workflows. MCP tools handle local retrieval, previews, and file operations. You generally do not need to call them directly.

| Capability | Main tools |
| --- | --- |
| Vault configuration | `configure_vault`, `get_configuration` |
| Search and reading | `search_cards`, `get_card`, `list_categories` |
| Connection candidates | `suggest_links` |
| Group preview and save | `preview_capture`, `save_capture` |
| Individual card creation and updates | `preview_card`, `save_card`, `preview_card_update`, `update_card` |
| Activation and draft management | `launch_patchouli`, `get_patchouli_status`, `get_checkpoint_drafts` |

See the [skill instructions](plugins/patchouli/skills/patchouli/SKILL.md) for complete workflows and [MCP tool registration](plugins/patchouli/src/mcp/register-tools.ts) for the implementation.

## Data and scope

Patchouli works with the current conversation, learning material you provide, and checkpoint drafts from the current task. It does not automatically import your account's entire chat history or copy whole conversations verbatim into cards.

Cards and search are local, while knowledge synthesis relies on Codex's model capabilities. Local Markdown storage does not mean the entire workflow runs offline. Native macOS and Windows are supported; Linux and WSL are outside the current supported scope.

For help, open an [issue](https://github.com/VacuumFreezer/patchouli_knowledge_database/issues) with your operating system, installation error, or reproduction steps. Remove private conversations and sensitive paths before sharing logs. See the [changelog](CHANGELOG.md) for release history.
