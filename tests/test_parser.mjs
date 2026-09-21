// Regression test suite for the Reflectify JSON/chat-log parser (BLD-1027).
//
// The parser is the product core: reports render entirely client-side from
// user-supplied JSON, so schema drift in model output must degrade gracefully
// instead of hard-crashing the render. These tests run the REAL parser from
// script.js (via parser-harness.mjs) and guard four behaviours:
//
//   1. Exact-schema JSON (happy path) — both frameworks validate + normalize.
//   2. Malformed / partial / schema-divergent JSON — graceful degradation,
//      never a throw from validate/normalize.
//   3. Multi-language output — keys stay English, prose stays localized.
//   4. Raw chat-log paste — currently degrades to a clean error (no crash);
//      the fallback parser's tests slot in here once it lands.
//
// Run with:  node --test tests/test_parser.mjs
// (or `python3 -m unittest discover -s tests`, which shells out to node.)

import { test } from "node:test";
import assert from "node:assert/strict";
import { parser, svgTags } from "./parser-harness.mjs";

const {
  parseUploadedJson,
  extractFirstJsonObject,
  reportFramework,
  validateReport,
  normalizeReport,
  radarCoveragePct,
  selectRadarAxes,
  normalizeRadar,
  radarAxes,
} = parser;

// The parser runs inside a Node vm sandbox, so its arrays/objects carry a
// different realm's prototype. assert.deepEqual (strict) rejects those on
// prototype identity, so compare cross-realm values by their JSON shape.
const jsonEqual = (actual, expected) =>
  assert.equal(JSON.stringify(actual), JSON.stringify(expected));

// A fully-populated, exact-schema Job report (matches the README schema).
const JOB_REPORT = {
  jobTitle: "Senior Product Designer",
  periodMonths: 12,
  overallScore: 8.5,
  headline: "A year of shipping and levelling up.",
  summary: "Led the redesign, grew the craft, and shipped a lot.",
  summaryBullets: ["Shipped the redesign", "Mentored two juniors"],
  achievements: [
    { title: "Redesign", detail: "Led the 2026 redesign end to end.", quote: "I owned it." },
  ],
  achievementsAnalysis: "The wins cluster around ownership and craft.",
  achievementSuggestions: ["Keep leading big bets"],
  challenges: [{ title: "Scope", detail: "Too much scope, learned to cut." }],
  challengesAnalysis: "Challenges were about focus.",
  regrets: [{ title: "Slow start", detail: "Took too long to ask for help." }],
  regretsAnalysis: "Regrets centre on speed.",
  regretSuggestions: ["Ask for help earlier"],
  skills: [
    { name: "Visual design", level: 9 },
    { name: "Prototyping", level: 7.5 },
  ],
  skillsAnalysis: "Design craft is the standout strength.",
  skillDirections: [{ role: "Design lead", reason: "Strong craft and ownership." }],
  quotes: [
    { section: "achievements", text: "I owned it." },
    { section: "goals", text: "I want to lead a team." },
  ],
  goals: [
    { title: "Lead a team", detail: "Move into a lead role.", measure: "Title change", suggestion: "Take on a mentee" },
  ],
  goalsAnalysis: "Goals build on the leadership theme.",
  wellbeing: { score: 7.5, note: "Energy was good.", suggestions: ["Sleep more"] },
  sentiment: {
    label: "Mostly positive",
    score: 62,
    note: "Tone was warm throughout.",
    positives: ["Ownership", "Craft"],
    improvements: ["Speed"],
  },
  conclusion: "A strong year with a clear path forward.",
};

// A fully-populated, exact-schema Personal Development report.
const DEV_REPORT = {
  season: "building",
  periodMonths: 6,
  lifeStory: "A season of building a new practice.",
  values: {
    claimed: ["Courage", "Curiosity"],
    actual: ["Courage"],
    congruence: "Mostly aligned.",
    realignment: ["Say no more often"],
  },
  growth: [
    { quality: "Consistency", change: 40 },
    { quality: "Patience", change: -10 },
  ],
  growthAnalysis: "Consistency grew, patience dipped.",
  shed: [{ item: "Perfectionism" }],
  shedAnalysis: "Letting go of perfectionism.",
  patterns: [{ name: "Overcommit", moment: "Said yes to three projects." }],
  patternsAnalysis: "Overcommitment is the recurring pattern.",
  patternDirections: ["Batch commitments"],
  relationships: { note: "Closer to a few people.", balance: "Good.", suggestions: ["Call weekly"] },
  wellbeing: { score: 72, note: "Steady.", draining: "Late nights", refilling: "Walks", suggestions: ["Walk daily"] },
  quotes: [{ section: "growth", text: "I showed up every day." }],
  becoming: "Becoming someone who finishes what they start.",
  northStar: { commitment: "Finish the book", why: "It matters", measure: "Draft done", suggestions: ["Write daily"] },
  sentiment: { label: "Positive", score: 55, note: "Upward trend.", positives: ["Consistency"], tensions: ["Patience"] },
  conclusion: "A season of building momentum.",
};

// ---------------------------------------------------------------------------
// 1. Happy path — exact-schema JSON
// ---------------------------------------------------------------------------

test("job report: exact schema validates and normalizes without error", () => {
  const { valid, errors } = validateReport(JOB_REPORT);
  assert.equal(valid, true, `expected valid, got errors: ${errors.join("; ")}`);
  const norm = normalizeReport(JOB_REPORT);
  assert.equal(norm.jobTitle, "Senior Product Designer");
  assert.equal(norm.overallScore, 8.5);
  assert.equal(norm.skills[0].levelPct, "90%"); // 9 * 10
  assert.equal(norm.skills[1].levelPct, "75%"); // 7.5 * 10
  assert.equal(norm.sentiment.pct, "81%"); // (62 + 100) / 2
  assert.equal(norm.wellbeing.pct, "75%"); // 7.5 * 10
});

test("personal-dev report: exact schema validates and normalizes without error", () => {
  const { valid, errors } = validateReport(DEV_REPORT);
  assert.equal(valid, true, `expected valid, got errors: ${errors.join("; ")}`);
  const norm = normalizeReport(DEV_REPORT);
  assert.equal(norm.season, "building");
  assert.equal(norm.growth[0].pct, "70%"); // (40 + 100) / 2
  assert.equal(norm.growth[1].pct, "45%"); // (-10 + 100) / 2
  assert.equal(norm.wellbeing.pct, "72%");
});

test("framework detection routes job vs personal-dev correctly", () => {
  assert.equal(reportFramework(JOB_REPORT), "job-reflection");
  assert.equal(reportFramework(DEV_REPORT), "personal-development");
  // A job report that happens to carry a dev-only key is treated as dev.
  assert.equal(reportFramework({ ...JOB_REPORT, season: "x" }), "personal-development");
  // Non-objects are job-reflection (and will fail validation, not crash).
  assert.equal(reportFramework(null), "job-reflection");
  assert.equal(reportFramework("nope"), "job-reflection");
});

// ---------------------------------------------------------------------------
// 2. Malformed / partial / schema-divergent JSON — graceful degradation
// ---------------------------------------------------------------------------

test("parseUploadedJson: plain JSON object parses", () => {
  const r = parseUploadedJson('{"jobTitle":"Dev","periodMonths":6,"overallScore":8}');
  assert.equal(r.jobTitle, "Dev");
});

test("parseUploadedJson: fenced ```json code block parses", () => {
  const r = parseUploadedJson('```json\n{"jobTitle":"Dev","periodMonths":6,"overallScore":8}\n```');
  assert.equal(r.jobTitle, "Dev");
});

test("parseUploadedJson: fenced ``` (no language) code block parses", () => {
  const r = parseUploadedJson('```\n{"jobTitle":"Dev","periodMonths":6,"overallScore":8}\n```');
  assert.equal(r.jobTitle, "Dev");
});

test("parseUploadedJson: JSON embedded in surrounding prose is extracted", () => {
  const r = parseUploadedJson(
    'Here is your report:\n{"jobTitle":"Dev","periodMonths":6,"overallScore":8}\nHope it helps!'
  );
  assert.equal(r.jobTitle, "Dev");
});

test("extractFirstJsonObject: finds the first balanced object, ignoring strings/escapes", () => {
  const text = 'prefix {"a":"has { brace","b":[1,2,{"c":3}]} suffix';
  const extracted = extractFirstJsonObject(text);
  assert.equal(extracted, '{"a":"has { brace","b":[1,2,{"c":3}]}');
});

test("extractFirstJsonObject: returns null when no object present", () => {
  assert.equal(extractFirstJsonObject("no braces here"), null);
  assert.equal(extractFirstJsonObject(""), null);
});

test("parseUploadedJson: truly invalid input throws (caller shows error, no crash)", () => {
  assert.throws(() => parseUploadedJson("this is not json at all"));
  assert.throws(() => parseUploadedJson(""));
  // "[]" is valid JSON so it parses to an array (no throw) — but the array is
  // not a report object, so validation must reject it downstream.
  assert.doesNotThrow(() => parseUploadedJson("[]"));
  assert.equal(validateReport(parseUploadedJson("[]")).valid, false);
});

test("validateReport: missing required fields reports errors, does not throw", () => {
  const { valid, errors } = validateReport({});
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes("jobTitle")));
  assert.ok(errors.some((e) => e.includes("periodMonths")));
  assert.ok(errors.some((e) => e.includes("overallScore")));
});

test("validateReport: wrong types on required fields are rejected", () => {
  const bad = {
    jobTitle: 42,
    periodMonths: "six",
    overallScore: 11, // out of 0-10 range
  };
  const { valid, errors } = validateReport(bad);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes("jobTitle")));
  assert.ok(errors.some((e) => e.includes("periodMonths")));
  assert.ok(errors.some((e) => e.includes("overallScore")));
});

test("validateReport: non-object input is rejected cleanly", () => {
  for (const bad of [null, "text", 42, [], true]) {
    const { valid, errors } = validateReport(bad);
    assert.equal(valid, false, `expected invalid for ${JSON.stringify(bad)}`);
    assert.ok(errors.length > 0);
  }
});

test("validateReport: schema-divergent extra keys are tolerated (lenient)", () => {
  const divergent = {
    ...JOB_REPORT,
    someFutureKey: { nested: true },
    anotherUnknown: "value",
  };
  const { valid, errors } = validateReport(divergent);
  assert.equal(valid, true, `extra keys must not fail validation: ${errors.join("; ")}`);
});

test("validateReport: malformed optional arrays are rejected, not crashed on", () => {
  const bad = {
    ...JOB_REPORT,
    achievements: "not an array",
    skills: [{ name: "x", level: 99 }], // level out of 0-10
    timeline: [{ label: "", detail: 5 }],
  };
  const { valid, errors } = validateReport(bad);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes("achievements")));
  assert.ok(errors.some((e) => e.includes("skills")));
  assert.ok(errors.some((e) => e.includes("timeline")));
});

test("normalizeReport: partial report defaults missing optional fields, never throws", () => {
  const partial = { jobTitle: "Dev", periodMonths: 6, overallScore: 8 };
  const norm = normalizeReport(partial);
  jsonEqual(norm.achievements, []);
  jsonEqual(norm.regrets, []);
  jsonEqual(norm.goals, []);
  jsonEqual(norm.quotes, []);
  assert.equal(norm.headline, "");
  assert.equal(norm.sentiment, null);
  assert.equal(norm.wellbeing, null);
  assert.ok(typeof norm.conclusion === "string" && norm.conclusion.length > 0);
});

test("normalizeReport: schema-divergent / weird input never throws", () => {
  const weird = {
    jobTitle: "Dev",
    periodMonths: 6,
    overallScore: 8,
    skills: [{ name: "x", level: "not-a-number" }],
    quotes: [42, null, { text: "ok" }, "legacy string"],
    sentiment: { score: 999, label: 5 },
    wellbeing: { score: "high" },
  };
  const norm = normalizeReport(weird); // must not throw
  assert.equal(norm.skills[0].levelPct, "0%"); // Number("not-a-number")||0 -> 0
  assert.equal(norm.quotes.length, 2); // {text:"ok"} + "legacy string"
  assert.equal(norm.sentiment.score, 100); // clamped to 100
  assert.equal(norm.wellbeing, null); // score not a number -> dropped
});

test("normalizeReport: legacy string quotes are upgraded to object form", () => {
  const norm = normalizeReport({ ...JOB_REPORT, quotes: ["plain quote"] });
  jsonEqual(norm.quotes, [{ section: "general", text: "plain quote" }]);
});

// ---------------------------------------------------------------------------
// 3. Multi-language output — keys stay English, prose localized
// ---------------------------------------------------------------------------

test("German prose with English keys validates and normalizes", () => {
  const de = {
    jobTitle: "Produktdesignerin",
    periodMonths: 12,
    overallScore: 8,
    headline: "Ein Jahr voller Fortschritt.",
    summary: "Ich habe viel gelernt und viel geliefert.",
    achievements: [{ title: "Redesign", detail: "Habe das Redesign geleitet." }],
    skills: [{ name: "Visuelles Design", level: 9 }],
    goals: [{ title: "Team leiten", detail: "In eine Führungsrolle wachsen." }],
    conclusion: "Ein starkes Jahr mit klarem Weg nach vorn.",
  };
  const { valid, errors } = validateReport(de);
  assert.equal(valid, true, `German report should validate: ${errors.join("; ")}`);
  const norm = normalizeReport(de);
  assert.equal(norm.headline, "Ein Jahr voller Fortschritt.");
  assert.equal(norm.achievements[0].title, "Redesign");
  assert.equal(norm.skills[0].name, "Visuelles Design");
});

test("Spanish prose with English keys validates and normalizes", () => {
  const es = {
    jobTitle: "Diseñadora de producto",
    periodMonths: 6,
    overallScore: 7.5,
    headline: "Un semestre de crecimiento.",
    summary: "Aprendí mucho y entregué mucho.",
    conclusion: "Un semestre fuerte con un camino claro.",
  };
  const { valid, errors } = validateReport(es);
  assert.equal(valid, true, `Spanish report should validate: ${errors.join("; ")}`);
  const norm = normalizeReport(es);
  assert.equal(norm.headline, "Un semestre de crecimiento.");
});

// ---------------------------------------------------------------------------
// 4. Raw chat-log paste — graceful degradation (fallback parser TBD)
// ---------------------------------------------------------------------------

test("raw chat log (no JSON) degrades to a clean error, never a crash", () => {
  const chatLog = [
    "User: I want to reflect on my year as a designer.",
    "Assistant: Great! What language would you like to use?",
    "User: English.",
    "Assistant: How many months should this cover?",
    "User: 12 months.",
  ].join("\n");
  // No JSON object present -> parseUploadedJson throws (handleJsonText catches
  // it and shows the upload error). This is the current graceful path.
  assert.throws(() => parseUploadedJson(chatLog));
  // And even if it somehow parsed, validate must not crash on the result.
  assert.doesNotThrow(() => validateReport(chatLog));
});

test("chat-log fallback parser: placeholder for when it lands (BLD-1027)", () => {
  // The paste-raw-chat-log fallback parser is not yet implemented. When it
  // lands, add its regression cases here: a chat log with no JSON should be
  // parsed into a valid report instead of erroring. Until then, the assertion
  // below documents the current behaviour so the gap is explicit.
  const chatLog = "User: hello\nAssistant: hi";
  assert.throws(() => parseUploadedJson(chatLog), "raw chat log has no JSON today");
});

// ---------------------------------------------------------------------------
// 5. Competency radar (BLD-1025)
// ---------------------------------------------------------------------------

test("radarCoveragePct: candidate ÷ benchmark × 100, never a bare number", () => {
  assert.equal(radarCoveragePct(4, 5), 80);
  assert.equal(radarCoveragePct(5, 5), 100);
  assert.equal(radarCoveragePct(2, 4), 50);
  // candidate can exceed the benchmark (coverage > 100%) and is meaningful
  assert.equal(radarCoveragePct(5, 4), 125);
  // guards: bad benchmark -> 0, non-numeric candidate -> 0
  assert.equal(radarCoveragePct(3, 0), 0);
  assert.equal(radarCoveragePct("n/a", 5), 0);
});

const SIX_AXES = [
  { competency: "React", requirement_weight: 1.0, candidate_score: 4, role_benchmark: 5 },
  { competency: "TypeScript", requirement_weight: 0.9, candidate_score: 4, role_benchmark: 4 },
  { competency: "Testing", requirement_weight: 0.8, candidate_score: 3, role_benchmark: 4 },
  { competency: "Web performance", requirement_weight: 0.7, candidate_score: 4, role_benchmark: 5 },
  { competency: "Design systems", requirement_weight: 0.6, candidate_score: 3, role_benchmark: 3 },
  { competency: "Accessibility", requirement_weight: 0.7, candidate_score: 0, role_benchmark: 5 },
];

test("selectRadarAxes: keeps only scored axes; no-evidence goes to unscored", () => {
  const { axes, unscored } = selectRadarAxes(SIX_AXES);
  // Accessibility has candidate_score 0 -> unscored, not an axis
  assert.equal(axes.length, 5);
  assert.ok(unscored.includes("Accessibility"));
  // coverage_pct computed on every axis
  const react = axes.find((a) => a.competency === "React");
  assert.equal(react.coverage_pct, 80);
  const ts = axes.find((a) => a.competency === "TypeScript");
  assert.equal(ts.coverage_pct, 100);
});

test("selectRadarAxes: caps at 8 by requirement_weight, surplus goes to unscored", () => {
  const many = [];
  for (let i = 0; i < 12; i++) {
    many.push({
      competency: `C${i}`,
      requirement_weight: 1 - i / 20, // descending importance
      candidate_score: 4,
      role_benchmark: 5,
    });
  }
  const { axes, unscored } = selectRadarAxes(many);
  assert.equal(axes.length, 8); // hard cap
  assert.equal(axes[0].competency, "C0"); // highest weight first
  assert.ok(unscored.length >= 4);
  assert.ok(!unscored.includes("C0"));
  // all 12 competencies accounted for across axes + unscored
  const accounted = new Set(axes.map((a) => a.competency).concat(unscored));
  assert.equal(accounted.size, 12);
});

test("selectRadarAxes: guards against malformed / missing axes", () => {
  jsonEqual(selectRadarAxes(undefined), { axes: [], unscored: [] });
  jsonEqual(selectRadarAxes("nope"), { axes: [], unscored: [] });
  const { axes, unscored } = selectRadarAxes([
    { competency: "", candidate_score: 4, role_benchmark: 5 }, // blank name -> dropped
    null,
    { competency: "NoBench", candidate_score: 4 }, // no benchmark -> no evidence
    { competency: "Ok", candidate_score: 4, role_benchmark: 3 },
  ]);
  assert.equal(axes.length, 1);
  assert.equal(axes[0].competency, "Ok");
  assert.ok(unscored.includes("NoBench"));
});

test("normalizeRadar: returns null for <3 axes (falls back to bars)", () => {
  const twoAxes = {
    role_title: "Role",
    axes: [
      { competency: "A", candidate_score: 4, role_benchmark: 5 },
      { competency: "B", candidate_score: 3, role_benchmark: 4 },
    ],
  };
  assert.equal(normalizeRadar(twoAxes, "Role"), null);
  assert.equal(normalizeRadar(null, "Role"), null);
  assert.equal(normalizeRadar({}, "Role"), null);
});

test("normalizeRadar: unscored merged + deduped, role_title defaulted", () => {
  const radar = normalizeRadar(
    { axes: SIX_AXES, unscored_competencies: ["Design engineering"] },
    "Senior Frontend Engineer"
  );
  assert.ok(radar);
  assert.equal(radar.role_title, "Senior Frontend Engineer"); // defaulted
  assert.equal(radar.benchmark_basis, "job_posting"); // defaulted
  assert.equal(radar.axes.length, 5);
  // Accessibility (unscored by axis scoring) + declared unscored merged
  assert.ok(radar.unscored_competencies.includes("Accessibility"));
  assert.ok(radar.unscored_competencies.includes("Design engineering"));
});

test("radarAxes: one angle per axis, evenly spaced starting at top (-90°)", () => {
  const radar = normalizeRadar({ axes: SIX_AXES }, "R");
  const entries = radarAxes(radar);
  assert.equal(entries.length, 5);
  assert.equal(entries[0].angle, -90);
  const step = 360 / 5;
  entries.forEach((e, i) => assert.equal(e.angle, -90 + i * step));
});

test("normalizeReport: radar present normalizes; absent radar -> null (backward compat)", () => {
  const withRadar = {
    jobTitle: "Senior Frontend Engineer",
    periodMonths: 6,
    overallScore: 8,
    radar: { axes: SIX_AXES },
  };
  const norm = normalizeReport(withRadar);
  assert.ok(norm.radar);
  assert.equal(norm.radar.axes.length, 5);

  // legacy report with no radar still normalizes; radar is null
  const legacy = { jobTitle: "Dev", periodMonths: 6, overallScore: 8 };
  assert.equal(normalizeReport(legacy).radar, null);
});

test("BLD-1025 REGRESSION: every DOM element the radar emits is an SVG-namespace tag", () => {
  // Every tag that `buildRadarSvg` (rings/spokes/benchmark/candidate/labels)
  // and `buildRadarBars` pass to the DOM builder `h()` MUST be in SVG_TAGS.
  // The DOM builder routes SVG tags through createElementNS; anything missing
  // gets created as an HTML element and the browser silently refuses to draw
  // it. Prior regression: the radar rendered only its circles+labels with the
  // polygon/line shapes missing entirely (`polygon`, `line`, `title` were not
  // in the set).
  for (const tag of ["polygon", "line", "circle", "text", "title", "svg"]) {
    assert.ok(
      svgTags.has(tag),
      `renderer tag "${tag}" must be SVG-aware so h() builds a drawable element`
    );
  }
  // Sanity: the anchor tag is present. (No instanceof Set here — svgTags comes
  // from the vm sandbox realm, so a cross-realm instanceof Set would be false.)
  assert.ok(svgTags.has("svg"));
});

test("validateReport: malformed radar is rejected, not crashed on", () => {
  assert.equal(
    validateReport({ jobTitle: "x", periodMonths: 1, overallScore: 1, radar: "nope" }).valid,
    false
  );
  assert.equal(
    validateReport({
      jobTitle: "x", periodMonths: 1, overallScore: 1,
      radar: { axes: [{ competency: "", candidate_score: 9 }] },
    }).valid,
    false
  );
});
