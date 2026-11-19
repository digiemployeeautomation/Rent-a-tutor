"""Generate the PWA icons in public/icons from the brand mark.

The mark matches components/layout/Brand.js: a blue (#2563EB) rounded square
with an open book — left page white, right page amber (#FBBF24).

Run from the repo root:  python scripts/make-icons.py   (needs Pillow)
"""
from pathlib import Path

from PIL import Image, ImageDraw

BLUE = (37, 99, 235, 255)
WHITE = (255, 255, 255, 255)
AMBER = (251, 191, 36, 255)
OUT = Path(__file__).resolve().parent.parent / "public" / "icons"
SS = 4  # supersampling factor for smooth edges


def cubic(p0, p1, p2, p3, n=24):
    """Points along a cubic Bezier curve (excluding the start point)."""
    pts = []
    for i in range(1, n + 1):
        t = i / n
        a, b, c, d = (1 - t) ** 3, 3 * (1 - t) ** 2 * t, 3 * (1 - t) * t ** 2, t ** 3
        pts.append((a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
                    a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]))
    return pts


def left_page():
    """The left page, traced from the SVG path in Brand.js (24-unit viewBox):
    M4 6.5C4 5.67 4.67 5 5.5 5H10c1.1 0 2 .9 2 2v12c0-1.1-.9-2-2-2H5.5C4.67 17 4 16.33 4 15.5v-9Z
    """
    pts = [(4, 6.5)]
    pts += cubic((4, 6.5), (4, 5.67), (4.67, 5), (5.5, 5))
    pts += [(10, 5)]
    pts += cubic((10, 5), (11.1, 5), (12, 5.9), (12, 7))
    pts += [(12, 19)]
    pts += cubic((12, 19), (12, 17.9), (11.1, 17), (10, 17))
    pts += [(5.5, 17)]
    pts += cubic((5.5, 17), (4.67, 17), (4, 16.33), (4, 15.5))
    return pts


def make(size, maskable=False):
    s = size * SS
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    if maskable:
        # Full-bleed background; artwork stays inside the central safe zone.
        draw.rectangle((0, 0, s, s), fill=BLUE)
        book = 0.46
    else:
        draw.rounded_rectangle((0, 0, s - 1, s - 1), radius=int(s * 0.225), fill=BLUE)
        book = 0.58

    # The book spans x 4..20 and y 5..19 in the SVG; centre it in the icon.
    unit = s * book / 16.0
    left = (s - 16 * unit) / 2
    top = (s - 14 * unit) / 2
    place = lambda x, y: (left + (x - 4) * unit, top + (y - 5) * unit)

    page = left_page()
    draw.polygon([place(x, y) for x, y in page], fill=WHITE)
    draw.polygon([place(24 - x, y) for x, y in page], fill=AMBER)  # mirrored right page

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
    apple = Image.new("RGBA", (180, 180), BLUE)
    apple.alpha_composite(make(180, maskable=True))
    apple.convert("RGB").save(OUT / "apple-touch-icon.png", optimize=True)
    print("wrote", OUT / "apple-touch-icon.png")


if __name__ == "__main__":
    main()
