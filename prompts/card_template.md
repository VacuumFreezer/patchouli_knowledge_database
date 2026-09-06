# Patchouli card template

This file defines the rules Patchouli follows when creating a v1 card. Angle-bracket values describe content that Patchouli will insert; they are not commands the user must type. Patchouli controls the frontmatter, headings, and destination filename.

```markdown
---
id: "<uuid>"
title: "<title>"
categories:
  - "<category>"
created_at: "<ISO-8601 timestamp>"
source_types:
  - "<chat|text|markdown>"
---

# <title>

## Summary

<concise agent-written synthesis, editable by the user during review>

## Detail

<substantially more concrete paraphrased explanation derived from the target conversation; use Markdown paragraphs, lists, headings at ### or lower, and Obsidian-compatible inline $...$ or block $$...$$ LaTeX math where useful>

## Evidence

- <paraphrased claim> — <source label or Markdown link>

## Connections

- [[<card filename>|<card title>]] — <connection reason>

## Sources

- <source type>: <source label or Markdown link>
```

## Card creation rules

- Generate a UUID for every new card and preserve the human title separately from the sanitized filename.
- Serialize frontmatter safely; model- or user-supplied Markdown cannot add or replace frontmatter.
- Trim extra spaces from categories and remove exact duplicates without renaming the user's categories.
- Use an ISO-8601 creation timestamp with an explicit UTC offset.
- Generate one concise Summary that combines the useful roles previously served by a separate annotation and My Understanding section; let the user edit it directly during review.
- Make Detail substantially more concrete than Summary, faithful to the target conversation, self-contained for a future reader, and paraphrased rather than copied.
- Preserve mathematical meaning with Obsidian-compatible Markdown/LaTeX: `$...$` for inline formulas and `$$...$$` for display formulas.
- Reserve level-one and level-two headings for the server-owned card structure; Summary and Detail may use `###` or lower subheadings.
- Include only concise, paraphrased evidence. Never copy the full chat transcript or reproduce long dialogue passages in Detail.
- Render only user-selected connections. Existing cards are not edited because Obsidian derives backlinks.
- Keep empty optional Evidence, Connections, and Sources sections with `_None._` so the card structure remains predictable. Summary and Detail are required.
- Reject a destination collision; never overwrite or create an automatically suffixed filename.
