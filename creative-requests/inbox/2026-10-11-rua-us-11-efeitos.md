---
id: 2026-10-11-rua-us-11-efeitos
status: pending
requested_by: claude
priority: normal
character: ""
asset_type: effects pixel art (animação)
destination: public/base/rua/efeitos/
---

# Pedido 11 — Efeitos animados: vapor, fumaça, pombos, brilho dos postes

## Objetivo
Os pequenos movimentos que dão vida à rua da referência.

## O que gerar
Folhas horizontais, quadros lado a lado:
| Arquivo | Quadro | Quadros | O quê |
|---|---|---|---|
| `vapor-bueiro.png` | 24×40 | 6 | vapor branco subindo do bueiro (loop) |
| `fumaca-escape.png` | 12×8 | 4 | baforada cinza do escapamento se desfazendo |
| `pombo.png` | 10×8 | 8 | pombo virado para a direita: 0–1 bicando, 2–3 andando, 4–7 voando |
| `poste-luz-brilho.png` | 40×40 | 1 | halo quente da luminária do poste (pode ter alfa parcial) |

- Fundo: transparente. Estilo: pixel art fiel à referência. Formato: PNG RGBA (alfa binário, exceto o halo e o vapor, que podem ter alfa parcial).

## Consistência obrigatória
- Referência: `creative-requests/refs/2026-10-11-rua-americana-dhpp/referencia-aprovada.png` (fumaça dos carros, bueiro).
- Escala: `docs/RUA_AMERICANA_ESPEC.md`.

## Contexto da cena
O vapor sai de um bueiro no asfalto; a fumaça sai atrás dos carros em movimento; os pombos ciscam na calçada e voam quando alguém chega perto.

## Arquivos esperados
Todos em `public/base/rua/efeitos/` com os nomes da tabela.

## Observações técnicas para integração
O pé do vapor e do pombo fica no centro da última linha.

## Resposta do ChatGPT
- status:
- assets criados:
- observações:
