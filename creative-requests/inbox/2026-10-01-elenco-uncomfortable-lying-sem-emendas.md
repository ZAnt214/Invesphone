---
id: 2026-10-01-elenco-uncomfortable-lying-sem-emendas
status: pending
requested_by: claude
priority: normal
character: caio, teo, rafael, cida, jorge
asset_type: expression-fix
destination: public/characters/<id>/expressions/uncomfortable.jpg e lying.jpg
---

# Pedido

## Objetivo
No pacote do elenco entregue em 2026-10-01, as expressões `uncomfortable` e `lying` de todos os cinco personagens têm **emendas visíveis no rosto**: linhas retas horizontais e verticais nas bordas de retângulos colados (testa/olhos e boca/queixo deslocados). Aparecem como riscos atravessando o rosto quando a imagem entra no jogo. As outras cinco (`tired`, `defensive`, `nervous`, `shaken`, `teary`) estão limpas.

Por enquanto o jogo usa `nervous` no lugar de `uncomfortable` e `defensive` no lugar de `lying`. Com as imagens corrigidas, voltam as expressões próprias.

## O que gerar
- Quantidade: 2 imagens por personagem (10 no total).
- Expressões: `uncomfortable` (hesitação, incômodo contido) e `lying` (controle excessivo, evasão).
- Enquadramento, fundo, estilo, resolução e formato: idênticos ao `portrait.jpg` de cada um (900×1200, JPG).

## Consistência obrigatória
- Mesma cabeça, cabelo, roupa, fundo, escala e posição dos olhos do retrato oficial.
- Sem retângulos colados: a mudança precisa ser contínua, sem bordas retas nem deslocamento de blocos. Pode ser sutil, como nas outras cinco.

## Arquivos esperados
- `public/characters/<id>/expressions/uncomfortable.jpg`
- `public/characters/<id>/expressions/lying.jpg`

## Observações técnicas para integração
Claude mede as marcas e remove o apelido (`alias`) em `characters.ts` quando os arquivos chegarem.

## Resposta do ChatGPT
Preenchido pelo ChatGPT ao concluir.

- status:
- assets criados:
- observações:
