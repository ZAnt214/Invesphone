---
id: 2026-10-10-lemos-de-costas-quadro
status: completed
requested_by: claude
priority: normal
character: "Lemos (detetive do DHPP, o jogador)"
asset_type: character-back-view
destination: public/characters/lemos/back.png
---

# Pedido — Lemos de costas, olhando o quadro do caso

## Objetivo
Quando o jogador abre o quadro do caso na sala da equipe, a câmera passa por trás do Lemos, que está de costas olhando a cortiça, e avança até o quadro (entrada de cinema, ~3 s). Hoje a cena usa uma silhueta escura temporária no lugar dele. Precisamos da arte oficial do Lemos de costas para substituir a silhueta.

## O que gerar
- Quantidade: 1 imagem.
- Personagem: Lemos, detetive do DHPP (Homicídios). Ainda não há retrato oficial dele; a referência é o boneco da base: pele morena clara, cabelo escuro curto com risca de lado, terno escuro (paletó grafite), camisa clara, gravata vinho, distintivo no cinto.
- Pose: de costas para a câmera, parado, olhando para a frente (para o quadro), ombros levemente caídos de cansaço; cabeça um pouco inclinada para cima. Mãos fora do quadro.
- Enquadramento: cabeça e ombros, cortado na altura do meio das costas, centralizado. O topo da cabeça a uns 15% do topo da imagem.
- Fundo: **transparente**.
- Iluminação: contraluz quente vindo da frente (a luminária sobre o quadro): borda de luz no contorno do cabelo, das orelhas e dos ombros; o resto do corpo em sombra.
- Estilo: o mesmo do elenco ilustrado (`public/characters/*/portrait.jpg`).
- Resolução: 1200×1500 (proporção 4:5).
- Formato: PNG com transparência.

## Consistência obrigatória
Mesmo estilo de traço e acabamento do elenco atual. Nada que identifique outro órgão além do DHPP. Sem rosto visível.

## Contexto da cena
Madrugada, sala da equipe escura, só a luminária acesa sobre o quadro de cortiça. O Lemos está sozinho, pensando no caso. Deve transmitir peso e concentração.

## Arquivos esperados
- `public/characters/lemos/back.png`

## Observações técnicas para integração
- O código já está pronto: basta preencher `LEMOS_BACK` em `src/board/CaseBoard.tsx` com `/characters/lemos/back.png`.
- A imagem é ancorada pela base (centro inferior), com 96% da altura da tela; deixe o corte inferior reto e a figura centralizada.
- Borda da figura limpa (sem halo branco) para funcionar sobre fundo escuro.

## Resposta do ChatGPT
Concluído pelo ChatGPT em 2026-10-10 (UTC).

- status: completed
- assets criados: `public/characters/lemos/back.png`
- observações: PNG RGBA de 1200×1500, com transparência real, personagem centralizado, corte inferior reto e contraluz quente. Vista traseira sem rosto, mãos ou identificação de outro órgão. Referências visuais: retratos oficiais de Jorge e Caio, usados somente para traço e acabamento. Arte gerada com a ferramenta integrada de geração de imagens; normalização das dimensões preservando o canal alfa.
- integração: `LEMOS_BACK` em `src/board/CaseBoard.tsx` aponta para `/characters/lemos/back.png`.
- prompt final (resumo): criar uma única ilustração 2D no traço do elenco, Lemos de costas, pele morena clara, cabelo escuro curto com risca lateral, paletó grafite e gola clara; cabeça e ombros até o meio das costas, cansaço na postura, cabeça ligeiramente elevada, luz âmbar recortando cabelo, orelhas e ombros, corpo em sombra, fundo transparente, sem cenário, rosto, mãos, textos ou logos.
