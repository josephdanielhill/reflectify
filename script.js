const PROMPT_TEMPLATE = `You are a thoughtful, warm career coach conducting a structured reflection interview. Follow these steps exactly, in order. Ask ONE question at a time and wait for my reply before asking the next one — never ask multiple questions in a single message. Keep your own responses brief (one short acknowledging sentence at most) between questions; you are not the one reflecting, I am.

STEP 1 — Reflection period
Ask me: "How many months does this reflection cover?"
Wait for my answer and interpret it as a whole number of months (e.g. "6", "half a year" → 6, "a year" → 12, "since January" → estimate the number of months from today). Store this as reflectionPeriodMonths.

STEP 2 — Job title
Ask me: "What's your job title?"
Wait for my answer and store it as jobTitle. From this point on, tailor the wording and emphasis of every question below to this role. For example: for engineers, lean into technical growth, code quality, and system design; for salespeople, lean into quota, pipeline, and relationship-building; for managers or leads, lean into team development, delegation, and stakeholder management; for creative, support, or operations roles, lean into craft quality, collaboration, and process. If the title doesn't fit an obvious category, use your judgment to ask relevant, specific questions rather than generic ones.

STEP 3 — Reflective interview
Ask me open-ended questions, ONE AT A TIME, covering all six areas below. Adapt each question's specific wording to my job title and to what I've already told you, and ask brief, genuine follow-up questions if an answer is too vague to turn into a clear title + description. Keep the whole interview to roughly 12-20 questions total, including follow-ups — don't drag it out.

1. Achievements — surface 2 to 4 specific wins, accomplishments, or moments of pride from this period.
2. Challenges — surface 2 to 4 real difficulties, obstacles, or hard problems I faced.
3. Regrets / lessons learned — surface 1 to 3 things I'd do differently, mistakes, or missed opportunities, and what I learned from each one.
4. Skill growth — help me identify 3 to 6 specific skills relevant to my role (suggest a few candidates based on my job title to jog my thinking), and for each one ask me to (a) rate my current proficiency from 1 (novice) to 10 (expert) and (b) briefly say how it changed over this period.
5. Goals — surface 2 to 4 goals for the next period, and for each one clarify whether it's short-term (next 1-3 months) or longer-term.
6. Overall sentiment — ask me to describe, in my own words, how I feel about this period overall (proud, exhausted, stagnant, energized, etc.), then ask me to translate that into a single number from 0 (extremely negative) to 100 (extremely positive).

STEP 4 — Output
Once you have enough detail for all six areas, respond with ONLY a single JSON object and NOTHING else: no preamble, no closing remarks, no markdown code fences, no explanation. Just the raw JSON, matching this exact structure and these exact field names and types:

{
  "schemaVersion": "1.0",
  "metadata": {
    "jobTitle": "<string, the job title I gave you>",
    "reflectionPeriodMonths": <integer, the number of months I gave you>,
    "generatedDate": "<string, today's date as YYYY-MM-DD>"
  },
  "headline": "<string, max ~100 characters: a punchy one-line summary of my period>",
  "overallSentiment": {
    "score": <integer 0-100, from my answer in question 6>,
    "label": "<one of exactly: very_negative, negative, neutral, positive, very_positive — pick whichever matches the score>",
    "summary": "<string, 1-3 sentences summarizing my overall sentiment in my own voice>"
  },
  "skills": [
    { "name": "<string>", "rating": <integer 1-10>, "note": "<optional short string on how it changed>" }
  ],
  "achievements": [
    { "title": "<string, 3-8 words>", "description": "<string, 1-3 sentences, first person, based on what I told you>" }
  ],
  "challenges": [
    { "title": "<string, 3-8 words>", "description": "<string, 1-3 sentences, first person>" }
  ],
  "regrets": [
    { "title": "<string, 3-8 words>", "description": "<string, 1-3 sentences, first person>", "lesson": "<string, 1-2 sentences: what I learned>" }
  ],
  "goals": [
    { "title": "<string, 3-8 words>", "description": "<string, 1-2 sentences>", "timeframe": "<short_term or long_term>" }
  ]
}

Formatting rules — follow these precisely:
- "skills" must have between 3 and 6 items.
- "achievements" and "challenges" must each have between 2 and 4 items.
- "regrets" must have between 1 and 3 items.
- "goals" must have between 2 and 4 items.
- Only include items with real substance from my answers — never pad with filler to hit a count, and never fabricate content I didn't tell you.
- All text should be written in first person, based only on what I actually said.
- Output must be valid, parseable JSON — no trailing commas, no comments, no code fences, no text before or after the JSON.

Begin now by asking me the Step 1 question.`;

const SENTIMENT_LABELS = {
  very_negative: "Very negative",
  negative: "Negative",
  neutral: "Neutral",
  positive: "Positive",
  very_positive: "Very positive",
};

const TIMEFRAME_LABELS = {
  short_term: "Short-term",
  long_term: "Long-term",
};

const STATUS = {
  critical: "#d03b3b",
  serious: "#ec835a",
  warning: "#fab219",
  good: "#0ca30c",
};

let currentReport = null;

// ---------- View switching ----------

function showView(name) {
  document.querySelectorAll(".view").forEach((section) => {
    section.classList.toggle("hidden", section.id !== `view-${name}`);
  });
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

document.querySelectorAll("[data-nav]").forEach((btn) => {
  btn.addEventListener("click", () => showView(btn.dataset.nav));
});

// ---------- Prompt view ----------

function initPromptView() {
  const textEl = document.getElementById("prompt-text");
  textEl.value = PROMPT_TEMPLATE;

  const copyBtn = document.getElementById("copy-prompt-btn");
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(PROMPT_TEMPLATE);
    } catch {
      textEl.select();
      document.execCommand("copy");
      window.getSelection()?.removeAllRanges();
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
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const browseBtn = document.getElementById("browse-btn");
  const pasteText = document.getElementById("paste-text");
  const pasteSubmitBtn = document.getElementById("paste-submit-btn");

  browseBtn.addEventListener("click", () => fileInput.click());
  dropzone.addEventListener("click", (e) => {
    if (e.target === browseBtn) return;
    fileInput.click();
  });
  dropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInput.click();
    }
  });

  ["dragenter", "dragover"].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add("dropzone--active");
    });
  });
  ["dragleave", "dragend", "drop"].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove("dropzone--active");
    });
  });
  dropzone.addEventListener("drop", (e) => {
    const file = e.dataTransfer?.files?.[0];
    if (file) readFile(file);
  });

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (file) readFile(file);
    fileInput.value = "";
  });

  pasteSubmitBtn.addEventListener("click", () => {
    if (pasteText.value.trim()) handleJsonText(pasteText.value);
  });
}

function readFile(file) {
  const reader = new FileReader();
  reader.onload = () => handleJsonText(String(reader.result));
  reader.onerror = () => showUploadErrors(["Could not read that file. Please try again."]);
  reader.readAsText(file);
}

function handleJsonText(text) {
  let data;
  try {
    data = parseUploadedJson(text);
  } catch {
    showUploadErrors([
      "That doesn't look like valid JSON. Make sure you copied the AI's full response, including the outermost { and }.",
    ]);
    return;
  }

  const { valid, errors } = validateReport(data);
  if (!valid) {
    showUploadErrors(errors);
    return;
  }

  clearUploadErrors();
  currentReport = data;
  renderReport(currentReport);
  showView("report");
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

function showUploadErrors(errors) {
  const box = document.getElementById("upload-errors");
  box.innerHTML = "";
  const heading = document.createElement("p");
  heading.className = "upload-errors__heading";
  heading.textContent = errors.length === 1 ? "There's a problem with that file:" : "There are a few problems with that file:";
  box.appendChild(heading);
  const list = document.createElement("ul");
  errors.forEach((err) => {
    const li = document.createElement("li");
    li.textContent = err;
    list.appendChild(li);
  });
  box.appendChild(list);
  box.classList.remove("hidden");
}

function clearUploadErrors() {
  const box = document.getElementById("upload-errors");
  box.classList.add("hidden");
  box.innerHTML = "";
}

// ---------- Validation ----------

function validateReport(data) {
  const errors = [];
  const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

  if (!isObj(data)) {
    return { valid: false, errors: ["The uploaded JSON must be a single object."] };
  }

  if (data.schemaVersion !== "1.0") {
    errors.push('"schemaVersion" must be "1.0".');
  }

  if (!isObj(data.metadata)) {
    errors.push('"metadata" is missing or not an object.');
  } else {
    if (typeof data.metadata.jobTitle !== "string" || !data.metadata.jobTitle.trim()) {
      errors.push('"metadata.jobTitle" must be a non-empty string.');
    }
    const months = data.metadata.reflectionPeriodMonths;
    if (!Number.isInteger(months) || months < 1 || months > 120) {
      errors.push('"metadata.reflectionPeriodMonths" must be a whole number between 1 and 120.');
    }
    if (typeof data.metadata.generatedDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data.metadata.generatedDate)) {
      errors.push('"metadata.generatedDate" must be a date string in YYYY-MM-DD format.');
    }
  }

  if (typeof data.headline !== "string" || !data.headline.trim()) {
    errors.push('"headline" must be a non-empty string.');
  }

  if (!isObj(data.overallSentiment)) {
    errors.push('"overallSentiment" is missing or not an object.');
  } else {
    const score = data.overallSentiment.score;
    if (!Number.isInteger(score) || score < 0 || score > 100) {
      errors.push('"overallSentiment.score" must be a whole number between 0 and 100.');
    }
    if (!Object.keys(SENTIMENT_LABELS).includes(data.overallSentiment.label)) {
      errors.push(`"overallSentiment.label" must be one of: ${Object.keys(SENTIMENT_LABELS).join(", ")}.`);
    }
    if (typeof data.overallSentiment.summary !== "string" || !data.overallSentiment.summary.trim()) {
      errors.push('"overallSentiment.summary" must be a non-empty string.');
    }
  }

  validateItemArray(data.skills, "skills", 3, 6, errors, (item, path, errs) => {
    if (typeof item.name !== "string" || !item.name.trim()) errs.push(`"${path}.name" must be a non-empty string.`);
    if (!Number.isInteger(item.rating) || item.rating < 1 || item.rating > 10) {
      errs.push(`"${path}.rating" must be a whole number between 1 and 10.`);
    }
    if (item.note !== undefined && typeof item.note !== "string") {
      errs.push(`"${path}.note" must be a string if present.`);
    }
  });

  validateItemArray(data.achievements, "achievements", 2, 4, errors, validateTitleDescription);
  validateItemArray(data.challenges, "challenges", 2, 4, errors, validateTitleDescription);

  validateItemArray(data.regrets, "regrets", 1, 3, errors, (item, path, errs) => {
    validateTitleDescription(item, path, errs);
    if (typeof item.lesson !== "string" || !item.lesson.trim()) {
      errs.push(`"${path}.lesson" must be a non-empty string.`);
    }
  });

  validateItemArray(data.goals, "goals", 2, 4, errors, (item, path, errs) => {
    validateTitleDescription(item, path, errs);
    if (item.timeframe !== "short_term" && item.timeframe !== "long_term") {
      errs.push(`"${path}.timeframe" must be "short_term" or "long_term".`);
    }
  });

  return { valid: errors.length === 0, errors };
}

function validateTitleDescription(item, path, errs) {
  if (typeof item.title !== "string" || !item.title.trim()) {
    errs.push(`"${path}.title" must be a non-empty string.`);
  }
  if (typeof item.description !== "string" || !item.description.trim()) {
    errs.push(`"${path}.description" must be a non-empty string.`);
  }
}

function validateItemArray(arr, name, min, max, errors, itemValidator) {
  if (!Array.isArray(arr)) {
    errors.push(`"${name}" must be an array.`);
    return;
  }
  if (arr.length < min || arr.length > max) {
    errors.push(`"${name}" must have between ${min} and ${max} items (found ${arr.length}).`);
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

// ---------- Report rendering ----------

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

function formatDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function renderReport(report) {
  const root = document.getElementById("report-root");
  root.innerHTML = "";
  root.appendChild(renderMetadataHeader(report));
  root.appendChild(renderSentimentGauge(report.overallSentiment));
  root.appendChild(renderSkillsChart(report.skills));
  root.appendChild(
    renderCardSection("Achievements", "achievement", report.achievements, (item) =>
      buildBasicCard(item, "achievement")
    )
  );
  root.appendChild(
    renderCardSection("Challenges", "challenge", report.challenges, (item) => buildBasicCard(item, "challenge"))
  );
  root.appendChild(
    renderCardSection("Regrets & lessons", "regret", report.regrets, (item) => buildRegretCard(item))
  );
  root.appendChild(renderCardSection("Goals ahead", "goal", report.goals, (item) => buildGoalCard(item)));
}

function renderMetadataHeader(report) {
  return h("header", { class: "report-header" }, [
    h("p", { class: "report-header__eyebrow" }, `${report.metadata.reflectionPeriodMonths}-month reflection`),
    h("h2", { class: "report-header__job" }, report.metadata.jobTitle),
    h("p", { class: "report-header__date" }, `Generated ${formatDate(report.metadata.generatedDate)}`),
    h("p", { class: "report-header__headline" }, `"${report.headline}"`),
  ]);
}

function sentimentBucketColor(score) {
  if (score < 25) return STATUS.critical;
  if (score < 50) return STATUS.serious;
  if (score < 75) return STATUS.warning;
  return STATUS.good;
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function arcPath(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = Math.abs(startAngle - endAngle) <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

function renderSentimentGauge(sentiment) {
  const cx = 100;
  const cy = 100;
  const r = 78;
  const strokeWidth = 20;
  const gap = 1.5;

  const bands = [
    { from: 180, to: 135, color: STATUS.critical },
    { from: 135, to: 90, color: STATUS.serious },
    { from: 90, to: 45, color: STATUS.warning },
    { from: 45, to: 0, color: STATUS.good },
  ];

  const bandPaths = bands
    .map((band) => {
      const start = band.from - (band.from === 180 ? 0 : gap / 2);
      const end = band.to + (band.to === 0 ? 0 : gap / 2);
      return `<path d="${arcPath(cx, cy, r, start, end)}" stroke="${band.color}" stroke-width="${strokeWidth}" fill="none" stroke-linecap="butt" />`;
    })
    .join("");

  const needleAngle = 180 - (sentiment.score / 100) * 180;
  const needleTip = polarToCartesian(cx, cy, r - 10, needleAngle);
  const needleColor = "var(--ink-primary)";

  const svg = `
    <svg viewBox="0 0 200 128" class="gauge__svg" role="img" aria-label="Overall sentiment score ${sentiment.score} out of 100">
      ${bandPaths}
      <line x1="${cx}" y1="${cy}" x2="${needleTip.x}" y2="${needleTip.y}" stroke="${needleColor}" stroke-width="4" stroke-linecap="round" />
      <circle cx="${cx}" cy="${cy}" r="7" fill="${needleColor}" />
      <text x="${cx - r}" y="${cy + 18}" class="gauge__tick">0</text>
      <text x="${cx + r}" y="${cy + 18}" class="gauge__tick" text-anchor="end">100</text>
    </svg>
  `;

  const badgeColor = sentimentBucketColor(sentiment.score);

  return h("section", { class: "report-section gauge" }, [
    h("h3", {}, "Overall sentiment"),
    h("div", { class: "gauge__layout" }, [
      h("div", { class: "gauge__chart", html: svg }),
      h("div", { class: "gauge__readout" }, [
        h("p", { class: "gauge__score" }, String(sentiment.score)),
        h("p", { class: "gauge__badge" }, [
          h("span", { class: "gauge__dot", style: `background:${badgeColor}` }),
          document.createTextNode(SENTIMENT_LABELS[sentiment.label] || sentiment.label),
        ]),
      ]),
    ]),
    h("p", { class: "gauge__summary" }, sentiment.summary),
  ]);
}

function renderSkillsChart(skills) {
  const rows = skills.map((skill) => {
    const pct = Math.max(0, Math.min(100, (skill.rating / 10) * 100));
    return h("div", { class: "skill-row" }, [
      h("div", { class: "skill-row__label" }, [
        h("span", { class: "skill-row__name" }, skill.name),
        skill.note ? h("span", { class: "skill-row__note" }, skill.note) : null,
      ]),
      h("div", { class: "skill-row__track" }, [
        h("div", { class: "skill-row__fill", style: `width:${pct}%` }),
      ]),
      h("span", { class: "skill-row__value" }, `${skill.rating}/10`),
    ]);
  });

  return h("section", { class: "report-section skills-chart" }, [h("h3", {}, "Skill growth"), h("div", { class: "skills-chart__rows" }, rows)]);
}

function renderCardSection(title, modifier, items, cardBuilder) {
  const grid = h(
    "div",
    { class: "card-grid card-grid--report" },
    items.map((item) => cardBuilder(item))
  );
  return h("section", { class: `report-section report-section--${modifier}` }, [h("h3", {}, title), grid]);
}

function buildBasicCard(item, modifier) {
  return h("article", { class: `report-card report-card--${modifier}` }, [
    h("h4", {}, item.title),
    h("p", {}, item.description),
  ]);
}

function buildRegretCard(item) {
  return h("article", { class: "report-card report-card--regret" }, [
    h("h4", {}, item.title),
    h("p", {}, item.description),
    h("p", { class: "report-card__lesson" }, [h("strong", {}, "Lesson: "), document.createTextNode(item.lesson)]),
  ]);
}

function buildGoalCard(item) {
  return h("article", { class: "report-card report-card--goal" }, [
    h("span", { class: "badge" }, TIMEFRAME_LABELS[item.timeframe] || item.timeframe),
    h("h4", {}, item.title),
    h("p", {}, item.description),
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
  const job = sanitizeFilename(currentReport.metadata.jobTitle);
  const date = currentReport.metadata.generatedDate;
  return `reflectify-${job}-${date}.${extension}`;
}

function reportBackgroundColor() {
  const value = getComputedStyle(document.getElementById("report-root")).backgroundColor;
  return value && value !== "rgba(0, 0, 0, 0)" ? value : "#fcfcfb";
}

async function captureReportCanvas() {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
  const root = document.getElementById("report-root");
  return window.html2canvas(root, { scale: 2, backgroundColor: reportBackgroundColor(), useCORS: true });
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
      const canvas = await captureReportCanvas();
      const link = document.createElement("a");
      link.download = filenameFor("png");
      link.href = canvas.toDataURL("image/png");
      link.click();
    })
  );

  pdfBtn.addEventListener(
    "click",
    withExportButton(pdfBtn, async () => {
      const canvas = await captureReportCanvas();
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const imgData = canvas.toDataURL("image/jpeg", 0.92);

      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(filenameFor("pdf"));
    })
  );
}

// ---------- Init ----------

initPromptView();
initUploadView();
initExportButtons();
showView("home");
