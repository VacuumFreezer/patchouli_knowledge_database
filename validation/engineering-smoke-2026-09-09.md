# Engineering 知识库 smoke test

**后续目录修正（2026-09-09 15:30 EDT）：** 按用户要求，卡片已原样移到 `Engineering/`，空的 `Engineering/Patchouli/` 已删除。当前 `cardsDirectory` 为 `Engineering`。插件指引已更新并重新安装为 `0.2.0+codex.20260909192920`；12 项相关测试、安装后的配置读取及两张卡的检索/读取通过。[迁移验证与哈希](engineering-folder-correction.json)

结果：**11 项 MCP 流程检查通过**；本机 Obsidian 中的中文、数学公式和更新内容显示正常。反向链接计数未独立确认，见下方限制。

本次使用已安装并启用的 Patchouli `0.2.0+codex.20260909142257`，通过实际 Mac MCP 启动器调用插件，不直接写入卡片文件。测试材料是明确标记的生成示例，不代表从用户历史对话中提取的知识。

Obsidian 1.13.7 位于 `/Applications/Obsidian.app`，知识库根目录是 `/Users/tongshen/Koumakan_Library`；用户指定的 `Engineering` 是该库的子目录。最初的 smoke test 通过 `configure_vault` 使用了以下配置（现已按上方说明修正）：

- 知识库：`/Users/tongshen/Koumakan_Library`
- 卡片目录：`Engineering/Patchouli`

## 验证结果

1. 已安装 MCP 正常初始化，列出全部 15 个工具。
2. 现有 Obsidian 知识库配置成功，无缺少 `.obsidian` 的警告。
3. 预览不生成卡片，返回确认令牌。
4. 保存第一张卡成功；相同请求重试返回原结果，无重复卡片。
5. 连接建议找到第一张卡；第二张卡保存所选 wikilink。
6. 预览并更新第二张卡，增加随机抖动说明；保留 UUID、创建时间、原内容和连接。
7. 第二张卡更新后，第一张卡的版本与内容保持不变。
8. 放弃的预览未写入；同标题预览检测到冲突。
9. “重试”查询找到并读取两张卡；完全无关的查询返回零结果。
10. MCP 重启后仍能读取配置和两张卡；旧预览令牌失效，未保存取消的卡片。
11. 目录中恰好两张 Markdown 卡，没有残留临时文件；文件内容与 MCP 返回值一致。

负例查询最初包含 `smoke`，因测试卡标题包含同词而正确返回结果。改用完全无关的单个词后得到零结果；这是测试输入修正，不是插件故障。

## 保留的测试卡

- [幂等性](</Users/tongshen/Koumakan_Library/Engineering/Patchouli Smoke Test - 幂等性.md>)
- [指数退避](</Users/tongshen/Koumakan_Library/Engineering/Patchouli Smoke Test - 指数退避.md>)

第二张卡链接至第一张卡。两张卡均带有 `Patchouli Smoke Test` 标记，保留供用户检查。移动前后的内容哈希相同，UUID、创建时间和连接均保留；当前持久配置直接使用 `Engineering`。

查询示例：“指数退避能否保证请求重试不会产生重复副作用？”

读取两张卡后，依据其内容可回答：不能。退避控制重试时间和请求压力；幂等性控制重复执行的副作用。超时请求可能已经成功，仅延长等待或加入随机抖动，不能防止重复业务操作。

## Obsidian 检查与范围

在用户已安装的 Obsidian 中打开指数退避卡，确认 Properties、Summary、Detail、更新后的随机抖动说明、中文文本、行内数学和独立公式均能显示。连接字段可见，点击后窗口标题切换为幂等性卡。

跳转后，窗口标题与自动化返回的页面内容/截图不同步，后续还出现 `noWindowsAvailable`。因此**没有声称确认了 Obsidian 的反向链接计数**。官方 CLI 报告尚未启用；未改变该设置，也未重装或卸载 Obsidian。

本次 smoke test 验证实际已安装 MCP 与用户知识库的读写流程。未再次启动独立 Codex 对话、触发压缩 Hook，或操作内联卡片审核 UI；此前 Stage 8/9 的验收覆盖仍记录在 `mac-build.md` 中。

[结构化结果与文件哈希](engineering-smoke-2026-09-09.json)
