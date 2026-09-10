# Concept boundaries and depth

A card should be independently useful when found months later. Inventory concepts before picking titles or searching the vault.

- **Domain transition:** a discussion develops another field's knowledge. Keep its explanation in its own card even when the conversation reached it through an analogy or tangent.
- **General prerequisite:** a concept explains several applications beyond the current topic. Give it its own reusable card and link the application to it with the actual dependency.
- **Foundational concept:** a basic, important concept is explained with substance (mechanism, constraints, derivation or practical implications). Preserve it independently when it has its own retrieval value. A passing mention alone does not justify a thin card.
- **Same mechanism:** tightly coupled steps, qualifications and derivations of the same idea stay together. A card is not required for each noun or subsection.
- **Example rather than concept:** incidental facts, model-specific figures and worked exercises belong in FYI. Core retains the general lesson, not a catalog of equal-weight anecdotes.

Examples are guidance, not a fixed template or mandatory card count:

- A tokenization lesson develops Unicode/UTF-8, code points, bytes and grapheme clusters. Tokenization is an NLP mechanism; Unicode/UTF-8 is a general character-encoding prerequisite. Separate them, then connect Tokenization → Unicode with the reason that byte-level BPE consumes UTF-8 bytes and Chinese/emoji token boundaries need that representation. Core covers BPE's mechanism and limitations. Model vocabulary figures and a “20 words, 10 containing s” exercise go in FYI; the general weakness of token-based character constraints stays in Core.
- A broader LLM lesson explains Transformer attention, positions and the architecture in substance. Preserve Transformer as a foundation and connect supported applications. Merely naming Transformer is insufficient.
- A probability lesson derives Bayes' rule and walks through one diagnostic-test example. One Bayes card can hold the derivation in Core and the worked numbers in FYI; do not fragment every algebraic step.
- A conversation separately discusses gardening and Unicode without a conceptual bridge. Make independent cards if both contain reusable knowledge, but do not invent a connection from their shared session.

For each proposed split, give a short reason explaining the independent concept boundary. For each connection, explain the actual dependency or comparison; “same session” and “related topic” alone are not sufficient reasons.
