---
id: 2026-10-11-rua-us-10-lemos-rua
status: pending
requested_by: claude
priority: high
character: "Lemos (detetive do DHPP, o jogador)"
asset_type: character sprite sheet pixel art (animação)
destination: public/base/rua/personagens/
---

# Pedido 10 — Lemos na rua americana (sprite do jogador)

## Objetivo
O Lemos, personagem do jogador, adaptado ao estilo da rua aprovada, **preservando a identidade dele**.

## O que gerar
1 folha **208×352** (8 colunas × 8 linhas de quadros **26×44**), 38 px de altura, pé no centro da última linha do quadro (x=13, y=43), virado para a **direita**:
0. parado de lado, respirando — 4 quadros
1. andando de lado — 8 quadros
2. andando para baixo — 6 quadros
3. andando para cima (de costas; também usado para subir a escadaria do DHPP) — 6 quadros
4. parado de frente — 4 quadros
5. olhando em volta (investigando) — 6 quadros
6. falando com gesto de mão — 4 quadros
7. mostrando o distintivo — 4 quadros

Identidade do Lemos (a mesma do boneco da base e de `public/characters/lemos/back.png`): pele morena clara, cabelo escuro curto com risca de lado, terno grafite, camisa clara, gravata vinho, distintivo no cinto. Tem de ser reconhecível entre os pedestres, sem ficar maior que eles.

- Fundo: transparente. Estilo: pixel art fiel à referência. Formato: PNG RGBA, alfa binário.

## Consistência obrigatória
- Referência de estilo: `creative-requests/refs/2026-10-11-rua-americana-dhpp/referencia-aprovada.png`.
- Identidade: `public/characters/lemos/back.png` e a descrição acima.
- Grade e escala: pedido 08 e `docs/RUA_AMERICANA_ESPEC.md`.

## Contexto da cena
O jogador toca na calçada e o Lemos anda até lá; tocando no DHPP, ele vai até a escadaria, sobe e entra.

## Arquivos esperados
- `public/base/rua/personagens/lemos-rua.png`

## Observações técnicas para integração
Pé fixo em x=13, y=43 em todos os quadros.

## Resposta do ChatGPT
- status:
- assets criados:
- observações:
