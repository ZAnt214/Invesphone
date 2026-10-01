from pathlib import Path
from PIL import Image
import numpy as np
import cv2

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public" / "characters"

CHARACTERS = {
    "caio":   (241, 244, 402, 402),
    "teo":    (255, 254, 396, 396),
    "rafael": (240, 240, 420, 420),
    "cida":   (221, 268, 441, 441),
    "jorge":  (215, 162, 486, 486),
}

def radial_field(X, Y, cx, cy, sigma, dx=0.0, dy=0.0):
    g = np.exp(-((X-cx)**2 + (Y-cy)**2) / (2*sigma*sigma))
    return dx*g, dy*g

def make_expression(img: Image.Image, bbox, kind: str) -> Image.Image:
    arr = np.asarray(img.convert("RGB"))
    H, W = arr.shape[:2]
    Y, X = np.mgrid[0:H, 0:W].astype(np.float32)
    mapx, mapy = X.copy(), Y.copy()

    x, y, w, h = bbox
    cx = x + w/2
    eye_y = y + .42*h
    brow_y = y + .31*h
    mouth_y = y + .72*h
    lx = x + .33*w
    rx = x + .67*w

    if kind == "uncomfortable":
        shifts = [
            (lx, brow_y, .09*w, 0, -3.2),
            (rx, brow_y, .09*w, 0, 1.8),
            (lx, eye_y, .09*w, -1.5, .5),
            (rx, eye_y, .09*w, -1.5, 1.2),
            (cx-.10*w, mouth_y, .10*w, -2.0, 1.0),
            (cx+.12*w, mouth_y, .10*w, 1.0, 3.0),
        ]
    elif kind == "lying":
        shifts = [
            (lx, brow_y, .09*w, .6, 1.2),
            (rx, brow_y, .09*w, 0, -2.6),
            (lx, eye_y, .10*w, 2.2, 1.6),
            (rx, eye_y, .10*w, 2.2, 1.6),
            (cx-.15*w, mouth_y, .09*w, -1.0, 1.0),
            (cx+.16*w, mouth_y, .09*w, 1.8, -3.2),
        ]
    else:
        raise ValueError(kind)

    for px, py, sigma, dx, dy in shifts:
        fx, fy = radial_field(X, Y, px, py, sigma, dx, dy)
        mapx -= fx
        mapy -= fy

    if kind == "lying":
        for ex in (lx, rx):
            _, fy1 = radial_field(X, Y, ex, eye_y-.03*h, .08*w, 0, 1.4)
            _, fy2 = radial_field(X, Y, ex, eye_y+.03*h, .08*w, 0, -1.4)
            mapy -= (fy1 + fy2)
    else:
        for ex in (lx, rx):
            _, fy = radial_field(X, Y, ex, eye_y+.035*h, .075*w, 0, -.8)
            mapy -= fy

    warped = cv2.remap(
        arr,
        mapx.astype(np.float32),
        mapy.astype(np.float32),
        interpolation=cv2.INTER_CUBIC,
        borderMode=cv2.BORDER_REFLECT101,
    )
    return Image.fromarray(warped)

for cid, bbox in CHARACTERS.items():
    portrait = PUBLIC / cid / "portrait.jpg"
    if not portrait.exists():
        raise FileNotFoundError(portrait)

    base = Image.open(portrait).convert("RGB").resize((900,1200), Image.Resampling.LANCZOS)
    out_dir = PUBLIC / cid / "expressions"
    out_dir.mkdir(parents=True, exist_ok=True)

    for expression in ("uncomfortable", "lying"):
        out = make_expression(base, bbox, expression)
        target = out_dir / f"{expression}.jpg"
        out.save(target, "JPEG", quality=92, subsampling=0, optimize=True)
        check = Image.open(target)
        if check.size != (900,1200):
            raise RuntimeError(f"Invalid size for {target}: {check.size}")

request = ROOT / "creative-requests" / "inbox" / "2026-10-01-elenco-uncomfortable-lying-sem-emendas.md"
completed = ROOT / "creative-requests" / "completed" / request.name
if request.exists():
    text = request.read_text(encoding="utf-8")
    text = text.replace("status: pending", "status: completed", 1)
    marker = """## Resposta do ChatGPT
Preenchido pelo ChatGPT ao concluir.

- status:
- assets criados:
- observações:
"""
    response = """## Resposta do ChatGPT

- status: completed
- assets criados: 10 imagens (uncomfortable + lying para Caio, Téo, Rafael, Cida e Jorge)
- observações: imagens refeitas por deformação facial contínua sobre o retrato oficial inteiro, sem colagem de retângulos, sem bordas retas e sem emendas. Canvas 900×1200 JPG preservado.
"""
    text = text.replace(marker, response)
    completed.parent.mkdir(parents=True, exist_ok=True)
    completed.write_text(text, encoding="utf-8")
    request.unlink()

print("Generated 10 seamless expression assets and completed the Claude request.")
