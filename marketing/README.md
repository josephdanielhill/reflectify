# Reflectify marketing cards

Export-ready campaign cards for Reflectify, built the same way as the Milo launch
assets: self-contained HTML templates rendered headless to PNG, restyled into
Reflectify's own restrained visual language.

## Cards

| Card | Source | Export | Size |
|---|---|---|---|
| Hero / social | `reflectify-marketing-hero.html` | `reflectify-marketing-hero-{1x,2x}.png` | 1200x630 / 2400x1260 |
| Feature / workflow | `reflectify-marketing-feature.html` | `reflectify-marketing-feature-{1x,2x}.png` | 1080x1080 / 2160x2160 |

`reflectify-marketing-hero-1x.png` is also the site's `og:image` / `twitter:image`.

## Re-render

```bash
./render-cards.sh all      # audit + render every card at 1x and 2x
./render-cards.sh hero     # one card
./render-cards.sh audit    # layout audit only, no PNGs
```

The renderer uses the Chrome for Testing binary already on this machine
(`~/.cache/puppeteer/chrome-headless-shell`) via raw `--screenshot`, with
`--force-device-scale-factor=2` for the 2x pass. No npm install required.

## Design rules baked into both templates

- Brand tokens come from `../style.css` (`#F7F5F0` paper, `#1E2421` ink,
  `#2D4A3E` moss, `#B0523A` terracotta) — do not invent colours.
- Newsreader for display, Inter for body; both self-hosted from `../vendor/fonts`.
  No CDN font link, so the headless capture can never race a network fetch.
- One accent colour per card. Terracotta is reserved for the hero CTA pill; the
  feature card uses moss only.
- Flat paper, no hard gradients. If a card starts to look like the Milo campaign,
  it is wrong.
- Text stays inside the middle 80% of the canvas so the hero survives a centre
  crop for X / LinkedIn cards.
- No `@`-prefixed strings in copy (the Linear mention resolver chokes on them).

## Verification

`python3 -m unittest discover -s tests -v` runs `tests/test_marketing_cards.py`,
which asserts the templates stay self-contained, the exports keep their exact
pixel geometry, the papers stays cream, moss and ink are actually on the card,
terracotta appears only on the hero, and the hero's outer 10% band is untouched
paper (crop safety).
