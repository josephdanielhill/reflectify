# Reflectify

A job reflection tool. No build step, no backend, no account — everything
runs in your browser.

## How it works

1. **Get a prompt.** Click "Generate my reflection prompt" and copy the text
   into ChatGPT, Claude, Gemini, or any AI you like. It first asks what
   language you'd like to use &mdash; the whole interview and report can be
   run entirely in German, Spanish, or any language you choose &mdash; then
   interviews you about achievements, regrets, challenges, skill growth,
   relationships, energy/wellbeing, and goals for the period you choose. At
   the end it replies with a JSON object.
2. **Upload your answers.** Save that JSON (or paste it directly) into the
   upload screen. Reflectify renders a visual report card: an overall
   letter grade, a sentiment meter, skills and a timeline, first-person
   quotes pulled from your answers, goals, and an energy/wellbeing trend.
   No JSON handy? Use "Or just see an example report" to preview a fully
   populated sample.
3. **Download it.** Export the report as a PNG image, or print it — the
   report has its own print stylesheet, so choosing "Save as PDF" in your
   browser's print dialog produces a clean, paginated PDF with selectable
   text.

Nothing you write is sent to a server — the AI conversation happens directly
with whichever AI tool you choose, and the JSON upload/report rendering all
happens client-side in this page.

## Schema

```ts
interface ReflectionReport {
  jobTitle: string;
  periodMonths: number;               // integer, 1-120
  overallScore: number;               // 0-100 — drives the letter grade
  headline: string;
  summary: string;
  achievements: { title: string; detail: string }[];
  achievementsAnalysis: string;
  regrets: { title: string; detail: string }[];
  regretsAnalysis: string;
  skills: { name: string; level: number }[];   // level 0-100
  skillsAnalysis: string;
  timeline: { label: string; detail: string }[];
  quotes: string[];
  goals: { title: string; detail: string }[];
  goalsAnalysis: string;
  wellbeing?: { score: number; note: string };            // optional
  sentiment?: { label: string; score: number; note: string }; // optional, score -100..100
  conclusion: string;
}
```

Only `jobTitle`, `periodMonths`, and `overallScore` are required — everything
else defaults gracefully (missing arrays render as empty sections, missing
`sentiment`/`wellbeing`/`quotes` sections simply don't appear).

## Weekly Reset (Framework #3)

A third framework, **Weekly Reset**, ships alongside Job and Personal
Reflection. It's a short, mindful end-of-week check-in (the "Sunday Reset"):
wins, drains, last week's intention, what to let go, and one focus for the
week ahead. Its report schema is keyed on `weekLabel` / `nextFocus` and is
detected and rendered separately from the Job and Personal frameworks, so
uploading a weekly JSON never collides with the other two.

```ts
interface WeeklyResetReport {
  weekLabel: string;                 // e.g. "Week of 14 Sep"
  headline: string;
  atAGlance: string[];
  wins: { title: string; detail: string; quote?: string }[];
  drains: { title: string; detail: string }[];
  intentionReview?: { lastIntention: string; status: "kept"|"partial"|"dropped"|"none"; insight: string };
  gratitude?: string[];
  letGo?: string[];
  nextFocus: { intention: string; why: string; firstStep: string; measure: string };
  energy: { score: number; note: string };   // score 0-10
  quotes?: { section: string; text: string }[];
  sentiment?: { label: string; score: number; note: string };
  conclusion: string;
}
```

Only `weekLabel`, `nextFocus.intention`, and `energy.score` are required;
everything else defaults gracefully (first-week reports that skip the
intention review still render).

## Running it

There's no build step. Either:

- Open `index.html` directly in a browser, or
- Serve the folder with any static file server, e.g.:

  ```
  npx serve .
  ```

## Files

- `index.html` — markup for all four views (home, prompt, upload, report)
- `style.css` — all styling, including the `@media print` rule that makes the
  browser's print-to-PDF produce a clean report
- `script.js` — app logic: view switching, prompt copy, JSON parsing/
  validation/normalization, report rendering, PNG export
- `vendor/html2canvas.min.js` — vendored (not CDN-loaded) so PNG export has no
  runtime third-party dependency. PDF export uses the browser's native
  `window.print()` instead of a library.
- `vendor/fonts/` — the Archivo typeface (weights 400/600/800, SIL Open Font
  License, see `LICENSE-archivo.txt`), vendored as local `.woff2` files rather
  than loaded from Google Fonts. This isn't just about avoiding a CDN
  dependency in general — html2canvas re-fetches `<link>` stylesheets while
  rasterizing the report for PNG export, so a slow or unreachable font host
  would otherwise stall every export. Vendoring the font removes that risk
  entirely rather than trying to work around it.
