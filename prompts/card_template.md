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

<concise summary Markdown>

## My Understanding

<concise representation of the user's demonstrated understanding>

## Evidence

- <paraphrased claim> — <source label or Markdown link>

## Connections

- [[<card filename>|<card title>]] — <connection reason>

## Annotations

<optional user annotation>

## Sources

- <source type>: <source label or Markdown link>
```

## Card creation rules

- Generate a UUID for every new card and preserve the human title separately from the sanitized filename.
- Serialize frontmatter safely; model- or user-supplied Markdown cannot add or replace frontmatter.
- Trim extra spaces from categories and remove exact duplicates without renaming the user's categories.
- Use an ISO-8601 creation timestamp with an explicit UTC offset.
- Include only concise, paraphrased evidence. Never copy the full chat transcript.
- Render only user-selected connections. Existing cards are not edited because Obsidian derives backlinks.
- Keep empty optional sections with `_None._` so the card structure remains predictable.
- Reject a destination collision; never overwrite or create an automatically suffixed filename.
