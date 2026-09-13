"""Regression test: the Fathom analytics snippet must be present on every page.

Reflectify is a static, build-less site, so this test runs against the HTML
files as they are served. Run with:

    python3 -m unittest discover -s tests -v
"""

import pathlib
import re
import unittest
from html.parser import HTMLParser

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
SITE_ID = "BDNHWVBT"
FATHOM_SCRIPT_HOST = "cdn.usefathom.com/script.js"

# Any of these hosts appearing in a third-party <script src> would mean an
# unannounced tracker slipped in.
SUPPORT_CONTACT_URL = "https://tally.so/r/zxNrGM"
SUPPORT_CONTACT_EMAIL = "inbx@josephhill.co"

# Any of these hosts appearing in a third-party <script src> would mean an
# unannounced tracker slipped in.
DISALLOWED_HOSTS = (
    "googletagmanager.com",
    "google-analytics.com",
    "doubleclick.net",
    "connect.facebook.net",
    "hotjar.com",
    "plausible.io",
    "posthog.com",
    "segment.com",
)


class HeadScripts(HTMLParser):
    """Collect <script> tags that appear before </head>."""

    def __init__(self):
        super().__init__()
        self.in_head = False
        self.scripts = []

    def handle_starttag(self, tag, attrs):
        if tag == "head":
            self.in_head = True
        elif tag == "script":
            self.scripts.append((self.in_head, dict(attrs)))

    def handle_endtag(self, tag):
        if tag == "head":
            self.in_head = False


def html_pages():
    return sorted(p for p in REPO_ROOT.glob("*.html"))


class FathomSnippetTest(unittest.TestCase):
    def test_pages_exist(self):
        pages = html_pages()
        self.assertIn(REPO_ROOT / "index.html", pages)
        self.assertGreaterEqual(len(pages), 2)

    def test_every_page_loads_correct_fathom_site(self):
        for page in html_pages():
            with self.subTest(page=page.name):
                parser = HeadScripts()
                parser.feed(page.read_text(encoding="utf-8"))

                fathom = [
                    attrs
                    for in_head, attrs in parser.scripts
                    if in_head and FATHOM_SCRIPT_HOST in attrs.get("src", "")
                ]
                self.assertEqual(
                    len(fathom), 1, f"{page.name}: expected exactly one Fathom tag in <head>"
                )
                attrs = fathom[0]
                self.assertEqual(
                    attrs.get("data-site"),
                    SITE_ID,
                    f"{page.name}: wrong Fathom SiteID (expected {SITE_ID})",
                )
                self.assertIn(
                    "defer", attrs, f"{page.name}: Fathom script must be deferred"
                )

    def test_no_other_trackers(self):
        for page in html_pages():
            text = page.read_text(encoding="utf-8")
            for host in DISALLOWED_HOSTS:
                with self.subTest(page=page.name, host=host):
                    self.assertNotIn(
                        host, text, f"{page.name}: unexpected tracker {host}"
                    )

    def test_fathom_source_tag_is_documented(self):
        """The comment markers from the ticket must wrap the snippet."""
        for page in html_pages():
            with self.subTest(page=page.name):
                text = page.read_text(encoding="utf-8")
                self.assertRegex(
                    text,
                    re.compile(
                        r"<!-- Fathom[^\n]*-->\s*\n\s*<script src=\"https://cdn\.usefathom\.com/script\.js\""
                        r" data-site=\"BDNHWVBT\" defer></script>\s*\n\s*<!-- / Fathom -->"
                    ),
                    f"{page.name}: Fathom block is missing or malformed",
                )


    def test_privacy_page_uses_tally_contact_not_email(self):
        """Review feedback (BLD-1019): remove Joseph's personal email from the
        privacy page; use the Tally feedback link instead."""
        text = (REPO_ROOT / "privacy.html").read_text(encoding="utf-8")
        self.assertIn(SUPPORT_CONTACT_URL, text, "privacy page must link the Tally form")
        self.assertNotIn(
            SUPPORT_CONTACT_EMAIL,
            text,
            "privacy page must not expose Joseph's personal email",
        )
        self.assertNotIn("mailto:", text, "no mailto: links on the privacy page")


if __name__ == "__main__":
    unittest.main()
