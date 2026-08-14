#!/usr/bin/env python3
"""Regenerate the fonts og-worker draws the social cards with.

The cards are drawn by satori, whose font parser cannot read variable fonts, so
every weight has to ship as a static instance. General Sans covers Latin only,
leaving every other script to a Noto face; the CJK faces carry tens of thousands
of glyphs, and are subset down to the characters the card copy actually uses.

Re-run this whenever that copy changes. Until you do, the worker falls back to
the English card for the affected locale and says so in its log.

    python3 scripts/build-og-fonts.py

Needs fonttools and brotli: pip install 'fonttools[woff]'
"""
import json
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WORKER = ROOT / "og-worker"
ASSETS = WORKER / "assets" / "fonts"
# Every string the cards draw, per locale, written by the worker's own script so
# the subset and the render can never disagree about what the copy is.
CARD_COPY = WORKER / "src" / "copy.json"

# The card uses two weights: 300 for the headline, 400 for everything else.
WEIGHTS = {"Light": 300, "Regular": 400}

LATIN = "U+0020-007E,U+00A0-00FF,U+0100-017F,U+0180-024F,U+2010-2027,U+2030-203A,U+20AC,U+2122"
NOTO = "https://raw.githubusercontent.com/notofonts/notofonts.github.io/main/fonts"
GOOGLE = "https://github.com/google/fonts/raw/main/ofl"

# Latin faces: a variable source instanced per weight, then subset to Latin.
# `NotoSans` also carries Cyrillic, Greek and the Vietnamese Latin range, which
# General Sans has no glyphs for.
STATIC = {
    "NotoSans": (f"{NOTO}/NotoSans/hinted/ttf/NotoSans-%s.ttf",
                 LATIN + ",U+0300-036F,U+0370-03FF,U+0400-04FF,U+1E00-1EFF"),
    "NotoSansThai": (f"{NOTO}/NotoSansThai/hinted/ttf/NotoSansThai-%s.ttf",
                     "U+0020-007E,U+00A0-00FF,U+0E00-0E7F"),
}
CJK = {"NotoSansJP": ("notosansjp", "ja"), "NotoSansKR": ("notosanskr", "ko"),
       "NotoSansSC": ("notosanssc", "zh"), "NotoSansTC": ("notosanstc", "zh-TW")}


def run(*args):
    subprocess.run([sys.executable, "-m", *args], check=True, capture_output=True)


def fetch(url, dest):
    print(f"  fetching {url.rsplit('/', 1)[-1]}")
    urllib.request.urlretrieve(url, dest)


def subset(source, dest, unicodes=None, text=None):
    args = ["fontTools.subset", str(source), f"--output-file={dest}",
            "--layout-features-=rlig", "--name-IDs=*", "--notdef-outline"]
    args.append(f"--text={text}" if text else f"--unicodes={unicodes}")
    run(*args)


def instance(source, dest, weight):
    run("fontTools.varLib.instancer", str(source), f"wght={weight}", "-o", str(dest))


def card_characters(locale):
    """Every character the locale's cards draw, plus ASCII for the mixed-in
    Latin (ORIGYN, OGY, DPP) and any digits."""
    copy = json.loads(CARD_COPY.read_text(encoding="utf-8"))
    used = set(json.dumps(copy[locale], ensure_ascii=False))
    return "".join(sorted(used | set(map(chr, range(0x20, 0x7F)))))


def main():
    ASSETS.mkdir(parents=True, exist_ok=True)
    # Regenerated rather than assumed: a stale copy table would silently subset
    # the fonts to yesterday's copy.
    subprocess.run(
        ["node", "--experimental-strip-types", "scripts/build-copy.mjs"],
        cwd=WORKER, check=True, capture_output=True,
    )
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)

        print("General Sans (Latin)")
        for name, weight in WEIGHTS.items():
            instanced = tmp / f"gs-{weight}.ttf"
            instance(ROOT / "public" / "GeneralSans-Variable.ttf", instanced, weight)
            subset(instanced, ASSETS / f"GeneralSans-{name}.ttf", unicodes=LATIN)

        for family, (url, unicodes) in STATIC.items():
            print(family)
            for name in WEIGHTS:
                source = tmp / f"{family}-{name}.ttf"
                fetch(url % name, source)
                subset(source, ASSETS / f"{family}-{name}.ttf", unicodes=unicodes)

        for family, (slug, locale) in CJK.items():
            print(f"{family} ({locale} card copy)")
            variable = tmp / f"{family}.ttf"
            fetch(f"{GOOGLE}/{slug}/{family}%5Bwght%5D.ttf", variable)
            text = card_characters(locale)
            for name, weight in WEIGHTS.items():
                instanced = tmp / f"{family}-{weight}.ttf"
                instance(variable, instanced, weight)
                subset(instanced, ASSETS / f"{family}-{name}.ttf", text=text)

    for font in sorted(ASSETS.glob("*.ttf")):
        print(f"  {font.stat().st_size / 1024:7.1f} KB  {font.name}")


if __name__ == "__main__":
    main()
