#!/usr/bin/env python3
"""
Gera a máscara do interior do rosto de um personagem (public/characters/<id>/face-mask.png) a partir do
retrato neutro e do polígono do rosto. A máscara exclui as mechas de cabelo que entram no polígono
(componentes marrons ligados ao cabelo de fora), com uma folga, para que elas venham sempre da imagem neutra
e não se deformem quando a expressão troca.

Uso: python3 scripts/make-face-mask.py public/characters/livia/expressions/neutral.jpg poly.json public/characters/livia/face-mask.png [brown|dark|nohair]
`dark`: cabelo = manchas escuras ligadas à borda do polígono (pele escura que se confunde com o cabelo na detecção por cor). `nohair`: não exclui mechas (para personagens cujas expressões só alteram o rosto e cuja pele se confunde com o cabelo na detecção).
Requer: pillow, numpy, opencv-python-headless
"""
import json, sys
import numpy as np, cv2
from PIL import Image

src, poly_json, out = sys.argv[1:4]
MODE = sys.argv[4] if len(sys.argv) > 4 else 'brown'   # brown (Lívia) | dark | nohair
img = np.asarray(Image.open(src).convert('RGB')).astype(int)
H, W, _ = img.shape
poly = np.array(json.load(open(poly_json)), np.int32)
P = np.zeros((H, W), np.uint8)
cv2.fillPoly(P, [poly], 255)

R, G, B = img[..., 0], img[..., 1], img[..., 2]
if MODE == 'dark':
    # cabelo e barba: pixels bem mais escuros que a pele do rosto (mediana do polígono); sobrancelhas e pupilas também,
    # mas só as manchas escuras LIGADAS à borda do polígono são cabelo (as sobrancelhas ficam dentro, isoladas)
    lum = (R + G + B) / 3
    skin_lum = np.median(lum[P > 0])
    brown = (lum < skin_lum * .62).astype(np.uint8) * 255
else:
    brown = ((R > G) & (G > B) & ((R - B) > 25) & (R + G + B < 420)).astype(np.uint8) * 255
# região um pouco maior que o polígono: os componentes marrons que saem dela são cabelo
big = cv2.dilate(P, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (61, 61)))
cand = cv2.bitwise_and(brown, big)
n, lab = cv2.connectedComponents(cand, connectivity=8)
ring = cv2.bitwise_and(big, cv2.bitwise_not(cv2.erode(big, np.ones((5, 5), np.uint8))))
touching = set(np.unique(lab[ring > 0])) - {0}
hair = np.isin(lab, list(touching)).astype(np.uint8) * 255
hair = cv2.dilate(hair, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25)))   # folga de ~12 px
if MODE == 'nohair': hair[:] = 0
# sobrancelhas: ficam no recorte (são o que mais muda de expressão), mesmo onde mechas encostam nelas
if len(sys.argv) > 5:
    eyes = json.load(open(sys.argv[5]))   # [[x, y], [x, y]] dos centros dos olhos
    d = abs(eyes[1][0] - eyes[0][0]); sc = d / 143.7
    prot = np.zeros((H, W), np.uint8)
    for ex, ey in eyes:
        cv2.ellipse(prot, (int(ex), int(ey - 48 * sc)), (int(62 * sc), int(26 * sc)), 0, 0, 360, 255, -1)
    hair[prot > 0] = 0
mask = cv2.bitwise_and(P, cv2.bitwise_not(hair))
mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
Image.fromarray(mask).save(out, optimize=True)
vis = img.copy().astype(np.uint8)
vis[hair > 0] = (vis[hair > 0] * .5 + np.array([255, 0, 0]) * .5).astype(np.uint8)
cv2.polylines(vis, [poly.reshape(-1, 1, 2)], True, (0, 255, 0), 1)
Image.fromarray(vis).save('/tmp/mask-debug.png')
print('máscara:', int((mask > 0).sum()), 'px; cabelo dentro do polígono:', int(((hair > 0) & (P > 0)).sum()), 'px')
