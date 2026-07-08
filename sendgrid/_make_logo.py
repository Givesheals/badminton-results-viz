"""Bake a soft white glow behind the Badminfo logo so it stays legible on
dark email backgrounds (Gmail etc. don't invert image pixels), while staying
invisible on the white card in light mode. Also injects the resulting data URI
into the SendGrid HTML templates in place of the __LOGO_SRC__ placeholder."""

import base64
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
SRC_LOGO = ROOT / "public" / "badminfo-logo.png"
OUT_LOGO = ROOT / "public" / "badminfo-logo-email.png"

logo = Image.open(SRC_LOGO).convert("RGBA")
lw, lh = logo.size

pad_x, pad_y = 44, 30
W, H = lw + pad_x * 2, lh + pad_y * 2

# Feathered white plate: rounded rect on an alpha mask, then blur so the edges
# melt into transparency -> a soft glow that "fades to dark" on dark clients.
mask = Image.new("L", (W, H), 0)
d = ImageDraw.Draw(mask)
mx, my = 30, 22
d.rounded_rectangle(
    [mx, my, W - mx, H - my],
    radius=34,
    fill=255,
)
mask = mask.filter(ImageFilter.GaussianBlur(24))

glow = Image.new("RGBA", (W, H), (255, 255, 255, 0))
white = Image.new("RGBA", (W, H), (255, 255, 255, 255))
glow = Image.composite(white, glow, mask)

canvas = Image.new("RGBA", (W, H), (255, 255, 255, 0))
canvas.alpha_composite(glow)
canvas.alpha_composite(logo, (pad_x, pad_y))
canvas.save(OUT_LOGO)

# Display height so the logo glyphs render at ~32px (as before the padding).
display_height = round(32 * H / lh)
print(f"canvas={W}x{H} display_height={display_height}")

data_uri = "data:image/png;base64," + base64.b64encode(OUT_LOGO.read_bytes()).decode()

for name in ("capture-notes.html", "draw-out.html"):
    p = HERE / name
    html = p.read_text()
    html = html.replace("__LOGO_SRC__", data_uri)
    html = html.replace("__LOGO_HEIGHT__", str(display_height))
    p.write_text(html)
    print(f"injected into {name}")
