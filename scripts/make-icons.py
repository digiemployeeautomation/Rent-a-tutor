"""Generate the PWA icons in public/icons from the brand mark.

The mark matches components/layout/Brand.js: a chalkboard-green (#0F5337)
rounded square with a chalk-white tick and a small copper full stop.

Run from the repo root:  python scripts/make-icons.py   (needs Pillow)
"""
from pathlib import Path

from PIL import Image, ImageDraw

GREEN = (15, 83, 55, 255)
CHALK = (248, 247, 238, 255)
COPPER = (231, 143, 86, 255)
OUT = Path(__file__).resolve().parent.parent / "public" / "icons"
SS = 4  # supersampling factor for smooth edges

# Geometry on the 36-unit grid used by the SVG mark.
TICK = [(9.5, 19.5), (15.5, 25.5), (26.5, 10.5)]
STROKE = 3.6
DOT = (26.5, 25.5, 2.4)


def make(size, maskable=False):
    s = size * SS
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    if maskable:
        # Full-bleed background; artwork stays inside the central safe zone.
        draw.rectangle((0, 0, s, s), fill=GREEN)
        scale = 0.66
    else:
        draw.rounded_rectangle((0, 0, s - 1, s - 1), radius=int(s * 8 / 36), fill=GREEN)
        scale = 1.0

    unit = s * scale / 36.0
    off = (s - 36 * unit) / 2
    place = lambda x, y: (off + x * unit, off + y * unit)

    w = STROKE * unit
    pts = [place(x, y) for x, y in TICK]
    draw.line(pts, fill=CHALK, width=int(round(w)), joint="curve")
    for x, y in pts:  # round caps and join
        draw.ellipse((x - w / 2, y - w / 2, x + w / 2, y + w / 2), fill=CHALK)

    cx, cy = place(DOT[0], DOT[1])
    r = DOT[2] * unit
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=COPPER)

    return img.resize((size, size), Image.LANCZOS)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    targets = [
        ("icon-192.png", 192, False),
        ("icon-512.png", 512, False),
        ("icon-maskable-192.png", 192, True),
        ("icon-maskable-512.png", 512, True),
    ]
    for name, size, maskable in targets:
        make(size, maskable).save(OUT / name, optimize=True)
        print("wrote", OUT / name)

    # iOS home-screen icon: opaque, square (iOS rounds the corners itself).
    apple = Image.new("RGBA", (180, 180), GREEN)
    apple.alpha_composite(make(180, maskable=True))
    apple.convert("RGB").save(OUT / "apple-touch-icon.png", optimize=True)
    print("wrote", OUT / "apple-touch-icon.png")


if __name__ == "__main__":
    main()
