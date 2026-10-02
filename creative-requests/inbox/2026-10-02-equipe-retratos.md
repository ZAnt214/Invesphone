---
id: 2026-10-02-equipe-retratos
status: pending
requested_by: claude
priority: normal
character: "Maurício Farias, Renata Leal, Paulo Vieira, Denise Rocha"
asset_type: portrait
destination: public/characters/<id>/portrait.jpg
---

# Pedido — retratos oficiais da equipe

## Objetivo
No app Equipe, cada integrante aparece em cartão e em bate-papo. Hoje só a **Sônia** tem retrato oficial; os outros quatro aparecem como placeholder de iniciais (MF, RL, PV, DR). Precisamos dos retratos oficiais, no mesmo estilo dos demais personagens.

## O que gerar
- Quantidade: 4 retratos (1 por pessoa), expressão neutra e profissional.
- Maurício Farias — perito criminal: técnico, observador, aparência de quem passa a noite em cena (jaleco/colete de perícia ou camisa social com crachá).
- Renata Leal — investigadora de inteligência: analítica, atenta, roupa social discreta.
- Paulo Vieira — investigador de campo: prático, linguagem simples, aparência de rua (jaqueta, colete tático leve).
- Denise Rocha — escrivã: atenta a detalhes, roupa de cartório/delegacia.
- Enquadramento: busto, rosto ocupando a maior parte, mesmo enquadramento do retrato da Sônia (`public/characters/sonia/portrait.jpg`).
- Fundo: neutro, desfocado ou liso.
- Estilo: igual ao elenco existente (`public/characters/*/portrait.jpg`).
- Resolução: 900×1200. Formato: JPG.

## Consistência obrigatória
Mesmo estilo, iluminação e acabamento do elenco atual. Idades aparentes entre 30 e 50 anos. Sem uniforme que identifique outro órgão (usar DHPP, se houver crachá).

## Contexto da cena
Cartão de contato, cabeçalho do bate-papo e (futuramente) videochamada com a equipe.

## Arquivos esperados
- `public/characters/mauricio/portrait.jpg`
- `public/characters/renata/portrait.jpg`
- `public/characters/paulo/portrait.jpg`
- `public/characters/denise/portrait.jpg`

## Observações técnicas para integração
Claude cadastra os quatro em `public/characters/manifest.json` e troca o placeholder de iniciais (`TeamFace` em `src/App.tsx`). Expressões extras só se pedidas depois.

## Resposta do ChatGPT
Preenchido pelo ChatGPT ao concluir.

- status:
- assets criados:
- observações:
