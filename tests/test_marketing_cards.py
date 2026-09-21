"""Regression tests for the Reflectify marketing cards (BLD-1022 / BLD-1023, parent BLD-1021).

The cards are self-contained HTML templates rendered headless to PNG. These tests
guard the two things that silently break a headless render:

1. **Fonts** - the templates must use the repo's self-hosted variable fonts
   (no CDN), or the capture falls back to Georgia/system-ui and the typography
   is wrong.
2. **Geometry** - the exports must be exactly the declared pixel size, must not
   be blank, must carry the brand palette, and the hero card must keep its text
   inside the middle-80% safe band so a centre crop for X/LinkedIn does not clip
   the headline.

Run with:  python3 -m unittest discover -s tests -v
(marketing/render-cards.sh must have been run first; the PNG assertions skip
when the exports are absent, so a fresh clone without renders still passes.)
"""

import pathlib
import re
import unittest

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
MARKETING = REPO_ROOT / "marketing"

# Declared export geometry: name -> (source_w, source_h)
CARDS = {
    "hero": (1200, 630),
    "feature": (1080, 1080),
}

SCALE_FACTORS = (1, 2)

# Brand tokens (style.css, PRV-5). Do not invent colours.
PAPER = (0xF7, 0xF5, 0xF0)
INK = (0x1E, 0x24, 0x21)
MOSS = (0x2D, 0x4A, 0x3E)
MIST = (0xEB, 0xF3, 0xEF)
TERRACOTTA = (0xB0, 0x52, 0x3A)

TOLERANCE = 10


def _png_path(name, scale):
    return MARKETING / f"reflectify-marketing-{name}-{scale}x.png"


def _close(pixel, target, tol=TOLERANCE):
    return all(abs(p - t) <= tol for p, t in zip(pixel[:3], target))


def _pillow():
    try:
        from PIL import Image
    except ImportError:  # pragma: no cover
        raise unittest.SkipTest("Pillow not installed")
    return Image


class TestCardSources(unittest.TestCase):
    """The HTML templates are the source of truth; keep them render-safe."""

    def _source(self, name):
        path = MARKETING / f"reflectify-marketing-{name}.html"
        self.assertTrue(path.exists(), f"missing card template: {path}")
        return path.read_text(encoding="utf-8")

    def test_templates_exist_for_every_card(self):
        for name in CARDS:
            with self.subTest(card=name):
                self._source(name)

    def test_fonts_are_self_hosted_not_cdn(self):
        """A Google-Fonts <link> would race the headless capture and break type."""
        for name in CARDS:
            with self.subTest(card=name):
                src = self._source(name)
                self.assertNotIn("fonts.googleapis.com", src)
                self.assertIn("newsreader-latin-variable.woff2", src)
                self.assertIn("inter-latin-variable.woff2", src)

    def test_no_external_network_dependencies(self):
        """Cards must render offline - anything remote is a render-time failure."""
        for name in CARDS:
            with self.subTest(card=name):
                src = self._source(name)
                remote = re.findall(r'(?:src|href)\s*=\s*["\'](https?://[^"\']+)', src)
                self.assertEqual(remote, [], f"{name}: remote assets {remote}")

    def test_declares_render_readiness_hook(self):
        """render-cards.sh relies on the fonts-ready promise before capture."""
        for name in CARDS:
            with self.subTest(card=name):
                src = self._source(name)
                self.assertIn("document.fonts.ready", src)
                self.assertIn("__cardReady", src)

    def _visible_text(self, name):
        """Card copy only - CSS at-rules like @font-face are not mention tokens."""
        src = self._source(name)
        src = re.sub(r"<!--.*?-->", "", src, flags=re.S)
        src = re.sub(r"<style\b.*?</style>", "", src, flags=re.S | re.I)
        src = re.sub(r"<script\b.*?</script>", "", src, flags=re.S | re.I)
        return re.sub(r"<[^>]+>", " ", src)

    def test_no_at_prefixed_strings(self):
        """The Linear mention resolver chokes on @-prefixed tokens in copy."""
        for name in CARDS:
            with self.subTest(card=name):
                found = re.findall(r"(?<!\S)@[A-Za-z][\w-]*", self._visible_text(name))
                self.assertEqual(found, [], f"{name}: @-prefixed string in copy: {found}")

    def test_single_accent_colour_discipline(self):
        """Terracotta is the one accent and belongs to the hero CTA only."""
        hero = self._source("hero")
        feature = self._source("feature")
        self.assertIn("--terracotta:#B0523A", hero)
        self.assertIn("var(--terracotta)", hero)
        self.assertNotIn("terracotta", feature)
        self.assertNotIn("var(--terracotta)", feature)

    def test_brand_tokens_are_from_style_css(self):
        style = (REPO_ROOT / "style.css").read_text(encoding="utf-8")
        for token in ("#F7F5F0", "#1E2421", "#2D4A3E", "#EBF3EF"):
            with self.subTest(token=token):
                self.assertIn(token, style)


class TestRenderedExports(unittest.TestCase):
    """Pixel-level checks against the committed exports."""

    @classmethod
    def setUpClass(cls):
        try:
            from PIL import Image  # noqa: F401
        except ImportError:  # pragma: no cover
            raise unittest.SkipTest("Pillow not installed")

        cls.available = all(
            _png_path(name, scale).exists() for name in CARDS for scale in SCALE_FACTORS
        )

    def setUp(self):
        if not self.available:
            self.skipTest("exports not rendered - run marketing/render-cards.sh all")

    def _image(self, name, scale):
        from PIL import Image

        return Image.open(_png_path(name, scale)).convert("RGB")

    def test_export_geometry_is_exact(self):
        for name, (w, h) in CARDS.items():
            for scale in SCALE_FACTORS:
                with self.subTest(card=name, scale=scale):
                    im = self._image(name, scale)
                    self.assertEqual(
                        im.size,
                        (w * scale, h * scale),
                        f"{name} {scale}x should be {w * scale}x{h * scale}",
                    )

    def test_exports_are_not_blank(self):
        for name in CARDS:
            for scale in SCALE_FACTORS:
                with self.subTest(card=name, scale=scale):
                    im = self._image(name, scale)
                    self.assertGreater(
                        len(set(im.getdata())), 8, f"{name} {scale}x looks blank"
                    )

    def test_paper_field_dominates(self):
        """Flat cream paper, not a gradient sea of off-brand colour."""
        for name in CARDS:
            with self.subTest(card=name):
                im = self._image(name, 1)
                sampled = list(im.getdata())[::53]
                paper_share = sum(1 for p in sampled if _close(p, PAPER)) / len(sampled)
                self.assertGreater(paper_share, 0.5, f"{name}: paper share {paper_share:.2f}")

    def test_brand_palette_present(self):
        """Moss and ink must actually be on the card, or the render fell over."""
        for name in CARDS:
            for scale in SCALE_FACTORS:
                with self.subTest(card=name, scale=scale):
                    im = self._image(name, scale)
                    pixels = list(im.getdata())
                    for label, target, minimum in (("ink", INK, 200), ("moss", MOSS, 200)):
                        hits = sum(1 for p in pixels if _close(p, target, 24))
                        self.assertGreater(
                            hits, minimum, f"{name} {scale}x: {label} pixels = {hits}"
                        )

    def test_hero_carries_the_single_terracotta_accent(self):
        im = self._image("hero", 1)
        pixels = list(im.getdata())
        hits = sum(1 for p in pixels if _close(p, TERRACOTTA, 20))
        self.assertGreater(hits, 1000, "hero: terracotta CTA pill missing")
        # one accent only - it must stay a pill, not a wash
        self.assertLess(hits / len(pixels), 0.05, "hero: terracotta is not an accent any more")

    def test_hero_keeps_content_inside_the_crop_safe_band(self):
        """Centre-crop survival: the outer 10% band must be untouched paper."""
        im = self._image("hero", 1)
        w, h = im.size
        band_x, band_y = int(w * 0.10), int(h * 0.10)
        pixels = im.load()

        offenders = []
        for x in range(w):
            for y in list(range(band_y)) + list(range(h - band_y, h)):
                if not _close(pixels[x, y], PAPER, TOLERANCE + 6):
                    offenders.append((x, y))
        for y in range(h):
            for x in list(range(band_x)) + list(range(w - band_x, w)):
                if not _close(pixels[x, y], PAPER, TOLERANCE + 6):
                    offenders.append((x, y))

        self.assertEqual(
            offenders[:5], [], f"hero: {len(offenders)} non-paper pixels in the outer 10% band"
        )

    def test_feature_card_is_square_safe(self):
        """1:1 placements - the export must be square at both scales."""
        for scale in SCALE_FACTORS:
            with self.subTest(scale=scale):
                im = self._image("feature", scale)
                self.assertEqual(im.size[0], im.size[1])


class TestOpenGraphCard(unittest.TestCase):
    """The hero card backs og:image / twitter:image, so meta and file must agree."""

    def setUp(self):
        self.html = (REPO_ROOT / "index.html").read_text(encoding="utf-8")

    def _content(self, prop):
        m = re.search(
            r'<meta[^>]+(?:property|name)="%s"[^>]+content="([^"]+)"' % re.escape(prop),
            self.html,
        )
        return m.group(1) if m else None

    def test_og_image_points_at_the_hero_export(self):
        url = self._content("og:image") or ""
        self.assertTrue(url.endswith("reflectify-marketing-hero-1x.png"), f"og:image is {url!r}")

    def test_declared_dimensions_match_the_file(self):
        """A stale width/height breaks the social card layout."""
        url = self._content("og:image") or ""
        rel = url.split("squarecircletriangle.co/", 1)[-1]
        path = REPO_ROOT / rel
        self.assertTrue(path.is_file(), f"og:image target missing in repo: {rel}")
        if not path.is_file():
            return
        Image = _pillow()
        with Image.open(path) as im:
            self.assertEqual(
                (im.size, self._content("og:image:width"), self._content("og:image:height")),
                ((1200, 630), "1200", "630"),
                "og:image dimensions disagree with the exported PNG",
            )

    def test_twitter_image_matches_og_image(self):
        self.assertEqual(self._content("twitter:image"), self._content("og:image"))

    def test_legacy_og_image_is_retained(self):
        """Do not delete og-image.jpg until the replacement is live-verified."""
        self.assertTrue((REPO_ROOT / "og-image.jpg").is_file())


if __name__ == "__main__":
    unittest.main()
