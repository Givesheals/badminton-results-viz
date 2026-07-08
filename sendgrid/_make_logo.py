"""Embed the Badminfo logo into the SendGrid templates as two variants:
a purple logo for light mode and a white logo for dark mode, swapped by the
`prefers-color-scheme` media query. Both are shipped as transparent PNGs (no
backing plate) so there's no indent and nothing that reads as a box.

Run: python3 _make_logo.py
"""

import base64
import re
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
SRC_LOGO = ROOT / "public" / "badminfo-logo.png"
WHITE_LOGO = ROOT / "public" / "badminfo-logo-white.png"

DISPLAY_HEIGHT = 30

logo = Image.open(SRC_LOGO).convert("RGBA")

# White variant: keep the original alpha (so antialiasing is preserved) but
# force every visible pixel to white for legibility on dark backgrounds.
alpha = logo.split()[3]
solid = Image.new("L", logo.size, 255)
white = Image.merge("RGBA", (solid, solid, solid, alpha))
white.save(WHITE_LOGO)


def data_uri(path: Path) -> str:
    return "data:image/png;base64," + base64.b64encode(path.read_bytes()).decode()


light_uri = data_uri(SRC_LOGO)
dark_uri = data_uri(WHITE_LOGO)

new_imgs = (
    f'<img class="logo-light" src="{light_uri}" alt="Badminfo" '
    f'height="{DISPLAY_HEIGHT}" style="display:block; border:0;" />'
    f'<img class="logo-dark" src="{dark_uri}" alt="Badminfo" '
    f'height="{DISPLAY_HEIGHT}" style="display:none; border:0;" />'
)

# Matches either the current two-img markup (re-runs) or a single embedded img
# (first run / glow version), between the logo <td> and its closing tag.
img_block = re.compile(
    r'(<td style="padding:24px 24px 16px 24px;">\s*).*?(\s*</td>)',
    re.DOTALL,
)

for name in ("capture-notes.html", "draw-out.html"):
    p = HERE / name
    html = p.read_text()
    html, n = img_block.subn(rf"\g<1>{new_imgs}\g<2>", html, count=1)
    p.write_text(html)
    print(f"{name}: replaced {n} logo block(s)")
