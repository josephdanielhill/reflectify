const PROMPT_TEMPLATE = `You are guiding me through a structured reflection on my current job. Interview me one question at a time and wait for my answer before moving to the next question. Keep your tone warm and encouraging, and keep questions concise.

Step 1: Ask what language I'd like to use for this reflection (e.g. English, German, Spanish, French). From that point on, ask every question in that language, and write every piece of prose in your final JSON output - headline, summary, analyses, quotes, conclusion, etc. - in that language too. Keep the JSON keys themselves in English exactly as specified below, regardless of the chosen language.
Step 2: Ask how many months I want this reflection to cover (e.g. 3, 6, 12).
Step 3: Ask my job title.

Then run a guided interview covering, roughly in this order:
1. Achievements & wins - what am I proud of in this period?
2. Regrets or missed opportunities - what would I do differently?
3. Challenges I faced and how I handled them
4. Skills I grew - ask me to name 4-6 skills and rate my growth in each from 0-10 (one decimal place allowed)
5. Relationships & collaboration - who did I work well with, any friction worth noting?
6. Energy & wellbeing - how has my energy/burnout trended? Ask for a 0-10 score (one decimal place allowed) and a short note
7. Goals for the next period

Ask thoughtful follow-up questions where it helps, but keep the whole interview reasonably tight - no more than a few questions per topic.

When the interview is complete, respond with ONLY a single JSON code block (no other text before or after) that exactly matches this schema:

{
  "jobTitle": "string",
  "periodMonths": number,
  "overallScore": number, // 0-10, one decimal place allowed, your holistic assessment of how the period went
  "headline": "string", // one punchy sentence summing up the period
  "summary": "string", // 2-4 sentence summary
  "summaryBullets": ["string"], // 3-5 short scannable bullet points distilling the most important takeaways from the whole period
  "achievements": [{ "title": "string", "detail": "string", "quote": "string" }], // quote is an optional verbatim first-person line from my answer that supports this item
  "achievementsAnalysis": "string", // 2-3 sentences analyzing the pattern across my achievements - what they reveal about me
  "achievementSuggestions": ["string"], // 2-3 personalized actions to build on these strengths
  "challenges": [{ "title": "string", "detail": "string", "quote": "string" }], // the challenges I described facing and how I handled them
  "challengesAnalysis": "string", // 2-3 sentences on the pattern in how I handled challenges
  "regrets": [{ "title": "string", "detail": "string", "quote": "string" }],
  "regretsAnalysis": "string", // 2-3 sentences analyzing the pattern across my regrets
  "regretSuggestions": ["string"], // 2-3 personalized actions to avoid repeating the same pattern
  "skills": [{ "name": "string", "level": number }], // 0-10, one decimal place allowed
  "skillsAnalysis": "string", // 2-3 sentences on what my skill growth (or stagnation) suggests
  "skillDirections": [{ "role": "string", "reason": "string" }], // 2-3 role directions that fit my strongest demonstrated skills (e.g. a visual-design strength -> UI/product roles), each with a one-line reason grounded in my answers
  "quotes": [{ "section": "string", "text": "string" }], // 3-6 short first-person quotes pulled verbatim from my answers, each tagged with the section it belongs to (one of: achievements, challenges, regrets, skills, goals, wellbeing). Use quotes[].section and quotes[].text
  "goals": [{ "title": "string", "detail": "string", "measure": "string", "suggestion": "string", "quote": "string" }], // measure = how I'll know the goal is met; suggestion = a personalized action to help reach it
  "goalsAnalysis": "string", // 2-3 sentences on whether these goals address what came up in the interview
  "wellbeing": { "score": number, "note": "string", "suggestions": ["string"] }, // score 0-10, one decimal place allowed; suggestions = 2-3 personalized actions to protect or raise my energy; optional
  "sentiment": {
    "label": "string", // one or two words, e.g. "Mostly positive", "Mixed", "Strained"
    "score": number, // -100 (very negative) to 100 (very positive), your read of my overall tone across all answers
    "note": "string", // one sentence on what drives that read
    "positives": ["string"], // 2-3 things that genuinely landed well across the period (signal of what to keep doing)
    "improvements": ["string"] // 2-3 specific areas that need attention (signal of what to improve)
  },
  "conclusion": "string" // 2-3 sentence closing reflection tying the period together and pointing forward
}

Base every analysis field on genuine patterns in my actual answers, not generic advice. Before writing the final JSON, review each analysis field (achievementsAnalysis, challengesAnalysis, regretsAnalysis, skillsAnalysis, goalsAnalysis, sentiment.note, conclusion) and confirm it references a specific detail from my answers rather than a generic observation that could apply to anyone; rewrite any field that fails this check.

Save that JSON as a .json file (for example reflection.json) so I can upload it to my reflection report tool.`;

const PERSONAL_DEV_PROMPT_TEMPLATE = `You are guiding me through a structured reflection on my personal development and growth. Interview me one question at a time and wait for my answer before moving to the next question. Keep your tone warm, encouraging, and free of judgment, and keep questions concise.

Step 1: Ask what language I'd like to use for this reflection (e.g. English, German, Spanish, French). From that point on, ask every question in that language, and write every piece of prose in your final JSON output in that language too. Keep the JSON keys themselves in English exactly as specified below, regardless of the chosen language.
Step 2: Ask how many months this reflection covers (e.g. 3, 6, 12).
Step 3: Ask me to name, in one or two words, the season of life I'm currently in (a label I choose myself, e.g. "building," "restoring," "transition," "settling").

Then run a guided interview covering, roughly in this order:
1. Where I've been - what period of my life did these months belong to, and what was the underlying story of it?
2. What I've valued - what did I actually prioritize with my time and attention? What does that say about what matters to me right now? (Ask whether that matches the values I'd claim to hold, and where it doesn't.)
3. Growth & change - in what concrete ways have I grown as a person this period? Ask me to name 3-5 qualities I developed and rate my change in each from -100 to +100 (negative = moved away from it).
4. What I've shed or outgrown - what beliefs, habits, roles, or people-am-I-becoming no longer fit? What did letting go cost me, and what did it free up?
5. Limiting patterns - ask me to name 2-3 recurring patterns that hold me back (self-criticism, avoidance, people-pleasing, overcommitting, etc.). For each, ask for a specific moment this period where it showed up.
6. How I show up with others - my relationships and how I give and receive support. Anywhere I've been giving too much, or not letting myself be helped?
7. Energy & whole-life wellbeing - not just work: how are my body, mind, and spirit doing? Ask for a 0-100 score and a short note on what's draining and what's refilling me.
8. Who I'm becoming - if I look ahead one year, what kind of person do I want to be that I'm not yet? What's the single most important change that would move me toward that?
9. North star commitment - one concrete personal commitment for the next period that moves me toward who I'm becoming.

Ask thoughtful follow-up questions where it helps, but keep the whole interview reasonably tight.

When the interview is complete, respond with ONLY a single JSON code block (no other text before or after) that exactly matches this schema:

{
  "season": "string",
  "periodMonths": number,
  "lifeStory": "string",
  "values": {
    "claimed": ["string"],
    "actual": ["string"],
    "congruence": "string",
    "realignment": ["string"]
  },
  "growth": [{ "quality": "string", "change": number }],
  "growthAnalysis": "string",
  "shed": [{ "item": "string", "cost": "string", "freed": "string" }],
  "shedAnalysis": "string",
  "patterns": [{ "name": "string", "moment": "string", "quote": "string" }],
  "patternsAnalysis": "string",
  "patternDirections": ["string"],
  "relationships": { "note": "string", "balance": "string", "suggestions": ["string"] },
  "wellbeing": { "score": number, "draining": "string", "refilling": "string", "suggestions": ["string"] },
  "quotes": [{ "section": "string", "text": "string" }],
  "becoming": "string",
  "northStar": { "commitment": "string", "why": "string", "measure": "string", "suggestions": ["string"] },
  "sentiment": {
    "label": "string",
    "score": number,
    "note": "string",
    "positives": ["string"],
    "tensions": ["string"]
  },
  "conclusion": "string"
}

Base every analysis field on genuine patterns in my actual answers, not generic advice. Before writing the final JSON, review each analysis field (lifeStory, values.congruence, growthAnalysis, shedAnalysis, patternsAnalysis, relationships.balance, wellbeing, becoming, northStar.why, sentiment.note, conclusion) and confirm it references a specific detail from my answers rather than a generic observation that could apply to anyone; rewrite any field that fails this check.

Save that JSON as a .json file so I can upload it to my reflection report tool.`;

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
  {
    id: "personal-development",
    icon: "🌱",
    name: "Personal Development Reflection",
    image: "illustration-personal-development-reflection.jpg",
    alpha: true,
    description:
      "Guides a forward-looking reflection on who you're becoming - values, growth, what you've shed, patterns, and your north star - then hands back a JSON file for a reflection summary.",
    promptTemplate: PERSONAL_DEV_PROMPT_TEMPLATE,
  },
];

const SAMPLE_REPORT = {
  jobTitle: "Senior Product Designer",
  periodMonths: 6,
  overallScore: 7.8,
  headline: "A period of real growth, with a launch you're proud of and a few boundaries you're still learning to hold.",
  summary: "You shipped the redesign you'd been pushing for a year, grew into a more senior voice in critiques, and started saying no to work that wasn't yours to own. The cost was a stretch in spring where the hours crept up.",
  summaryBullets: [
    "Shipped the checkout redesign end to end - conversion up 12%",
    "Grew into a more senior voice in critiques",
    "Delegation still lags; the spring crunch pushed hours up",
  ],
  achievements: [
    { title: "Shipped the checkout redesign", detail: "Led it end to end, from research through a phased rollout. Conversion is up 12%.", quote: "I finally understand why the old checkout kept losing people, and I actually fixed it." },
    { title: "Mentored two junior designers", detail: "Set up a weekly critique that's stuck even without you running it." },
  ],
  achievementsAnalysis: "Both wins came from you taking ownership beyond your job description - running a project end to end and building a ritual that outlasted your direct involvement. You do your best work when you're trusted with the whole picture, not just a slice of it.",
  achievementSuggestions: [
    "Take the next project no one is asking you to own - that's where you grow fastest.",
    "Write down the critique structure so the next mentor can pick it up and run with it.",
  ],
  challenges: [
    { title: "Managing an unplanned Q2 workload", detail: "Two projects collided and pushed hours up across spring.", quote: "I kept saying yes because I didn't want to seem like I couldn't handle it." },
    { title: "Giving a teammate hard feedback", detail: "Sat on it for months rather than raising it in week one." },
  ],
  challengesAnalysis: "Both challenges share a root: avoiding short-term friction at a longer-term cost. When you did finally name things - the scope and the feedback - they resolved, which suggests the friction you feared was smaller than the cost of delay.",
  regrets: [
    { title: "Said yes to too much in Q2", detail: "Took on a second project without pushing back, which flattened your best quarter." },
    { title: "Delayed a hard conversation", detail: "Sat on feedback for a teammate for months when it needed to happen in week one." },
  ],
  regretsAnalysis: "Both regrets trace back to the same instinct: avoiding friction in the moment, even when you could see the cost coming. That's worth naming directly rather than treating as two separate incidents.",
  regretSuggestions: [
    "Practice a 'not right now' script for scope that lands before you're in too deep.",
    "Put a two-week cap on any difficult feedback you're holding.",
  ],
  skills: [
    { name: "Systems thinking", level: 8.2 },
    { name: "Stakeholder communication", level: 7.4 },
    { name: "Delegation", level: 5.5 },
    { name: "Motion design", level: 6.3 },
  ],
  skillsAnalysis: "Delegation is the clear outlier against otherwise strong growth - consistent with the regret about taking on too much. It's less a skill gap than a permission gap.",
  skillDirections: [
    { role: "Design lead / Staff designer", reason: "Your systems thinking and stakeholder communication already carry a senior cross-functional voice." },
    { role: "Product design roles on complex flows", reason: "The checkout win shows you thrive on untangling high-stakes, multi-step experiences." },
  ],
  quotes: [
    { section: "achievements", text: "I finally understand why the old checkout kept losing people, and I actually fixed it." },
    { section: "challenges", text: "I kept saying yes because I didn't want to seem like I couldn't handle it." },
    { section: "goals", text: "I want feedback to feel like something I do early, not something I dread." },
  ],
  goals: [
    { title: "Protect one deep-work day a week", detail: "Block it and defend it, even from your own manager.", measure: "Four undisturbed deep-work days on the calendar by end of next quarter.", suggestion: "Book it before Monday planning so it isn't already spoken for.", quote: "The redesign only moved once I carved out real focus time." },
    { title: "Give feedback in week one", detail: "Not month three.", measure: "No piece of feedback older than two weeks by the next check-in.", suggestion: "Draft the note the same day it surfaces, then schedule it while it's fresh." },
  ],
  goalsAnalysis: "Both goals directly target the two regrets above, which is a good sign - you're not setting aspirational goals, you're fixing the specific pattern that cost you this period.",
  wellbeing: { score: 5.8, note: "Recovered late in the period, but spring was rough. Worth watching next cycle.", suggestions: ["Protect one evening a week that stays screen-free", "Name your load in the weekly one-to-one before it spikes"] },
  sentiment: {
    label: "Cautiously positive",
    score: 42,
    note: "Pride in the shipped work is real, but it sits next to visible strain about boundaries and overload.",
    positives: ["Real ownership and delivery on the checkout launch", "Mentoring that stuck without you running it"],
    improvements: ["Boundaries around scope and hours", "Speaking up earlier instead of holding feedback"],
  },
  conclusion: "This was a period where you proved you can lead something real, end to end, and people are already leaning on you for more. The work now is protecting your own time as fiercely as you protect the work.",
};

const PERSONAL_DEV_SAMPLE_REPORT = {
  season: "rebuilding",
  periodMonths: 6,
  lifeStory: "Six months of quiet reconstruction - you slowed down, named what wasn't working, and began choosing your energy instead of spending it.",
  values: {
    claimed: ["Honesty", "Rest", "Presence"],
    actual: ["Performing availability", "Overcommitting", "Busyness as worth"],
    congruence:
      "There's a real gap: you claim rest and presence but your behaviour kept serving availability and output. The honesty is that you could see it most months but only recently started acting on it.",
    realignment: ["Say no to two commitments a month before they land", "Schedule rest like a meeting, not as a leftover"],
  },
  growth: [
    { quality: "Self-compassion", change: 62 },
    { quality: "Setting boundaries", change: 48 },
    { quality: "Being still", change: 35 },
    { quality: "People-pleasing", change: -27 },
  ],
  growthAnalysis: "Growth clustered exactly where the work was - you got kinder to yourself and more willing to say no, while the old people-pleasing reflex loosened rather than vanished.",
  shed: [
    { item: "The belief that rest must be earned", cost: "Grief over years of running on empty", freed: "Permission to stop without guilt" },
    { item: "The role of 'always reliable one'", cost: "Some friends leaned harder at first", freed: "Space to ask for help yourself" },
  ],
  shedAnalysis: "You let go of stories you'd been carrying for years. What they cost you is real, but what they freed is the thing the growth scores keep pointing to.",
  patterns: [
    { name: "Overcommitting before checking capacity", moment: "Said yes to a weekend trip while already exhausted, then resented it all weekend.", quote: "I say yes first and do the maths after." },
    { name: "Waiting to be asked before asking for help", moment: "Sat with a heavy project for two weeks instead of asking a friend to split it.", quote: "Asking feels like admitting I can't cope." },
  ],
  patternsAnalysis: "Both patterns share one root: you treat your own capacity as negotiable and your needs as last. The moment you gave yourself permission to check first, both softened.",
  patternDirections: ["Build a 'check capacity before yes' rule and make it visible", "Practise one direct ask for help a week until it stops feeling like failure"],
  relationships: {
    note: "You gave a lot and let little back in. The people closest to you noticed the shift when you finally let them help.",
    balance: "Still tilted toward giving - the balance only starts to level when you actively invite support rather than waiting for it.",
    suggestions: ["Name one thing a friend could genuinely carry this month", "Let someone finish their offer without a quick 'I'm fine'"],
  },
  wellbeing: {
    score: 64,
    draining: "The low-grade guilt about not doing enough, and screens late into the night.",
    refilling: "Morning walks, cooking, and the hour of reading you now defend.",
    suggestions: ["Move the phone out of the bedroom", "Protect the walk even on 'too busy' days"],
  },
  quotes: [
    { section: "values", text: "I say yes first and do the maths after." },
    { section: "patterns", text: "Asking feels like admitting I can't cope." },
    { section: "becoming", text: "I want to be someone whose yes means something because my no does too." },
  ],
  becoming: "A year from now you want to be someone who chooses deliberately - whose rest is protected, whose yes means something, and who lets people in rather than managing everything alone.",
  northStar: {
    commitment: "Protect one full day of rest a week, no exceptions.",
    why: "Every growth score and shed item traces back to learning that rest is a right, not a reward.",
    measure: "Seven rest days kept across the next quarter, logged honestly.",
    suggestions: ["Block it on Sunday for the week ahead", "Tell one person your plan so it's not silent"],
  },
  sentiment: {
    label: "Emerging hope",
    score: 38,
    note: "The tone is weary but turning - real grief sits beside a genuine sense that the rebuild is working.",
    positives: ["Clearer boundaries and kinder self-talk", "Consistent morning walks", "The first real asks for help"],
    tensions: ["Old overcommitting reflex still fires", "Guilt about slowing down", "Nights are still screen-heavy"],
  },
  conclusion: "You spent this period learning, often painfully, that you are allowed to be less. The growth scores confirm what the shed list already knew: the rebuild is working, and the next chapter is about protecting it on purpose.",
};

function gradeFor(score) {
  if (score >= 9.3) return "A+";
  if (score >= 8.7) return "A";
  if (score >= 8.0) return "A-";
  if (score >= 7.3) return "B+";
  if (score >= 6.5) return "B";
  if (score >= 5.5) return "B-";
  if (score >= 4.5) return "C+";
  if (score >= 3.5) return "C";
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

const SVG_NS = "http://www.w3.org/2000/svg";
const SVG_TAGS = new Set(["svg", "g", "rect", "path", "text", "circle", "defs", "use", "clipPath", "linearGradient", "stop"]);

function h(tag, attrs = {}, children = []) {
  const el = SVG_TAGS.has(tag)
    ? document.createElementNS(SVG_NS, tag)
    : document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "class") el.setAttribute("class", value);
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
        tool.alpha ? h("span", { class: "tool-card__alpha" }, "alpha") : null,
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
    const isDev = selectedTool && selectedTool.id === "personal-development";
    currentReport = normalizeReport(isDev ? PERSONAL_DEV_SAMPLE_REPORT : SAMPLE_REPORT);
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

// Detect which framework a report belongs to from its schema. Personal
// Development reports carry development-specific keys that Job reports never do.
function reportFramework(data) {
  if (
    data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    (typeof data.season === "string" ||
      typeof data.lifeStory === "string" ||
      Array.isArray(data.values) ||
      Array.isArray(data.growth) ||
      Array.isArray(data.shed) ||
      Array.isArray(data.patterns) ||
      typeof data.becoming === "string" ||
      (data.northStar && typeof data.northStar === "object"))
  ) {
    return "personal-development";
  }
  return "job-reflection";
}

function validateReport(data) {
  return reportFramework(data) === "personal-development"
    ? validatePersonalDevReport(data)
    : validateJobReport(data);
}

function validateJobReport(data) {
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
    data.overallScore > 10
  ) {
    errors.push('"overallScore" must be a number between 0 and 10.');
  }

  validateOptionalArray(data.achievements, "achievements", errors, titleDetailValidator);
  validateOptionalArray(data.challenges, "challenges", errors, titleDetailValidator);
  validateOptionalArray(data.regrets, "regrets", errors, titleDetailValidator);
  validateOptionalArray(data.goals, "goals", errors, titleDetailValidator);
  validateOptionalArray(data.timeline, "timeline", errors, (item, path, errs) => {
    if (typeof item.label !== "string" || !item.label.trim()) errs.push(`"${path}.label" must be a non-empty string.`);
    if (typeof item.detail !== "string") errs.push(`"${path}.detail" must be a string.`);
  });
  validateOptionalArray(data.skills, "skills", errors, (item, path, errs) => {
    if (typeof item.name !== "string" || !item.name.trim()) errs.push(`"${path}.name" must be a non-empty string.`);
    if (typeof item.level !== "number" || item.level < 0 || item.level > 10) {
      errs.push(`"${path}.level" must be a number between 0 and 10.`);
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

// Personal Development framework validation. Load-bearing: season, periodMonths,
// and (optionally) the structured sub-objects. Everything else is lenient.
function validatePersonalDevReport(data) {
  const errors = [];
  const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

  if (!isObj(data)) {
    return { valid: false, errors: ["The uploaded JSON must be a single object."] };
  }

  if (typeof data.season !== "string" || !data.season.trim()) {
    errors.push('"season" must be a non-empty string (your own label for this period of life).');
  }
  if (!Number.isInteger(data.periodMonths) || data.periodMonths < 1 || data.periodMonths > 120) {
    errors.push('"periodMonths" must be a whole number between 1 and 120.');
  }

  if (data.values !== undefined && data.values !== null && !isObj(data.values)) {
    errors.push('"values" must be an object if present.');
  }
  if (data.northStar !== undefined && data.northStar !== null && !isObj(data.northStar)) {
    errors.push('"northStar" must be an object if present.');
  }

  validateOptionalArray(data.growth, "growth", errors, (item, path, errs) => {
    if (typeof item.quality !== "string" || !item.quality.trim()) errs.push(`"${path}.quality" must be a non-empty string.`);
    if (typeof item.change !== "number" || item.change < -100 || item.change > 100) {
      errs.push(`"${path}.change" must be a number between -100 and +100 (negative = moved away from the quality).`);
    }
  });
  validateOptionalArray(data.shed, "shed", errors, (item, path, errs) => {
    if (typeof item.item !== "string" || !item.item.trim()) errs.push(`"${path}.item" must be a non-empty string.`);
  });
  validateOptionalArray(data.patterns, "patterns", errors, (item, path, errs) => {
    if (typeof item.name !== "string" || !item.name.trim()) errs.push(`"${path}.name" must be a non-empty string.`);
    if (typeof item.moment !== "string" || !item.moment.trim()) errs.push(`"${path}.moment" must be a non-empty string (a concrete instance).`);
  });
  if (data.relationships !== undefined && data.relationships !== null && !isObj(data.relationships)) {
    errors.push('"relationships" must be an object if present.');
  }
  if (data.wellbeing !== undefined && data.wellbeing !== null && !isObj(data.wellbeing)) {
    errors.push('"wellbeing" must be an object if present.');
  }
  if (data.quotes !== undefined && !Array.isArray(data.quotes)) {
    errors.push('"quotes" must be an array if present.');
  }
  if (data.sentiment !== undefined && data.sentiment !== null && !isObj(data.sentiment)) {
    errors.push('"sentiment" must be an object if present.');
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
  return reportFramework(obj) === "personal-development"
    ? normalizePersonalDevReport(obj)
    : normalizeJobReport(obj);
}

function normalizeJobReport(obj) {
  const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
  const r = Object.assign({}, obj);

  r.achievements = Array.isArray(r.achievements) ? r.achievements : [];
  r.challenges = Array.isArray(r.challenges) ? r.challenges : [];
  r.regrets = Array.isArray(r.regrets) ? r.regrets : [];
  r.skills = (Array.isArray(r.skills) ? r.skills : []).map((s) =>
    Object.assign({}, s, { levelPct: Math.max(0, Math.min(100, (Number(s.level) || 0) * 10)) + "%" })
  );
  r.timeline = Array.isArray(r.timeline) ? r.timeline : [];
  // Quotes may be legacy strings OR section-tagged objects ({ section, text }).
  // Keep the objects (so quotes can be placed inside their topic - BLD-1005) and
  // upgrade legacy strings to the object form so downstream code is uniform.
  r.quotes = (Array.isArray(r.quotes) ? r.quotes : [])
    .map((q) => {
      if (typeof q === "string") return { section: "general", text: q };
      if (q && typeof q === "object") {
        const text = q.text || q.quote || q.detail || q.value || null;
        return text ? { section: (q.section || "general").toLowerCase(), text } : null;
      }
      return null;
    })
    .filter(Boolean);
  r.goals = Array.isArray(r.goals) ? r.goals : [];
  r.achievementSuggestions = Array.isArray(r.achievementSuggestions) ? r.achievementSuggestions : [];
  r.regretSuggestions = Array.isArray(r.regretSuggestions) ? r.regretSuggestions : [];
  r.skillDirections = Array.isArray(r.skillDirections) ? r.skillDirections : [];
  r.summaryBullets = Array.isArray(r.summaryBullets) ? r.summaryBullets : [];

  r.jobTitle = r.jobTitle || "Untitled role";
  r.headline = r.headline || "";
  r.summary = r.summary || "";
  r.achievementsAnalysis = r.achievementsAnalysis || "";
  r.challengesAnalysis = r.challengesAnalysis || "";
  r.regretsAnalysis = r.regretsAnalysis || "";
  r.skillsAnalysis = r.skillsAnalysis || "";
  r.goalsAnalysis = r.goalsAnalysis || "";

  r.sentiment = isObj(r.sentiment) ? r.sentiment : null;
  if (r.sentiment) {
    r.sentiment.score = Math.max(-100, Math.min(100, Number(r.sentiment.score) || 0));
    r.sentiment.pct = (r.sentiment.score + 100) / 2 + "%";
    r.sentiment.label = r.sentiment.label || "Mixed";
    r.sentiment.note = r.sentiment.note || "";
    r.sentiment.positives = Array.isArray(r.sentiment.positives) ? r.sentiment.positives : [];
    r.sentiment.improvements = Array.isArray(r.sentiment.improvements) ? r.sentiment.improvements : [];
  }

  r.wellbeing = isObj(r.wellbeing) && typeof r.wellbeing.score === "number" ? r.wellbeing : null;
  if (r.wellbeing) {
    r.wellbeing.score = Math.max(0, Math.min(10, Number(r.wellbeing.score) || 0));
    r.wellbeing.pct = Math.round(r.wellbeing.score * 10) + "%";
    r.wellbeing.note = r.wellbeing.note || "";
    r.wellbeing.suggestions = Array.isArray(r.wellbeing.suggestions) ? r.wellbeing.suggestions : [];
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

// Personal Development normalizer: lenient defaulting for the dev schema.
function normalizePersonalDevReport(obj) {
  const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
  const r = Object.assign({}, obj);

  r.season = r.season || "this period";
  r.periodMonths = Number(r.periodMonths) || 0;
  r.lifeStory = r.lifeStory || "";

  r.values = isObj(r.values) ? r.values : null;
  if (r.values) {
    r.values.claimed = Array.isArray(r.values.claimed) ? r.values.claimed : [];
    r.values.actual = Array.isArray(r.values.actual) ? r.values.actual : [];
    r.values.congruence = r.values.congruence || "";
    r.values.realignment = Array.isArray(r.values.realignment) ? r.values.realignment : [];
  }

  r.growth = (Array.isArray(r.growth) ? r.growth : []).map((g) => {
    const change = Math.max(-100, Math.min(100, Number(g.change) || 0));
    return Object.assign({}, g, { change, pct: (change + 100) / 2 + "%" });
  });
  r.growthAnalysis = r.growthAnalysis || "";

  r.shed = Array.isArray(r.shed) ? r.shed : [];
  r.shedAnalysis = r.shedAnalysis || "";

  r.patterns = Array.isArray(r.patterns) ? r.patterns : [];
  r.patternsAnalysis = r.patternsAnalysis || "";
  r.patternDirections = Array.isArray(r.patternDirections) ? r.patternDirections : [];

  r.relationships = isObj(r.relationships) ? r.relationships : null;
  if (r.relationships) {
    r.relationships.note = r.relationships.note || "";
    r.relationships.balance = r.relationships.balance || "";
    r.relationships.suggestions = Array.isArray(r.relationships.suggestions) ? r.relationships.suggestions : [];
  }

  r.wellbeing = isObj(r.wellbeing) && typeof r.wellbeing.score === "number" ? r.wellbeing : null;
  if (r.wellbeing) {
    r.wellbeing.score = Math.max(0, Math.min(100, Number(r.wellbeing.score) || 0));
    r.wellbeing.pct = r.wellbeing.score + "%";
    r.wellbeing.draining = r.wellbeing.draining || "";
    r.wellbeing.refilling = r.wellbeing.refilling || "";
    r.wellbeing.suggestions = Array.isArray(r.wellbeing.suggestions) ? r.wellbeing.suggestions : [];
  }

  r.quotes = (Array.isArray(r.quotes) ? r.quotes : [])
    .map((q) => {
      if (typeof q === "string") return { section: "general", text: q };
      if (q && typeof q === "object") {
        const text = q.text || q.quote || null;
        return text ? { section: (q.section || "general").toLowerCase(), text } : null;
      }
      return null;
    })
    .filter(Boolean);

  r.becoming = r.becoming || "";

  r.northStar = isObj(r.northStar) ? r.northStar : null;
  if (r.northStar) {
    r.northStar.commitment = r.northStar.commitment || "";
    r.northStar.why = r.northStar.why || "";
    r.northStar.measure = r.northStar.measure || "";
    r.northStar.suggestions = Array.isArray(r.northStar.suggestions) ? r.northStar.suggestions : [];
  }

  r.sentiment = isObj(r.sentiment) ? r.sentiment : null;
  if (r.sentiment) {
    r.sentiment.score = Math.max(-100, Math.min(100, Number(r.sentiment.score) || 0));
    r.sentiment.pct = (r.sentiment.score + 100) / 2 + "%";
    r.sentiment.label = r.sentiment.label || "Mixed";
    r.sentiment.note = r.sentiment.note || "";
    r.sentiment.positives = Array.isArray(r.sentiment.positives) ? r.sentiment.positives : [];
    r.sentiment.tensions = Array.isArray(r.sentiment.tensions) ? r.sentiment.tensions : [];
  }

  if (!r.conclusion || typeof r.conclusion !== "string") {
    r.conclusion = r.becoming
      ? r.becoming
      : "A period worth sitting with. Carry the growth forward and keep tending the north star ahead.";
  }

  return r;
}
// Each topic is rendered as "your own words + the AI's read + what to do next"
// (BLD-1006), with any verbatim quotes shown inside the section they came from
// (BLD-1005). The report stays backward-compatible: every new field is optional
// and legacy reports render fine when those fields are absent.

function renderReport(report) {
  return reportFramework(report) === "personal-development"
    ? renderPersonalDevReport(report)
    : renderJobReport(report);
}

function renderJobReport(report) {
  const root = document.getElementById("report-card") || document.getElementById("printable-report");
  root.innerHTML = "";
  const grade = gradeFor(report.overallScore);
  const periodLabel = `${report.periodMonths}-month reflection`;
  const generatedDate = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const topics = [
    renderTopicAchievements(report),
    renderTopicChallenges(report), // BLD-999: challenges were missing from the render
    renderTopicRegrets(report),
    renderTopicSkills(report), // BLD-1004: matched roles/actions from strengths
    renderTopicGoals(report), // BLD-1002: suggestions + measurable parameters
  ].filter(Boolean);

  [
    renderHeader(report, grade, periodLabel),
    renderSentiment(report), // BLD-1000: positives + improvements per section
    renderOverview(report), // BLD-1001: scannable bullets beside the summary
    renderTopicWellbeing(report), // BLD-1003: actionable suggestions
    ...topics,
    renderGeneralQuotes(report), // untagged legacy quotes (BLD-1005 fallback)
    renderConclusion(report),
    renderFooter(generatedDate),
  ]
    .filter(Boolean)
    .forEach((node) => root.appendChild(node));
    }

    // ---------- Personal Development report rendering ----------
    // Framework #2 (BLD-1012): a different schema from the Job Reflection report.
    // Reuses the shared primitives (h, renderTopic, quoteNodes, renderConclusion,
    // renderFooter) and the same report-card styling, but renders its own sections.

    function renderPersonalDevHeader(report) {
    const periodLabel = `${report.periodMonths}-month reflection`;
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
          h("div", { class: "report-card__season" }, `Season of ${report.season}`),
          h("h1", { class: "report-card__title" }, "Personal Development Reflection"),
          h("p", { class: "report-card__headline" }, report.lifeStory),
        ]),
      ]),
    ]);
    }

    function renderValues(report) {
    const v = report.values;
    if (!v) return null;
    const left = [
      ...quoteNodes(report, "values", []),
      h("div", { class: "report-card__values-pair" }, [
        h("div", { class: "report-card__values-col" }, [
          h("h6", { class: "report-card__label report-card__label--muted" }, "Values you claim"),
          h("ul", { class: "report-card__suggest" }, (v.claimed || []).map((c) => h("li", {}, c))),
        ]),
        h("div", { class: "report-card__values-col" }, [
          h("h6", { class: "report-card__label report-card__label--muted" }, "What you actually prioritized"),
          h("ul", { class: "report-card__suggest" }, (v.actual || []).map((a) => h("li", {}, a))),
        ]),
      ]),
    ];
    const right = [
      v.congruence ? h("p", { class: "report-card__note" }, v.congruence) : null,
      ...(v.realignment && v.realignment.length
        ? [
            h("h6", { class: "report-card__label report-card__label--sub" }, "How to close the gap"),
            h("ul", { class: "report-card__suggest" }, v.realignment.map((r) => h("li", {}, r))),
          ]
        : []),
    ];
    return renderTopic(1, "What you've valued", left, right, "Living by your values");
    }

    function renderGrowth(report) {
    const growth = Array.isArray(report.growth) ? report.growth : [];
    const left = [
      ...quoteNodes(report, "growth", report.growth),
      ...(growth.length
        ? growth.map((g) =>
            h("div", { class: "report-card__skill" }, [
              h("div", { class: "report-card__skill-head" }, [
                h("span", {}, g.quality),
                h("span", {}, `${g.change > 0 ? "+" : ""}${g.change}`),
              ]),
              h("div", { class: "report-card__bar report-card__bar--growth" }, [
                h("div", { class: "report-card__bar-fill", style: `width:${g.pct}` }),
              ]),
            ])
          )
        : [h("p", { class: "report-card__empty" }, "No growth areas recorded this period.")]),
    ];
    const right = [
      report.growthAnalysis ? h("p", { class: "report-card__note" }, report.growthAnalysis) : null,
    ];
    if (!growth.length && !report.growthAnalysis) return null;
    return renderTopic(2, "How you've grown", left, right, "Analysis & what it points to");
    }

    function renderShed(report) {
    const shed = Array.isArray(report.shed) ? report.shed : [];
    const left = [
      ...quoteNodes(report, "shed", report.shed),
      ...(shed.length
        ? shed.map((s) =>
            h("div", { class: "report-card__shed-item" }, [
              h("h5", { class: "report-card__item-title" }, s.item),
              s.cost ? h("p", { class: "report-card__item-detail" }, `What it cost: ${s.cost}`) : null,
              s.freed ? h("p", { class: "report-card__item-detail" }, `What it freed: ${s.freed}`) : null,
            ])
          )
        : [h("p", { class: "report-card__empty" }, "Nothing shed this period.")]),
    ];
    const right = [
      report.shedAnalysis ? h("p", { class: "report-card__note" }, report.shedAnalysis) : null,
    ];
    if (!shed.length && !report.shedAnalysis) return null;
    return renderTopic(3, "What you've shed or outgrown", left, right, "Analysis & what letting go made room for");
    }

    function renderPatterns(report) {
    const patterns = Array.isArray(report.patterns) ? report.patterns : [];
    const left = [
      ...quoteNodes(report, "patterns", report.patterns),
      ...(patterns.length
        ? patterns.map((p) =>
            h("div", { class: "report-card__shed-item" }, [
              h("h5", { class: "report-card__item-title" }, p.name),
              p.moment ? h("p", { class: "report-card__item-detail" }, p.moment) : null,
              p.quote ? h("p", { class: "report-card__inline-quote" }, `“${p.quote}”`) : null,
            ])
          )
        : [h("p", { class: "report-card__empty" }, "No recurring patterns recorded this period.")]),
    ];
    const right = [
      report.patternsAnalysis ? h("p", { class: "report-card__note" }, report.patternsAnalysis) : null,
      ...(report.patternDirections && report.patternDirections.length
        ? [
            h("h6", { class: "report-card__label report-card__label--sub" }, "Directions to practise"),
            h("ul", { class: "report-card__suggest" }, report.patternDirections.map((d) => h("li", {}, d))),
          ]
        : []),
    ];
    if (!patterns.length && !report.patternsAnalysis) return null;
    return renderTopic(4, "Patterns that hold you back", left, right, "Analysis & what to practise");
    }

    function renderRelationships(report) {
    const rel = report.relationships;
    if (!rel) return null;
    const left = [
      ...quoteNodes(report, "relationships", []),
      rel.note ? h("p", { class: "report-card__item-detail" }, rel.note) : null,
    ];
    const right = [
      rel.balance ? h("p", { class: "report-card__note" }, rel.balance) : null,
      ...(rel.suggestions && rel.suggestions.length
        ? [
            h("h6", { class: "report-card__label report-card__label--sub" }, "Ways to rebalance"),
            h("ul", { class: "report-card__suggest" }, rel.suggestions.map((s) => h("li", {}, s))),
          ]
        : []),
    ];
    return renderTopic(5, "How you show up with others", left, right, "Analysis & how to rebalance");
    }

    function renderWholeWellbeing(report) {
    const w = report.wellbeing;
    if (!w) return null;
    const left = [
      h("div", { class: "report-card__skill" }, [
        h("div", { class: "report-card__skill-head" }, [
          h("span", {}, "Whole-life wellbeing"),
          h("span", {}, String(w.score)),
        ]),
        h("div", { class: "report-card__bar" }, [
          h("div", { class: "report-card__bar-fill", style: `width:${w.pct}` }),
        ]),
      ]),
      w.draining ? h("p", { class: "report-card__item-detail" }, `Draining: ${w.draining}`) : null,
      w.refilling ? h("p", { class: "report-card__item-detail" }, `Refilling: ${w.refilling}`) : null,
    ];
    const right = [
      ...(w.suggestions && w.suggestions.length
        ? [
            h("h6", { class: "report-card__label report-card__label--sub" }, "Ways to refill"),
            h("ul", { class: "report-card__suggest" }, w.suggestions.map((s) => h("li", {}, s))),
          ]
        : []),
    ];
    return renderTopic(6, "Energy & whole-life wellbeing", left, right, "How to refill");
    }

    function renderBecoming(report) {
    const b = report.becoming || "";
    const ns = report.northStar;
    const left = [
      ...quoteNodes(report, "becoming", []),
      b ? h("p", { class: "report-card__item-detail" }, b) : null,
    ];
    const right = [];
    if (ns && (ns.commitment || ns.why || ns.measure)) {
      right.push(h("h6", { class: "report-card__label report-card__label--sub" }, "North star commitment"));
      if (ns.commitment) right.push(h("h5", { class: "report-card__direction-role" }, ns.commitment));
      if (ns.why) right.push(h("p", { class: "report-card__note" }, ns.why));
      if (ns.measure) {
        right.push(
          h("p", { class: "report-card__measure" }, [
            h("span", { class: "report-card__measure-tag" }, "How you'll know"),
            ns.measure,
          ])
        );
      }
      if (ns.suggestions && ns.suggestions.length) {
        right.push(
          h("ul", { class: "report-card__suggest" }, ns.suggestions.map((s) => h("li", {}, s)))
        );
      }
    }
    if (!b && !right.length) return null;
    return renderTopic(7, "Who you're becoming", left, right, "Your north star");
    }

    function renderDevSentiment(report) {
    const s = report.sentiment;
    if (!s) return null;
    const positives = Array.isArray(s.positives) ? s.positives : [];
    const tensions = Array.isArray(s.tensions) ? s.tensions : [];
    const children = [
      h("div", { class: "report-card__sentiment-main" }, [
        h("div", { class: "report-card__sentiment-meta" }, [
          h("h6", { class: "report-card__label" }, "Sentiment"),
          h("div", { class: "report-card__sentiment-value" }, s.label),
        ]),
        h("div", { class: "report-card__sentiment-meter" }, [
          h("div", { class: "report-card__bar report-card__bar--sentiment" }, [
            h("div", { class: "report-card__bar-fill", style: `width:${s.pct}` }),
          ]),
          h("span", { class: "report-card__sentiment-score" }, String(s.score)),
        ]),
      ]),
      s.note ? h("p", { class: "report-card__sentiment-note" }, s.note) : null,
    ];
    if (positives.length || tensions.length) {
      children.push(
        h("div", { class: "report-card__sentiment-signals" }, [
          positives.length
            ? h("div", { class: "report-card__signal report-card__signal--pos" }, [
                h("span", { class: "report-card__signal-tag" }, "Keep doing"),
                h("ul", { class: "report-card__suggest" }, positives.map((p) => h("li", {}, p))),
              ])
            : null,
          tensions.length
            ? h("div", { class: "report-card__signal report-card__signal--neg" }, [
                h("span", { class: "report-card__signal-tag" }, "Watch out for"),
                h("ul", { class: "report-card__suggest" }, tensions.map((t) => h("li", {}, t))),
              ])
            : null,
        ])
      );
    }
    return h("div", { class: "report-card__sentiment" }, children);
    }

    function renderPersonalDevReport(report) {
    const root = document.getElementById("report-card") || document.getElementById("printable-report");
    root.innerHTML = "";
    const generatedDate = new Date().toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    [
      renderPersonalDevHeader(report),
      renderDevSentiment(report),
      renderValues(report),
      renderGrowth(report),
      renderShed(report),
      renderPatterns(report),
      renderRelationships(report),
      renderWholeWellbeing(report),
      renderBecoming(report),
      renderConclusion(report),
      renderFooter(generatedDate),
    ]
      .filter(Boolean)
      .forEach((node) => root.appendChild(node));
    }

    // A topic = a full-width band with a heading, then a two-column split:
// left  = the user's own reflection (items + their verbatim quotes)
// right = the AI analysis + personalized recommendations
function renderTopic(index, title, leftCol, rightCol, rightHeading = "Analysis & next steps") {
  const children = [];

  if (title) {
    children.push(
      h("div", { class: "report-card__topic-head" }, [
        h("span", { class: "report-card__topic-index" }, String(index)),
        h("h3", { class: "report-card__topic-title" }, title),
      ])
    );
  }

  children.push(
    h("div", { class: "report-card__grid" }, [
      h("div", { class: "report-card__col report-card__col--your" }, [
        h("h6", { class: "report-card__label report-card__label--muted" }, "Your reflection"),
        ...leftCol,
      ]),
      h("div", { class: "report-card__col report-card__col--insight" }, [
        h("div", { class: "report-card__insight-card" }, [
          h("h6", { class: "report-card__label report-card__insight-label" }, rightHeading),
          ...rightCol,
        ]),
      ]),
    ])
  );

  return h("section", { class: "report-card__topic" }, children);
}

function renderTopicSectionIntro(items) {
  if (!items || !items.length) {
    return [h("p", { class: "report-card__empty" }, "Nothing recorded here this period.")];
  }
  return items.map(renderReflectionItem);
}

// One reflection entry: title + detail + any verbatim quote attached to it.
function renderReflectionItem(item) {
  const nodes = [];
  if (item && typeof item === "object") {
    if (item.title) nodes.push(h("h5", { class: "report-card__item-title" }, item.title));
    if (item.detail) nodes.push(h("p", { class: "report-card__item-detail" }, item.detail));
    if (item.quote) nodes.push(h("p", { class: "report-card__inline-quote" }, `“${item.quote}”`));
    // goals add measure + suggestion (BLD-1002)
    if (item.measure) {
      nodes.push(
        h("p", { class: "report-card__measure" }, [
          h("span", { class: "report-card__measure-tag" }, "How you'll know"),
          item.measure,
        ])
      );
    }
    if (item.suggestion) {
      nodes.push(
        h("p", { class: "report-card__measure report-card__measure--suggestion" }, [
          h("span", { class: "report-card__measure-tag" }, "Try"),
          item.suggestion,
        ])
      );
    }
  } else {
    nodes.push(h("p", { class: "report-card__item-detail" }, String(item)));
  }
  return h("div", { class: "report-card__item" }, nodes);
}

// Personalized recommendations as a compact checklist.
function renderSuggestions(items, empty = null) {
  if (!items || !items.length) return empty ? [empty] : [];
  return [
    h("ul", { class: "report-card__suggest" }, items.map((s) => h("li", {}, s))),
  ];
}

function quoteNodes(report, section, items) {
  if (!Array.isArray(report.quotes)) return [];
  // Quotes already shown inline on an item (item.quote) should not repeat in the
  // section band (BLD-1005). Fall back to BLD-999-era layout if none match.
  const inlineTexts = new Set(
    (items || []).map((i) => (i && typeof i === "object" ? i.quote || i.text : null)).filter(Boolean)
  );
  return report.quotes
    .filter((q) => q && (q.section || "").toLowerCase() === section)
    .map((q) => q.text || q.quote)
    .filter(Boolean)
    .filter((text) => !inlineTexts.has(text))
    .map((text) => h("p", { class: "report-card__inline-quote" }, `“${text}”`));
}

// Untagged legacy quotes have no topic to live in; show them as one small band
// so no words are lost (BLD-1005 keeps section-tagged quotes inline instead).
function renderGeneralQuotes(report) {
  if (!Array.isArray(report.quotes)) return null;
  const texts = report.quotes
    .filter((q) => q && (q.section === "general" || !q.section) && (q.text || q.quote))
    .map((q) => q.text || q.quote);
  if (!texts.length) return null;
  return h("div", { class: "report-card__quotes" }, [
    h("h6", { class: "report-card__quotes-label" }, "In your own words"),
    ...texts.map((t) => h("p", { class: "report-card__quote" }, `“${t}”`)),
  ]);
}

function renderTopicAchievements(report) {
  const left = [
    ...quoteNodes(report, "achievements", report.achievements),
    ...renderTopicSectionIntro(report.achievements),
  ];
  if (!left.length && !report.achievementsAnalysis) return null;
  return renderTopic(1, "Wins & achievements", left, [
    report.achievementsAnalysis
      ? h("p", { class: "report-card__note" }, report.achievementsAnalysis)
      : null,
    ...renderSuggestions(report.achievementSuggestions),
  ], "What went well & how to build on it");
}

function renderTopicChallenges(report) {
  const left = [
    ...quoteNodes(report, "challenges", report.challenges),
    ...renderTopicSectionIntro(report.challenges),
  ];
  if (!left.length && !report.challengesAnalysis) return null;
  return renderTopic(2, "Challenges & how you handled them", left, [
    report.challengesAnalysis
      ? h("p", { class: "report-card__note" }, report.challengesAnalysis)
      : null,
  ], "What the hard parts revealed");
}

function renderTopicRegrets(report) {
  const left = [
    ...quoteNodes(report, "regrets", report.regrets),
    ...renderTopicSectionIntro(report.regrets),
  ];
  if (!left.length && !report.regretsAnalysis) return null;
  return renderTopic(3, "Regrets & lessons", left, [
    report.regretsAnalysis
      ? h("p", { class: "report-card__note" }, report.regretsAnalysis)
      : null,
    ...renderSuggestions(report.regretSuggestions),
  ], "The pattern & how not to repeat it");
}

function renderTopicSkills(report) {
  const left = [
    ...quoteNodes(report, "skills", report.skills),
    ...(report.skills && report.skills.length
      ? report.skills.map((skill) =>
          h("div", { class: "report-card__skill" }, [
            h("div", { class: "report-card__skill-head" }, [
              h("span", {}, skill.name),
              h("span", {}, String(skill.level)),
            ]),
            h("div", { class: "report-card__bar" }, [
              h("div", { class: "report-card__bar-fill", style: `width:${skill.levelPct}` }),
            ]),
          ])
        )
      : [h("p", { class: "report-card__empty" }, "No skills recorded this period.")]),
  ];

  const directions = (report.skillDirections || [])
    .filter((d) => d && (d.role || d.reason))
    .map((d) =>
      h("div", { class: "report-card__direction" }, [
        d.role ? h("h5", { class: "report-card__direction-role" }, d.role) : null,
        d.reason ? h("p", { class: "report-card__item-detail" }, d.reason) : null,
      ])
    );

  const right = [
    report.skillsAnalysis ? h("p", { class: "report-card__note" }, report.skillsAnalysis) : null,
    ...(directions.length
      ? [
          h("h6", { class: "report-card__label report-card__label--sub" }, "Roles worth leaning into"),
          ...directions,
        ]
      : []),
  ];
  if (!report.skillsAnalysis && !directions.length) return null;
  return renderTopic(4, "Skills & growth", left, right, "Analysis & where you could go next");
}

function renderTopicGoals(report) {
  const left = [
    ...quoteNodes(report, "goals", report.goals),
    ...renderTopicSectionIntro(report.goals),
  ];
  const right = [
    report.goalsAnalysis
      ? h("p", { class: "report-card__note" }, report.goalsAnalysis)
      : null,
  ];
  // Per-goal suggestion falls through below each goal on the user side; keep any
  // explicit list-level advice here too if present.
  if (!left.length && !right.some(Boolean)) return null;
  return renderTopic(5, "Goals ahead", left, right, "Why these goals fit");
}

function renderTopicWellbeing(report) {
  const wellbeingChildren = [
    ...quoteNodes(report, "wellbeing", []),
    h("div", { class: "report-card__skill-head" }, [
      h("span", {}, "Energy across the period"),
      h("span", {}, String(report.wellbeing ? report.wellbeing.score : "")),
    ]),
  ];
  if (report.wellbeing) {
    wellbeingChildren.push(
      h("div", { class: "report-card__bar", style: "margin-bottom:var(--space-3)" }, [
        h("div", { class: "report-card__bar-fill", style: `width:${report.wellbeing.pct}` }),
      ]),
      h("p", { class: "report-card__item-detail" }, report.wellbeing.note || "No note this period."),
      ...renderSuggestions(report.wellbeing.suggestions)
    );
  } else {
    wellbeingChildren.push(h("p", { class: "report-card__empty" }, "Not tracked this period."));
  }

  return h("div", { class: "report-card__topic" }, [
    h("div", { class: "report-card__topic-head" }, [
      h("span", { class: "report-card__topic-index" }, "◆"),
      h("h3", { class: "report-card__topic-title" }, "Energy & wellbeing"),
    ]),
    h("div", { class: "report-card__wellbeing" }, wellbeingChildren),
  ]);
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
  const s = report.sentiment;
  const positives = Array.isArray(s.positives) ? s.positives : [];
  const improvements = Array.isArray(s.improvements) ? s.improvements : [];
  const children = [
    h("div", { class: "report-card__sentiment-main" }, [
      h("div", { class: "report-card__sentiment-meta" }, [
        h("h6", { class: "report-card__label" }, "Sentiment"),
        h("div", { class: "report-card__sentiment-value" }, s.label),
      ]),
      h("div", { class: "report-card__sentiment-meter" }, [
        h("div", { class: "report-card__bar report-card__bar--sentiment" }, [
          h("div", { class: "report-card__bar-fill", style: `width:${s.pct}` }),
        ]),
        h("span", { class: "report-card__sentiment-score" }, String(s.score)),
      ]),
    ]),
    s.note ? h("p", { class: "report-card__sentiment-note" }, s.note) : null,
  ];

  // Per-section sentiment signals (BLD-1000): positives to keep, improvements to watch.
  if (positives.length || improvements.length) {
    children.push(
      h("div", { class: "report-card__sentiment-signals" }, [
        positives.length
          ? h("div", { class: "report-card__signal report-card__signal--pos" }, [
              h("span", { class: "report-card__signal-tag" }, "Keep doing"),
              h("ul", { class: "report-card__suggest" }, positives.map((p) => h("li", {}, p))),
            ])
          : null,
        improvements.length
          ? h("div", { class: "report-card__signal report-card__signal--neg" }, [
              h("span", { class: "report-card__signal-tag" }, "Watch out for"),
              h("ul", { class: "report-card__suggest" }, improvements.map((i) => h("li", {}, i))),
            ])
          : null,
      ])
    );
  }
  return h("div", { class: "report-card__sentiment" }, children);
}

// Overview = the descriptive summary alongside scannable bullet points (BLD-1001).
function renderOverview(report) {
  const bullets = Array.isArray(report.summaryBullets) ? report.summaryBullets : [];
  const hasSummary = Boolean(report.summary || bullets.length);
  if (!hasSummary) return null;

  const groups = [];
  if (report.summary) {
    groups.push(
      h("div", { class: "report-card__overview-col report-card__overview-col--desc" }, [
        h("h6", { class: "report-card__label" }, "In a nutshell"),
        h("p", { class: "report-card__summary-text" }, report.summary),
      ])
    );
  }
  if (bullets.length) {
    groups.push(
      h("div", { class: "report-card__overview-col" }, [
        h("h6", { class: "report-card__label" }, "Key points"),
        h("ul", { class: "report-card__suggest report-card__suggest--bullets" }, bullets.map((b) => h("li", {}, b))),
      ])
    );
  }
  return h("div", { class: "report-card__overview" }, groups);
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
  const isDev = reportFramework(currentReport) === "personal-development";
  const job = sanitizeFilename(isDev ? "personal-development-reflection" : currentReport.jobTitle);
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

// ---------- About avatar wobble ----------
// Gives the circular creator avatar the same gentle cursor-following tilt
// as the hero image, so it feels alive as you move over it.
function initAvatarWobble() {
  const frame = document.querySelector("#about-avatar");
  if (!frame) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduce.matches) return;

  const MAX_TILT_X = 10; // degrees
  const MAX_TILT_Y = 10;
  const ROT_SMOOTH = 0.09;
  const RAF = window.requestAnimationFrame.bind(window);

  let current = { x: 0, y: 0 };
  let target = { x: 0, y: 0 };
  let active = false;

  function frameLoop() {
    current.x += (target.x - current.x) * ROT_SMOOTH;
    current.y += (target.y - current.y) * ROT_SMOOTH;
    frame.style.transform =
      `perspective(800px) rotateX(${current.x.toFixed(2)}deg) rotateY(${current.y.toFixed(2)}deg)`;
    if (Math.abs(target.x - current.x) > 0.02 || Math.abs(target.y - current.y) > 0.02) {
      RAF(frameLoop);
    } else {
      active = false;
    }
  }

  function start(targetX, targetY) {
    target.x = targetX;
    target.y = targetY;
    if (!active) {
      active = true;
      RAF(frameLoop);
    }
  }

  frame.addEventListener("pointermove", (e) => {
    const rect = frame.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const px = (e.clientX - rect.left) / rect.width; // 0..1
    const py = (e.clientY - rect.top) / rect.height; // 0..1
    start((0.5 - py) * 2 * MAX_TILT_X, (px - 0.5) * 2 * MAX_TILT_Y);
  });

  frame.addEventListener("pointerleave", () => {
    start(0, 0);
  });
}

// ---------- Beta feedback floating widget ----------
// Toggles the floating beta-feedback panel open/closed on button press,
// and dismisses it when clicking outside or pressing Escape.
function initBetaFeedback() {
  const root = document.getElementById("beta-feedback");
  const fab = document.getElementById("beta-feedback-fab");
  const panel = document.getElementById("beta-feedback-panel");
  if (!root || !fab || !panel) return;

  function setOpen(open) {
    root.classList.toggle("is-open", open);
    fab.setAttribute("aria-expanded", String(open));
    panel.setAttribute("aria-hidden", String(!open));
  }

  fab.addEventListener("click", (e) => {
    e.stopPropagation();
    setOpen(!root.classList.contains("is-open"));
  });

  document.addEventListener("click", (e) => {
    if (!root.classList.contains("is-open")) return;
    if (!root.contains(e.target)) setOpen(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && root.classList.contains("is-open")) setOpen(false);
  });
}

// ---------- Init ----------

initToolGrid();
initPromptView();
initUploadView();
initExportButtons();
initHeroWobble();
initAvatarWobble();
initBetaFeedback();
showView("home");
