"""Regression test for BLD-1052: the "Your Privacy" box on the home screen
must not outgrow the three panels in the guided-workflow grid above it.

The guided-workflow grid (.landing-process__grid) is a 3-column grid
(repeat(3, 1fr)) with a 32px gap. Each panel therefore occupies one track
of width calc((100% - 64px) / 3). The privacy note is a full-width <p> by
default, which made it span all three columns and visually outgrow the
panels. This test pins the privacy box to a single panel's width and checks
the responsive reset (single-column grid at <=900px -> full width).

Run with:
    python3 -m unittest discover -s tests -v
"""

import pathlib
import re
import unittest

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]


class PrivacyPanelWidthTest(unittest.TestCase):
    def setUp(self):
        self.css = (REPO_ROOT / "style.css").read_text(encoding="utf-8")
        self.html = (REPO_ROOT / "index.html").read_text(encoding="utf-8")

    def test_privacy_box_pinned_to_single_grid_track(self):
        """The privacy box must be one panel wide, not the full grid width."""
        # Find the .landing-process__privacy rule block.
        m = re.search(
            r"\.landing-process__privacy\s*\{([^}]*)\}", self.css, re.DOTALL
        )
        self.assertIsNotNone(m, "missing .landing-process__privacy rule")
        block = m.group(1)
        self.assertRegex(
            block,
            r"width:\s*calc\(\(100%\s*-\s*64px\)\s*/\s*3\)",
            "privacy box must be constrained to a single 1/3 grid track width",
        )

    def test_privacy_box_resets_to_full_width_on_single_column_breakpoint(self):
        """At <=900px the grid collapses to one column, so the privacy box
        must return to full width to keep matching the panels."""
        # Find the responsive <=900px rule where the process grid becomes
        # single-column, then the .landing-process__privacy rule that follows
        # it (in the same media query) must override width back to 100%.
        m = re.search(
            r"\.landing-process__grid\s*\{\s*grid-template-columns:\s*1fr;?\s*\}"
            r"([\s\S]*?)\.landing-process__privacy\s*\{([^}]*)\}",
            self.css,
        )
        self.assertIsNotNone(
            m, "missing <=900px single-column grid + privacy reset in style.css"
        )
        self.assertRegex(
            m.group(2),
            r"width:\s*100%",
            "privacy box must be full width again at the single-column breakpoint",
        )

    def test_privacy_note_still_present_in_markup(self):
        """Sanity: the privacy note element remains in the guided workflow."""
        self.assertIn(
            "landing-process__privacy", self.html, "privacy note element missing"
        )


if __name__ == "__main__":
    unittest.main()