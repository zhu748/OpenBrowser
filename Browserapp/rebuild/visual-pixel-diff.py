"""Compare two screenshots pixel for pixel in RGB."""

import json
import sys

from PIL import Image, ImageChops, ImageDraw

left, right, out = sys.argv[1:4]
a, b = Image.open(left).convert("RGB"), Image.open(right).convert("RGB")
if a.size != b.size:
    print(json.dumps({"equal": False, "sizeA": a.size, "sizeB": b.size}))
    sys.exit(0)

diff = ImageChops.difference(a, b)
red, green, blue = diff.split()
mask = ImageChops.lighter(ImageChops.lighter(red, green), blue)
total = a.width * a.height
changed = total - mask.histogram()[0]
allowed_differences = json.loads(sys.argv[4]) if len(sys.argv) > 4 else []
unchecked = mask.copy()
draw = ImageDraw.Draw(unchecked)
for left, top, right, bottom in allowed_differences:
    draw.rectangle((left, top, right - 1, bottom - 1), fill=0)
unexpected = total - unchecked.histogram()[0]
if changed:
    highlight = Image.new("RGB", a.size, "#ff0040")
    mask = mask.point(lambda value: 255 if value else 0)
    Image.composite(highlight, Image.blend(a, b, .5), mask).save(out)
else:
    diff.save(out)

print(json.dumps({
    "equal": changed == 0,
    "width": a.width,
    "height": a.height,
    "changedPixels": changed,
    "maxChannelDelta": max(band[1] for band in diff.getextrema()),
    **({"unexpectedPixels": unexpected, "unexpectedBbox": unchecked.getbbox()} if allowed_differences else {}),
    "totalPixels": total,
    "bbox": mask.getbbox(),
}))
