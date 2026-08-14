#!/usr/bin/env python3
"""Regenerate the artwork og-worker draws the social cards with.

The cards reuse the site's own imagery, but the site ships it at display sizes
for a browser that can scale it. satori cannot: whatever pixels arrive are the
pixels drawn, so every file is cut to the exact size its card slot uses. That
also keeps the worker's assets small enough to stay uninteresting.

    python3 scripts/build-og-art.py

Needs Pillow: pip install Pillow
"""
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
ART = ROOT / "og-worker" / "assets" / "art"

CARD = (1200, 630)

# Cut-outs sit inside a card, so they keep their alpha and are sized to the
# width src/seo/pages.ts places them at.
CUTOUTS = {
    "dpp-passport-devices.png": ("dpp-passport-devices.webp", 600),
    "home-dashboard.png": ("ipad-mock.png", 620),
    "token-sphere.png": ("token.png", 430),
}

# Photographs fill a card edge to edge under a scrim. `centering` biases the
# crop towards the subject, since the left of the card is nearly opaque.
PHOTOS = {
    "integrator.jpg": ("integrator-program.jpg", (0.5, 0.32)),
    "use-case-art.jpg": ("use-cases/art.webp", (0.5, 0.5)),
    "use-case-gold.jpg": ("use-cases/gold.webp", (0.5, 0.5)),
    "use-case-luxury.jpg": ("use-cases/diamonds.webp", (0.5, 0.5)),
    "use-case-madein.jpg": ("use-cases/made_in.webp", (0.35, 0.4)),
}


def cutout(source, width):
    image = Image.open(source).convert("RGBA")
    image = image.crop(image.getbbox())  # drop the transparent margin first
    height = round(width * image.height / image.width)
    return image.resize((width, height), Image.LANCZOS)


def photo(source, centering):
    image = Image.open(source).convert("RGB")
    return ImageOps.fit(image, CARD, Image.LANCZOS, centering=centering)


def main():
    ART.mkdir(parents=True, exist_ok=True)

    for name, (source, width) in CUTOUTS.items():
        cutout(PUBLIC / source, width).save(ART / name, optimize=True)

    for name, (source, centering) in PHOTOS.items():
        photo(PUBLIC / source, centering).save(ART / name, quality=88, subsampling=1)

    for image in sorted(ART.iterdir()):
        size = Image.open(image).size
        print(f"  {image.stat().st_size / 1024:7.1f} KB  {size[0]:>4}x{size[1]:<4}  {image.name}")


if __name__ == "__main__":
    main()
