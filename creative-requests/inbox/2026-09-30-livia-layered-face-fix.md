---
id: 2026-09-30-livia-layered-face-fix
status: pending
requested_by: claude
priority: high
character: livia
asset_type: layered-face-rig-revision
destination: public/characters/livia/rig/
---

# Pedido

## Objetivo
Revisão do pedido `2026-09-30-livia-layered-face` (concluído em `creative-requests/completed/`). Testei o rig montando as camadas na ordem do `manifest.json` e comparando com as imagens oficiais. A **base e o neutral estão corretos** (diferença média de 2,8/255 contra `neutral.jpg`), mas as **partes das outras 10 expressões não encaixam** na cabeça do neutral e não servem para a troca contínua. Preciso que as partes sejam refeitas conforme abaixo. Nada de `head.png`, `body.png`, `background.png`, `hair_front.png`, `iris_*` ou do neutral precisa mudar (salvo o que está listado).

## O que foi encontrado
Montagem feita com `background → body → head → eyes → iris → brows → mouth → hair_front`:

| Expressão | Diferença média vs. imagem oficial |
|---|---|
| neutral | 2,8 |
| defensive | 10,0 |
| apprehensive | 14,5 |
| lying | 15,6 |

Problemas (valem para as 10 expressões que não são a neutral):
1. **Posição:** as partes ficaram no lugar que tinham na imagem original de cada expressão, **não** na cabeça do neutral. Os olhos do neutral estão em y≈437; em `apprehensive` estão em y≈474, em `lying` em y≈490. Isso deixa olhos, sobrancelhas e boca **35–55 px abaixo** do lugar certo sobre `head.png`, e a pele do `head.png` aparece acima. O pedido dizia para reposicionar os traços para a cabeça do neutral.
2. **Íris não removida:** em `eyes_<expressao>.png` (exceto neutral) a íris e a pupila **continuam dentro do olho**. Com `iris_left/right` por cima, aparecem dois pares de olhos. Além disso, no ponto onde ficava a íris do neutral há uma **mancha cinza/clara** em alguns arquivos.
3. **Manchas e remendos de pele:** `eyes_*` e `brows_*` vieram com fundo de pele oval com borda esfumada (um "recorte em elipse" da imagem original), não só com os traços. O tom de pele desses remendos não é o mesmo de `head.png`, então aparece uma área retangular/oval de outra cor em volta dos olhos e sobrancelhas. Em `brows_*` há também manchas marrons de cabelo e sombras do canto da imagem original.
4. **Halos:** as bordas esfumadas dos remendos dão uma auréola clara/escura.

## O que gerar
Refazer **somente** os arquivos abaixo, nos mesmos nomes e no mesmo canvas 900×1200 PNG com transparência:
- `brows_<expressao>.png` (10 arquivos, todas exceto `neutral`)
- `eyes_<expressao>.png` (10 arquivos, todas exceto `neutral`)
- `mouth_<expressao>.png` (10 arquivos, todas exceto `neutral`; conferir encaixe, veja abaixo)
- `eyes_half.png` e `eyes_closed.png`: hoje são **idênticos** entre si (mesmo tamanho e caixa). `eyes_half` deve ser **meio fechado** e `eyes_closed` **fechado**.

## Consistência obrigatória
Continua valendo o critério do pedido anterior: `head.png + eyes + iris + brows + mouth + hair_front` de uma expressão deve ficar **igual à imagem oficial** dela, **na cabeça do neutral** (mesma posição de olhos, nariz e boca do neutral). Regras específicas:
- **Só os traços, sem pele:** as camadas de cada parte contêm apenas os desenhos (sobrancelha, rugas, pálpebras, cílios, olheiras em sombra semitransparente, esclera, lábios, aparelho). **Nada de remendo de pele.** A pele vem do `head.png`. Fora dos traços, a camada deve ser **100% transparente** (alpha 0), sem borda esfumada.
- **Posição:** cada traço posicionado como ficaria na cabeça do neutral (olhos com centro em torno de y≈437, como no `eyes_neutral.png`; mesma distância entre os olhos do neutral, cerca de 143 px). Se a expressão pede olho mais baixo ou mais aberto, isso entra no **formato** do olho, não no deslocamento da cabeça.
- **Íris:** `eyes_<expressao>.png` com a esclera **inteira e branca** onde a íris ficaria (sem íris, sem pupila, sem brilho, sem mancha). A íris continua sendo `iris_left.png`/`iris_right.png`, centradas em (362,437) e (503,437) como no manifest.
- **Olheiras:** podem ficar dentro de `eyes_*`, como sombra semitransparente (não como pele sólida).
- **Rugas de testa e entre as sobrancelhas:** dentro de `brows_*`, também só o traço semitransparente.
- **Boca:** `mouth_<expressao>.png` só lábios e aparelho, sem pele ao redor, e centrada na boca do `head.png` (em torno de x≈432, y≈560 no neutral). Hoje as bocas das outras expressões também estão 30–55 px abaixo.

## Contexto da cena
Igual ao pedido original. O código mistura as partes de uma expressão para outra sobre a mesma cabeça; por isso o encaixe e a transparência limpa são essenciais (se as partes carregarem pele, a pele de uma expressão aparece por cima da pele da outra).

## Arquivos esperados
- `public/characters/livia/rig/brows_<expressao>.png`, `eyes_<expressao>.png`, `mouth_<expressao>.png` para: tired, uncomfortable, defensive, nervous, shaken, apprehensive, lying, teary, false_relief, slightly_tired
- `public/characters/livia/rig/eyes_half.png`, `public/characters/livia/rig/eyes_closed.png`
- Atualizar `manifest.json` só se mudar alguma coordenada.

## Observações técnicas para integração
- **Como conferir antes de entregar:** monte `background, body, head, eyes, iris_left, iris_right, brows, mouth, hair_front` (nessa ordem) e compare com `public/characters/livia/expressions/<expressao>.jpg`. Só a posição de cabeça/cabelo pode diferir um pouco (as imagens oficiais têm a cabeça em poses levemente diferentes); olhos, sobrancelhas e boca devem ter o mesmo **desenho**.
- Bordas nítidas com anti-aliasing de 1 px, sem halo.
- Prioridade, se precisar entregar em etapas: `eyes_half`, `eyes_closed`, depois `apprehensive, slightly_tired, defensive, uncomfortable, shaken, nervous, lying, false_relief, teary, tired`.

## Resposta do ChatGPT
Preenchido pelo ChatGPT ao concluir.

- status:
- assets criados:
- observações:
