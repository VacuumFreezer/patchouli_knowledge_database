import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = await readFile(path.join(pluginRoot, "dist", "review-app.html"), "utf8");

function preview() {
  return {
    draft: {
      title: "UI Review",
      filename: "UI Review.md",
      categories: ["Testing"],
      summaryMarkdown: "Initial summary.",
      detailMarkdown: "Initial detailed explanation with $x^2$.\n\n$$\n\\int_0^1 x^2\\,dx = \\frac{1}{3}\n$$\n\n![tracking pixel](https://example.com/pixel.png)",
      evidence: [{ claim: "Initial claim", sourceReference: "Fixture" }],
      sources: [{ type: "text", label: "Fixture" }],
      connections: [{ cardRef: "Patchouli/Related.md", title: "Related", reason: "Shared topic", selected: false }],
    },
    collision: { exists: false, cardRef: "Patchouli/UI Review.md" },
    pendingToken: "p".repeat(43),
    expiresAt: "2030-01-01T00:00:00.000Z",
    confirmationRequired: true,
  };
}

async function waitFor(check, message = "condition") {
  const deadline = Date.now() + 2_000;
  while (Date.now() < deadline) {
    const value = check();
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error(`Timed out waiting for ${message}`);
}

async function widget(previewPayload = preview(), group = false) {
  const messages = [];
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    pretendToBeVisual: true,
    url: "https://patchouli.local/",
    beforeParse(window) {
      window.postMessage = (message) => {
        messages.push(message);
      };
    },
  });
  const { window } = dom;
  await waitFor(() => messages.some((message) => message.method === "ui/initialize"), "ui initialization");
  window.dispatchEvent(new window.MessageEvent("message", {
    source: window.parent,
    data: {
      jsonrpc: "2.0",
      method: "ui/notifications/tool-result",
      params: { structuredContent: { ok: true, [group ? "capturePreview" : "preview"]: previewPayload } },
    },
  }));
  await waitFor(() => window.document.querySelector("#title"), "review form");
  await waitFor(() => window.document.querySelector('[data-preview-for="core"] .katex'), "rendered math preview");
  assert.equal(window.document.querySelector('[data-preview-for="core"] img'), null);
  assert.match(window.document.querySelector('[data-preview-for="core"] .image-placeholder').textContent, /tracking pixel/u);
  return { dom, window, messages };
}

function input(window, selector, value) {
  const element = window.document.querySelector(selector);
  const prototype = element instanceof window.HTMLTextAreaElement
    ? window.HTMLTextAreaElement.prototype
    : window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, "value").set.call(element, value);
  element.dispatchEvent(new window.Event("input", { bubbles: true }));
  return element;
}

function groupPreview() {
  const original = preview();
  return { pendingToken: original.pendingToken, expiresAt: original.expiresAt, confirmationRequired: true,
    cards: ["Tokenization", "Unicode"].map((title, index) => ({ key: `card${index}`, splitReason: index ? "General prerequisite" : "NLP mechanism", selected: true, draft: { ...original.draft, title, fyiMarkdown: "Model example.", connections: [] }, resolvedDraft: original.draft, destinationRef: `NLP/${title}.md` })),
    relationships: [{ fromKey: "card0", toKey: "card1", reason: "UTF-8 explains the byte representation.", selected: true }],
  };
}

test("group UI edits all fields, refreshes renamed peer targets, and saves only the refreshed token", async () => {
  const { dom, window, messages } = await widget(groupPreview(), true);
  const button = text => [...window.document.querySelectorAll('button')].find(element => element.textContent === text);
  const reply = (call, structuredContent) => window.dispatchEvent(new window.MessageEvent('message', { source: window.parent, data: { jsonrpc: '2.0', id: call.id, result: { structuredContent } } }));
  try {
    assert.match(window.document.body.textContent, /Tokenization → Unicode/);
    button('Unicode').click(); await waitFor(() => window.document.querySelector('#title').value === 'Unicode');
    input(window, '#title', 'Unicode renamed'); input(window, '#fyi', 'Worked example revised.');
    input(window, '#detail', 'Core with $x^2$.'); input(window, '#claim-0', 'Edited evidence');
    input(window, '#source-label-0', 'Edited source'); input(window, '#peer-reason-0', 'Chinese and emoji use UTF-8 bytes.');
    await waitFor(() => button('Save all selected cards').disabled);
    assert.equal(messages.some(message => message.params?.name === 'save_capture'), false);
    button('Refresh preview').click();
    const refresh = await waitFor(() => messages.find(message => message.params?.name === 'preview_capture'));
    const args = refresh.params.arguments;
    assert.equal(args.cards[1].draft.title, 'Unicode renamed'); assert.equal(args.cards[1].draft.fyiMarkdown, 'Worked example revised.');
    assert.equal(args.cards[1].draft.evidence[0].claim, 'Edited evidence'); assert.equal(args.cards[1].draft.sources[0].label, 'Edited source');
    assert.equal('resolvedDraft' in args.cards[1], false);
    const refreshed = groupPreview(); refreshed.pendingToken = 'r'.repeat(43);
    refreshed.cards[1].draft = { ...refreshed.cards[1].draft, ...args.cards[1].draft }; refreshed.cards[1].destinationRef = 'NLP/Unicode renamed.md';
    reply(refresh, { ok: true, capturePreview: refreshed });
    await waitFor(() => !button('Save all selected cards').disabled);
    assert.match(window.document.body.textContent, /NLP\/Unicode renamed.md/);
    button('Save all selected cards').click();
    const save = await waitFor(() => messages.find(message => message.params?.name === 'save_capture'));
    assert.deepEqual(Object.keys(save.params.arguments).sort(), ['action', 'pendingToken']);
    assert.equal(save.params.arguments.pendingToken, 'r'.repeat(43));
    reply(save, { ok: false, error: { message: 'Only part of the capture was saved. Retry this same token.' } });
    await waitFor(() => !button('Save all selected cards').disabled);
    assert.match(window.document.querySelector('[role="status"]').textContent, /Only part/);
    button('Save all selected cards').click();
    const retry = await waitFor(() => messages.filter(message => message.params?.name === 'save_capture')[1]);
    assert.equal(retry.params.arguments.pendingToken, save.params.arguments.pendingToken);
    reply(retry, { ok: true, cards: [{ title: 'Tokenization' }, { title: 'Unicode renamed' }] });
    await waitFor(() => window.document.querySelector('[role="status"]').textContent === 'Saved 2 cards.');
  } finally { dom.window.close(); }
});

test("group UI omission deselects dangling peers and cancellation calls only token invalidation", async () => {
  const { dom, window, messages } = await widget(groupPreview(), true);
  try {
    window.document.querySelector('input[aria-label="Include Unicode"]').click();
    await waitFor(() => [...window.document.querySelectorAll('input[type="checkbox"]')].filter(input => input.disabled).length === 1);
    const peer = [...window.document.querySelectorAll('input[type="checkbox"]')].find(input => input.disabled);
    assert.equal(peer.checked, false);
    [...window.document.querySelectorAll('button')].find(button => button.textContent === 'Cancel capture').click();
    const cancel = await waitFor(() => messages.find(message => message.params?.name === 'save_capture'));
    assert.equal(cancel.params.arguments.action, 'cancel');
    assert.equal(messages.some(message => message.params?.name === 'save_card'), false);
  } finally { dom.window.close(); }
});

test("edits every draft group, enters categories, selects links, and calls save_card", async () => {
  const { dom, window, messages } = await widget();
  try {
    input(window, "#title", "Edited UI Review");
    input(window, "#categories", "Testing, Interface");
    input(window, "#summary", "Edited summary.");
    const editedDetail = "### Derivation\n\nEdited detail with\n\n$$\nx = \\frac{2}{1}\n$$";
    input(window, "#detail", editedDetail);
    input(window, "#claim-0", "Edited claim");
    input(window, "#reference-0", "Edited fixture");
    input(window, "#source-type-0", "markdown");
    input(window, "#source-label-0", "Edited source");
    input(window, "#source-url-0", "https://example.com/source");
    const connection = window.document.querySelector('input[type="checkbox"]');
    connection.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const focusables = [...window.document.querySelectorAll("input, textarea, button")];
    focusables[0].focus();
    assert.equal(window.document.activeElement, focusables[0]);
    assert.equal(window.document.querySelectorAll('[tabindex^="-"]').length, 0);

    window.document.querySelector('button[type="submit"]').click();
    const call = await waitFor(
      () => messages.find((message) => message.method === "tools/call" && message.params?.name === "save_card"),
      "save tool call",
    );
    assert.equal(call.params.arguments.pendingToken, "p".repeat(43));
    assert.equal(call.params.arguments.draft.title, "Edited UI Review");
    assert.deepEqual(Array.from(call.params.arguments.draft.categories), ["Testing", "Interface"]);
    assert.equal(call.params.arguments.draft.summaryMarkdown, "Edited summary.");
    assert.equal(call.params.arguments.draft.detailMarkdown, editedDetail);
    assert.equal("annotation" in call.params.arguments.draft, false);
    assert.equal("understandingMarkdown" in call.params.arguments.draft, false);
    assert.equal(call.params.arguments.draft.evidence[0].claim, "Edited claim");
    assert.equal(call.params.arguments.draft.sources[0].url, "https://example.com/source");
    assert.equal(call.params.arguments.draft.connections[0].selected, true);
    assert.equal("filename" in call.params.arguments.draft, false);
  } finally {
    dom.window.close();
  }
});

test("requires Summary and Detail with accessible feedback and does not call save for invalid edits", async () => {
  for (const [selector, message] of [["#summary", "Summary is required."], ["#detail", "Core is required."]]) {
    const { dom, window, messages } = await widget();
    try {
      input(window, selector, " ");
      await new Promise((resolve) => setTimeout(resolve, 0));
      window.document.querySelector('button[type="submit"]').click();
      const status = await waitFor(
        () => window.document.querySelector('[role="status"]')?.textContent.includes(message),
        "validation status",
      );
      assert.equal(status, true);
      assert.equal(messages.some((item) => item.method === "tools/call"), false);
    } finally {
      dom.window.close();
    }
  }
});

test("rejects server-owned headings before calling save_card", async () => {
  const { dom, window, messages } = await widget();
  try {
    input(window, "#detail", "## Evidence\nInjected section");
    await new Promise((resolve) => setTimeout(resolve, 0));
    window.document.querySelector('button[type="submit"]').click();
    await waitFor(
      () => window.document.querySelector('[role="status"]')?.textContent.includes("Core cannot contain"),
      "heading validation status",
    );
    assert.equal(messages.some((item) => item.method === "tools/call"), false);
  } finally {
    dom.window.close();
  }
});

test("Cancel is explicit, calls ui/message, and never calls save_card", async () => {
  const { dom, window, messages } = await widget();
  try {
    [...window.document.querySelectorAll("button")].find((button) => button.textContent === "Cancel").click();
    const message = await waitFor(
      () => messages.find((item) => item.method === "ui/message"),
      "cancel message",
    );
    assert.match(message.params.content[0].text, /Do not save/u);
    assert.match(window.document.querySelector('[role="status"]').textContent, /Nothing was written/u);
    assert.equal(messages.some((item) => item.method === "tools/call"), false);
  } finally {
    dom.window.close();
  }
});

test("renders an update review and calls only update_card after confirmation", async () => {
  const updatePreview = {
    ...preview(),
    operation: "update",
    collision: undefined,
    target: {
      cardRef: "Patchouli/UI Review.md",
      title: "UI Review",
      revision: "a".repeat(64),
    },
    destination: {
      cardRef: "Patchouli/UI Review.md",
      renamed: false,
      collision: false,
    },
  };
  const { dom, window, messages } = await widget(updatePreview);
  try {
    assert.match(window.document.querySelector("h1").textContent, /Refine/u);
    assert.match(window.document.querySelector('button[type="submit"]').textContent, /Update card/u);
    window.document.querySelector('button[type="submit"]').click();
    const call = await waitFor(
      () => messages.find((message) => message.method === "tools/call"),
      "update tool call",
    );
    assert.equal(call.params.name, "update_card");
    assert.equal(call.params.arguments.pendingToken, "p".repeat(43));
    assert.equal(messages.some((message) => message.params?.name === "save_card"), false);
  } finally {
    dom.window.close();
  }
});

test("shows a host save failure, allows retry, then confirms success without a duplicate request", async () => {
  const { dom, window, messages } = await widget();
  try {
    window.document.querySelector('button[type="submit"]').click();
    const first = await waitFor(() => messages.find((item) => item.method === "tools/call"));
    window.dispatchEvent(new window.MessageEvent("message", { source: window.parent, data: { jsonrpc: "2.0", id: first.id, result: { structuredContent: { ok: false, error: { code: "IO_ERROR", message: "Temporary write failure." } } } } }));
    await waitFor(() => window.document.querySelector('[role="status"]').textContent.includes("Temporary write failure"));
    assert.equal(window.document.querySelector('button[type="submit"]').disabled, false);
    window.document.querySelector('button[type="submit"]').click();
    const second = await waitFor(() => messages.filter((item) => item.method === "tools/call")[1]);
    assert.equal(second.params.arguments.pendingToken, first.params.arguments.pendingToken);
    window.dispatchEvent(new window.MessageEvent("message", { source: window.parent, data: { jsonrpc: "2.0", id: second.id, result: { structuredContent: { ok: true, card: { title: "UI Review", cardRef: "Patchouli/UI Review.md" } } } } }));
    await waitFor(() => window.document.querySelector('[role="status"]').textContent.includes("Saved UI Review"));
    assert.equal(window.document.querySelector('button[type="submit"]').disabled, true);
    assert.equal(messages.filter((item) => item.method === "tools/call").length, 2);
  } finally { dom.window.close(); }
});
