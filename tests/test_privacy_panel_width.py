"""Regression test for BLD-1052: the "Your Privacy" box on the home screen
must match the width of the three panels in the guided-workflow grid above it.

The guided-workflow grid (.landing-process__grid) is a 3-column grid
(repeat(3, 1fr)) with a 32px gap; together the three panels span the full
width of their container. The privacy note (<p class="landing-process__privacy">)
sits inside the SAME container as the grid (.landing-process__inner), so it
naturally spans the exact same width as all three panels combined - matching
them exactly. It must NOT be pinned to a single 1/3 column (which made it
narrow and left-aligned - the reworked bug), and must NOT be outside the
container where it would outgrow the grid (the original bug).

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

    def test_privacy_box_must_not_be_pinned_to_single_track(self):
        """The privacy box must NOT be forced to a single 1/3-column width.
        That was the reworked bug (narrow, left-aligned panel)."""
        m = re.search(
            r"\.landing-process__privacy\s*\{([^}]*)\}", self.css, re.DOTALL
        )
        self.assertIsNotNone(m, "missing .landing-process__privacy rule")
        block = m.group(1)
        self.assertNotRegex(
            block,
            r"width:\s*calc\(",
            "privacy box must not be constrained to a single grid track width",
        )

    def test_privacy_box_shares_the_grid_container(self):
        """The privacy note must live inside .landing-process__inner alongside
        the grid, so it inherits the exact combined width of the three panels
        without outgrowing them and without collapsing to one column."""
        # The privacy <p> must appear after the grid div opens and before the
        # .landing-process__inner container closes. We find the grid div, then
        # require the NEXT element after the grid's closing </div> (before the
        # inner container's closing </div>) to be the privacy note.
        grid_open = self.html.find('class="landing-process__grid"')
        self.assertNotEqual(
            grid_open, -1, "guided-workflow grid missing from markup"
        )
        # Everything from the grid open to the end of the section.
        tail = self.html[grid_open:]
        # The privacy <p> must come before the tool-grid section (i.e. it is
        # still part of the guided-workflow block, not the following section).
        boundary = tail.find("landing-tools-wrapper")
        self.assertNotEqual(
            boundary, -1, "could not find end of guided-workflow block"
        )
        block = tail[:boundary]
        self.assertIn(
            'class="landing-process__privacy"',
            block,
            "privacy note must be inside the guided-workflow block "
            "(inside .landing-process__inner, not a sibling below it)",
        )
        # And it must come AFTER the grid (grid opens, then steps, then the
        # note) - i.e. it sits at the bottom of the block, not before the grid.
        self.assertGreater(
            block.find('class="landing-process__privacy"'),
            block.find("process-card"),
            "privacy note must come after the step panels inside the container",
        )

    def test_privacy_note_still_present_in_markup(self):
        """Sanity: the privacy note element remains in the guided workflow."""
        self.assertIn(
            "landing-process__privacy", self.html, "privacy note element missing"
        )

    def test_no_full_width_override_left_on_privacy_rule(self):
        """The desktop privacy rule must have no explicit width override -
        it correctly inherits the container width. Any explicit width here
        would risk the narrow-left or outgrow bugs."""
        m = re.search(
            r"\.landing-process__privacy\s*\{([^}]*)\}", self.css, re.DOTALL
        )
        block = m.group(1)
        self.assertNotRegex(
            block, r"width:\s*[^;]+;", "privacy rule should not set a width"
        )


if __name__ == "__main__":
    unittest.main()