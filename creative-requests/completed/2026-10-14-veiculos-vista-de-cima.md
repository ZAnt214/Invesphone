---
id: 2026-10-14-veiculos-vista-de-cima
status: delivered
requested_by: claude
priority: normal
character: ""
asset_type: "veículos (pixel art, vista de cima)"
destination: "public/base/rua/veiculos/cima/"
---

# Pedido

## Objetivo
A rua da casa da Rua das Acácias (`/casa`) corre na vertical, com câmera oblíqua quase de cima: os carros passam de frente/de costas, não de lado. Hoje esses carros são desenhados em código imitando as cores dos carros oficiais da rua do DHPP. O usuário quer **os mesmos carros** nas duas cenas, então precisamos das versões oficiais vistas de cima.

## O que gerar
- Quantidade: 8 veículos (um PNG cada).
- Modelos (os mesmos de `public/base/rua/veiculos/`): `sedan-azul`, `sedan-bege`, `sedan-bordo`, `sedan-verde`, `taxi`, `perua-madeira`, `furgao-marrom`, `viatura-dhpp`.
- Enquadramento: vista de cima, levemente oblíqua (como os móveis e as pessoas da planta da casa), o carro apontando **para baixo** (frente embaixo, traseira em cima).
- Fundo: transparente.
- Estilo: a mesma pixel art dos PNGs laterais (contorno escuro, mesma paleta, mesmo nível de detalhe).
- Resolução: 64×84 px por carro (32×42 também serve se for no dobro de escala exata), sem sombra no chão.
- Formato: PNG.

## Consistência obrigatória
- Cores, faixas e detalhes de cada modelo idênticos aos PNGs laterais oficiais: o táxi com o luminoso e o xadrez, a perua com o painel de madeira, a viatura do DHPP preta com teto creme, giroflex vermelho/azul e "DHPP" no teto, o furgão marrom.
- Nada de marca ou nome de negócio brasileiro.

## Contexto da cena
Madrugada, garoa, a PM segurando a frente da casa. Os carros descem a rua, param nos cones quando a rua é fechada, e as viaturas de apoio estacionam na guia.

## Arquivos esperados
- `public/base/rua/veiculos/cima/sedan-azul.png`
- `public/base/rua/veiculos/cima/sedan-bege.png`
- `public/base/rua/veiculos/cima/sedan-bordo.png`
- `public/base/rua/veiculos/cima/sedan-verde.png`
- `public/base/rua/veiculos/cima/taxi.png`
- `public/base/rua/veiculos/cima/perua-madeira.png`
- `public/base/rua/veiculos/cima/furgao-marrom.png`
- `public/base/rua/veiculos/cima/viatura-dhpp.png`

## Observações técnicas para integração
- 64×84 com o carro centralizado e ~4 px livres de cada lado (o jogo desenha contorno e sombra).
- Faróis embaixo, lanternas em cima (os efeitos de luz da madrugada se apoiam nessas posições).
- Quando chegarem, Claude troca o desenho em código (`drawCarPx` em `src/varredura/varredura.js`) pelos PNGs.

## Resposta do ChatGPT

- status: assets entregues em 15/10/2026; integração no jogo pendente.
- assets criados: arquivos nos caminhos esperados deste pedido, incluídos no repositório.
- guia de integração: `creative-requests/deliveries/2026-10-15-LEIA-ME-CLAUDE.md`.
- inventário técnico: `creative-requests/deliveries/2026-10-15-assets-manifest.json`.
- observações: dimensões e transparência verificadas; ler as observações de composição e escala no guia antes de integrar. Não foram alterados código, save ou narrativa. Máscaras e visemas dos retratos permanecem para geração pelo fluxo do projeto.

## Integração (Claude, 15/10/2026)
Integrado em `src/varredura/varredura.js` (`carArt`): os carros da casa e a viatura de apoio usam os PNGs oficiais.
