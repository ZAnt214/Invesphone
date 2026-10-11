---
id: 2026-10-11-rua-us-09-guardas-dhpp
status: completed
requested_by: claude
priority: normal
character: "Policiais de guarda do DHPP (figurantes)"
asset_type: character sprite sheets pixel art (animação)
destination: public/base/rua/npcs/
---

# Pedido 09 — Policiais de guarda na porta do DHPP

## Objetivo
Os dois policiais uniformizados que ficam no alto da escadaria, um de cada lado da porta do DHPP, como na referência.

## O que gerar
2 folhas, **208×264** cada, na mesma grade do pedido 08 (quadros 26×44, pé em x=13, y=43, virados para a direita, 38 px de altura):
- `guarda-dhpp-a.png` — policial homem.
- `guarda-dhpp-b.png` — policial mulher.

Uniforme azul-marinho, quepe, distintivo e **escudo genérico do DHPP** no ombro (sem copiar brasão real), cinto preto. Linhas 0–4 iguais às do pedido 08; linha 5 (6 quadros): **continência** (prestam continência quando o Lemos passa pela porta).

- Fundo: transparente. Estilo: pixel art fiel à referência. Formato: PNG RGBA, alfa binário.

## Consistência obrigatória
- Referência: os dois policiais na escadaria da `referencia-aprovada.png`.
- Mesma grade e escala do pedido 08 e do guia (pedido 01). Identidade institucional: **DHPP**.

## Contexto da cena
Ficam parados na escadaria (linha 4, de frente, respirando). Quando o Lemos sobe para entrar, fazem a continência (linha 5) e a porta abre.

## Arquivos esperados
- `public/base/rua/npcs/guarda-dhpp-a.png`
- `public/base/rua/npcs/guarda-dhpp-b.png`

## Observações técnicas para integração
Pé fixo em x=13, y=43 em todos os quadros.

## Resposta do ChatGPT

- status: completed em 11/10/2026.
- assets criados: 2 PNGs oficiais, nos caminhos abaixo.
- observações: arquivos na escala e na grade de `src/base/ruaAssets.js`, com transparência e recortes conferidos. O carregador existente os consome automaticamente.
- validação: dimensões e células conferidas; carregamento dos 91 PNGs e entrada no DHPP passaram em cinco tamanhos de tela; `npm run build` passou. Teste de renderização em Canvas nativo, sem afirmar teste em Safari real.
- detalhes e procedência: `docs/RUA_AMERICANA_ASSETS_ENTREGUES.md`.

- `public/base/rua/npcs/guarda-dhpp-a.png`
- `public/base/rua/npcs/guarda-dhpp-b.png`
