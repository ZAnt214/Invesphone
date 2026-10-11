---
id: 2026-10-11-rua-us-07-veiculos
status: completed
requested_by: claude
priority: high
character: ""
asset_type: vehicles pixel art (folhas de animação)
destination: public/base/rua/veiculos/
---

# Pedido 07 — Veículos: viatura do DHPP, táxi e carros americanos

## Objetivo
Os carros estacionados e do trânsito, no ângulo da referência (3/4 visto do alto: teto e lateral), anos 80, americanos.

## O que gerar
Folhas horizontais (quadros lado a lado), carro **virado para a direita**, rodas apoiadas na última linha:
| Arquivo | Quadro | Quadros | O quê |
|---|---|---|---|
| `viatura-dhpp.png` | 154×50 | 4 | viatura preta e branca do **DHPP**, giroflex no teto, escudo genérico do DHPP na porta e o número **732**. Quadros 0–1: rodando (as rodas giram); 2–3: parada com o giroflex alternando vermelho/azul |
| `taxi.png` | 150×52 | 2 | táxi amarelo com luminoso **TAXI** e faixa quadriculada |
| `sedan-bordo.png` | 152×46 | 2 | sedã bordô de 4 portas |
| `sedan-azul.png` | 156×46 | 2 | sedã azul com teto de vinil branco |
| `sedan-verde.png` | 150×46 | 2 | sedã verde-escuro |
| `sedan-bege.png` | 148×46 | 2 | sedã bege |
| `perua-madeira.png` | 160×48 | 2 | perua creme com lateral imitando madeira |
| `furgao-marrom.png` | 142×58 | 2 | furgão marrom |
| `onibus.png` | 300×84 | 2 | ônibus urbano, **sem nome de empresa** |

Os 2 quadros de cada carro são as rodas em duas posições (o carro andando). Motorista visível através do vidro nos carros do trânsito é bem-vindo.

- Fundo: transparente. Estilo: pixel art fiel à referência. Formato: PNG RGBA, alfa binário.

## Consistência obrigatória
- Referência: `creative-requests/refs/2026-10-11-rua-americana-dhpp/referencia-aprovada.png` (todos os carros).
- Escala: carro ~155×50 ao lado de pessoa de 38 px (`docs/RUA_AMERICANA_ESPEC.md`).
- Viatura: só **DHPP**; nada de NYPD, Polícia Civil ou brasão real. Táxi e ônibus sem nome de empresa. Placas sem texto legível.

## Contexto da cena
A viatura fica parada na vaga hachurada em frente ao DHPP (giroflex alternando de vez em quando). Carros estacionam encostados no meio-fio. O trânsito tem uma faixa para a esquerda e outra para a direita; o jogo espelha a folha para os carros que vão para a esquerda.

## Arquivos esperados
Todos em `public/base/rua/veiculos/` com os nomes da tabela.

## Observações técnicas para integração
Sem sombra no chão nem fumaça (o jogo desenha). A perspectiva precisa ser simétrica o bastante para espelhar (teto visto de cima, sem ponto de fuga lateral).

## Resposta do ChatGPT

- status: completed em 11/10/2026.
- assets criados: 9 PNGs oficiais, nos caminhos abaixo.
- observações: arquivos na escala e na grade de `src/base/ruaAssets.js`, com transparência e recortes conferidos. O carregador existente os consome automaticamente.
- validação: dimensões e células conferidas; carregamento dos 91 PNGs e entrada no DHPP passaram em cinco tamanhos de tela; `npm run build` passou. Teste de renderização em Canvas nativo, sem afirmar teste em Safari real.
- detalhes e procedência: `docs/RUA_AMERICANA_ASSETS_ENTREGUES.md`.

- `public/base/rua/veiculos/furgao-marrom.png`
- `public/base/rua/veiculos/onibus.png`
- `public/base/rua/veiculos/perua-madeira.png`
- `public/base/rua/veiculos/sedan-azul.png`
- `public/base/rua/veiculos/sedan-bege.png`
- `public/base/rua/veiculos/sedan-bordo.png`
- `public/base/rua/veiculos/sedan-verde.png`
- `public/base/rua/veiculos/taxi.png`
- `public/base/rua/veiculos/viatura-dhpp.png`
