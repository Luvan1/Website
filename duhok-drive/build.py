#!/usr/bin/env python3
"""Build the single-file game.

Reads dev.html (the multi-file development page) and inlines three.min.js and
every js/*.js into one fully self-contained index.html, so the game runs even
when index.html is the only file present (downloaded alone, previewed through
a proxy, opened from file://, etc.).

Usage:  python3 build.py
"""
import re
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent
src = (ROOT / 'dev.html').read_text(encoding='utf-8')

def inline(match):
    path = match.group(1)
    code = (ROOT / path).read_text(encoding='utf-8')
    lowered = code.lower()
    if '</script' in lowered:
        raise SystemExit(f'{path} contains "</script" — cannot inline safely')
    return '<script>\n' + code + '\n</script>'

out, n = re.subn(r'<script src="([^"]+)"></script>', inline, src)
if n < 7:
    raise SystemExit(f'expected to inline at least 7 scripts, found {n}')

# the "files missing" hint makes no sense in the single-file build
out = out.replace(
    "'Game files failed to load. Make sure the whole duhok-drive folder ' +\n"
    "        '(index.html, three.min.js and the js/ folder) is uploaded together, then refresh.'",
    "'The game could not start in this browser. Please refresh, or open it in a recent ' +\n"
    "        'version of Chrome, Edge, Firefox or Safari.'")

banner = ('<!-- BUILT FILE — do not edit. Edit dev.html / js/*.js and run '
          'python3 build.py -->\n')
out = out.replace('<!DOCTYPE html>\n', '<!DOCTYPE html>\n' + banner, 1)

(ROOT / 'index.html').write_text(out, encoding='utf-8')
print(f'inlined {n} scripts -> index.html '
      f'({(ROOT / "index.html").stat().st_size / 1024:.0f} KB)')
