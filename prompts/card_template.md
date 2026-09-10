# Patchouli card template

This file defines the rules Patchouli follows when creating a v2 card. Angle-bracket values describe content that Patchouli will insert; they are not commands the user must type. Patchouli controls the frontmatter, headings, and destination filename.

```markdown
---
cssclasses: ["patchouli-card"]
id: "<uuid>"
title: "<title>"
categories:
  - "<category>"
created_at: "<ISO-8601 timestamp>"
updated_at: "<ISO-8601 timestamp; present after an update>"
source_types:
  - "<chat|text|markdown>"
---

# <title>

## Summary

<concise agent-written synthesis, editable by the user during review>

## Core

<substantially more concrete paraphrased explanation derived from the target conversation; use Markdown paragraphs, lists, headings at ### or lower, and Obsidian-compatible inline $...$ or block $$...$$ LaTeX math where useful>

## FYI

<optional worked examples, model/version figures, or peripheral observations; _None._ when empty>

## Evidence

- <paraphrased claim> — <source label or Markdown link>

## Connections

- [[<card filename>|<card title>]] — <connection reason>

## Sources

- <source type>: <source label or Markdown link>
```

## Card creation rules

- Generate a UUID for every new card and preserve the human title separately from the sanitized filename.
- On update, preserve the existing UUID and `created_at` value and set `updated_at` to the confirmed write time.
- Serialize frontmatter safely; model- or user-supplied Markdown cannot add or replace frontmatter.
- Trim extra spaces from categories and remove exact duplicates without renaming the user's categories.
- Use an ISO-8601 creation timestamp with an explicit UTC offset.
- Generate one concise Summary that combines the useful roles previously served by a separate annotation and My Understanding section; let the user edit it directly during review.
- Make Core substantially more concrete than Summary, faithful to the target conversation, self-contained for a future reader, and paraphrased rather than copied.
- Preserve mathematical meaning with Obsidian-compatible Markdown/LaTeX: `$...$` for inline formulas and `$$...$$` for display formulas.
- Reserve level-one and level-two headings for the server-owned card structure; Summary and Core may use `###` or lower subheadings.
- Include only concise, paraphrased evidence. Never copy the full chat transcript or reproduce long dialogue passages in Core.
- Render only user-selected connections. Updating a card never edits other cards because Obsidian derives backlinks.
- Keep empty optional Evidence, Connections, and Sources sections with `_None._` so the card structure remains predictable. Summary and Core are required.
- Reject a new-card destination collision; never create an automatically suffixed filename.
- Update only through a reviewed token bound to the existing card UUID and content revision. Reject stale revisions and title-derived rename collisions.
- Preserve unrelated frontmatter keys and custom level-two sections when updating a canonical card.

- `detailMarkdown` is the compatible input field for Core; optional `fyiMarkdown` defaults to empty. Legacy cards are not silently migrated.
- Hide Properties and Obsidian inline title only for `patchouli-card` notes through the enabled `patchouli-cards-v2` snippet; retain YAML and the Markdown H1.
- Split independently useful topics, general prerequisites, and substantively explained foundations; keep incidental examples in FYI. Do not split every term.
