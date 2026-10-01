#!/usr/bin/env python3
"""
Refaz as expressões tired, defensive, nervous, shaken e teary do elenco do Caso 01 por deformação contínua do
retrato oficial (mesmo método de scripts/generate-clean-cast-expressions.py, que fez uncomfortable e lying).

As expressões antigas foram feitas colando blocos deslocados do rosto: mechas de cabelo e contornos ficavam
cortados nas bordas dos blocos. Aqui cada mudança é um campo de deslocamento gaussiano centrado numa feição
(sobrancelha, pálpebra, canto da boca), medido no retrato: fora das feições a imagem fica idêntica ao neutro,
então não há emenda, mudança de tom nem mecha cortada.

Uso: python3 scripts/make-cast-expressions.py   (requer pillow, numpy, opencv-python-headless)
"""
import numpy as np, cv2
from PIL import Image

ROOT = __file__.rsplit('/scripts/', 1)[0]
# olhos (esq, dir) e boca (cx, linha dos lábios, meia-largura), medidos no retrato neutro
CAST = {
    'caio':   {'eyes': [(372, 415), (521, 410)], 'mouth': (454, 559, 54)},
    'teo':    {'eyes': [(372, 430), (523, 427)], 'mouth': (452, 570, 47)},
    'rafael': {'eyes': [(373, 451), (527, 451)], 'mouth': (450, 576, 45)},
    'cida':   {'eyes': [(368, 462), (517, 466)], 'mouth': (442, 599, 57)},
    'jorge':  {'eyes': [(385, 385), (532, 388)], 'mouth': (458, 551, 50)},
}

def expression_fields(info, kind):
    """Lista de (x, y, sigma, dx, dy): a imagem em (x, y) se move (dx, dy), com queda gaussiana."""
    (lx, ly), (rx, ry) = info['eyes']
    cx, rim, half = info['mouth']
    s = (rx - lx) / 143.7
    F = []
    def brow(ex, ey, inner_dy, outer_dy, side):
        # parte interna (perto do nariz) e externa de cada sobrancelha
        F.append((ex - side * 22 * s, ey - 46 * s, 17 * s, 0, inner_dy * s))
        F.append((ex + side * 22 * s, ey - 44 * s, 17 * s, 0, outer_dy * s))
    def lids(ex, ey, upper_dy, lower_dy=0):
        F.append((ex, ey - 13 * s, 15 * s, 0, upper_dy * s))
        if lower_dy: F.append((ex, ey + 13 * s, 14 * s, 0, lower_dy * s))
    def corners(dy, dx=0):
        F.append((cx - half, rim, 14 * s, -dx * s, dy * s))
        F.append((cx + half, rim, 14 * s, dx * s, dy * s))
    eyes = [(lx, ly, 1), (rx, ry, -1)]   # side: +1 = nariz à direita da sobrancelha esquerda
    if kind == 'tired':
        for ex, ey, sd in eyes: brow(ex, ey, 2, 3.5, sd); lids(ex, ey, 5.5)
        corners(2.5)
    elif kind == 'defensive':
        for ex, ey, sd in eyes:
            brow(ex, ey, 5.5, 1.5, sd)
            F.append((ex - sd * 22 * s, ey - 46 * s, 17 * s, sd * 2.5 * s, 0))   # sobrancelhas se aproximam
            lids(ex, ey, 2.5)
        F.append((cx, rim + 9 * s, 16 * s, 0, -2 * s))   # lábios apertados
    elif kind == 'nervous':
        for ex, ey, sd in eyes: brow(ex, ey, -5, -3.5, sd); lids(ex, ey, -3, 1.5)
        corners(1.5, 1.5)
    elif kind == 'shaken':
        for ex, ey, sd in eyes: brow(ex, ey, -7.5, 1, sd); lids(ex, ey, -2.5, 1.5)
        corners(4)
        F.append((cx, rim + 10 * s, 15 * s, 0, 2 * s))
    elif kind == 'teary':
        for ex, ey, sd in eyes: brow(ex, ey, -6, 1.5, sd); lids(ex, ey, 2.5)
        corners(3.5)
    else:
        raise ValueError(kind)
    return F

def warp(img, fields):
    H, W = img.shape[:2]
    Y, X = np.mgrid[0:H, 0:W].astype(np.float32)
    mx, my = X.copy(), Y.copy()
    for (px, py, sg, dx, dy) in fields:
        g = np.exp(-((X - px) ** 2 + (Y - py) ** 2) / (2 * sg * sg)).astype(np.float32)
        mx -= dx * g; my -= dy * g
    return cv2.remap(img, mx, my, interpolation=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT101)

def tear_shine(img, info):
    """Olhos marejados: brilho úmido suave na linha d'água de baixo (sem desenho por cima, só luz)."""
    out = img.astype(np.float32)
    H, W = img.shape[:2]
    Y, X = np.mgrid[0:H, 0:W].astype(np.float32)
    (lx, ly), (rx, ry) = info['eyes']
    s = (rx - lx) / 143.7
    for ex, ey in info['eyes']:
        g = np.exp(-(((X - ex) / (26 * s)) ** 2 + ((Y - (ey + 15 * s)) / (4 * s)) ** 2) / 2)[..., None]
        out = out * (1 - .28 * g) + 245 * .28 * g
    return out.clip(0, 255).astype(np.uint8)

for cid, info in CAST.items():
    base = np.asarray(Image.open(f'{ROOT}/public/characters/{cid}/portrait.jpg').convert('RGB'))
    for kind in ('tired', 'defensive', 'nervous', 'shaken', 'teary'):
        out = warp(base, expression_fields(info, kind))
        if kind == 'teary': out = tear_shine(out, info)
        Image.fromarray(out).save(f'{ROOT}/public/characters/{cid}/expressions/{kind}.jpg', 'JPEG', quality=92, subsampling=0, optimize=True)
    print(cid, 'ok')
