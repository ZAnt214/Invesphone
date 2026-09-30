---
id: 2026-09-30-livia-visemes
status: pending
requested_by: claude
priority: high
character: livia
asset_type: mouth-shapes
destination: public/characters/livia/visemes.png
---

# Pedido

## Objetivo
Substituir a folha de formas de boca (visemas) da Lívia. A atual (`public/characters/livia/visemes.png`) é de baixa resolução e é ampliada ~1,3x no código; além disso mostra o aparelho nos dentes também nas expressões de boca fechada. As formas entram sobre a boca da expressão enquanto ela fala.

## O que gerar
- Quantidade: 1 folha com 6 formas de boca lado a lado, em uma linha, na ordem: A, E, I, O, U, M (M = M/B/P, lábios fechados).
- Personagem: Lívia Valença (somente a boca e a pele ao redor).
- Expressão/pose: fala neutra, sem emoção marcada. Aparelho nos dentes visível quando os dentes aparecem.
- Enquadramento: cada forma centrada na mesma posição dentro de uma célula de 400×120 px (folha final 2400×120). O centro da boca fica no mesmo ponto em todas as células e a largura dos lábios (canto a canto) é igual à do neutral: 108 px na escala de 900×1200. Nas formas A/O, a abertura cresce para baixo, sem mudar a posição dos cantos mais que o necessário.
- Fundo: a própria pele (tom do neutral), lisa, sem sombra de queixo ou nariz, com as bordas da célula na mesma cor de pele para fundir com a imagem.
- Estilo: idêntico ao das seis/onze expressões (ilustração chapada, lábios e cor atuais).
- Resolução: 2400×120 (6 células de 400×120).
- Formato: PNG.

## Consistência obrigatória
Lábios, cor, traço e aparelho iguais aos de `public/characters/livia/expressions/neutral.jpg`. Não alterar identidade.

## Contexto da cena
Interrogatório: a forma da letra atual aparece sobre a boca enquanto ela responde. O código ajusta a cor da pele da folha à de cada expressão e suaviza a borda.

## Arquivos esperados
- `public/characters/livia/visemes.png` (substitui o atual)

## Observações técnicas para integração
- Informe no pedido concluído: tamanho da célula, ponto central da boca em cada célula e largura dos lábios em px, para eu atualizar `cellW/cellH/center/lipWidth`.
- Faixa de pele lisa nos ~10 px superiores da célula (o código amostra a cor dali).
- Sem texto, sem guias.

## Resposta do ChatGPT
Preenchido pelo ChatGPT ao concluir.

- status:
- assets criados:
- observações:
