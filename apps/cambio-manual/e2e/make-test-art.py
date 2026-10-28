"""Gera um pacote de arte FALSO no mesmo contrato do pedido ao ChatGPT, só para testar o
encaixe do modo foto (tamanhos, pivôs, transparências). Não é para publicar.

uso: python3 e2e/make-test-art.py <pasta-de-saida>
"""
import json, math, os, sys
from PIL import Image, ImageDraw

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
S = 4  # px por unidade


def u(v):
    return int(round(v * S))


layers = {}

# painel-base: 1200x420 unidades; para-brisa transparente; janelas do quadro e da tela transparentes
base = Image.new('RGBA', (u(1200), u(420)), (0, 0, 0, 0))
d = ImageDraw.Draw(base)
d.polygon([(0, u(118)), (u(600), u(96)), (u(1200), u(118)), (u(1200), u(420)), (0, u(420))], fill=(38, 40, 44, 255))
d.rectangle([0, u(140), u(1200), u(420)], fill=(30, 32, 35, 255))
for x0, y0, w, h in [(24, 152, 60, 34), (818, 152, 62, 34)]:
    d.rounded_rectangle([u(x0), u(y0), u(x0 + w), u(y0 + h)], radius=u(9), outline=(212, 81, 58, 255), width=u(3.5), fill=(10, 10, 12, 255))
d.rounded_rectangle([u(164), u(150), u(376), u(266)], radius=u(24), fill=(8, 9, 10, 255))
d.rounded_rectangle([u(172), u(160), u(368), u(258)], radius=u(18), fill=(0, 0, 0, 0))   # janela do quadro
d.rounded_rectangle([u(532), u(90), u(708), u(182)], radius=u(7), fill=(20, 22, 25, 255))
d.rounded_rectangle([u(539), u(96), u(701), u(176)], radius=u(3), fill=(0, 0, 0, 0))     # vidro da tela
d.rounded_rectangle([u(546), u(246), u(704), u(322)], radius=u(11), fill=(16, 17, 19, 255))
for i in range(3):
    d.rounded_rectangle([u(29), u(200 + i * 15), u(81), u(212 + i * 15)], radius=u(2.5), fill=(45, 48, 52, 255))
d.ellipse([u(570), u(378), u(666), u(416)], fill=(12, 12, 14, 255))
d.ellipse([u(462), u(334), u(498), u(370)], fill=(150, 156, 162, 255))
base.save(os.path.join(out, 'painel-base.png'))
layers['base'] = {'file': 'painel-base.png', 'w': base.width, 'h': base.height}

# volante 400x400 unidades, pivô no centro
wh = Image.new('RGBA', (u(400), u(400)), (0, 0, 0, 0))
d = ImageDraw.Draw(wh)
c = u(200)
d.ellipse([c - u(181), c - u(181), c + u(181), c + u(181)], outline=(25, 26, 28, 255), width=u(20))
d.rectangle([c - u(166), c - u(6), c - u(44), c + u(36)], fill=(35, 37, 40, 255))
d.rectangle([c + u(44), c - u(6), c + u(166), c + u(36)], fill=(35, 37, 40, 255))
d.rectangle([c - u(25), c + u(36), c + u(25), c + u(181)], fill=(35, 37, 40, 255))
d.ellipse([c - u(46), c - u(30), c + u(46), c + u(52)], fill=(28, 30, 33, 255))
d.rectangle([c - u(4), c - u(181), c + u(4), c - u(161)], fill=(200, 60, 50, 255))  # marca do topo (ver o giro)
wh.save(os.path.join(out, 'volante.png'))
layers['wheel'] = {'file': 'volante.png', 'w': wh.width, 'h': wh.height, 'pivot': [c, c]}

# alavancas: 188x22 unidades, horizontais; pivô na ponta da coluna
for name, key, left in [('alavanca-esquerda.png', 'stalkL', True), ('alavanca-direita.png', 'stalkR', False)]:
    im = Image.new('RGBA', (u(188), u(22)), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle([0, u(6), u(188), u(16)], fill=(40, 43, 47, 255))
    rx = 0 if left else u(188 - 46)
    d.rounded_rectangle([rx, u(1), rx + u(46), u(21)], radius=u(7), fill=(70, 75, 80, 255))
    im.save(os.path.join(out, name))
    layers[key] = {'file': name, 'w': im.width, 'h': im.height, 'pivot': [u(188) if left else 0, u(11)]}

# chave 25x60 unidades, pivô no centro do miolo
k = Image.new('RGBA', (u(25), u(60)), (0, 0, 0, 0))
d = ImageDraw.Draw(k)
d.rectangle([u(10), u(4), u(15), u(24)], fill=(190, 195, 200, 255))
d.rounded_rectangle([u(1), u(22), u(24), u(58)], radius=u(8), fill=(30, 32, 35, 255))
k.save(os.path.join(out, 'chave.png'))
layers['key'] = {'file': 'chave.png', 'w': k.width, 'h': k.height, 'pivot': [u(12.5), u(10)]}

# botão giratório 40x40 unidades (o código escala), marcador para cima
kn = Image.new('RGBA', (u(40), u(40)), (0, 0, 0, 0))
d = ImageDraw.Draw(kn)
d.ellipse([0, 0, u(40), u(40)], fill=(40, 43, 47, 255))
d.rectangle([u(18.5), u(3), u(21.5), u(16)], fill=(235, 238, 240, 255))
kn.save(os.path.join(out, 'botao-giratorio.png'))
layers['knob'] = {'file': 'botao-giratorio.png', 'w': kn.width, 'h': kn.height}

# manopla 40x32 unidades
g = Image.new('RGBA', (u(40), u(32)), (0, 0, 0, 0))
d = ImageDraw.Draw(g)
d.ellipse([0, 0, u(40), u(32)], fill=(55, 58, 62, 255))
g.save(os.path.join(out, 'manopla.png'))
layers['gearKnob'] = {'file': 'manopla.png', 'w': g.width, 'h': g.height}

# pisca-alerta 32x32, freio de mão 60x90, pedais 80x40
for name, key, size, col in [('pisca-alerta-desligado.png', 'hazardOff', (32, 32), (60, 30, 28, 255)),
                             ('pisca-alerta-ligado.png', 'hazardOn', (32, 32), (255, 90, 76, 255)),
                             ('freio-de-mao-baixo.png', 'handbrakeDown', (60, 90), (50, 52, 56, 255)),
                             ('freio-de-mao-puxado.png', 'handbrakeUp', (60, 90), (80, 84, 90, 255)),
                             ('pedal-embreagem.png', 'pedalClutch', (80, 40), (60, 64, 68, 255)),
                             ('pedal-freio.png', 'pedalBrake', (80, 40), (60, 64, 68, 255)),
                             ('pedal-acelerador.png', 'pedalGas', (60, 70), (60, 64, 68, 255))]:
    im = Image.new('RGBA', (u(size[0]), u(size[1])), (0, 0, 0, 0))
    ImageDraw.Draw(im).rounded_rectangle([0, 0, im.width - 1, im.height - 1], radius=u(4), fill=col)
    im.save(os.path.join(out, name))
    layers[key] = {'file': name, 'w': im.width, 'h': im.height}

json.dump({'version': 1, 'scale': S, 'layers': layers}, open(os.path.join(out, 'manifest.json'), 'w'), indent=2)
print('ok', len(layers), 'camadas em', out)
