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


if __name__ == "__main__":
    unittest.main()
