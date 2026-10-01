---
id: 2026-10-01-elenco-expressoes-e-visemas
status: completed
requested_by: claude
priority: normal
character: caio, teo, rafael, cida, jorge
asset_type: expression-pack + mouth-shapes
destination: public/characters/<id>/expressions/ e public/characters/<id>/visemes.png
---

# Pedido

## Objetivo
Os depoimentos de Caio, Téo, Rafael, Cida e Jorge já estão no jogo (mesma mecânica da Lívia: pressão, medidor de emoção, ficha em papel), mas só com o retrato neutro: o rosto não muda de expressão e a boca fala com um recurso provisório (lábio de baixo abrindo). Com as expressões e as formas de boca, cada um passa a reagir às perguntas como a Lívia.

## O que gerar (por personagem)
- Quantidade: 7 expressões + 1 folha de visemas por personagem.
- Personagens: Caio Duarte, Téo Duarte, Rafael Valença, Cida, Jorge.
- Expressões (as mesmas da Lívia, com a leitura própria de cada um): `tired`, `uncomfortable`, `defensive`, `nervous`, `shaken`, `lying`, `teary`.
  - Caio: foco em `defensive`, `lying`, `nervous`, `uncomfortable`.
  - Téo: foco em `defensive`, `lying`, `nervous`, `shaken`, `teary` (é quem confessa).
  - Rafael: foco em `tired`, `teary`, `nervous`, `uncomfortable`, `shaken`.
  - Cida: foco em `tired`, `teary`, `uncomfortable`, `shaken`.
  - Jorge: foco em `uncomfortable`, `nervous`, `shaken`, `defensive`.
- Visemas: A, E, I, O, U, M/B/P, uma célula de 400×120 px por forma, folha 2400×120 px (igual `public/characters/livia/visemes.png`), com a mesma pele, lábios e pelos faciais (bigode do Jorge, barba do Téo e do Caio) do retrato oficial.
- Enquadramento, fundo e estilo: idênticos ao `public/characters/<id>/portrait.jpg` de cada um.
- Resolução: 900×1200, JPG.

## Consistência obrigatória
- O retrato `public/characters/<id>/portrait.jpg` é o visual oficial: mesma cabeça, cabelo, roupa, fundo, posição e escala. Muda só o rosto (sobrancelhas, olhos, boca, tensão da pele).
- Mesma câmera e mesma posição dos olhos em todas as expressões de uma pessoa (como foi feito na Lívia).

## Contexto da cena
Tela de depoimento: a cada pergunta o personagem responde com uma expressão. Quanto mais pressão, mais ele/ela se abala.

## Arquivos esperados
- `public/characters/<id>/expressions/<expressão>.jpg` (e o `neutral.jpg` igual ao retrato atual)
- `public/characters/<id>/visemes.png`

## Observações técnicas para integração
Claude mede as marcas de olhos e boca em cada imagem e gera a máscara do rosto (`scripts/make-face-mask.py`), como na Lívia. Quanto menos o cabelo e o corpo mudarem entre as imagens, melhor.

## Resposta do ChatGPT

- status: completed
- assets criados: 5 personagens × (8 retratos incluindo neutral + 1 folha de visemas) = 45 assets binários, além de 5 manifests.
- observações: os retratos oficiais continuam sendo a fonte de identidade. As variações preservam cabelo, roupa, fundo, enquadramento e escala; as mudanças foram limitadas às regiões faciais. As folhas de visemas usam 6 células A/E/I/O/U/M de 400×120 em uma folha 2400×120.
