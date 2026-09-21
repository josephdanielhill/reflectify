"""Bridge: run the Node parser regression suite (BLD-1027) from the Python
unittest entrypoint.

The parser lives in script.js, so its regression tests are written in Node
(tests/test_parser.mjs) against the real code. This module shells out to
`node --test` so the repo's single test command still runs everything:

    python3 -m unittest discover -s tests -v

Run the JS suite directly with:  node --test tests/test_parser.mjs
"""

import pathlib
import subprocess
import unittest

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
TEST_FILE = REPO_ROOT / "tests" / "test_parser.mjs"
SMOKE_FILE = REPO_ROOT / "tests" / "smoke_radar_svg.mjs"


class ParserRegressionSuite(unittest.TestCase):
    def test_node_parser_suite_passes(self):
        self.assertTrue(TEST_FILE.is_file(), f"missing parser test file: {TEST_FILE}")
        result = subprocess.run(
            ["node", "--test", str(TEST_FILE)],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
        )
        self.assertEqual(
            result.returncode,
            0,
            f"node --test failed (exit {result.returncode})\n"
            f"--- stdout ---\n{result.stdout}\n--- stderr ---\n{result.stderr}",
        )

    def test_radar_svg_render_smoke_passes(self):
        # BLD-1025 regression: the radar's shapes must be created in the SVG
        # namespace, or the browser silently refuses to draw them (only dots +
        # labels showed before the fix). Guards against SVG_TAGS drift.
        self.assertTrue(SMOKE_FILE.is_file(), f"missing smoke test file: {SMOKE_FILE}")
        result = subprocess.run(
            ["node", str(SMOKE_FILE)],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
        )
        self.assertEqual(
            result.returncode,
            0,
            f"radar SVG smoke test failed (exit {result.returncode})\n"
            f"--- stdout ---\n{result.stdout}\n--- stderr ---\n{result.stderr}",
        )


if __name__ == "__main__":
    unittest.main()
