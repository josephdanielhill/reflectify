"""Bridge: run the print/PDF CSS regression (BLD-1045) from the Python unittest
entrypoint.

The empty-page fix lives in the `@media print` block of style.css, so its
regression assertions are written in Node (tests/test_print_pdf.mjs) against
the real stylesheet. This module shells out to `node --test` so the repo's
single test command still runs everything:

    python3 -m unittest discover -s tests -v
"""

import pathlib
import subprocess
import unittest

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
TEST_FILE = REPO_ROOT / "tests" / "test_print_pdf.mjs"


class PrintPdfRegressionSuite(unittest.TestCase):
    def test_node_print_pdf_suite_passes(self):
        self.assertTrue(TEST_FILE.is_file(), f"missing print/pdf test file: {TEST_FILE}")
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