// Parser test harness — loads the REAL script.js in a Node vm sandbox with a
// minimal DOM stub, then exposes the pure parser functions for regression tests.
//
// The parser (parseUploadedJson / extractFirstJsonObject / reportFramework /
// validate* / normalize*) is the product core and is pure JS with no DOM
// dependency. script.js itself runs a bunch of init() calls at load time that
// touch the DOM, so we stub just enough of `document`/`window`/`navigator` for
// the file to evaluate, then reach into the sandbox for the functions we test.
//
// Run the suite with:  node --test tests/test_parser.mjs
// (or `python3 -m unittest discover -s tests` which shells out to node).

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = path.resolve(__dirname, "..", "script.js");

// --- Minimal DOM stub -----------------------------------------------------
// Only what the top-level init() calls touch. Every method is a no-op that
// returns a safe value so the file evaluates without throwing.

function makeElement() {
  const classList = {
    _set: new Set(),
    add: (...c) => c.forEach((x) => classList._set.add(x)),
    remove: (...c) => c.forEach((x) => classList._set.delete(x)),
    toggle: (c, force) => {
      const on = force === undefined ? !classList._set.has(c) : !!force;
      if (on) classList._set.add(c);
      else classList._set.delete(c);
      return on;
    },
    contains: (c) => classList._set.has(c),
  };
  return {
    classList,
    style: {},
    children: [],
    files: [],
    value: "",
    textContent: "",
    innerHTML: "",
    disabled: false,
    src: "",
    alt: "",
    setAttribute() {},
    getAttribute: () => null,
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    removeChild() {},
    addEventListener() {},
    removeEventListener() {},
    select() {},
    contains: () => false,
    setAttributeNS() {},
  };
}

function makeDocument() {
  const el = makeElement();
  return {
    getElementById: () => makeElement(),
    querySelector: () => makeElement(),
    querySelectorAll: () => [],
    createElement: () => makeElement(),
    createElementNS: () => makeElement(),
    createTextNode: (t) => ({ nodeType: 3, textContent: t }),
    addEventListener() {},
    removeEventListener() {},
    body: makeElement(),
    execCommand: () => true,
    fonts: { ready: Promise.resolve() },
  };
}

function makeWindow() {
  return {
    scrollTo() {},
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    requestAnimationFrame: (cb) => setTimeout(cb, 0),
    cancelAnimationFrame: () => {},
    print() {},
    html2canvas: async () => ({ toDataURL: () => "" }),
    fathom: { trackEvent() {} },
    addEventListener() {},
    removeEventListener() {},
  };
}

const sandbox = {
  document: makeDocument(),
  window: makeWindow(),
  navigator: { clipboard: { writeText: async () => {} } },
  FileReader: class {
    readAsText() {}
  },
  console,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  location: { href: "http://localhost/" },
  URL,
  Blob,
  Image: class {},
  requestAnimationFrame: (cb) => setTimeout(cb, 0),
  cancelAnimationFrame: () => {},
  matchMedia: () => ({ matches: false }),
};

sandbox.globalThis = sandbox;
vm.createContext(sandbox);

const source = readFileSync(SCRIPT_PATH, "utf8");
vm.runInContext(source, sandbox, { filename: "script.js" });

// The pure parser functions we test. These are defined at the top level of
// script.js, so they land on the sandbox global after evaluation.
export const parser = {
  parseUploadedJson: sandbox.parseUploadedJson,
  extractFirstJsonObject: sandbox.extractFirstJsonObject,
  reportFramework: sandbox.reportFramework,
  validateReport: sandbox.validateReport,
  validateJobReport: sandbox.validateJobReport,
  validatePersonalDevReport: sandbox.validatePersonalDevReport,
  validateWeeklyResetReport: sandbox.validateWeeklyResetReport,
  normalizeReport: sandbox.normalizeReport,
  normalizeJobReport: sandbox.normalizeJobReport,
  normalizePersonalDevReport: sandbox.normalizePersonalDevReport,
  normalizeWeeklyResetReport: sandbox.normalizeWeeklyResetReport,
  renderWeeklyResetReport: sandbox.renderWeeklyResetReport,
  radarCoveragePct: sandbox.radarCoveragePct,
  selectRadarAxes: sandbox.selectRadarAxes,
  normalizeRadar: sandbox.normalizeRadar,
  radarAxes: sandbox.radarAxes,
};

// Guard: if any function is missing, the harness is broken — fail loudly.
for (const [name, fn] of Object.entries(parser)) {
  if (typeof fn !== "function") {
    throw new Error(`parser-harness: script.js did not expose "${name}" — is the parser still in script.js?`);
  }
}

// The SVG-namespace tag set the DOM builder routes through createElementNS.
// Exposed for the BLD-1025 regression test: if a renderer's tag is missing
// from this set, `h()` builds an HTML element and the browser won't draw it.
// SVG_TAGS is a top-level `const`, which in a vm sandbox is a lexical binding
// (not a global property), so read it back via runInContext.
export const svgTags = vm.runInContext("SVG_TAGS", sandbox);
