---
id: 2026-10-18-reporter-cabelo-ao-vento
status: completed
requested_by: claude
priority: high
character: "reporter"
asset_type: "camadas de cabelo para animação (mechas separadas + base + máscaras de peso), no mesmo formato do Jorge"
destination: "public/characters/reporter/hair/"
---

# Pedido

## Objetivo
A repórter da TV Sereno (`public/characters/reporter/`, entregue em 2026-10-16) já está no jogo: é a **entrevista do Lemos no portão da casa**, na mesma cena do depoimento na rua (`src/rua/streetDepo.js`, modo imprensa; `docs/DEPOIMENTO_NA_RUA.md`, seção "Entrevista"). O usuário pediu que **o cabelo dela tenha a mesma lógica do Jorge**: balançar com a brisa da garoa e ser empurrado quando o helicóptero passa, de forma suave e natural.

O cabelo é animado **em código, a cada quadro** (`src/rua/hairWind.js`): cada mecha gira e se deforma a partir da raiz, na força do vento do momento. Para isso precisamos do cabelo dela **separado em camadas**, exatamente como foi feito para o Jorge (`public/characters/jorge/hair/` e o pedido `creative-requests/completed/2026-10-15-jorge-cabelo-ao-vento.md`, que é a referência de formato).

Com as camadas, ela também ganha automaticamente a garoa no rosto e no casaco que o Jorge tem (gotas no cabelo e nos ombros, pele úmida refletindo o giroflex).

## O que gerar

Para **cada uma das 6 expressões oficiais** (`neutral`, `asking`, `insisting`, `surprised`, `satisfied`, `annoyed`). Se precisar de duas levas: `neutral`, `asking` e `annoyed` primeiro.

### 1. Base sem as mechas soltas (1 por expressão)
- O retrato oficial **idêntico**, só sem as mechas soltas, com a área de baixo pintada como cabelo preso/colado na cabeça, no mesmo estilo e cor. Quando uma mecha se mexer, o que aparece embaixo tem de ser cabelo plausível, nunca fundo nem buraco.
- Rosto, orelhas, brinco, roupa, crachá, microfone, mão, luz e fundo **pixel a pixel iguais** ao oficial.
- 900×1200, JPG (igual ao oficial).

### 2. Mechas separadas (5 a 9 por expressão)
PNG **transparente do tamanho do retrato inteiro (900×1200)**, cada mecha **exatamente na posição** do retrato oficial (todas as mechas sobre a base = retrato oficial).

O cabelo dela é castanho, preso num coque baixo prático depois de uma noite de trabalho, com fios soltos. Grupos sugeridos:
- fios soltos que caem na frente da orelha e na testa (os que mais dão vida: 2 a 4);
- as laterais presas acima das orelhas (esquerda e direita: são rígidas, mexem pouco);
- a franja/topo, em 1 ou 2 partes;
- o coque **não** precisa ser separado se não aparecer de frente; se aparecer, pode ser uma mecha bem rígida.

Ordem de empilhamento numerada no nome do arquivo (01 embaixo, depois 02, 03...).

### 3. Máscara de peso de cada mecha (1 por mecha)
PNG em tons de cinza, 900×1200, no mesmo recorte da mecha: **preto na raiz** (não mexe) até **branco na ponta** (mexe mais).

### 4. Pontos de raiz (no manifesto)
Para cada mecha, a coordenada (x, y) da **raiz** e a direção da **ponta** (`tip`), e `stiffness` de 0 a 1 (laterais presas perto de 1, fios soltos perto de 0). É em volta da raiz que o código gira e dobra a mecha.

### 5. (Opcional) Referência de movimento
`neutral` em 3 momentos de vento (calmo, brisa, rajada do helicóptero), só para calibrar a amplitude.

## Consistência obrigatória
- Referência: `public/characters/reporter/expressions/*.jpg`, `portrait.jpg`, `figure-mask.png`, `manifest.json` (marcas de olhos e boca).
- Não mudar a repórter: mesma pessoa, cabelo (cor, volume, coque), roupa, crachá "TV SERENO", microfone, luz e estilo de ilustração plana.
- Alinhamento pixel a pixel com o retrato oficial de cada expressão: os olhos, as bocas (visemas) e a máscara da figura já estão calibrados nessas coordenadas e não podem se mover.
- Com vento zero, base + mechas = retrato oficial. Nada de fio novo que mude a silhueta parada.

## Contexto da cena
Madrugada na Rua das Acácias, garoa fina, giroflex batendo pela esquerda (a viatura está fora do quadro, à esquerda), curiosos atrás da fita. A brisa é leve e constante (só os fios soltos se mexem); quando o helicóptero passa, vem uma rajada forte de alguns segundos.

## Arquivos esperados
```
public/characters/reporter/hair/manifest.json
public/characters/reporter/hair/<expressão>/base.jpg
public/characters/reporter/hair/<expressão>/strand-01-<nome>.png
public/characters/reporter/hair/<expressão>/strand-01-<nome>-weight.png
...
public/characters/reporter/hair/reference-wind.png   (opcional)
```
`manifest.json` no mesmo formato do `public/characters/jorge/hair/manifest.json` (`character: "reporter"`, `resolution`, `expressions.<nome>.base`, `strands[]` com `file`, `weight`, `root`, `tip`, `stiffness`, `zIndex`).

## Observações técnicas para integração
- O código já está pronto e já aponta para `public/characters/reporter/hair/manifest.json`: assim que os arquivos chegarem nesse caminho, o cabelo dela passa a balançar. O Claude confere e calibra.
- A borda de cada mecha que encosta em outro cabelo pode ser reta: o jogo esfuma essa borda quando a mecha se mexe.

## Resposta do ChatGPT

- status: assets entregues em 18/10/2026; conferir movimento e calibrar no jogo.
- assets criados: 6 bases PNG sem perdas e 6 JPG de compatibilidade; 42 mechas transparentes; 42 mapas de peso; manifesto com raízes, pontas e rigidez.
- destino: public/characters/reporter/hair/manifest.json (já cadastrado em src/characters/characters.ts).
- validação: reconstrução RGB exata das seis expressões com vento zero; zero alteração fora das máscaras de cabelo; PNGs 900×1200.
- orientação: usar base.png do manifesto. JPG não garante igualdade pixel a pixel. Coque fixo; fios frontais mais flexíveis.
- processo: preenchimento inferior editado com image_gen; extração e empacotamento dos pixels originais por script. Retratos oficiais, marcas faciais, visemas e máscaras originais preservados.
- limites: validação visual da composição; Safari real e amplitude final precisam ser conferidos pelo Claude. Ler hair/README.md.
