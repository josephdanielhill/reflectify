// Render smoke test: call renderWeeklyResetReport + renderReport with the
// weekly sample through the real script.js sandbox (DOM stubbed by harness).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = path.resolve(__dirname, "..", "script.js");

function makeElement() {
  const classList = {
    _set: new Set(),
    add: (...c) => c.forEach((x) => classList._set.add(x)),
    remove: (...c) => c.forEach((x) => classList._set.delete(x)),
    toggle: (c, force) => { const on = force === undefined ? !classList._set.has(c) : !!force; if (on) classList._set.add(c); else classList._set.delete(c); return on; },
    contains: (c) => classList._set.has(c),
  };
  return {
    classList, style: {}, children: [], files: [], value: "", textContent: "",
    innerHTML: "", disabled: false, src: "", alt: "", tagName: "DIV",
    setAttribute() {}, getAttribute: () => null,
    appendChild(child) { this.children.push(child); return child; },
    removeChild() {}, addEventListener() {}, removeEventListener() {}, select() {},
    contains: () => false, setAttributeNS() {},
  };
}
function makeDocument() {
  const el = makeElement();
  return {
    getElementById: () => makeElement(),
    querySelector: () => makeElement(),
    querySelectorAll: () => [],
    createElement: (t) => { const e = makeElement(); e.tagName = (t || "div").toUpperCase(); return e; },
    createElementNS: () => makeElement(),
    createTextNode: (t) => ({ nodeType: 3, textContent: t }),
    addEventListener() {}, removeEventListener() {}, body: makeElement(),
    execCommand: () => true, fonts: { ready: Promise.resolve() },
  };
}
function makeWindow() {
  return {
    scrollTo() {}, matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    requestAnimationFrame: (cb) => setTimeout(cb, 0), cancelAnimationFrame: () => {},
    print() {}, html2canvas: async () => ({ toDataURL: () => "" }),
    fathom: { trackEvent() {} }, addEventListener() {}, removeEventListener() {},
  };
}
const sandbox = {
  document: makeDocument(), window: makeWindow(),
  navigator: { clipboard: { writeText: async () => {} } },
  FileReader: class { readAsText() {} }, console, setTimeout, clearTimeout,
  setInterval, clearInterval, location: { href: "http://localhost/" }, URL, Blob,
  Image: class {}, requestAnimationFrame: (cb) => setTimeout(cb, 0),
  cancelAnimationFrame: () => {}, matchMedia: () => ({ matches: false }),
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(readFileSync(SCRIPT_PATH, "utf8"), sandbox, { filename: "script.js" });

// Use the weekly sample (defined inline — consts aren't exposed on the vm global)
const sample = {
  weekLabel: "Week of 14 Sep",
  headline: "A week of steady momentum - you shipped the thing you'd been avoiding and finally protected an evening for yourself.",
  atAGlance: ["Shipped the migration you'd been dreading", "Said no to a meeting that would have wrecked your focus", "Energy dipped midweek but recovered by Friday"],
  wins: [{ title: "Shipped the migration", detail: "Finished the data migration you'd been putting off.", quote: "I kept dreading it, and then it just... took a morning." }],
  drains: [{ title: "Midweek meeting sprawl", detail: "Three back-to-back meetings on Wednesday." }],
  intentionReview: { lastIntention: "Start the migration before Friday", status: "kept", insight: "You kept it because the first step was tiny." },
  gratitude: ["A long walk on Tuesday", "A friend checking in"],
  letGo: ["The guilt about the migration"],
  nextFocus: { intention: "Protect two deep-work mornings", why: "The migration win showed the value of a focused morning.", firstStep: "Block Tuesday and Thursday 9-11am.", measure: "Two mornings without email before noon." },
  energy: { score: 6.5, note: "Drained by meetings, refilled by the walk." },
  quotes: [{ section: "wins", text: "I kept dreading it, and then it just... took a morning." }],
  sentiment: { label: "Steady", score: 42, note: "A grounded week ending on a high." },
  conclusion: "A week that proved the value of a small first step.",
};
const fw = sandbox.reportFramework(sample);
console.log("framework:", fw);
const { valid, errors } = sandbox.validateReport(sample);
console.log("valid:", valid, errors);
const norm = sandbox.normalizeReport(sample);
console.log("normalized weekLabel:", norm.weekLabel, "| energy:", norm.energy.score, "| nextFocus:", norm.nextFocus.intention);

// Render into a fake report-card element
const reportCard = makeElement();
sandbox.document.getElementById = () => reportCard;
sandbox.renderReport(norm);
console.log("renderReport OK, appended", reportCard.children.length, "top-level nodes");
const classes = reportCard.children.map((c) => c.getAttribute("class"));
console.log("top-level classes:", classes.join(" | "));
console.log("RENDER SMOKE OK");
