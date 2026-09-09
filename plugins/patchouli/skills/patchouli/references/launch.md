# Launch workflow

Use this workflow only for `$patchouli launch` or an equally clear natural-language request to launch or start compaction-safe Patchouli capture for the current task. The command may appear anywhere in the conversation. Do not infer launch from a capture request, an inquiry, educational subject matter, or a casual mention of Patchouli.

1. Call `launch_patchouli`. Repeated launch calls are safe and keep existing checkpoint drafts.
2. Begin the final response with the exact standalone heading `# 🌿 Patchouli capture active`. This indicator is mandatory even when the rest of the response uses another language.
3. Explain that future pre-compaction events may create private task drafts, but nothing has been written to the Obsidian vault.

When a Codex session ends, automatic capture stops but outstanding checkpoint drafts remain available to the same task. Load them for final capture without requiring a relaunch; only an explicit launch resumes automatic checkpoints. Never treat closing, archiving, or ending a session as confirmation to delete drafts. Automatic consumption follows successful user-confirmed card saves or updates only.

Launch is task-scoped. It does not retroactively force a compaction, open a card review, or save a card. Hook trust is controlled by Codex; if the host requests trust, tell the user that the bundled Patchouli Hook must be reviewed and enabled for automatic checkpoints to run.
