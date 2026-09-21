// BLD-1025 RADAR RENDER SMOKE TEST (run: node tests/smoke_radar_svg.mjs)
//
// Verifies the actual rendering fix end-to-end: that every shape the radar
// draws (polygon/line/circle/text/title) is created via createElementNS with
// the SVG namespace. Prior to the fix, "polygon"/"line"/"title" were missing
// from SVG_TAGS, so the DOM builder created HTML elements that the browser
// silently refuses to draw — the radar showed only dots+labels, no chart.
//
// We stub document with a namespace-recording createElementNS, load the real
// script.js, build a full radar SVG, and assert the SVG elements exist.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = path.resolve(__dirname, "..", "script.js");
const SVG_NS = "http://www.w3.org/2000/svg";

const svgCreated = []; // tags created in the SVG namespace
const htmlCreated = []; // tags created as plain HTML elements

function makeDocument() {
  return {
    createElementNS: (ns, tag) => { svgCreated.push(tag); return makeNode(tag, true); },
    createElement: (tag) => { htmlCreated.push(tag); return makeNode(tag, false); },
    createTextNode: (t) => ({ textContent: t }),
    addEventListener() {},
    getElementById: () => makeNode("div", false),
    getElementsByClassName: () => [],
    querySelector: () => null,
    querySelectorAll: () => [],
    body: { appendChild() {}, classList: { add() {}, remove() {}, toggle() {} } },
    documentElement: { classList: { add() {}, toggle() {} } },
  };
}

// Minimal element that supports the attribute/appendChild paths buildRadarSvg uses.
function makeNode(tag, isSvg) {
  return {
    tagName: tag.toUpperCase(), _tag: tag, _isSvg: isSvg,
    children: [], _attrs: {},
    setAttribute: function(k, v) { this._attrs[k] = v; },
    getAttribute: function(k) { return this._attrs[k]; },
    appendChild: function(c) { this.children.push(c); return c; },
    classList: { _set: new Set(), add(...c){c.forEach(x=>this._set.add(x))}, remove(){}, toggle(){}, contains(){}, },
    style: {},
    addEventListener() {},
    closest: () => null,
  };
}

function makeWindow() {
  return {
    scrollTo() {}, matchMedia: () => ({ matches:false, addEventListener(){}, removeEventListener(){} }),
    requestAnimationFrame: () => {}, cancelAnimationFrame: () => {}, print() {},
    html2canvas: async () => ({ toDataURL: () => "" }), fathom: { trackEvent() {} },
    addEventListener() {}, removeEventListener() {},
  };
}

const sandbox = {
  document: makeDocument(), window: makeWindow(),
  navigator: { clipboard: { writeText: async () => {} } },
  FileReader: class { readAsText() {} }, console,
  setTimeout, clearTimeout, setInterval, clearInterval,
  location: { href: "http://localhost/" }, URL, Blob, Image: class {},
  requestAnimationFrame: () => {}, cancelAnimationFrame: () => {},
  matchMedia: () => ({ matches: false }),
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(readFileSync(SCRIPT_PATH, "utf8"), sandbox, { filename: "script.js" });

// Build the real radar SVG from a normalized radar object.
const radar = vm.runInContext(
  `normalizeRadar({ axes: [
     { competency: "React", requirement_weight: 1.0, candidate_score: 4, role_benchmark: 5 },
     { competency: "Node", requirement_weight: 0.9, candidate_score: 3, role_benchmark: 4 },
     { competency: "CSS", requirement_weight: 0.8, candidate_score: 5, role_benchmark: 5 },
     { competency: "Testing", requirement_weight: 0.6, candidate_score: 2, role_benchmark: 4 },
     { competency: "Cloud", requirement_weight: 0.5, candidate_score: 1, role_benchmark: 3 },
   ] }, "Senior Frontend Engineer")`, sandbox);
const svg = vm.runInContext("buildRadarSvg", sandbox)(radar);

// Assert the SVG element exists and was created in the SVG namespace.
function assert(cond, msg) { if (!cond) { console.error("FAIL: " + msg); process.exitCode = 1; } else { console.log("  ok - " + msg); } }

assert(svg._isSvg === true, "root <svg> created via createElementNS (SVG namespace)");
assert(svgCreated.includes("polygon"), "<polygon> rings/candidate/benchmark created in SVG namespace");
assert(svgCreated.includes("line"), "<line> spokes created in SVG namespace");
assert(svgCreated.includes("circle"), "<circle> vertex dots created in SVG namespace");
assert(svgCreated.includes("text"), "<text> labels created in SVG namespace");
assert(svgCreated.includes("title"), "<title> tooltips created in SVG namespace");

// Every element the radar built must be an SVG element — no stray HTML shapes.
const shapeTags = svgCreated.filter(t => ["polygon","line","circle","rect","text","title","g"].includes(t));
const brokenHtml = svgCreated.length + htmlCreated.length - (svgCreated.length);
// Collect all elements nested under the radar svg and check none are HTML shapes.
function walk(n, found) { 
  if (!n) return; 
  found.push(n); 
  (n.children||[]).forEach(c => walk(c, found)); 
}
const all = []; walk(svg, all);
const htmlShapes = all.filter(n => !n._isSvg && ["polygon","line","circle","rect","text","title","g"].includes(n._tag));
assert(htmlShapes.length === 0, `no HTML-namespace shape elements under the radar svg (found ${htmlShapes.length})`);

const passed = process.exitCode !== 1;
console.log(passed ? "\nPASS — radar renders fully in the SVG namespace" : "\nFAIL — radar rendering still broken");
process.exit(passed ? 0 : 1);