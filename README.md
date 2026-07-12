# Reflectify

A small tool for reflecting on your job. No build step, no backend, no
account — everything runs in your browser.

## How it works

1. **Get a prompt.** Click "Get the prompt" and copy the text into ChatGPT,
   Claude, or any AI you like. It interviews you: how many months you're
   reflecting on, your job title, then questions tailored to that role
   covering achievements, challenges, regrets, skill growth, and goals. At
   the end it replies with a JSON object.
2. **Upload your answers.** Save that JSON (or paste it directly) into the
   upload screen. Reflectify validates it and renders a visual report:
   a sentiment gauge, a skills chart, and cards for each section.
3. **Download it.** Export the report as a PNG image or a PDF.

Nothing you write is sent to a server — the AI conversation happens directly
with whichever AI tool you choose, and the JSON upload/report rendering all
happens client-side in this page.

## Running it

There's no build step. Either:

- Open `index.html` directly in a browser, or
- Serve the folder with any static file server, e.g.:

  ```
  npx serve .
  ```

## Files

- `index.html` — markup for all four views (home, prompt, upload, report)
- `style.css` — all styling
- `script.js` — app logic: view switching, prompt copy, JSON parsing/
  validation, report rendering, PNG/PDF export
- `vendor/` — vendored copies of [html2canvas](https://html2canvas.hertzen.com/)
  and [jsPDF](https://github.com/parallax/jsPDF), used for PNG/PDF export.
  Vendored (rather than loaded from a CDN) so the page has no runtime
  dependency on a third party once it's loaded.
