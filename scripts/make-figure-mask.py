#!/usr/bin/env python3
"""
Gera a máscara da silhueta de um personagem (public/characters/<id>/figure-mask.png) a partir do retrato neutro.
Com ela o retrato sai com fundo transparente e o personagem aparece dentro da sala do depoimento.
A arte oficial não muda: a máscara só diz onde está o fundo liso.

O fundo é preenchido a partir da borda de cima e das laterais (até `--seed` da altura), passando só por pixels
parecidos com a cor do fundo e sem degrau de cor em relação ao vizinho: o contorno do desenho segura o preenchimento,
mesmo quando a roupa é tão escura quanto o fundo. A saída é PNG branco com transparência (alfa = figura), com 1,5 px de borda suave.

Uso: python3 scripts/make-figure-mask.py <id> [--seed 0.55] [--ref 30] [--step 7] [--hue 3]
Ajustes usados no Caso 01: caio --ref 40; rafael --ref 44 --step 8; jorge --hue 6 --step 5; teo, cida e livia no padrão.
Requer: pillow, numpy
"""
import argparse
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

ap = argparse.ArgumentParser()
ap.add_argument('id')
ap.add_argument('--seed', type=float, default=.55, help='altura (fração) até onde as laterais semeiam o fundo')
ap.add_argument('--ref', type=int, default=30, help='distância máxima (soma RGB) até a cor do fundo')
ap.add_argument('--step', type=int, default=7, help='degrau máximo (soma RGB) entre vizinhos')
ap.add_argument('--hue', type=int, default=3, help='o fundo é azulado: azul menos vermelho mínimo (-99 desliga)')
a = ap.parse_args()

src = f'public/characters/{a.id}/expressions/neutral.jpg'
im = Image.open(src).convert('RGB')
img = np.asarray(im.filter(ImageFilter.BoxBlur(3))).astype(np.int32)   # apaga o grão do fundo
H, W, _ = img.shape
corners = np.concatenate([img[:12, :12].reshape(-1, 3), img[:12, -12:].reshape(-1, 3)])
ref = np.median(corners, axis=0)
near = (np.abs(img - ref).sum(2) <= a.ref) & ((img[..., 2] - img[..., 0]) >= a.hue)

bg = np.zeros((H, W), bool)
q = deque()
seeds = [(0, x) for x in range(W)] + [(y, 0) for y in range(int(H * a.seed))] + [(y, W - 1) for y in range(int(H * a.seed))]
for y, x in seeds:
    if near[y, x] and not bg[y, x]:
        bg[y, x] = True
        q.append((y, x))
while q:
    y, x = q.popleft()
    c = img[y, x]
    for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
        if 0 <= ny < H and 0 <= nx < W and not bg[ny, nx] and near[ny, nx] and np.abs(img[ny, nx] - c).sum() <= a.step:
            bg[ny, nx] = True
            q.append((ny, nx))

# só a silhueta principal: manchas soltas do grão do fundo que o preenchimento não alcançou voltam a ser fundo
fgm = ~bg
lab = np.zeros((H, W), np.int32)
best, bestn, n = 0, 0, 0
for sy in range(0, H, 4):
    for sx in range(0, W, 4):
        if not fgm[sy, sx] or lab[sy, sx]:
            continue
        n += 1
        lab[sy, sx] = n
        q.append((sy, sx))
        cnt = 0
        while q:
            y, x = q.popleft()
            cnt += 1
            for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= ny < H and 0 <= nx < W and fgm[ny, nx] and not lab[ny, nx]:
                    lab[ny, nx] = n
                    q.append((ny, nx))
        if cnt > bestn:
            best, bestn = n, cnt
fgm = lab == best
fg = Image.fromarray((fgm * 255).astype(np.uint8))
# tira pontinhos soltos e fecha furinhos de 1 px antes de suavizar a borda
fg = fg.filter(ImageFilter.MedianFilter(5)).filter(ImageFilter.GaussianBlur(1.5))
out = Image.new('RGBA', (W, H), (255, 255, 255, 0))
out.putalpha(fg)
dst = f'public/characters/{a.id}/figure-mask.png'
out.save(dst, optimize=True)
print(dst, f'fundo {1 - fgm.mean():.1%}')
