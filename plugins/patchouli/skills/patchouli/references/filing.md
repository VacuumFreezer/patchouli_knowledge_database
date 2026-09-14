# Filing new cards

- User base `/Users/me/Koumakan_Library/Market`, local day 2026-09-13, no explicit topic (including daily update): configure vault `/Users/me/Koumakan_Library`, cardsDirectory `Market`, captureDate `2026-09-13`, omit topic. New cards go to `Market/Sep_13_26/`.
- User base `NLP`, explicit topic `tokenization`, same day: cardsDirectory `NLP`, captureDate `2026-09-13`, topic `tokenization`. New cards go to `NLP/tokenization_Sep1326/`.
- Preserve topic spelling, spaces and Unicode; unsafe path separators/reserved names are rejected. A topic is one directory component, not a nested path.
- Recompute the user's local date for each new capture. Call configure before preview; do not reconfigure a confirmed pending save. Old cards stay in their original date folders when updated. Search and links span the complete base, not only today's layer.
- If the user supplies an already dated destination, do not nest another layer. Resolve its base and date/topic; if they explicitly override the filing convention, honor the exact destination.
- This is the default skill workflow. Low-level callers omitting captureDate retain legacy exact-folder behavior for compatibility.
