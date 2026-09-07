const PROMPT_TEMPLATE = `You are guiding me through a structured reflection on my current job. Interview me one question at a time and wait for my answer before moving to the next question. Keep your tone warm and encouraging, and keep questions concise.

Step 1: Ask what language I'd like to use for this reflection (e.g. English, German, Spanish, French). From that point on, ask every question in that language, and write every piece of prose in your final JSON output - headline, summary, analyses, quotes, conclusion, etc. - in that language too. Keep the JSON keys themselves in English exactly as specified below, regardless of the chosen language.
Step 2: Ask how many months I want this reflection to cover (e.g. 3, 6, 12).
Step 3: Ask my job title.

Then run a guided interview covering, roughly in this order:
1. Achievements & wins - what am I proud of in this period?
2. Regrets or missed opportunities - what would I do differently?
3. Challenges I faced and how I handled them
4. Skills I grew - ask me to name 4-6 skills and rate my growth in each from 0-100
5. Relationships & collaboration - who did I work well with, any friction worth noting?
6. Energy & wellbeing - how has my energy/burnout trended? Ask for a 0-100 score and a short note
7. Goals for the next period

Ask thoughtful follow-up questions where it helps, but keep the whole interview reasonably tight - no more than a few questions per topic.

When the interview is complete, respond with ONLY a single JSON code block (no other text before or after) that exactly matches this schema:

{
  "jobTitle": "string",
  "periodMonths": number,
  "overallScore": number, // 0-100, your holistic assessment of how the period went
  "headline": "string", // one punchy sentence summing up the period
  "summary": "string", // 2-4 sentence summary
  "achievements": [{ "title": "string", "detail": "string" }],
  "achievementsAnalysis": "string", // 2-3 sentences analyzing the pattern across my achievements - what they reveal about me
  "regrets": [{ "title": "string", "detail": "string" }],
  "regretsAnalysis": "string", // 2-3 sentences analyzing the pattern across my regrets
  "skills": [{ "name": "string", "level": number }], // 0-100
  "skillsAnalysis": "string", // 2-3 sentences on what my skill growth (or stagnation) suggests
  "timeline": [{ "label": "string", "detail": "string" }], // chronological milestones across the period
  "quotes": ["string"], // 2-4 short first-person quotes pulled from my answers, verbatim where possible
  "goals": [{ "title": "string", "detail": "string" }],
  "goalsAnalysis": "string", // 2-3 sentences on whether these goals address what came up in the interview
  "wellbeing": { "score": number, "note": "string" }, // optional, include if we discussed it
  "sentiment": {
    "label": "string", // one or two words, e.g. "Mostly positive", "Mixed", "Strained"
    "score": number, // -100 (very negative) to 100 (very positive), your read of my overall tone across all answers
    "note": "string" // one sentence on what drives that read
  },
  "conclusion": "string" // 2-3 sentence closing reflection tying the period together and pointing forward
}

Base every analysis field on genuine patterns in my actual answers, not generic advice. Before writing the final JSON, review each analysis field (achievementsAnalysis, regretsAnalysis, skillsAnalysis, goalsAnalysis, sentiment.note, conclusion) and confirm it references a specific detail from my answers rather than a generic observation that could apply to anyone; rewrite any field that fails this check.

Save that JSON as a .json file (for example reflection.json) so I can upload it to my reflection report tool.`;

const TOOLS = [
  {
    id: "job-reflection",
    icon: "💼",
    name: "Job Reflection",
    image: "illustration-job-reflection.jpg",
    description:
      "Interviews you about achievements, regrets, growth and goals from your current job, then hands back a JSON file for a reflection summary.",
    promptTemplate: PROMPT_TEMPLATE,
  },
];

const SAMPLE_REPORT = {
  jobTitle: "Senior Product Designer",
  periodMonths: 6,
  overallScore: 78,
  headline: "A period of real growth, with a launch you're proud of and a few boundaries you're still learning to hold.",
  summary: "You shipped the redesign you'd been pushing for a year, grew into a more senior voice in critiques, and started saying no to work that wasn't yours to own. The cost was a stretch in spring where the hours crept up.",
  achievements: [
    { title: "Shipped the checkout redesign", detail: "Led it end to end, from research through a phased rollout. Conversion is up 12%." },
    { title: "Mentored two junior designers", detail: "Set up a weekly critique that's stuck even without you running it." },
  ],
  achievementsAnalysis: "Both wins came from you taking ownership beyond your job description - running a project end to end and building a ritual that outlasted your direct involvement. You do your best work when you're trusted with the whole picture, not just a slice of it.",
  regrets: [
    { title: "Said yes to too much in Q2", detail: "Took on a second project without pushing back, which flattened your best quarter." },
    { title: "Delayed a hard conversation", detail: "Sat on feedback for a teammate for months when it needed to happen in week one." },
  ],
  regretsAnalysis: "Both regrets trace back to the same instinct: avoiding friction in the moment, even when you could see the cost coming. That's worth naming directly rather than treating as two separate incidents.",
  skills: [
    { name: "Systems thinking", level: 82 },
    { name: "Stakeholder communication", level: 74 },
    { name: "Delegation", level: 55 },
    { name: "Motion design", level: 63 },
  ],
  skillsAnalysis: "Delegation is the clear outlier against otherwise strong growth - consistent with the regret about taking on too much. It's less a skill gap than a permission gap.",
  timeline: [
    { label: "Month 1-2", detail: "Kicked off checkout research, early prototypes." },
    { label: "Month 3", detail: "Took on a second, unplanned project." },
    { label: "Month 4-5", detail: "Crunch period; redesign moved to build." },
    { label: "Month 6", detail: "Redesign shipped; started mentoring formally." },
  ],
  quotes: [
    "I think I finally understand why the old checkout kept losing people, and I actually fixed it.",
    "I keep saying yes because I don't want to seem like I can't handle it.",
  ],
  goals: [
    { title: "Protect one deep-work day a week", detail: "Block it and defend it, even from your own manager." },
    { title: "Give feedback in week one", detail: "Not month three." },
  ],
  goalsAnalysis: "Both goals directly target the two regrets above, which is a good sign - you're not setting aspirational goals, you're fixing the specific pattern that cost you this period.",
  wellbeing: { score: 58, note: "Recovered late in the period, but spring was rough. Worth watching next cycle." },
  sentiment: { label: "Cautiously positive", score: 42, note: "Pride in the shipped work is real, but it sits next to visible strain about boundaries and overload." },
  conclusion: "This was a period where you proved you can lead something real, end to end, and people are already leaning on you for more. The work now is protecting your own time as fiercely as you protect the work.",
};

function gradeFor(score) {
  if (score >= 93) return "A+";
  if (score >= 87) return "A";
  if (score >= 80) return "A-";
  if (score >= 73) return "B+";
  if (score >= 65) return "B";
  if (score >= 55) return "B-";
  if (score >= 45) return "C+";
  if (score >= 35) return "C";
  return "C-";
}

let currentReport = null;
let selectedTool = null;

// ---------- Analytics ----------

function trackEvent(name) {
  window.fathom?.trackEvent(name);
}

// ---------- View switching ----------

function showView(name) {
  document.querySelectorAll(".view").forEach((section) => {
    section.classList.toggle("hidden", section.id !== `view-${name}`);
  });
  document.getElementById("nav-start-over").classList.toggle("hidden", name === "home");
  document.getElementById("tool-hero").classList.toggle("hidden", name === "home" || !selectedTool);
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

document.querySelectorAll("[data-nav]").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    const target = el.dataset.nav;
    if (target === "home") selectedTool = null;
    if (target === "upload") trackEvent("Job Reflection: Have JSON Click");
    showView(target);
  });
});

// ---------- DOM builder ----------

function h(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "class") el.className = value;
    else if (key === "html") el.innerHTML = value;
    else el.setAttribute(key, value);
  }
  [].concat(children).forEach((child) => {
    if (child === null || child === undefined) return;
    el.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
  });
  return el;
}

// ---------- Tool selection ----------

function initToolGrid() {
  const grid = document.getElementById("tool-grid");

  TOOLS.forEach((tool) => {
    const cardMedia = tool.image
      ? h("div", { class: "tool-card__media" }, [
          h("img", { src: tool.image, alt: tool.name, class: "tool-card__img" }),
        ])
      : null;

    const main = h("button", { class: "tool-card__main", type: "button" }, [
      cardMedia,
      h("div", { class: "tool-card__header-line" }, [
        h("span", { class: "tool-card__icon" }, tool.icon),
        h("h3", { class: "tool-card__title" }, tool.name),
      ]),
      h("p", { class: "tool-card__desc" }, tool.description),
      h("div", { class: "tool-card__cta-wrap" }, [
        h("span", { class: "btn btn-primary tool-card__btn" }, "Start reflection →"),
      ]),
    ]);
    main.addEventListener("click", () => {
      trackEvent("Job Reflection: Card Click");
      selectTool(tool.id, "prompt");
    });

    const uploadLink = h(
      "a",
      { class: "tool-card__upload-link", href: "#" },
      "Already have a JSON file? Upload it →"
    );
    uploadLink.addEventListener("click", (e) => {
      e.preventDefault();
      trackEvent("Job Reflection: Have JSON Click");
      selectTool(tool.id, "upload");
    });

    grid.appendChild(h("div", { class: "tool-card" }, [main, uploadLink]));
  });

  grid.appendChild(
    h("div", { class: "tool-card tool-card--placeholder" }, [
      h("div", { class: "tool-card__media" }, [
        h("img", { src: "illustration-coming-soon.jpg", alt: "More tools coming soon", class: "tool-card__img" }),
      ]),
      h("div", { class: "tool-card__placeholder-body" }, [
        h("div", { class: "tool-card__header-line" }, [
          h("span", { class: "tool-card__icon" }, "✨"),
          h("h3", { class: "tool-card__title" }, "More tools coming soon"),
        ]),
        h("p", { class: "tool-card__desc" }, "Reflectify is growing into a suite of reflection tools beyond the job check-in."),
      ]),
    ])
  );
}

function selectTool(toolId, destination) {
  selectedTool = TOOLS.find((t) => t.id === toolId) || null;
  updateToolHero();
  renderPromptText();
  showView(destination);
}

function updateToolHero() {
  if (!selectedTool) return;
  document.getElementById("tool-hero-icon").textContent = selectedTool.icon;
  document.getElementById("tool-hero-name").textContent = selectedTool.name;
  document.getElementById("tool-hero-title").textContent = selectedTool.name;
  document.getElementById("tool-hero-desc").textContent = selectedTool.description || "";
  
  const heroMedia = document.getElementById("tool-hero-media");
  const heroImg = document.getElementById("tool-hero-img");
  if (selectedTool.image) {
    heroImg.src = selectedTool.image;
    heroImg.alt = selectedTool.name;
    heroMedia.classList.remove("hidden");
  } else {
    heroMedia.classList.add("hidden");
  }
}

// ---------- Prompt view ----------

function renderPromptText() {
  document.getElementById("prompt-text").textContent = selectedTool ? selectedTool.promptTemplate : "";
}

function initPromptView() {
  const copyBtn = document.getElementById("copy-prompt-btn");
  copyBtn.addEventListener("click", async () => {
    trackEvent("Job Reflection: Copy Prompt");
    const template = selectedTool ? selectedTool.promptTemplate : "";
    try {
      await navigator.clipboard.writeText(template);
    } catch {
      const temp = document.createElement("textarea");
      temp.value = template;
      temp.style.position = "fixed";
      temp.style.opacity = "0";
      document.body.appendChild(temp);
      temp.select();
      document.execCommand("copy");
      document.body.removeChild(temp);
    }
    const original = copyBtn.textContent;
    copyBtn.textContent = "Copied!";
    copyBtn.disabled = true;
    setTimeout(() => {
      copyBtn.textContent = original;
      copyBtn.disabled = false;
    }, 1800);
  });
}

// ---------- Upload view ----------

function initUploadView() {
  const fileInput = document.getElementById("file-input");
  const pasteText = document.getElementById("paste-text");
  const pasteSubmitBtn = document.getElementById("paste-submit-btn");
  const sampleBtn = document.getElementById("load-sample-btn");
  const uploadPanel = document.getElementById("upload-panel");

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (file) readFile(file);
    fileInput.value = "";
  });

  ["dragover", "drop"].forEach((evt) => {
    uploadPanel.addEventListener(evt, (e) => e.preventDefault());
  });
  uploadPanel.addEventListener("drop", (e) => {
    const file = e.dataTransfer?.files?.[0];
    if (file) readFile(file);
  });

  pasteSubmitBtn.addEventListener("click", () => {
    trackEvent("Job Reflection: Load JSON");
    if (pasteText.value.trim()) handleJsonText(pasteText.value);
  });

  sampleBtn.addEventListener("click", (e) => {
    e.preventDefault();
    currentReport = normalizeReport(SAMPLE_REPORT);
    renderReport(currentReport);
    showView("report");
  });
}

function readFile(file) {
  const reader = new FileReader();
  reader.onload = () => handleJsonText(String(reader.result));
  reader.onerror = () => showUploadError("Could not read that file.");
  reader.readAsText(file);
}

function handleJsonText(text) {
  let data;
  try {
    data = parseUploadedJson(text);
  } catch {
    showUploadError(
      "That doesn't look like valid JSON. Make sure you copied the AI's full response, including the outermost { and }."
    );
    return;
  }

  const { valid, errors } = validateReport(data);
  if (!valid) {
    showUploadError(errors.join("\n"));
    return;
  }

  clearUploadError();
  currentReport = normalizeReport(data);
  renderReport(currentReport);
  showView("report");
}

function showUploadError(message) {
  const box = document.getElementById("upload-error");
  box.textContent = message;
  box.classList.remove("hidden");
}

function clearUploadError() {
  const box = document.getElementById("upload-error");
  box.classList.add("hidden");
  box.textContent = "";
}

function parseUploadedJson(text) {
  const trimmed = text.trim();

  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenced ? fenced[1] : trimmed;

  try {
    return JSON.parse(candidate);
  } catch {
    const extracted = extractFirstJsonObject(candidate);
    if (extracted) return JSON.parse(extracted);
    throw new Error("Unparseable JSON");
  }
}

function extractFirstJsonObject(text) {
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (ch === "\\") {
      escapeNext = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

// ---------- Validation (hybrid: strict for load-bearing fields, lenient for optional) ----------

function validateReport(data) {
  const errors = [];
  const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

  if (!isObj(data)) {
    return { valid: false, errors: ["The uploaded JSON must be a single object."] };
  }

  if (typeof data.jobTitle !== "string" || !data.jobTitle.trim()) {
    errors.push('"jobTitle" must be a non-empty string.');
  }
  if (!Number.isInteger(data.periodMonths) || data.periodMonths < 1 || data.periodMonths > 120) {
    errors.push('"periodMonths" must be a whole number between 1 and 120.');
  }
  if (
    typeof data.overallScore !== "number" ||
    Number.isNaN(data.overallScore) ||
    data.overallScore < 0 ||
    data.overallScore > 100
  ) {
    errors.push('"overallScore" must be a number between 0 and 100.');
  }

  validateOptionalArray(data.achievements, "achievements", errors, titleDetailValidator);
  validateOptionalArray(data.regrets, "regrets", errors, titleDetailValidator);
  validateOptionalArray(data.goals, "goals", errors, titleDetailValidator);
  validateOptionalArray(data.timeline, "timeline", errors, (item, path, errs) => {
    if (typeof item.label !== "string" || !item.label.trim()) errs.push(`"${path}.label" must be a non-empty string.`);
    if (typeof item.detail !== "string") errs.push(`"${path}.detail" must be a string.`);
  });
  validateOptionalArray(data.skills, "skills", errors, (item, path, errs) => {
    if (typeof item.name !== "string" || !item.name.trim()) errs.push(`"${path}.name" must be a non-empty string.`);
    if (typeof item.level !== "number" || item.level < 0 || item.level > 100) {
      errs.push(`"${path}.level" must be a number between 0 and 100.`);
    }
  });

  if (data.quotes !== undefined && !Array.isArray(data.quotes)) {
    errors.push('"quotes" must be an array if present.');
  }
  if (data.sentiment !== undefined && data.sentiment !== null && !isObj(data.sentiment)) {
    errors.push('"sentiment" must be an object if present.');
  }
  if (data.wellbeing !== undefined && data.wellbeing !== null && !isObj(data.wellbeing)) {
    errors.push('"wellbeing" must be an object if present.');
  }

  return { valid: errors.length === 0, errors };
}

function titleDetailValidator(item, path, errs) {
  if (typeof item.title !== "string" || !item.title.trim()) errs.push(`"${path}.title" must be a non-empty string.`);
  if (typeof item.detail !== "string" || !item.detail.trim()) errs.push(`"${path}.detail" must be a non-empty string.`);
}

function validateOptionalArray(arr, name, errors, itemValidator) {
  if (arr === undefined) return;
  if (!Array.isArray(arr)) {
    errors.push(`"${name}" must be an array if present.`);
    return;
  }
  arr.forEach((item, i) => {
    const path = `${name}[${i}]`;
    if (item === null || typeof item !== "object") {
      errors.push(`"${path}" must be an object.`);
      return;
    }
    itemValidator(item, path, errors);
  });
}

// ---------- Normalize (lenient defaulting for optional/prose fields) ----------

function normalizeReport(obj) {
  const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
  const r = Object.assign({}, obj);

  r.achievements = Array.isArray(r.achievements) ? r.achievements : [];
  r.regrets = Array.isArray(r.regrets) ? r.regrets : [];
  r.skills = (Array.isArray(r.skills) ? r.skills : []).map((s) =>
    Object.assign({}, s, { levelPct: Math.max(0, Math.min(100, Number(s.level) || 0)) + "%" })
  );
  r.timeline = Array.isArray(r.timeline) ? r.timeline : [];
  r.quotes = (Array.isArray(r.quotes) ? r.quotes : [])
    .map((q) => {
      if (typeof q === "string") return q;
      if (q && typeof q === "object") return q.quote || q.text || q.detail || q.value || JSON.stringify(q);
      return String(q);
    })
    .filter(Boolean);
  r.goals = Array.isArray(r.goals) ? r.goals : [];

  r.jobTitle = r.jobTitle || "Untitled role";
  r.headline = r.headline || "";
  r.summary = r.summary || "";
  r.achievementsAnalysis = r.achievementsAnalysis || "";
  r.regretsAnalysis = r.regretsAnalysis || "";
  r.skillsAnalysis = r.skillsAnalysis || "";
  r.goalsAnalysis = r.goalsAnalysis || "";

  r.sentiment = isObj(r.sentiment) ? r.sentiment : null;
  if (r.sentiment) {
    r.sentiment.score = Math.max(-100, Math.min(100, Number(r.sentiment.score) || 0));
    r.sentiment.pct = (r.sentiment.score + 100) / 2 + "%";
    r.sentiment.label = r.sentiment.label || "Mixed";
    r.sentiment.note = r.sentiment.note || "";
  }

  r.wellbeing = isObj(r.wellbeing) && typeof r.wellbeing.score === "number" ? r.wellbeing : null;
  if (r.wellbeing) {
    r.wellbeing.score = Math.max(0, Math.min(100, Number(r.wellbeing.score) || 0));
    r.wellbeing.pct = r.wellbeing.score + "%";
    r.wellbeing.note = r.wellbeing.note || "";
  }

  r.overallScore = Number(r.overallScore);
  if (Number.isNaN(r.overallScore)) r.overallScore = 0;

  if (!r.conclusion || typeof r.conclusion !== "string") {
    const nextGoal = r.goals[0] ? r.goals[0].title : null;
    r.conclusion = r.headline
      ? r.headline + (nextGoal ? " Heading into the next period, the focus is " + nextGoal.toLowerCase() + "." : "")
      : "A period worth sitting with. Carry the wins forward and keep an eye on the goals ahead.";
  }

  return r;
}

// ---------- Report rendering ----------

function renderReport(report) {
  const root = document.getElementById("report-card") || document.getElementById("printable-report");
  root.innerHTML = "";
  const grade = gradeFor(report.overallScore);
  const periodLabel = `${report.periodMonths}-month reflection`;
  const generatedDate = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  [
    renderHeader(report, grade, periodLabel),
    renderSentiment(report),
    renderSummary(report),
    renderAchievementsRegrets(report),
    renderSkillsTimeline(report),
    renderQuotes(report),
    renderGoalsWellbeing(report),
    renderConclusion(report),
    renderFooter(generatedDate),
  ]
    .filter(Boolean)
    .forEach((node) => root.appendChild(node));
}

function renderHeader(report, grade, periodLabel) {
  return h("div", { class: "report-card__header" }, [
    h("div", { class: "report-card__header-top" }, [
      h("div", { class: "report-card__brand" }, [
        h("svg", { class: "report-card__brand-logo", width: "240", height: "56", viewBox: "0 0 280 64", fill: "none", xmlns: "http://www.w3.org/2000/svg", role: "img", "aria-label": "Reflectify" }, [
          h("g", { transform: "translate(4, 4)" }, [
            h("rect", { x: "0", y: "0", width: "56", height: "56", rx: "28", fill: "#EBF3EF" }),
            h("path", { d: "M28 11 C 14 25, 14 39, 28 44 C 42 39, 42 25, 28 11 Z", fill: "#2D4A3E" }),
            h("path", { d: "M28 19 C 38 26, 38 37, 28 41", stroke: "#E8A88A", "stroke-width": "3.5", "stroke-linecap": "round", fill: "none" }),
          ]),
          h("text", { x: "76", y: "44", "font-family": "Newsreader, Georgia, serif", "font-weight": "500", "font-size": "38", fill: "#2D4A3E", "letter-spacing": "-0.8" }, "Reflectify"),
        ]),
      ]),
      h("span", { class: "report-card__period-badge" }, periodLabel),
    ]),
    h("div", { class: "report-card__header-main" }, [
      h("div", { class: "report-card__title-group" }, [
        h("h1", { class: "report-card__title" }, report.jobTitle),
        h("p", { class: "report-card__headline" }, report.headline),
      ]),
      h("div", { class: "report-card__grade" }, [
        h("div", { class: "report-card__grade-value" }, grade),
        h("div", { class: "report-card__grade-caption" }, "overall assessment"),
      ]),
    ]),
  ]);
}

function renderSentiment(report) {
  if (!report.sentiment) return null;
  return h("div", { class: "report-card__sentiment" }, [
    h("div", { class: "report-card__sentiment-meta" }, [
      h("h6", { class: "report-card__label" }, "Sentiment"),
      h("div", { class: "report-card__sentiment-value" }, report.sentiment.label),
    ]),
    h("div", { class: "report-card__sentiment-body" }, [
      h("div", { class: "report-card__bar" }, [
        h("div", { class: "report-card__bar-fill", style: `width:${report.sentiment.pct}` }),
      ]),
      h("p", { class: "report-card__sentiment-note" }, report.sentiment.note),
    ]),
  ]);
}

function renderSummary(report) {
  if (!report.summary) return null;
  return h("div", { class: "report-card__summary" }, [h("p", {}, report.summary)]);
}

function renderItemColumn(label, note, items, dividerRight) {
  return h("div", { class: dividerRight ? "report-card__col report-card__col--divider" : "report-card__col" }, [
    h("h6", { class: "report-card__label" }, label),
    note ? h("p", { class: "report-card__note" }, note) : null,
    ...items.map((item) =>
      h("div", { class: "report-card__item" }, [
        h("h5", { class: "report-card__item-title" }, item.title),
        h("p", { class: "report-card__item-detail" }, item.detail),
      ])
    ),
  ]);
}

function renderAchievementsRegrets(report) {
  return h("div", { class: "report-card__grid" }, [
    renderItemColumn("Achievements", report.achievementsAnalysis, report.achievements, true),
    renderItemColumn("Regrets & lessons", report.regretsAnalysis, report.regrets, false),
  ]);
}

function renderSkillsTimeline(report) {
  const skillsCol = h("div", { class: "report-card__col report-card__col--divider" }, [
    h("h6", { class: "report-card__label" }, "Skills grown"),
    report.skillsAnalysis ? h("p", { class: "report-card__note" }, report.skillsAnalysis) : null,
    ...report.skills.map((skill) =>
      h("div", { class: "report-card__skill" }, [
        h("div", { class: "report-card__skill-head" }, [h("span", {}, skill.name), h("span", {}, String(skill.level))]),
        h("div", { class: "report-card__bar" }, [
          h("div", { class: "report-card__bar-fill", style: `width:${skill.levelPct}` }),
        ]),
      ])
    ),
  ]);

  const timelineCol = h("div", { class: "report-card__col" }, [
    h("h6", { class: "report-card__label" }, "Timeline"),
    ...report.timeline.map((tl) =>
      h("div", { class: "report-card__timeline-item" }, [
        h("div", { class: "report-card__timeline-dot" }),
        h("div", {}, [
          h("h5", { class: "report-card__item-title" }, tl.label),
          h("p", { class: "report-card__item-detail" }, tl.detail),
        ]),
      ])
    ),
  ]);

  return h("div", { class: "report-card__grid" }, [skillsCol, timelineCol]);
}

function renderQuotes(report) {
  if (!report.quotes.length) return null;
  return h("div", { class: "report-card__quotes" }, [
    h("h6", { class: "report-card__quotes-label" }, "In your own words"),
    ...report.quotes.map((q) => h("p", { class: "report-card__quote" }, `“${q}”`)),
  ]);
}

function renderGoalsWellbeing(report) {
  const goalsCol = renderItemColumn("Goals ahead", report.goalsAnalysis, report.goals, true);

  const wellbeingChildren = [h("h6", { class: "report-card__label" }, "Energy & wellbeing")];
  if (report.wellbeing) {
    wellbeingChildren.push(
      h("div", { class: "report-card__skill-head" }, [
        h("span", {}, "Trend across the period"),
        h("span", {}, String(report.wellbeing.score)),
      ]),
      h("div", { class: "report-card__bar", style: "margin-bottom:var(--space-3)" }, [
        h("div", { class: "report-card__bar-fill", style: `width:${report.wellbeing.pct}` }),
      ]),
      h("p", { class: "report-card__item-detail" }, report.wellbeing.note)
    );
  } else {
    wellbeingChildren.push(h("p", { class: "report-card__empty" }, "Not tracked this period."));
  }
  const wellbeingCol = h("div", { class: "report-card__col" }, wellbeingChildren);

  return h("div", { class: "report-card__grid report-card__grid--flush" }, [goalsCol, wellbeingCol]);
}

function renderConclusion(report) {
  return h("div", { class: "report-card__conclusion" }, [
    h("h6", { class: "report-card__label" }, "The takeaway"),
    h("p", { class: "report-card__conclusion-text" }, report.conclusion),
  ]);
}

function renderFooter(generatedDate) {
  return h("div", { class: "report-card__footer" }, [
    h("span", {}, `Generated ${generatedDate}`),
    h("span", {}, "Reflectify"),
  ]);
}

// ---------- Export ----------

function sanitizeFilename(str) {
  return (
    str
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "reflection"
  );
}

function filenameFor(extension) {
  const job = sanitizeFilename(currentReport.jobTitle);
  const date = new Date().toISOString().slice(0, 10);
  return `reflect-card-${job}-${date}.${extension}`;
}

function reportBackgroundColor() {
  const el = document.getElementById("report-card") || document.getElementById("printable-report");
  const value = getComputedStyle(el).backgroundColor;
  return value && value !== "rgba(0, 0, 0, 0)" ? value : "#EBF3EF";
}

async function captureReportCanvas() {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
  const root = document.getElementById("report-card") || document.getElementById("printable-report");
  return window.html2canvas(root, {
    scale: 2,
    backgroundColor: reportBackgroundColor(),
    useCORS: true,
    imageTimeout: 3000,
  });
}

function withExportButton(button, task) {
  return async () => {
    const original = button.textContent;
    button.disabled = true;
    button.textContent = "Preparing…";
    try {
      await task();
    } catch (err) {
      console.error(err);
      alert("Sorry, something went wrong generating that file. Please try again.");
    } finally {
      button.disabled = false;
      button.textContent = original;
    }
  };
}

function initExportButtons() {
  const pngBtn = document.getElementById("export-png-btn");
  const pdfBtn = document.getElementById("export-pdf-btn");

  pngBtn.addEventListener(
    "click",
    withExportButton(pngBtn, async () => {
      trackEvent("Job Reflection: Download Image");
      const canvas = await captureReportCanvas();
      const link = document.createElement("a");
      link.download = filenameFor("png");
      link.href = canvas.toDataURL("image/png");
      link.click();
    })
  );

  pdfBtn.addEventListener("click", () => {
    trackEvent("Job Reflection: Download PDF");
    window.print();
  });
}

// ---------- Hero wobble + glossy sheen ----------
// Tilts the whole framed card toward the cursor (smooth eased) and moves
// the specular highlight across it, so the card reads as a living,
// glossy surface.
function initHeroWobble() {
  const frame = document.querySelector(".landing-hero__media");
  if (!frame) return;

  // Respect users who prefer reduced motion.
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduce.matches) return;

  const MAX_TILT_X = 9; // degrees
  const MAX_TILT_Y = 11;
  const ROT_SMOOTH = 0.09; // 1 = instant, lower = floatier/wobblier
  const HIGHLIGHT_SMOOTH = 0.12;
  const RAF = window.requestAnimationFrame.bind(window);

  let current = { x: 0, y: 0, hx: 50, hy: 45 };
  let target = { x: 0, y: 0, hx: 50, hy: 45 };
  let active = false;

  function frameLoop() {
    current.x += (target.x - current.x) * ROT_SMOOTH;
    current.y += (target.y - current.y) * ROT_SMOOTH;
    current.hx += (target.hx - current.hx) * HIGHLIGHT_SMOOTH;
    current.hy += (target.hy - current.hy) * HIGHLIGHT_SMOOTH;
    apply(current.x, current.y, current.hx, current.hy);
    if (
      Math.abs(target.x - current.x) > 0.02 ||
      Math.abs(target.y - current.y) > 0.02 ||
      Math.abs(target.hx - current.hx) > 0.05 ||
      Math.abs(target.hy - current.hy) > 0.05
    ) {
      RAF(frameLoop);
    } else {
      active = false;
    }
  }

  function apply(rx, ry, hx, hy) {
    frame.style.transform =
      `perspective(1000px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    frame.style.setProperty("--hx", `${hx.toFixed(1)}%`);
    frame.style.setProperty("--hy", `${hy.toFixed(1)}%`);
  }

  frame.addEventListener("pointermove", (e) => {
    const rect = frame.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const px = (e.clientX - rect.left) / rect.width; // 0..1
    const py = (e.clientY - rect.top) / rect.height; // 0..1
    target.y = (px - 0.5) * 2 * MAX_TILT_Y; // rotateY
    target.x = (0.5 - py) * 2 * MAX_TILT_X; // rotateX
    target.hx = px * 100; // sheen follows cursor across the card
    target.hy = py * 100;
    frame.classList.add("hero-hover");
    if (!active) {
      active = true;
      RAF(frameLoop);
    }
  });

  frame.addEventListener("pointerleave", () => {
    target.x = 0;
    target.y = 0;
    target.hx = 50;
    target.hy = 45;
    frame.classList.remove("hero-hover");
    if (!active) {
      active = true;
      RAF(frameLoop);
    }
  });
}

// ---------- Init ----------

initToolGrid();
initPromptView();
initUploadView();
initExportButtons();
initHeroWobble();
showView("home");
