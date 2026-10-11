---
id: 2026-10-11-rua-us-06-mobiliario
status: completed
requested_by: claude
priority: high
character: ""
asset_type: props pixel art
destination: public/base/rua/props/
---

# Pedido 06 — Mobiliário urbano americano (lixeiras, caixa de correio, hidrante, postes, placas…)

## Objetivo
Todas as peças soltas da calçada, cada uma separada para as pessoas passarem na frente e atrás dela.

## O que gerar
Cada peça com o **pé no centro da última linha**, vista igual à referência (frente com o topo um pouco visível):
| Arquivo | Tamanho | O quê |
|---|---|---|
| `lixeira.png` | 16×24 | lixeira de metal preta com tampa |
| `lixeira-cheia.png` | 18×26 | lixeira transbordando de lixo |
| `sacos-lixo.png` | 30×18 | pilha de sacos pretos |
| `cacamba.png` | 46×32 | caçamba verde de beco, tampa fechada |
| `caixa-papelao.png` | 14×12 | caixa de papelão |
| `pallet.png` | 24×8 | pallet de madeira encostado |
| `caixa-correio.png` | 16×30 | caixa de correio azul americana, **sem logotipo real** |
| `hidrante.png` | 10×18 | hidrante vermelho |
| `parquimetro.png` | 6×30 | parquímetro de cabeça simples |
| `poste-luz.png` | 16×120 | poste de ferro fundido com luminária |
| `placa-proibido.png` | 12×44 | placa "proibido estacionar" (P cortado) no poste |
| `placa-onibus.png` | 12×46 | placa de ponto de ônibus (ícone de ônibus, sem empresa) |
| `telefone-publico.png` | 22×46 | telefone público americano com cabine meia-concha |
| `jornal-azul.png` | 14×24 | caixa de jornal azul |
| `jornal-vermelho.png` | 14×24 | caixa de jornal vermelha |
| `alarme-incendio.png` | 8×38 | caixa vermelha de alarme de incêndio no poste |
| `banco.png` | 40×16 | banco de madeira com pés de ferro |
| `semaforo.png` | folha 54×96 (3 quadros de 18×96) | semáforo da esquina: verde, amarelo, vermelho aceso |
| `placa-n-9th-st.png` | 44×8 | placa verde de nome de rua: **N 9TH ST** |
| `placa-w-oak-st.png` | 44×8 | placa verde de nome de rua: **W OAK ST** |

- Fundo: transparente. Estilo: pixel art fiel à referência. Formato: PNG RGBA, alfa binário.

## Consistência obrigatória
- Referência: `creative-requests/refs/2026-10-11-rua-americana-dhpp/referencia-aprovada.png` (caixa de correio, lixeiras, parquímetros, hidrante, placa).
- Escala: pessoa de 38 px (`docs/RUA_AMERICANA_ESPEC.md`); as peças devem ter o tamanho certo ao lado dela.
- Nenhuma marca ou logotipo real.

## Contexto da cena
Ficam na beira da calçada (parquímetros, postes, hidrante, placas, lixeiras) ou encostadas nas fachadas/becos (sacos, caixas, caçamba, telefone).

## Arquivos esperados
Todos em `public/base/rua/props/` com os nomes da tabela.

## Observações técnicas para integração
Sem sombra no chão (o jogo desenha). Tamanho exato.

## Resposta do ChatGPT

- status: completed em 11/10/2026.
- assets criados: 20 PNGs oficiais, nos caminhos abaixo.
- observações: arquivos na escala e na grade de `src/base/ruaAssets.js`, com transparência e recortes conferidos. O carregador existente os consome automaticamente.
- validação: dimensões e células conferidas; carregamento dos 91 PNGs e entrada no DHPP passaram em cinco tamanhos de tela; `npm run build` passou. Teste de renderização em Canvas nativo, sem afirmar teste em Safari real.
- detalhes e procedência: `docs/RUA_AMERICANA_ASSETS_ENTREGUES.md`.

- `public/base/rua/props/alarme-incendio.png`
- `public/base/rua/props/banco.png`
- `public/base/rua/props/cacamba.png`
- `public/base/rua/props/caixa-correio.png`
- `public/base/rua/props/caixa-papelao.png`
- `public/base/rua/props/hidrante.png`
- `public/base/rua/props/jornal-azul.png`
- `public/base/rua/props/jornal-vermelho.png`
- `public/base/rua/props/lixeira-cheia.png`
- `public/base/rua/props/lixeira.png`
- `public/base/rua/props/pallet.png`
- `public/base/rua/props/parquimetro.png`
- `public/base/rua/props/placa-n-9th-st.png`
- `public/base/rua/props/placa-onibus.png`
- `public/base/rua/props/placa-proibido.png`
- `public/base/rua/props/placa-w-oak-st.png`
- `public/base/rua/props/poste-luz.png`
- `public/base/rua/props/sacos-lixo.png`
- `public/base/rua/props/semaforo.png`
- `public/base/rua/props/telefone-publico.png`
