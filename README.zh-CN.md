<p><a href="README.md"><kbd>English</kbd></a> &nbsp; <a href="README.zh-CN.md"><kbd><b>简体中文</b></kbd></a></p>

# ![Patchouli](plugins/patchouli/assets/patchouli-launch.png) Patchouli

**把对话中逐渐理解的知识，整理成值得反复阅读的卡片。**

Patchouli 是面向 **macOS 和 Windows 的 Codex 插件**。它读取当前 session 中你与 ChatGPT / Codex 的对话，总结概念、提炼关键点，保留有价值的问题与澄清，并将经过你确认的知识卡片存入本地 Obsidian 知识库。

它适合这样的时刻：你已经通过讨论消化了一部分知识，希望留下自己的理解、推理和疑问，方便以后复习、检索，并与已有知识建立联系。

> 讨论与理解 → 提炼概念 → 预览卡片和连接 → 确认保存 → 在 Obsidian 中复习

**原生 macOS / Windows · 本地 Markdown · 多概念拆卡 · 关联检索 · 长对话 checkpoint**

## 📦 安装与更新

Patchouli 安装在 **Codex 中**，Obsidian 用于阅读和管理生成的卡片，无需安装额外的 Obsidian 社区插件。

### 安装前准备

| 依赖 | 要求 |
| --- | --- |
| Codex | 支持插件与 Hooks 的 Codex 环境，包含官方 `plugin-creator` 安装辅助脚本 |
| Node.js | 建议使用 Node.js 24；安装脚本要求至少 20.19 |
| pnpm | `11.19.0`，或可运行该版本的 Corepack |
| Git | 可在终端中运行 `git` |
| Python | Python 3，可通过 `python3`、`python` 或 Windows 的 `py` 调用 |
| Obsidian | 准备一个本地知识库，用于浏览卡片、链接与反向链接 |

如果尚未安装 pnpm，可运行：

```sh
npm install --global pnpm@11.19.0
```

### 首次安装

在 **macOS Terminal** 或 **Windows PowerShell** 中运行相同的命令：

```sh
git clone https://github.com/VacuumFreezer/patchouli_knowledge_database.git
cd patchouli_knowledge_database
node scripts/sync-install.mjs --no-pull
```

安装脚本会自动识别当前操作系统，安装依赖、构建对应平台的插件、运行测试与校验，然后注册、安装并验证 MCP 服务。无需手动修改平台路径。

成功后会看到以下提示；Windows 上的第一行会显示 `Windows`：

```text
SUCCESS: Patchouli installed and verified on macOS.
Version: ...
MCP: 17 tools available
...
安装成功：已验证本机平台及 MCP 启动。请开启新会话使用。
```

**安装完成后，开启一个新的 Codex 会话使用 Patchouli。** 如果 Codex 提示审核插件 Hook，请启用它以使用长对话 checkpoint 功能。

### 同步仓库并更新安装

在仓库目录中运行：

```sh
node scripts/sync-install.mjs
```

脚本会先检查工作区，再执行 `git pull --ff-only`，随后为当前机器重新构建、测试和安装。因此，同一份仓库可以在 Mac 和 Windows 之间同步，各自在本机运行安装脚本即可。

如果你已经手动 `git pull`，或者希望安装已检查过的本地修改，使用：

```sh
node scripts/sync-install.mjs --no-pull
```

默认同步模式遇到未提交或未跟踪的文件会停止，不会自动丢弃或暂存你的修改。安装过程会恢复仓库中的平台构建产物与安装版本标记，减少跨平台同步时的冲突。

<details>
<summary>找不到 Codex CLI 或安装辅助脚本？</summary>

安装器会查找 `PATH` 中的 Codex CLI，也会检查 macOS 上常见的应用安装位置。若未找到，可指定实际可执行文件路径，然后重新运行安装命令。

macOS Terminal：

```sh
export CODEX_CLI_PATH="/path/to/codex"
node scripts/sync-install.mjs --no-pull
```

Windows PowerShell：

```powershell
$env:CODEX_CLI_PATH = 'C:\path\to\codex.exe'
node scripts/sync-install.mjs --no-pull
```

请将示例路径替换为本机 CLI 路径。若提示缺少 `plugin-creator` helper，需要更新或修复 Codex 自带的系统技能；安装器使用 `$CODEX_HOME/skills/.system/plugin-creator/scripts`，默认位于用户目录的 `.codex` 下。

查看安装参数：

```sh
node scripts/sync-install.mjs --help
```

</details>

## 📝 第一次使用

在 Codex 对话中直接告诉 Patchouli 知识库位置，以及你希望保存的内容。例如：

```text
$patchouli 把本次对话中我已经理解的知识整理成方便复习的卡片。
知识库路径是 /Users/me/Koumakan_Library，保存到 NLP 文件夹。
保留我的关键问题与澄清，把具体练习和例子放进 FYI。
```

Windows 同样可以使用本机路径，例如 `C:\Users\me\Koumakan_Library`。Patchouli 也接受明确的自然语言请求，无需记住每个工具名称。

1. **讨论知识。** 在当前会话中学习、追问、验证自己的理解，也可以提供要整理的学习笔记。
2. **请求整理。** Patchouli 识别独立概念，检索已有卡片，提出新卡片或更新建议。
3. **一起预览。** 查看完整卡片组、保存位置和连接理由；可以修改内容、标题和链接选择。
4. **确认保存。** 确认预览后说“都保存”，或点击预览界面的保存按钮。
5. **回到 Obsidian。** 阅读卡片，通过链接继续复习相关概念。

预览阶段不会写入知识库；界面不可用时，也可以在对话中完成预览与确认。

### 一场对话，可以形成多张卡片

讨论 Tokenization 时，如果深入涉及 Unicode，Patchouli 会根据概念边界拆分卡片：Tokenization 记录分词机制，Unicode 记录字符编码基础，再用连接说明两者的关系。

话题迁移、更通用的前置知识、得到实质讲解的重要基础概念，都可能值得单独成卡。拆分依据是概念能否独立复用，而不是对话长度或出现了多少术语。

## 卡片里有什么？

卡片保留适合复习的理解与推理，结构区分主次：

| 内容 | 用途 |
| --- | --- |
| **Summary** | 用简短文字概括最值得记住的结论 |
| **Core · 关键点** | 自成体系地解释机制、条件、关键区别、公式与必要推理 |
| **Core · 用户的问题与澄清** | 可按你的提问组织小节，记录“哪里不理解、如何理解、还有什么未解决” |
| **FYI · 例子与补充** | 收纳具体练习、示例、特定模型或版本的数据，以及次要应用 |
| **Evidence / Sources** | 保留依据和来源，便于回溯 |
| **Connections** | 链接相关卡片，并解释为什么有关联 |

例如，一张 Tokenization 卡片的正文可以这样组织，实际卡片还会包含依据与来源：

```markdown
# Byte-level BPE

## Summary
Byte-level BPE 从字节出发，通过合并常见的相邻片段构造 token。

## Core
### 关键点
文本先转换为 UTF-8 字节，再按学到的合并规则形成 token。
一个 token 可能跨越多个字符，也可能只覆盖某个字符的一部分字节。

### 我的问题与澄清
**为什么一个 emoji 不一定是一个 token？**
字符、UTF-8 字节与 token 的边界不同，不能用显示字符数直接推算 token 数。

## FYI
### 练习与例子
把本次讨论使用的样例字符串、分词结果和验证过程放在这里。

## Connections
- [[Unicode 与 UTF-8]] — 理解字符如何编码为字节，有助于理解字节级分词。
```

“用户的问题”可以作为 Core 的小节保留，不是额外的固定元数据字段。卡片支持公式、代码块和表格；Obsidian 阅读视图会隐藏属性区域与重复的内联标题，让正文更集中。

## 🔎 检索与知识问答

可以直接向自己的知识库提问：

```text
$patchouli 根据知识库解释：为什么字符数不等于 token 数？请引用相关卡片。
```

Patchouli 先检索卡片，再读取相关内容组织回答，并引用支持结论的卡片。知识库不足以回答时，会明确指出缺失的依据。

检索在本地按标题、分类与正文进行关键词匹配，不需要向量数据库。概念解释和关系判断由当前 Codex agent 完成。

## 🔗 连接生成与知识更新

Patchouli 会同时考虑**已有知识库中的卡片**和**本轮尚未保存的卡片**，在预览阶段提出前置知识、解释、应用或对比关系，并给出具体理由。你可以保留或取消这些连接。

连接使用 Obsidian 原生 `[[wikilinks]]`，可以通过链接、反向链接和图谱浏览。来自同一场对话的概念会一起检查关联，但不会为了连线而强行关联。

当新的理解属于已有概念时，可以更新原卡片：

```text
$patchouli 用刚才的讨论补充已有的 Byte-level BPE 卡片，先给我看修改预览。
```

更新同样经过预览确认，并保留卡片身份、创建时间及无关的自定义内容。如果卡片在预览后被其他编辑修改，Patchouli 会报告冲突，避免覆盖未审阅的变化。

## 📚 Obsidian 集成与目录整理

卡片以 Markdown 文件保存在你指定的知识库和基础目录中。Patchouli 为每次新建卡片增加一层目录，使用当天的本地日期：

| 你提供的信息 | 目录示例 |
| --- | --- |
| 只指定知识库和基础目录，没有明确 topic | `Market/Sep_13_26/` |
| 明确指定 topic 为 `tokenization` | `NLP/tokenization_Sep1326/` |

`daily update` 本身不视为明确 topic，分类标签也不会自动变成 topic。指定基础目录后，不会再套一层 `Patchouli` 文件夹。更新旧卡片时保留其原有目录，检索覆盖配置的基础目录及其子目录。

在已有 `.obsidian` 配置的知识库中，Patchouli 会安装并启用专用 CSS snippet，为生成的卡片提供：

- 清晰的分区标题与副标题层级，区分 Core 与 FYI。
- 标题左侧的小型 Patchouli 图标。
- 隐藏阅读视图中的属性区域和重复标题；元数据仍保留在 Markdown 文件中。

样式通过 `patchouli-card` 类限定在 Patchouli 卡片上，无需额外主题或社区插件。知识库中的 Markdown 是长期存储的主体，可以继续用 Obsidian 或其他文本编辑器维护。

## 🧠 长对话与 Compact Hook

开始较长的学习讨论时，可以显式启动：

```text
$patchouli launch
```

看到小型 Patchouli 图标和 **Patchouli capture active** 后，当前任务的 checkpoint 功能已激活。当 Codex 触发 `PreCompact`、准备压缩上下文时，已启用并获信任的 Hook 会从会话记录中提炼私有草稿，尽量保留重要机制、公式、判断和未解决的问题。

这些草稿暂存在知识库之外。之后请求整理卡片时，Patchouli 会结合草稿和当前对话生成预览，只有你确认后才保存到 Obsidian。

- **Launch 按任务生效。** 新的学习会话需要单独启动；普通卡片整理无需提前 launch。
- **结束会话会停止自动 checkpoint。** 尚未整理的草稿会保留，可在原任务中继续使用；恢复自动 checkpoint 需要重新 launch。
- **Hook 依赖宿主支持与信任设置。** 发生超时或失败时会提示，且不会阻止正常的上下文压缩。

Checkpoint 用来保存可继续整理的知识线索，不是完整逐字的对话备份。

## Skill 与 MCP 工具

日常使用只需一个 **`patchouli` skill**，它根据请求进入启动、整理／更新或知识问答流程。MCP 工具负责本地检索、预览和文件操作，一般无需手动调用。

| 能力 | 主要工具 |
| --- | --- |
| 知识库配置 | `configure_vault`、`get_configuration` |
| 检索与读取 | `search_cards`、`get_card`、`list_categories` |
| 连接候选 | `suggest_links` |
| 成组预览与保存 | `preview_capture`、`save_capture` |
| 单卡新建与更新 | `preview_card`、`save_card`、`preview_card_update`、`update_card` |
| 启动与草稿管理 | `launch_patchouli`、`get_patchouli_status`、`get_checkpoint_drafts` |

完整工作流见 [Skill 说明](plugins/patchouli/skills/patchouli/SKILL.md)，工具实现见 [MCP 工具注册](plugins/patchouli/src/mcp/register-tools.ts)。

## 数据与使用范围

Patchouli 面向当前会话、你提供的学习材料，以及当前任务的 checkpoint 草稿，不会自动导入账号下的全部历史聊天。它提炼知识，不把整段聊天逐字写入卡片。

卡片和检索在本地，知识提炼依赖 Codex 的模型能力，因此“本地 Markdown”不代表整个处理过程离线。当前支持原生 macOS 与 Windows，Linux / WSL 不在支持范围内。

遇到问题，可在 [Issues](https://github.com/VacuumFreezer/patchouli_knowledge_database/issues) 提供操作系统、安装报错或复现步骤；提交日志前请去掉私人对话和敏感路径。版本变化见 [CHANGELOG](CHANGELOG.md)。
