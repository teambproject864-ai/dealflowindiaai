import os
from PIL import Image, ImageDraw

icons_dir = os.path.join(os.path.dirname(__file__), "..", "chrome-extension", "icons")
os.makedirs(icons_dir, exist_ok=True)

def create_icon(size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    radius = int(size * 0.2)
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=(15, 23, 42, 255), outline=(20, 184, 166, 255), width=max(1, int(size * 0.05)))
    
    inner_margin = max(1, int(size * 0.12))
    draw.rounded_rectangle([inner_margin, inner_margin, size - 1 - inner_margin, size - 1 - inner_margin], radius=max(1, radius - 2), fill=(20, 184, 166, 230))

    s = size / 24.0
    pts = [
        (13 * s, 3 * s),
        (6 * s, 13 * s),
        (11 * s, 13 * s),
        (10 * s, 21 * s),
        (18 * s, 10 * s),
        (13 * s, 10 * s)
    ]
    draw.polygon(pts, fill=(255, 255, 255, 255))

    out_path = os.path.join(icons_dir, f"icon{size}.png")
    img.save(out_path, "PNG")
    print(f"Generated icon: {out_path}")

for sz in [16, 48, 128]:
    create_icon(sz)

print("Icon generation complete!")
