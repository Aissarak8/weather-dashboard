import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Atmos shell exposes branded, searchable, accessible landmarks", async () => {
  const html = await readFile("index.html", "utf8");

  assert.match(html, /<title>Atmos/);
  assert.match(html, /role="search"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /href="#weather-content"/);
});

test("design system defines atmospheric tokens and responsive breakpoints", async () => {
  const css = await readFile("style.css", "utf8");

  assert.match(css, /--cyan:/);
  assert.match(css, /--radius:/);
  assert.match(css, /@media \(max-width: 680px\)/);
});
