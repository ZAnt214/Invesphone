#!/usr/bin/env python3
"""Generate deterministic expression packs + viseme sheets for Case 01 cast.

Source of identity: public/characters/<id>/portrait.jpg
Generated outputs:
  public/characters/<id>/expressions/{neutral,tired,uncomfortable,defensive,nervous,shaken,lying,teary}.jpg
  public/characters/<id>/visemes.png
  public/characters/<id>/manifest.json

The transformations are intentionally subtle and only affect face regions so hair,
clothing, framing, background and scale remain locked to the official portrait.
"""

from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance, ImageStat
import json
import shutil

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public" / "characters"

CHARACTERS = {
    "caio":   {"display": "Caio Duarte",    "bbox": (241, 244, 402, 402)},
    "teo":    {"display": "Téo Duarte",     "bbox": (255, 254, 396, 396)},
    "rafael": {"display": "Rafael Valença", "bbox": (240, 240, 420, 420)},
    "cida":   {"display": "Cida",            "bbox": (221, 268, 441, 441)},
    "jorge":  {"display": "Jorge",           "bbox": (215, 162, 486, 486)},
}

EXPRESSIONS = [
    "tired",
    "uncomfortable",
    "defensive",
    "nervous",
    "shaken",
    "lying",
    "teary",
]

MEANINGS = {
    "neutral": "estado base",
    "tired": "cansado(a), energia baixa",
    "uncomfortable": "incômodo, hesitação",
    "defensive": "resistente, fechado(a)",
    "nervous": "tensão e ansiedade",
    "shaken": "abalado(a), impacto emocional",
    "lying": "controle excessivo, evasão e mentira",
    "teary": "emoção contida, quase chorando",
}

def rounded_feather(size: tuple[int, int]) -> Image.Image:
    w, h = size
    m = Image.new("L", size, 0)
    d = ImageDraw.Draw(m)
    d.rounded_rectangle((2, 2, w - 3, h - 3), radius=max(2, min(w, h) // 5), fill=255)
    return m.filter(ImageFilter.GaussianBlur(7))

def transform_patch(
    image: Image.Image,
    box: tuple[float, float, float, float],
    scale_y: float = 1.0,
    shift_x: int = 0,
    shift_y: int = 0,
    angle: float = 0.0,
) -> Image.Image:
    x1, y1, x2, y2 = map(int, box)
    crop = image.crop((x1, y1, x2, y2))
    w, h = crop.size
    patch = crop.resize((w, max(2, int(h * scale_y))), Image.Resampling.BICUBIC)

    if angle:
        patch = patch.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)

    composed = crop.copy()
    px = (w - patch.width) // 2 + shift_x
    py = (h - patch.height) // 2 + shift_y
    composed.paste(patch, (px, py), rounded_feather(patch.size))

    out = image.copy()
    out.paste(composed, (x1, y1), rounded_feather((w, h)))
    return out

def add_emotion_details(
    image: Image.Image,
    *,
    cx: int,
    eye_y: int,
    mouth_y: int,
    face_w: int,
    expression: str,
) -> Image.Image:
    out = image.copy()
    d = ImageDraw.Draw(out, "RGBA")

    if expression == "lying":
        d.arc(
            (cx - int(.12 * face_w), mouth_y - 8, cx + int(.12 * face_w), mouth_y + 24),
            18, 158, fill=(95, 58, 55, 125), width=2,
        )
    elif expression == "teary":
        for ex in (cx - int(.18 * face_w), cx + int(.18 * face_w)):
            d.ellipse((ex + 12, eye_y + 14, ex + 17, eye_y + 23), fill=(225, 235, 241, 130))
            d.ellipse((ex - 8, eye_y - 4, ex - 3, eye_y + 1), fill=(255, 255, 255, 120))
        d.arc(
            (cx - int(.11 * face_w), mouth_y - 4, cx + int(.11 * face_w), mouth_y + 22),
            200, 340, fill=(93, 57, 54, 100), width=2,
        )
    elif expression == "nervous":
        d.ellipse(
            (cx + int(.28 * face_w), eye_y + 8, cx + int(.28 * face_w) + 4, eye_y + 15),
            fill=(212, 226, 230, 75),
        )
    elif expression == "shaken":
        d.arc(
            (cx - int(.12 * face_w), mouth_y - 4, cx + int(.12 * face_w), mouth_y + 26),
            200, 340, fill=(93, 57, 54, 90), width=2,
        )
    return out

def make_expression(base: Image.Image, bbox: tuple[int, int, int, int], expression: str) -> Image.Image:
    x, y, w, h = bbox
    cx = x + w // 2
    eye_y = int(y + .42 * h)
    brow_y = int(y + .31 * h)
    mouth_y = int(y + .72 * h)

    brow_box = (x + .12*w, brow_y - .10*h, x + .88*w, brow_y + .11*h)
    eye_box  = (x + .09*w, eye_y  - .13*h, x + .91*w, eye_y  + .16*h)
    mouth_box= (x + .24*w, mouth_y- .12*h, x + .76*w, mouth_y+ .14*h)

    params = {
        "tired":         {"brow":(.94,0, 3, 0),   "eye":(.84,0, 3, 0), "mouth":(.94,0,2,0)},
        "uncomfortable": {"brow":(.98,-1,0,-1.2), "eye":(.95,-2,1,0),  "mouth":(.92,1,1,1.6)},
        "defensive":     {"brow":(.92,0, 3, 0),   "eye":(.80,0, 1, 0), "mouth":(.80,0,0,0)},
        "nervous":       {"brow":(1.04,0,-3,0),   "eye":(1.10,0,-1,0), "mouth":(1.16,0,1,0)},
        "shaken":        {"brow":(1.04,0,-2,0),   "eye":(1.08,0, 0,0), "mouth":(.94,0,2,0)},
        "lying":         {"brow":(.96,1, 0,.8),   "eye":(.93,3, 0,0),  "mouth":(.90,1,0,-1.2)},
        "teary":         {"brow":(1.02,0,-3,0),   "eye":(1.06,0, 0,0), "mouth":(.88,0,2,0)},
    }[expression]

    out = base.copy()
    for box, key in ((brow_box, "brow"), (eye_box, "eye"), (mouth_box, "mouth")):
        sy, dx, dy, angle = params[key]
        out = transform_patch(out, box, sy, dx, dy, angle)

    out = add_emotion_details(out, cx=cx, eye_y=eye_y, mouth_y=mouth_y, face_w=w, expression=expression)

    if expression == "tired":
        out = ImageEnhance.Brightness(out).enhance(.985)
    elif expression == "shaken":
        out = ImageEnhance.Color(out).enhance(.95)
        out = ImageEnhance.Brightness(out).enhance(.985)

    return out

def median_rgb(im: Image.Image) -> tuple[int, int, int]:
    med = ImageStat.Stat(im.convert("RGB")).median
    return tuple(int(v) for v in med)

def create_visemes(base: Image.Image, bbox: tuple[int, int, int, int]) -> Image.Image:
    x, y, w, h = bbox
    cx = x + w // 2
    mouth_y = int(y + .72 * h)

    crop_w = min(400, int(.82 * w))
    x1 = max(0, cx - crop_w // 2)
    x2 = min(900, x1 + crop_w)
    y1 = max(0, mouth_y - 60)
    y2 = min(1200, mouth_y + 60)

    mouth_crop = base.crop((x1, y1, x2, y2)).resize((400, 120), Image.Resampling.LANCZOS)
    sheet = Image.new("RGB", (2400, 120))
    for i in range(6):
        sheet.paste(mouth_crop, (i * 400, 0))

    skin = median_rgb(base.crop((max(0, cx-120), max(0, mouth_y-75), min(900, cx+120), max(1, mouth_y-45))))
    lip_raw = median_rgb(base.crop((max(0, cx-60), mouth_y-8, min(900, cx+60), mouth_y+8)))
    lip = tuple(max(40, min(180, int(v * .82))) for v in lip_raw)
    dark = tuple(max(20, int(v * .45)) for v in lip)

    teeth = (224, 218, 205)
    brace = (135, 136, 134)
    d = ImageDraw.Draw(sheet, "RGBA")
    specs = [
        ("A",54,26,40,20),
        ("E",54,17,43,10),
        ("I",52,13,39,7),
        ("O",34,29,20,20),
        ("U",31,19,17,11),
        ("M",54,10,0,0),
    ]

    for i, (name, ow, oh, iw, ih) in enumerate(specs):
        ox, cy = i * 400 + 200, 60

        # Only replace the immediate lip area; beard/moustache in the official crop remains around it.
        d.ellipse((ox-65, cy-34, ox+65, cy+34), fill=skin + (205,))

        if name == "M":
            d.polygon([
                (ox-54,cy),(ox-28,cy-8),(ox,cy-5),(ox+28,cy-8),(ox+54,cy),
                (ox+28,cy+8),(ox,cy+5),(ox-28,cy+8),
            ], fill=lip + (255,))
            d.line((ox-52,cy,ox+52,cy), fill=dark + (255,), width=3)
        else:
            d.ellipse((ox-ow,cy-oh,ox+ow,cy+oh), fill=lip + (255,))
            d.ellipse((ox-iw,cy-ih,ox+iw,cy+ih), fill=dark + (255,))
            tw = max(12, int(iw * .84))
            th = max(3, int(ih * .42))
            d.rectangle((ox-tw, cy-ih+2, ox+tw, cy-ih+2+th), fill=teeth + (255,))
            d.line((ox-tw+2, cy-ih+4, ox+tw-2, cy-ih+4), fill=brace + (230,), width=1)
            for bx in range(ox-tw+5, ox+tw-4, max(5, (2*tw-10)//4 or 1)):
                d.rectangle((bx-2,cy-ih+2,bx+2,cy-ih+6), fill=brace + (230,))

        # Existing runtime samples this strip for skin-color adaptation.
        d.rectangle((i*400, 0, (i+1)*400-1, 9), fill=skin + (255,))

    return sheet

def finish_request() -> None:
    inbox = ROOT / "creative-requests" / "inbox" / "2026-10-01-elenco-expressoes-e-visemas.md"
    if not inbox.exists():
        return

    text = inbox.read_text(encoding="utf-8")
    text = text.replace("status: pending", "status: completed", 1)

    response = """
## Resposta do ChatGPT

- status: completed
- assets criados: 5 personagens × (8 retratos incluindo neutral + 1 folha de visemas) = 45 assets binários, além de 5 manifests.
- observações: os retratos oficiais continuam sendo a fonte de identidade. As variações preservam cabelo, roupa, fundo, enquadramento e escala; as mudanças foram limitadas às regiões faciais. As folhas de visemas usam 6 células A/E/I/O/U/M de 400×120 em uma folha 2400×120.
"""
    marker = "## Resposta do ChatGPT"
    if marker in text:
        text = text[:text.index(marker)].rstrip() + "\n\n" + response.strip() + "\n"
    else:
        text = text.rstrip() + "\n\n" + response.strip() + "\n"

    completed = ROOT / "creative-requests" / "completed" / inbox.name
    completed.parent.mkdir(parents=True, exist_ok=True)
    completed.write_text(text, encoding="utf-8")
    inbox.unlink()

def update_global_manifest() -> None:
    path = PUBLIC / "manifest.json"
    if not path.exists():
        return
    data = json.loads(path.read_text(encoding="utf-8"))
    for cid in CHARACTERS:
        if cid not in data.get("characters", {}):
            continue
        data["characters"][cid]["expressionPack"] = f"/characters/{cid}/expressions/"
        data["characters"][cid]["visemes"] = f"/characters/{cid}/visemes.png"
        data["characters"][cid]["hasExpressionPack"] = True
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

def main() -> None:
    for cid, meta in CHARACTERS.items():
        portrait = PUBLIC / cid / "portrait.jpg"
        if not portrait.exists():
            raise SystemExit(f"Missing official portrait: {portrait}")

        base = Image.open(portrait).convert("RGB")
        if base.size != (900, 1200):
            base = base.resize((900, 1200), Image.Resampling.LANCZOS)

        expression_dir = PUBLIC / cid / "expressions"
        expression_dir.mkdir(parents=True, exist_ok=True)

        # Neutral is byte-for-byte based on the official portrait when dimensions already match.
        if Image.open(portrait).size == (900, 1200):
            shutil.copyfile(portrait, expression_dir / "neutral.jpg")
        else:
            base.save(expression_dir / "neutral.jpg", "JPEG", quality=96, subsampling=0)

        for expression in EXPRESSIONS:
            generated = make_expression(base, meta["bbox"], expression)
            generated.save(expression_dir / f"{expression}.jpg", "JPEG", quality=96, subsampling=0)

        create_visemes(base, meta["bbox"]).save(PUBLIC / cid / "visemes.png", "PNG", optimize=True)

        manifest = {
            "character": cid,
            "displayName": meta["display"],
            "basePath": f"/characters/{cid}/",
            "resolution": {"width": 900, "height": 1200},
            "expressions": ["neutral"] + EXPRESSIONS,
            "expressionMeanings": MEANINGS,
            "visemes": {
                "file": "visemes.png",
                "order": ["A","E","I","O","U","M"],
                "sheet": {"width": 2400, "height": 120},
                "cell": {
                    "width": 400,
                    "height": 120,
                    "mouthCenter": {"x": 200, "y": 60},
                    "nominalLipWidth": 108,
                },
            },
        }
        (PUBLIC / cid / "manifest.json").write_text(
            json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    update_global_manifest()
    finish_request()

if __name__ == "__main__":
    main()
