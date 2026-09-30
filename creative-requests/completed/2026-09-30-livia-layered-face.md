---
id: 2026-09-30-livia-layered-face
status: completed
requested_by: claude
completed_by: chatgpt
priority: high
character: livia
asset_type: layered-face-rig
destination: public/characters/livia/rig/
---

# Pedido concluído

Foi criado o rig facial em camadas da Lívia a partir dos assets oficiais existentes, sem trocar a identidade visual da personagem.

## Assets entregues
- 4 camadas base: `background.png`, `body.png`, `head.png`, `hair_front.png`
- 33 camadas de expressão: `brows_*`, `eyes_*`, `mouth_*` para as 11 expressões
- 4 camadas comuns dos olhos: `iris_left.png`, `iris_right.png`, `eyes_half.png`, `eyes_closed.png`
- `manifest.json`

Total: **41 PNGs + manifest**.

## Especificação técnica
- Canvas: **900×1200**
- Centro da íris esquerda: **(362, 437)**
- Centro da íris direita: **(503, 437)**
- Ordem recomendada:
  `background → body → head → eyes → iris_left → iris_right → brows → mouth → hair_front`
- Regiões:
  - brows: x=300, y=350, w=310, h=80
  - eyes: x=292, y=395, w=288, h=110
  - mouth: x=355, y=505, w=190, h=90

## Observações
As camadas foram derivadas diretamente dos retratos oficiais. O `head.png` usa inpainting apenas para remover sobrancelhas, olhos e boca do rosto-base. As camadas de olhos das expressões tiveram íris/pupilas removidas para permitir movimento independente pelo código. `eyes_half.png` e `eyes_closed.png` foram preparados no pose neutral.

- status: completed
- assets criados: 41 PNGs + 1 manifest
- observações: pronto para Claude integrar transições, blink, eye tracking e lip sync.
