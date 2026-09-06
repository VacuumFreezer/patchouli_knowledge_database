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

async function widget() {
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
      params: { structuredContent: { ok: true, preview: preview() } },
    },
  }));
  await waitFor(() => window.document.querySelector("#title"), "review form");
  await waitFor(() => window.document.querySelector('[data-preview-for="detail"] .katex'), "rendered math preview");
  assert.equal(window.document.querySelector('[data-preview-for="detail"] img'), null);
  assert.match(window.document.querySelector('[data-preview-for="detail"] .image-placeholder').textContent, /tracking pixel/u);
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
  for (const [selector, message] of [["#summary", "Summary is required."], ["#detail", "Detail is required."]]) {
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
      () => window.document.querySelector('[role="status"]')?.textContent.includes("Detail cannot contain"),
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
