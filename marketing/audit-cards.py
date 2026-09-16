#!/usr/bin/env python3
"""Layout audit for the Reflectify marketing cards (BLD-1022 / BLD-1023).

Reads the JSON emitted by the templates' `#audit` hook on stdin and asserts:
  * webfonts actually loaded (otherwise headless capture silently falls back)
  * the card does not overflow its canvas
  * every [data-check] element sits inside the canvas
and warns when an element drifts outside the middle-80% safe band.

Exit 0 = safe to capture, exit 1 = hard failure.
"""
import json
import sys


def main() -> int:
    name = sys.argv[1] if len(sys.argv) > 1 else "card"
    raw = sys.stdin.read().strip()
    if not raw or raw == "AUDIT_MISSING":
        print(f"  [{name}] AUDIT FAILED - no audit payload found")
        return 1

    audit = json.loads(raw)
    w = audit["canvas"]["w"]
    h = audit["canvas"]["h"]
    ok = True

    print(f"  [{name}] canvas {w:.0f}x{h:.0f}  fonts_ok={audit['fontsLoaded']}")
    if not audit["fontsLoaded"]:
        print("    ! webfonts did not load - typography would fall back")
        ok = False

    overflow = audit["cardOverflow"]
    if overflow["scrollW"] > overflow["clientW"] + 1 or overflow["scrollH"] > overflow["clientH"] + 1:
        print(f"    ! card content overflows its canvas: {overflow}")
        ok = False

    for rect in audit["rects"]:
        if not rect["insideCanvas"]:
            print(f"    ! clipped by canvas: {rect['sel']} -> {rect}")
            ok = False

    sx, sy = w * 0.1, h * 0.1
    for rect in audit["rects"]:
        if rect["x"] < sx - 1 or rect["right"] > w - sx + 1:
            print(f"    ~ outside 80% horizontal safe area: {rect['sel']} x={rect['x']} right={rect['right']}")
        if rect["y"] < sy - 1 or rect["bottom"] > h - sy + 1:
            print(f"    ~ outside 80% vertical safe area: {rect['sel']} y={rect['y']} bottom={rect['bottom']}")

    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
