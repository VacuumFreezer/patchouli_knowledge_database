# Card update workflow

Use this workflow only after `search_cards` and `get_card` establish that newly learned material belongs to the same durable concept as an existing card.

1. Use the loaded card's exact `cardRef` and `revision`.
2. Build a complete replacement `CardDraft`, not a patch. Merge still-useful prior Summary, Core, FYI, Evidence, Sources, and Connections with the new material. Legacy Detail is readable content: classify it into durable Core (`detailMarkdown`) and optional FYI (`fyiMarkdown`) during this reviewed update, retaining qualifications and prior useful knowledge. Correct superseded claims explicitly. Never migrate unrelated cards silently.
3. Keep the existing title unless a rename materially improves it. Patchouli preserves the stable UUID and `created_at`, adds `updated_at`, and retains custom frontmatter and nonstandard level-two sections. It rejects rename collisions.
4. Call `suggest_links` for the merged result, judge semantic relevance, and let the user choose final links.
5. For a single-card update, call `preview_card_update` with `cardRef`, the exact `expectedRevision`, the complete draft, and only checkpoint references actually used. If a draft also feeds another unsaved concept, preserve it by using a group with all dependent members, or omit the shared reference from the single-card token. For a mixed group, use `preview_capture` from [capture.md](capture.md), with this member's `cardRef`/`expectedRevision` and in-group relationships; one confirmed `save_capture` handles the full selected group.
6. Let the user edit every reviewable field. When the UI is unavailable, present the complete conversational preview.

The initial request to update or save is not final confirmation. Call `update_card` only after the update preview is visible and the user then explicitly confirms, or when the user presses the UI's Update button. If `REVISION_CONFLICT` occurs, reload the card and prepare a new preview; never overwrite concurrent manual edits. Cancellation, validation errors, conflicts, and failed writes retain checkpoint drafts. A successful update consumes only its bound checkpoint revisions.

After success, report the final title and Obsidian wikilink. If the title changed, mention the old card reference. Do not call `update_card` again when the UI already returned success.
