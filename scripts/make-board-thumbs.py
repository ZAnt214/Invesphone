"""Versões leves das imagens que o quadro do caso mostra pequenas (cartões, rostos, parede do fundo e o Lemos de costas).

Os originais oficiais continuam onde estão e são os que abrem no visualizador com zoom; aqui só se reduz o tamanho
(mesma imagem, sem recorte nem retoque). Saída em public/thumbs/<mesmo caminho>. Rodar de novo quando um asset mudar:
    python3 scripts/make-board-thumbs.py
"""
from pathlib import Path
from PIL import Image

PUB = Path(__file__).resolve().parent.parent / 'public'
OUT = PUB / 'thumbs'

def save_jpg(src: Path, box: int, q: int = 74):
    im = Image.open(src).convert('RGB')
    im.thumbnail((box, box), Image.LANCZOS)
    dst = OUT / src.relative_to(PUB)
    dst.parent.mkdir(parents=True, exist_ok=True)
    im.save(dst, 'JPEG', quality=q, optimize=True, progressive=True)
    return dst

made = []
for f in sorted((PUB / 'evidence/case01/new').rglob('*.jpg')):
    # o croqui da casa aparece grande na cena do quadro; o resto vira cartão pequeno
    made.append(save_jpg(f, 1000 if f.name == 'croqui_residencia.jpg' else 480))
for f in sorted(PUB.glob('characters/*/expressions/neutral.jpg')) + sorted(PUB.glob('characters/*/portrait.jpg')):
    made.append(save_jpg(f, 320, 78))
# Lemos de costas na entrada do quadro: ocupa a altura da tela, com leve desfoque
back = Image.open(PUB / 'characters/lemos/back.png').convert('RGBA')
back.thumbnail((880, 1100), Image.LANCZOS)
dst = OUT / 'characters/lemos/back.webp'
dst.parent.mkdir(parents=True, exist_ok=True)
back.save(dst, 'WEBP', quality=82, method=6)
made.append(dst)
total = sum(p.stat().st_size for p in made)
print(f'{len(made)} arquivos, {total // 1024} KB')
