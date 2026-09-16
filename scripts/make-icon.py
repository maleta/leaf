#!/usr/bin/env python3
"""Draws the app icon into build/icon.png and build/icon.svg. The blade is two
circular arcs meeting at base and tip; the raster path samples them into a
polygon so a scanline fill with vertical supersampling is enough. Run via
`pnpm icon`, which turns the PNG into build/icon.icns."""
import struct, zlib, math, pathlib

SIZE = 1024
SUB = 4  # vertical sub-samples per pixel row

SQUIRCLE = (92, 92, 932, 932, 196)
TOP, BOTTOM = (0x5B, 0x7C, 0xFA), (0x3B, 0x4F, 0xD8)

BLADE, BULGE, TILT = 560.0, 168.0, -20.0  # length, half-width, degrees
CENTRE = (512.0, 528.0)
RIB = 30.0

RADIUS = (BULGE * BULGE + (BLADE / 2) ** 2) / (2 * BULGE)
ARC_X, ARC_Y = BULGE - RADIUS, BLADE / 2
SPAN = math.atan2(BLADE / 2, RADIUS - BULGE)
ANGLE = math.radians(TILT)


def place(x, y):
    """Blade coordinates, base at the origin and tip at +y, onto the canvas."""
    y -= ARC_Y
    return (CENTRE[0] + x * math.cos(ANGLE) - y * math.sin(ANGLE),
            CENTRE[1] - (x * math.sin(ANGLE) + y * math.cos(ANGLE)))


def arc(mirror, steps=96):
    points = []
    for i in range(steps + 1):
        th = -SPAN + 2 * SPAN * i / steps
        x, y = ARC_X + RADIUS * math.cos(th), ARC_Y + RADIUS * math.sin(th)
        points.append(place(-x if mirror else x, y))
    return points


def bar(y0, y1, w):
    return [place(-w / 2, y0), place(w / 2, y0), place(w / 2, y1), place(-w / 2, y1)]


LEAF = arc(False) + arc(True)[::-1]
STEM = bar(-104, 16, RIB)
MIDRIB = bar(26, BLADE - 74, RIB)


def spans_polygon(points, y):
    xs = []
    for i, (x0, y0) in enumerate(points):
        x1, y1 = points[(i + 1) % len(points)]
        if (y0 <= y < y1) or (y1 <= y < y0):
            xs.append(x0 + (y - y0) * (x1 - x0) / (y1 - y0))
    xs.sort()
    return list(zip(xs[0::2], xs[1::2]))


def spans_squircle(y):
    x0, y0, x1, y1, r = SQUIRCLE
    if not (y0 <= y < y1):
        return []
    dy = 0.0
    if y < y0 + r:
        dy = (y0 + r) - y
    elif y > y1 - r:
        dy = y - (y1 - r)
    if dy == 0:
        return [(x0, x1)]
    if dy >= r:
        return []
    inset = r - (r * r - dy * dy) ** 0.5
    return [(x0 + inset, x1 - inset)]


def coverage(span_fn):
    """Per-pixel coverage in [0,1] for every row, as a list of float lists."""
    rows = []
    for py in range(SIZE):
        acc = [0.0] * SIZE
        for s in range(SUB):
            for a, b in span_fn(py + (s + 0.5) / SUB):
                a, b = max(0.0, a), min(float(SIZE), b)
                if b <= a:
                    continue
                first, last = int(a), min(int(b), SIZE - 1)
                if first == last:
                    acc[first] += b - a
                    continue
                acc[first] += first + 1 - a
                for x in range(first + 1, last):
                    acc[x] += 1.0
                acc[last] += b - last
        rows.append([min(1.0, v / SUB) for v in acc])
    return rows


def blend(dst, src, alpha):
    return tuple(round(d + (s - d) * alpha) for d, s in zip(dst, src))


body = coverage(spans_squircle)
blade = coverage(lambda y: spans_polygon(LEAF, y))
stem = coverage(lambda y: spans_polygon(STEM, y))
rib = coverage(lambda y: spans_polygon(MIDRIB, y))

raw = bytearray()
for y in range(SIZE):
    raw.append(0)  # PNG filter: none
    t = min(1.0, max(0.0, (y - SQUIRCLE[1]) / (SQUIRCLE[3] - SQUIRCLE[1])))
    base = tuple(round(a + (b - a) * t) for a, b in zip(TOP, BOTTOM))
    sheen = max(0.0, 0.28 * (1 - t / 0.55)) if t < 0.55 else 0.0
    base = blend(base, (255, 255, 255), sheen)
    for x in range(SIZE):
        alpha = body[y][x]
        if alpha == 0:
            raw.extend((0, 0, 0, 0))
            continue
        colour = blend(base, (255, 255, 255), max(blade[y][x], stem[y][x]))
        colour = blend(colour, base, rib[y][x] * blade[y][x])
        raw.extend((*colour, round(alpha * 255)))


def chunk(tag, data):
    return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data))


png = (b'\x89PNG\r\n\x1a\n'
       + chunk(b'IHDR', struct.pack('>IIBBBBB', SIZE, SIZE, 8, 6, 0, 0, 0))
       + chunk(b'IDAT', zlib.compress(bytes(raw), 9))
       + chunk(b'IEND', b''))

build = pathlib.Path(__file__).resolve().parent.parent / 'build'
(build / 'icon.png').write_bytes(png)


def wound(points, clockwise):
    """Same ring, oriented so nonzero fill unions it with, or subtracts it from,
    the blade."""
    area = sum(x0 * y1 - x1 * y0 for (x0, y0), (x1, y1)
               in zip(points, points[1:] + points[:1]))
    return points if (area < 0) == clockwise else points[::-1]


def poly(points):
    return 'M' + 'L'.join(f'{x:.1f} {y:.1f}' for x, y in points) + 'Z'


base_pt, tip_pt = place(0, 0), place(0, BLADE)
leaf_path = (f'M{base_pt[0]:.1f} {base_pt[1]:.1f}'
             f'A{RADIUS:.1f} {RADIUS:.1f} 0 0 1 {tip_pt[0]:.1f} {tip_pt[1]:.1f}'
             f'A{RADIUS:.1f} {RADIUS:.1f} 0 0 1 {base_pt[0]:.1f} {base_pt[1]:.1f}Z')
x0, y0, x1, y1, r = SQUIRCLE
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5b7cfa"/>
      <stop offset="1" stop-color="#3b4fd8"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.28"/>
      <stop offset="0.55" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect x="{x0}" y="{y0}" width="{x1 - x0}" height="{y1 - y0}" rx="{r}" fill="url(#bg)"/>
  <rect x="{x0}" y="{y0}" width="{x1 - x0}" height="{y1 - y0}" rx="{r}" fill="url(#sheen)"/>
  <path fill="#ffffff" d="{leaf_path}{poly(wound(STEM, True))}{poly(wound(MIDRIB, False))}"/>
</svg>
'''
(build / 'icon.svg').write_text(svg)
print(f'build/icon.png ({len(png) // 1024} kB) + build/icon.svg')
