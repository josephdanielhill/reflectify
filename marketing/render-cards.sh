#!/usr/bin/env bash
# Reflectify marketing-card renderer  (BLD-1022 / BLD-1023, parent BLD-1021)
#
# Renders the self-contained card HTML templates to PNG at 1x and 2x, and runs a
# layout audit (font loading, canvas overflow, safe-area containment) before capture.
#
#   ./render-cards.sh hero      -> reflectify-marketing-hero-1x.png / -2x.png
#   ./render-cards.sh feature   -> reflectify-marketing-feature-1x.png / -2x.png
#   ./render-cards.sh all       -> both
#   ./render-cards.sh audit     -> audit only, no PNG writes
#
# Chromium is taken from $CHROME_BIN, else the puppeteer cache, else PATH.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

find_chrome() {
  if [[ -n "${CHROME_BIN:-}" ]]; then echo "$CHROME_BIN"; return; fi
  local cached
  cached="$(ls -1 "$HOME"/.cache/puppeteer/chrome-headless-shell/*/chrome-headless-shell-*/chrome-headless-shell 2>/dev/null | tail -1 || true)"
  if [[ -n "$cached" ]]; then echo "$cached"; return; fi
  command -v chrome-headless-shell || command -v chromium || command -v "Google Chrome" || true
}
CHROME="$(find_chrome)"
[[ -x "$CHROME" ]] || { echo "ERROR: no headless Chromium found (set CHROME_BIN)" >&2; exit 1; }

# name|width|height
CARDS=(
  "hero|1200|630"
  "feature|1080|1080"
)

render_one() {
  local name="$1" w="$2" h="$3" target="$4"
  local html="$HERE/reflectify-marketing-${name}.html"
  [[ -f "$html" ]] || { echo "ERROR: missing $html" >&2; return 1; }

  # ---- audit pass ---------------------------------------------------------
  local audit
  audit="$("$CHROME" --headless --disable-gpu --hide-scrollbars --window-size="$w,$h" \
            --virtual-time-budget=15000 --dump-dom "file://${html}#audit" 2>/dev/null \
            | python3 -c 'import sys,re,html; m=re.search(r"<pre id=\"__audit\">(.*?)</pre>", sys.stdin.read(), re.S); print(html.unescape(m.group(1)) if m else "AUDIT_MISSING")')"
  if [[ "$audit" == "AUDIT_MISSING" ]]; then
    echo "  [$name] AUDIT FAILED — could not measure the layout" >&2
    return 1
  fi
  echo "$audit" | python3 "$HERE/audit-cards.py" "$name" || { echo "  [$name] audit reported hard failures" >&2; return 1; }

  [[ "$target" == "audit" ]] && return 0

  # ---- render pass --------------------------------------------------------
  local dsf out
  for dsf in 1 2; do
    out="$HERE/reflectify-marketing-${name}-${dsf}x.png"
    "$CHROME" --headless --disable-gpu --hide-scrollbars \
      --force-device-scale-factor="$dsf" --window-size="$w,$h" \
      --virtual-time-budget=15000 --screenshot="$out" "file://${html}" >/dev/null 2>&1
    python3 - "$out" "$((w * dsf))" "$((h * dsf))" <<'PY'
import sys
from PIL import Image
path, ew, eh = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
im = Image.open(path)
assert im.size == (ew, eh), f"{path}: expected {ew}x{eh}, got {im.size[0]}x{im.size[1]}"
px = im.convert("RGB").getdata()
uniq = len({p for p in list(px)[::997]})
assert uniq > 6, f"{path}: looks blank (only {uniq} sampled colours)"
print(f"  [ok] {path.split('/')[-1]}  {im.size[0]}x{im.size[1]}  distinct_sampled_colours={uniq}")
PY
  done
}

target="${1:-all}"
case "$target" in
  hero)    render_one hero 1200 630 render ;;
  feature) render_one feature 1080 1080 render ;;
  audit)   for c in "${CARDS[@]}"; do IFS='|' read -r n w h <<<"$c"; render_one "$n" "$w" "$h" audit; done ;;
  all)     for c in "${CARDS[@]}"; do IFS='|' read -r n w h <<<"$c"; render_one "$n" "$w" "$h" render; done ;;
  *) echo "usage: $0 [hero|feature|audit|all]" >&2; exit 2 ;;
esac
