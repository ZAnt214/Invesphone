#!/usr/bin/env python3
"""
Gera a folha de visemas (A E I O U M, 6 células de 400x120 = 2400x120) de cada personagem do elenco no mesmo formato e
com as mesmas medidas da folha da Lívia (public/characters/livia/visemes.png).

Cada célula é o próprio retrato oficial recortado em volta da boca (cabelo, barba, bigode e pele ficam como no retrato),
com os lábios apagados (inpaint) e a boca da vogal desenhada com as cores dos lábios daquele personagem: anel de lábio,
interior escuro e dentes. A célula M (lábios fechados) é o recorte original, sem apagar nada.

Uso: python3 scripts/make-cast-visemes.py   (requer pillow, numpy, opencv-python-headless)
"""
import numpy as np, cv2
from PIL import Image, ImageDraw

ROOT = __file__.rsplit('/scripts/', 1)[0]
# centro da boca (cx), linha entre os lábios (rim) e meia-largura, medidos no retrato neutro (iguais aos de characters.ts)
CAST = {
    'caio':   (454, 559, 54),
    'teo':    (452, 570, 47),
    'rafael': (450, 576, 45),
    'cida':   (442, 599, 57),
    'jorge':  (458, 551, 50),
}
# medidas externas das bocas da Lívia (largura, altura) e abertura interna (largura, altura), em px da célula 400x120
SHAPES = {
    'A': dict(kind='ellipse', outer=(108, 51), inner=(86, 34), teeth=.26),
    'E': dict(kind='round',   outer=(108, 32), inner=(90, 15), teeth=.55),
    'I': dict(kind='round',   outer=(104, 24), inner=(88, 8),  teeth=.7),
    'O': dict(kind='ellipse', outer=(68, 58),  inner=(44, 38), teeth=0),
    'U': dict(kind='ellipse', outer=(62, 36),  inner=(36, 16), teeth=0),
}
CW, CH, CX, CY = 400, 120, 200, 60
SS = 4   # supersampling do desenho

def lips_and_skin(img, cx, rim, half):
    a = img.astype(np.float32)
    h, w = a.shape[:2]
    sk = []
    for sx in (-1, 1):
        x0 = int(cx + sx * half * 1.08); x1 = int(cx + sx * half * 1.3)
        sk.append(a[rim - 4:rim + 14, min(x0, x1):max(x0, x1)].reshape(-1, 3))
    skin = np.median(np.concatenate(sk), axis=0)
    y0, y1, x0, x1 = rim - 14, rim + 24, int(cx - half * 1.15), int(cx + half * 1.15)
    reg = a[y0:y1, x0:x1]
    dist = np.abs(reg - skin).sum(2)
    sat = reg.max(2) - reg.min(2)
    m = ((dist > 28) & (sat > 16)).astype(np.uint8)
    # só o que está ligado ao centro da boca (descarta pintas, barba solta)
    n, lab = cv2.connectedComponents(m)
    keep = np.zeros_like(m)
    for i in range(1, n):
        ys, xs = np.where(lab == i)
        if len(ys) > 40 and abs(xs.mean() + x0 - cx) < half * .8:
            keep[lab == i] = 1
    keep = cv2.dilate(keep, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
    full = np.zeros((h, w), np.uint8)
    full[y0:y1, x0:x1] = keep
    lips = a[full > 0]
    up = a[(full > 0) & (np.arange(h)[:, None] < rim)]
    lo = a[(full > 0) & (np.arange(h)[:, None] >= rim)]
    c_up = np.median(up, axis=0) if len(up) > 20 else skin * .8
    c_lo = np.median(lo, axis=0) if len(lo) > 20 else skin * .85
    return full, skin, c_up, c_lo

def crop_cell(img, cx, rim, half):
    s0 = 108 / (2 * half)
    ww, hh = CW / s0, CH / s0
    x0, y0 = cx - CX / s0, rim - CY / s0
    M = np.float32([[s0, 0, -x0 * s0], [0, s0, -y0 * s0]])
    return cv2.warpAffine(img, M, (CW, CH), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)

def draw_mouth(cell, spec, c_up, c_lo):
    big = Image.fromarray(cell).resize((CW * SS, CH * SS), Image.LANCZOS)
    layer = Image.new('RGBA', big.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    ow, oh = spec['outer']; iw, ih = spec['inner']
    def shape(w, h, fill):
        box = [(CX - w / 2) * SS, (CY - h / 2) * SS, (CX + w / 2) * SS, (CY + h / 2) * SS]
        if spec['kind'] == 'ellipse': d.ellipse(box, fill=fill)
        else: d.rounded_rectangle(box, radius=min(w, h) / 2 * SS, fill=fill)
    # anel dos lábios: degradê do lábio de cima ao de baixo
    ring = Image.new('RGBA', big.size, (0, 0, 0, 0))
    grad = np.zeros((CH * SS, CW * SS, 4), np.uint8)
    t = np.clip((np.arange(CH * SS) - (CY - oh / 2) * SS) / max(1, oh * SS), 0, 1)[:, None]
    col = (np.array(c_up)[None, :] * (1 - t) + np.array(c_lo)[None, :] * t)
    grad[..., :3] = col[:, None, :].astype(np.uint8); grad[..., 3] = 255
    mask = Image.new('L', big.size, 0); md = ImageDraw.Draw(mask)
    box = [(CX - ow / 2) * SS, (CY - oh / 2) * SS, (CX + ow / 2) * SS, (CY + oh / 2) * SS]
    if spec['kind'] == 'ellipse': md.ellipse(box, fill=255)
    else: md.rounded_rectangle(box, radius=min(ow, oh) / 2 * SS, fill=255)
    ring = Image.fromarray(grad); ring.putalpha(mask)
    big = Image.alpha_composite(big.convert('RGBA'), ring)
    # interior escuro, com dentes de cima
    dark = tuple(int(v * .32) for v in c_lo)
    inner = Image.new('RGBA', big.size, (0, 0, 0, 0)); idr = ImageDraw.Draw(inner)
    ibox = [(CX - iw / 2) * SS, (CY - ih / 2) * SS, (CX + iw / 2) * SS, (CY + ih / 2) * SS]
    im = Image.new('L', big.size, 0); imd = ImageDraw.Draw(im)
    if spec['kind'] == 'ellipse': imd.ellipse(ibox, fill=255)
    else: imd.rounded_rectangle(ibox, radius=min(iw, ih) / 2 * SS, fill=255)
    fill = Image.new('RGBA', big.size, dark + (255,))
    if spec['teeth'] > 0:
        td = ImageDraw.Draw(fill)
        th = ih * spec['teeth']
        td.rectangle([ibox[0], ibox[1], ibox[2], ibox[1] + th * SS], fill=(238, 228, 216, 255))
    fill.putalpha(im)
    big = Image.alpha_composite(big, fill)
    return np.asarray(big.resize((CW, CH), Image.LANCZOS).convert('RGB'))

for cid, (cx, rim, half) in CAST.items():
    path = f'{ROOT}/public/characters/{cid}/expressions/neutral.jpg'
    img = np.asarray(Image.open(path).convert('RGB'))
    mask, skin, c_up, c_lo = lips_and_skin(img, cx, rim, half)
    clean = cv2.inpaint(img, mask * 255, 6, cv2.INPAINT_TELEA)
    clean_cell = crop_cell(clean, cx, rim, half)
    orig_cell = crop_cell(img, cx, rim, half)
    cells = []
    for v in 'AEIOU':
        cells.append(draw_mouth(clean_cell, SHAPES[v], c_up, c_lo))
    cells.append(orig_cell)   # M: os lábios fechados do próprio retrato
    # o renderizador mede o tom de pele de cada forma numa faixa no topo da célula (y 3..7, em volta do centro);
    # essa faixa nunca aparece (a máscara esconde tudo acima dos lábios), então recebe a cor de pele ao lado da boca,
    # a mesma que ele mede na expressão, e o ganho de cor fica 1
    s0 = 108 / (2 * half)
    sx = int(round((half + 16) * s0))
    side = np.mean([orig_cell[CY + 3:CY + 8, CX - sx - 2:CX - sx + 3].reshape(-1, 3).mean(0),
                    orig_cell[CY + 3:CY + 8, CX + sx - 2:CX + sx + 3].reshape(-1, 3).mean(0)], axis=0)
    cells = [np.array(c) for c in cells]
    for c in cells:
        c[0:10, :, :] = side.astype(np.uint8)
    sheet = np.concatenate(cells, axis=1)
    Image.fromarray(sheet).save(f'{ROOT}/public/characters/{cid}/visemes.png', optimize=True)
    print(cid, 'ok', 'lábio cima', c_up.astype(int), 'baixo', c_lo.astype(int))
