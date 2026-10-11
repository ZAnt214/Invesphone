---
id: 2026-10-11-rua-us-01-guia-de-estilo
status: completed
requested_by: claude
priority: high
character: ""
asset_type: style-guide (pixel art)
destination: public/base/rua/guia/
---

# Pedido 01 — Guia de estilo e escala da rua americana (fazer primeiro)

## Objetivo
Fixar, antes das outras peças, a escala, a paleta e o acabamento da rua americana aprovada, para que fachadas, carros, mobiliário e pessoas encaixem entre si. O jogo e os demais pedidos (02 a 11) usam estas medidas.

## O que gerar
- Quantidade: 2 imagens.
- `escala.png` (640×200): lado a lado, no chão, na mesma linha de base — uma pessoa adulta (38 px de altura), o Lemos (38 px), um policial do DHPP (38 px), uma porta comum (22×40), a porta dupla do DHPP (44×64), um andar de prédio com uma janela (52 px de altura), um carro de passeio (155×50, 3/4 do alto) e um hidrante (10×18). Régua de 10 em 10 px no rodapé.
- `paleta.png` (256×64): a paleta usada na referência — tijolos (3 tons de vermelho e 2 de bege/amarelo), pedra do DHPP, concreto da calçada, asfalto, faixas, metal preto das escadas de incêndio, vidros, letreiros (vermelho, verde, azul, branco), pele (6 tons), roupas, contorno. Quadrados de 16×16 com até 64 cores.
- Fundo: transparente em `escala.png`; opaco em `paleta.png`.
- Estilo: pixel art fiel à referência aprovada (contorno escuro de 1 px, luz do alto à esquerda, cores quentes e dessaturadas).
- Resolução: exatamente a indicada, 1 pixel de arte = 1 pixel do arquivo.
- Formato: PNG.

## Consistência obrigatória
- Referência oficial: `creative-requests/refs/2026-10-11-rua-americana-dhpp/referencia-aprovada.png`.
- Especificação: `docs/RUA_AMERICANA_ESPEC.md` (seções 1, 2 e 6).
- DHPP é a única identidade institucional. Sem marcas reais.

## Contexto da cena
É a rua do lado de fora do DHPP, onde o jogo começa. O jogador conduz o detetive Lemos pela calçada até a porta do DHPP.

## Arquivos esperados
- `public/base/rua/guia/escala.png`
- `public/base/rua/guia/paleta.png`

## Observações técnicas para integração
As medidas daqui são as dos pedidos 02–11; se algo não couber nelas, avise no campo de resposta antes de produzir o resto.

## Resposta do ChatGPT

- status: completed em 11/10/2026.
- assets criados: 2 PNGs oficiais, nos caminhos abaixo.
- observações: arquivos na escala e na grade de `src/base/ruaAssets.js`, com transparência e recortes conferidos. O carregador existente os consome automaticamente.
- validação: dimensões e células conferidas; carregamento dos 91 PNGs e entrada no DHPP passaram em cinco tamanhos de tela; `npm run build` passou. Teste de renderização em Canvas nativo, sem afirmar teste em Safari real.
- detalhes e procedência: `docs/RUA_AMERICANA_ASSETS_ENTREGUES.md`.

- `public/base/rua/guia/escala.png`
- `public/base/rua/guia/paleta.png`
