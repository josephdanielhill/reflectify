// Regression tests for the PDF/print empty-page fix (BLD-1045).
//
// The report PDF is a browser `window.print()` of `#report-card` using the
// `@media print` rules in style.css. Two bugs used to produce empty pages:
//   1. Non-report chrome (header, footer, toolbar, inactive views) kept its
//      layout size via `visibility: hidden`, so pagination contaminated by
//      page-sized phantom blocks — the PDF gained full empty pages.
//   2. A whole two-column topic grid was `break-inside: avoid`; when a grid
//      was taller than the page space left after its heading, the grid jumped
//      to the next page and stranded the heading alone above a blank page.
//
// These tests assert the print rules that fix both, so a future edit that
// reintroduces empty pages fails loudly here.
//
// Run with:  node --test tests/test_print_pdf.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSS = readFileSync(path.resolve(__dirname, "..", "style.css"), "utf8");

// Everything relevant lives inside the @media print block.
const printMatch = CSS.match(/@media\s+print\s*\{([\s\S]*?)\n\}/);
assert.ok(printMatch, "style.css must contain an @media print block");
const PRINT = printMatch[1];

test("print: non-report chrome is taken out of layout (display:none)", () => {
  // The header, footer, toolbar and inactive views must not contribute page
  // height in print, otherwise the PDF gains phantom empty pages.
  for (const sel of [
    ".header-container",
    ".site-footer",
    ".report-toolbar",
    ".beta-feedback",
    "#view-home",
    "#view-prompt",
    "#view-upload",
  ]) {
    assert.match(PRINT, new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      `print block should target ${sel}`);
  }
  assert.match(PRINT, /display\s*:\s*none\s*!important/,
    "non-report chrome should be display:none in print");
});

test("print: topic grid columns are allowed to split across pages", () => {
  // Keeping the whole grid unbreakable strands the section heading on its own
  // page. Grid and columns must be freely breakable so content flows forward.
  assert.match(PRINT, /\.report-card__grid[^}]*break-inside:\s*auto/,
    "grid should be break-inside:auto");
  assert.match(PRINT, /\.report-card__col[^}]*break-inside:\s*auto/,
    "columns should be break-inside:auto");
});

test("print: atomic report blocks still avoid breaking internally", () => {
  // Small units (an individual item, skill, quote) should stay intact; this is
  // what keeps the document looking tidy once the grid itself can split.
  assert.match(PRINT, /\.report-card__item[^}]*break-inside:\s*avoid/,
    "report-card__item should be break-inside:avoid");
  assert.match(PRINT, /\.report-card__skill[^}]*break-inside:\s*avoid/,
    "report-card__skill should be break-inside:avoid");
});

test("print: headings are kept with the content that follows them", () => {
  // A section heading must never be the last thing on a page (keep-with-next).
  // The heading-oriented selectors (h3, topic-head, labels) get a protective
  // break-after:avoid so it moves down with its content instead of leaving a
  // blank page.
  const headingRule = /\.report-card h3[\s\S]*?break-after:\s*avoid/;
  assert.match(PRINT, headingRule,
    "report-card headings should be break-after:avoid (keep-with-next)");
  assert.match(PRINT, /orphans:\s*3/,
    "body copy should have orphan control (no lone lines at page breaks)");
  assert.match(PRINT, /widows:\s*3/,
    "body copy should have widow control");
});