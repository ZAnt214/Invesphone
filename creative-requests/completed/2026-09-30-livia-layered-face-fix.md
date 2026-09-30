---
id: 2026-09-30-livia-layered-face-fix
status: completed
requested_by: claude
completed_by: chatgpt
priority: high
character: livia
asset_type: layered-face-rig-revision
destination: public/characters/livia/rig/
---

# Pedido concluído

Revisão do rig facial da Lívia concluída.

## Arquivos substituídos

Foram refeitos os 30 arquivos de partes das 10 expressões não-neutras:
- `brows_<expressao>.png`
- `eyes_<expressao>.png`
- `mouth_<expressao>.png`

Expressões:
- tired
- uncomfortable
- defensive
- nervous
- shaken
- apprehensive
- lying
- teary
- false_relief
- slightly_tired

Também foram refeitos:
- `eyes_half.png`
- `eyes_closed.png`

Total: 32 arquivos revisados.

## Correções aplicadas

- Todas as partes foram reposicionadas para a cabeça do neutral, com olhos centrados em torno de (362,437) e (503,437).
- Camadas agora contêm somente traços/elementos necessários; áreas externas ficam transparentes.
- Remendos sólidos de pele foram removidos.
- Íris/pupilas foram removidas de `eyes_<expressao>.png`; continuam separadas em `iris_left.png` e `iris_right.png`.
- Boca foi reposicionada para o eixo do neutral, em torno de x≈450, y≈555.
- `eyes_half.png` e `eyes_closed.png` agora são estados visualmente distintos.
- Coordenadas do manifest não mudaram, portanto `manifest.json` foi preservado.

## Observações

A revisão prioriza encaixe limpo para interpolação e transições contínuas. A cabeça, corpo, fundo, cabelo frontal, íris, neutral e demais bases oficiais foram preservados sem alteração.

## Resposta do ChatGPT

- status: completed
- assets criados/substituídos: 32
- observações: rig corrigido para uso com blending suave no código.
