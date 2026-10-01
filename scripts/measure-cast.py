#!/usr/bin/env python3
"""
Mede as marcas (olhos, alinhamento) de cada expressão do elenco do Caso 01 e gera:
  - public/characters/<id>/face-mask.png (via make-face-mask.py, com polígono derivado do rosto da Lívia, escalado)
  - src/characters/castMarks.ts (dados lidos por characters.ts)
Uso: python3 scripts/measure-cast.py
Requer: pillow, numpy, scipy, opencv-python-headless
"""
import json, subprocess, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = __file__.rsplit('/scripts/', 1)[0]
EXPR = ['neutral', 'tired', 'uncomfortable', 'defensive', 'nervous', 'shaken', 'lying', 'teary']
# neutro medido a mão/aprovado em characters.ts: olhos (esq, dir), boca (cx, rim, meia-largura, fundo)
NEUTRAL = {
    'caio':   {'eyes': [(372, 415), (521, 410)], 'mouth': (454, 559, 54, 577)},
    'teo':    {'eyes': [(372, 430), (523, 427)], 'mouth': (452, 570, 47, 586)},
    'rafael': {'eyes': [(373, 451), (527, 451)], 'mouth': (450, 576, 45, 594)},
    'cida':   {'eyes': [(368, 462), (517, 466)], 'mouth': (442, 599, 57, 616)},
    'jorge':  {'eyes': [(385, 385), (532, 388)], 'mouth': (458, 551, 50, 568)},
}

def eyes_of(path, near):
    """Esclera (branco) perto dos olhos esperados: devolve [(cx, cy, w, h), (cx, cy, w, h)] ou None."""
    a = np.asarray(Image.open(path).convert('RGB')).astype(int)
    g = a.mean(2)
    white = (g > 175) & (abs(a[..., 0] - a[..., 2]) < 45)
    out = []
    for (ex, ey) in near:
        win = np.zeros_like(white)
        win[ey - 40:ey + 40, ex - 55:ex + 55] = True
        lab, k = ndi.label(white & win)
        best = None
        for i in range(1, k + 1):
            ys, xs = np.where(lab == i)
            if len(ys) < 150: continue
            if best is None or len(ys) > best[0]:
                best = (len(ys), xs.mean(), ys.mean(), xs.max() - xs.min(), ys.max() - ys.min())
        out.append(best[1:] if best else None)
    return out

def mouth_line(path, cx, rim):
    """y da linha entre os lábios: a linha mais escura da coluna central da boca."""
    a = np.asarray(Image.open(path).convert('L')).astype(float)
    col = a[rim - 40:rim + 45, cx - 30:cx + 30].mean(1)
    col = np.convolve(col, np.ones(3) / 3, mode='same')
    return int(np.argmin(col[3:-3]) + 3 + rim - 40)

TOP = 100   # px (na escala da Lívia) acima da linha dos olhos onde o recorte do rosto começa

def poly_for(info):
    """Contorno do interior do rosto: perfil do rosto da Lívia (máscara aprovada) escalado para o personagem."""
    (lx, ly), (rx, ry) = info['eyes']
    mx, my = (lx + rx) / 2, (ly + ry) / 2
    s = (rx - lx) / 143.7
    mouth_bottom = info['mouth'][3]
    LIV_MOUTH, LIV_BOTTOM = 137.0, 183.0   # fundo da boca e do queixo da Lívia, abaixo dos olhos
    def ymap(dy):   # dy relativo aos olhos na Lívia -> relativo aos olhos no personagem
        if dy <= 0: return dy * s
        if dy <= LIV_MOUTH: return dy * (mouth_bottom - my) / LIV_MOUTH
        return (mouth_bottom - my) + (dy - LIV_MOUTH) * s
    m = np.asarray(Image.open(f'{ROOT}/public/characters/livia/face-mask.png'))
    left, right = [], []
    for y in range(274, 621, 6):
        r = np.where(m[y] > 0)[0]
        if len(r) == 0: continue
        dy = y - 437
        # o recorte começa logo acima das sobrancelhas: testa e cabelo (mechas sobre a testa) vêm sempre do retrato neutro
        if dy < -TOP: continue
        left.append((mx + (r.min() - 431.9) * s, my + ymap(dy)))
        right.append((mx + (r.max() - 431.9) * s, my + ymap(dy)))
    return [[int(x), int(y)] for x, y in left + right[::-1]]

marks = {}
for cid, info in NEUTRAL.items():
    base = f'{ROOT}/public/characters/{cid}/expressions'
    poly = poly_for(info)
    json.dump(poly, open(f'/tmp/{cid}-poly.json', 'w'))
    json.dump([list(e) for e in info['eyes']], open(f'/tmp/{cid}-eyes.json', 'w'))
    r = subprocess.run([sys.executable, f'{ROOT}/scripts/make-face-mask.py', f'{base}/neutral.jpg', f'/tmp/{cid}-poly.json', f'{ROOT}/public/characters/{cid}/face-mask.png', 'nohair'], capture_output=True, text=True)
    print(cid, r.stdout.strip(), r.stderr.strip()[-200:])
    Image.open('/tmp/mask-debug.png').save(f'/tmp/{cid}-mask-debug.png')
    (nl, nr) = info['eyes']
    ndist = nr[0] - nl[0]
    marks[cid] = {}
    nline = mouth_line(f'{base}/neutral.jpg', info['mouth'][0], info['mouth'][1])
    for e in EXPR:
        found = eyes_of(f'{base}/{e}.jpg', info['eyes'])
        ok = all(found)
        if ok:
            (l, r_) = found
            eye_mid = [round((l[0] + r_[0]) / 2, 1), round((l[1] + r_[1]) / 2, 1)]
            dist = r_[0] - l[0]
            scale = round(ndist / dist, 3)
            eyes = [[round(l[0], 1), round(l[1], 1), int(l[2] / 2 + 4), max(12, int(l[3] / 2 + 4))],
                    [round(r_[0], 1), round(r_[1], 1), int(r_[2] / 2 + 4), max(12, int(r_[3] / 2 + 4))]]
        else:
            eye_mid = [(nl[0] + nr[0]) / 2, (nl[1] + nr[1]) / 2]; scale = 1.0
            eyes = [[nl[0], nl[1], 38, 17], [nr[0], nr[1], 38, 17]]
        marks[cid][e] = {'eyeMid': eye_mid, 'scale': scale, 'eyes': eyes, 'measured': ok, 'mouthDy': mouth_line(f'{base}/{e}.jpg', info['mouth'][0], info['mouth'][1]) - nline}
        print(cid, e, 'ok' if ok else 'FALLBACK', eye_mid, scale)
open(f'{ROOT}/src/characters/castMarks.json', 'w').write(json.dumps(marks, indent=1))
