"""Regression test for the "Your privacy" panel width bug (BLD-1065).

The privacy panel (`.landing-process__privacy`) sits as a direct child of the
full-width `.landing-process-section`. Before this fix it spanned 100% of the
section and was therefore much wider than the three step cards above it, which
are constrained inside `.landing-process__inner` (max-width 1160px, auto
margins). This test asserts at the source level that the privacy panel is
constrained by the SAME width budget as the cards container, so a future edit
cannot silently widen it again.

The actual visual alignment is also independently verified at render time (see
the issue), but this guards the rule at the source so regressions are caught by
`python3 -m unittest discover -s tests -v`.

Run with:  python3 -m unittest discover -s tests -v
"""

import pathlib
import re
import unittest

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
STYLE_CSS = REPO_ROOT / "style.css"

# `.landing-process__inner` constrains the three step cards.
INNER_MAX_WIDTH = "1160px"


def _rule_block(css, selector):
    """Return the normalised declaration-block body for the first rule matching
    ``selector``, or the empty string."""
    pattern = re.compile(
        r"^\s*" + re.escape(selector) + r"\s*\{(.*?)\}", re.DOTALL | re.MULTILINE
    )
    match = pattern.search(css)
    if not match:
        return ""
    # Collapse whitespace so "max-width: 1160px;" and "max-width:1160px;" agree.
    return re.sub(r"\s+", " ", match.group(1))


class PrivacyPanelWidthTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.css = STYLE_CSS.read_text()

    def test_style_css_present(self):
        self.assertTrue(STYLE_CSS.is_file(), "missing style.css")

    def test_privacy_panel_rule_exists(self):
        self.assertTrue(
            _rule_block(self.css, ".landing-process__privacy"),
            "expected a .landing-process__privacy rule in style.css",
        )

    def test_privacy_panel_matches_cards_max_width(self):
        """The privacy panel must be capped at the same max-width as the cards."""
        block = _rule_block(self.css, ".landing-process__privacy")
        self.assertIn("max-width: " + INNER_MAX_WIDTH, block)

    def test_privacy_panel_is_centered(self):
        """auto horizontal margins keep it aligned with the centered cards."""
        block = _rule_block(self.css, ".landing-process__privacy")
        self.assertTrue(
            re.search(r"margin\s*:\s*[^;]*auto[^;]*;", block),
            "privacy panel should use auto horizontal margins (shorthand), "
            f"got block: {block!r}",
        )

    def test_cards_inner_still_keeps_its_budget(self):
        """Sanity: the cards container still defines the reference max-width."""
        block = _rule_block(self.css, ".landing-process__inner")
        self.assertIn("max-width: " + INNER_MAX_WIDTH, block)


if __name__ == "__main__":
    unittest.main()