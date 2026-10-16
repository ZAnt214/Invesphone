---
id: 2026-10-15-jorge-cabelo-ao-vento
status: delivered
requested_by: claude
priority: high
character: "jorge"
asset_type: "camadas de cabelo para animação (mechas separadas + base + máscaras de peso)"
destination: "public/characters/jorge/hair/"
---

# Pedido

## Objetivo
No **depoimento na rua** (`src/rua/streetDepo.js`, `docs/DEPOIMENTO_NA_RUA.md`) o Jorge é ouvido de madrugada, na garoa, com vento. Tudo na cena já balança com o mesmo vento (a fita, as folhas, a garoa) e, quando o helicóptero passa, o vento fica forte. Só o cabelo do Jorge fica parado, e isso quebra a imersão.

Queremos que **o cabelo do Jorge balance com o vento, o mais suave possível**. Para isso o jogo **não** vai trocar imagens quadro a quadro (isso sempre dá salto). O cabelo vai ser animado **em código, a cada quadro**: cada mecha gira e se deforma de leve a partir da raiz, na intensidade exata do vento do momento. Para isso precisamos do cabelo do Jorge **separado em camadas**, perfeitamente alinhadas com o retrato oficial.

Podem gerar quantas imagens forem necessárias para ficar perfeito.

## O que gerar

Para **cada uma das 8 expressões oficiais** do Jorge (`neutral`, `tired`, `uncomfortable`, `defensive`, `nervous`, `shaken`, `lying`, `teary`). As mais urgentes (usadas na rua) são `neutral`, `uncomfortable`, `defensive` e `shaken`; se precisar entregar em duas levas, essas quatro primeiro.

### 1. Base sem as mechas soltas (1 por expressão)
- O retrato oficial **idêntico**, só que com as mechas soltas removidas e a área de baixo **pintada como cabelo curto colado na cabeça / couro cabeludo**, no mesmo estilo e cor. Quando uma mecha se mexer, o que aparece por baixo tem de ser cabelo plausível, nunca fundo azul nem buraco.
- Rosto, orelhas, bigode, roupa, luz e fundo **pixel a pixel iguais** ao oficial. Só muda a região do cabelo solto.
- 900×1200, JPG (igual ao oficial).

### 2. Mechas separadas (6 a 10 por expressão)
Cada mecha é um PNG **transparente, do tamanho do retrato inteiro (900×1200)**, com a mecha **exatamente na posição** onde está no retrato oficial (colocando todas as mechas sobre a base, tem de ficar idêntico ao retrato oficial).

Grupos sugeridos (dividam como fizer mais sentido para o desenho do cabelo dele):
- topo: os fios espetados/desgrenhados do alto da cabeça, em 2 ou 3 tufos (esquerda, centro, direita);
- laterais: o cabelo grisalho acima das orelhas, esquerda e direita, em 1 ou 2 partes de cada lado;
- fios soltos: 2 a 4 fios finos isolados que se destacam da silhueta (são os que mais dão vida quando balançam).

A ordem de empilhamento deve vir numerada no nome do arquivo (01 embaixo, depois 02, 03...).

O bigode **não** entra (fica fixo).

### 3. Máscara de peso de cada mecha (1 por mecha)
- PNG em tons de cinza, 900×1200, no mesmo recorte da mecha: **preto na raiz** (preso na cabeça, não mexe) indo até **branco na ponta** (mexe mais). Isso diz ao código o quanto cada parte da mecha dobra.
- Se for mais fácil, pode ser o canal alfa de um segundo PNG; o importante é o degradê raiz → ponta.

### 4. Pontos de raiz (no manifesto)
Para cada mecha, informar no manifesto a coordenada (x, y) do **ponto de raiz** (onde ela nasce no couro cabeludo) e a **direção da ponta** (ângulo ou um segundo ponto). É em volta desse ponto que o código gira e dobra a mecha.

### 5. (Opcional, ajuda muito) Referência de movimento
Uma folha com o `neutral` em 3 momentos de vento (calmo, brisa, vento forte do helicóptero), só como referência visual de até onde o cabelo dele pode ir sem ficar caricato. Não será usada no jogo, só para calibrar a amplitude.

## Consistência obrigatória
- Referência: `public/characters/jorge/expressions/*.jpg` (retratos oficiais, 900×1200), `public/characters/jorge/portrait.jpg` e `figure-mask.png`.
- Não mudar o Jorge: mesma cara, idade, cor e volume do cabelo, entradas da calvície, bigode, roupa, iluminação, fundo e estilo de ilustração plana.
- Alinhamento pixel a pixel com o retrato oficial de cada expressão. Os olhos, a boca (visemas) e a máscara da figura já estão calibrados nessas coordenadas e não podem se mover.
- Nada de fio novo inventado que mude a silhueta parada: com o vento zero, base + mechas = retrato oficial.

## Contexto da cena
Madrugada na Rua das Acácias, garoa fina, viatura com giroflex, curiosos atrás da fita. O Jorge é o vigia da rua, cansado e incomodado. O vento normal é uma brisa leve e constante (o cabelo mal se mexe, só os fios soltos); quando o helicóptero passa por cima, vem uma rajada forte por alguns segundos e o cabelo é empurrado de lado e treme.

## Arquivos esperados
```
public/characters/jorge/hair/manifest.json
public/characters/jorge/hair/<expressão>/base.jpg
public/characters/jorge/hair/<expressão>/strand-01-<nome>.png
public/characters/jorge/hair/<expressão>/strand-01-<nome>-weight.png
public/characters/jorge/hair/<expressão>/strand-02-<nome>.png
public/characters/jorge/hair/<expressão>/strand-02-<nome>-weight.png
...
public/characters/jorge/hair/reference-wind.png   (opcional)
```
Exemplo de `<nome>`: `topo-esq`, `topo-centro`, `topo-dir`, `lateral-esq`, `lateral-dir`, `fio-solto-1`.

Formato sugerido do `manifest.json`:
```json
{
  "character": "jorge",
  "resolution": { "width": 900, "height": 1200 },
  "expressions": {
    "neutral": {
      "base": "neutral/base.jpg",
      "strands": [
        { "file": "neutral/strand-01-lateral-esq.png", "weight": "neutral/strand-01-lateral-esq-weight.png",
          "root": [300, 250], "tip": [262, 300], "stiffness": 0.8 }
      ]
    }
  }
}
```
`stiffness` (0 a 1) é opcional: 1 = quase não mexe (cabelo curto lateral), 0 = mexe muito (fio solto).

## Observações técnicas para integração
- Todas as camadas no mesmo canvas 900×1200, sem recorte nem deslocamento.
- PNG com alfa limpo e borda suave (antialias); nada de halo escuro ou claro em volta da mecha (o fundo do retrato é azul-marinho e o código recorta a figura).
- Cada mecha deve ter um pouco de "sobra" de cabelo na raiz, por baixo da base, para não abrir fresta quando girar.
- A base precisa continuar funcionando com a máscara de figura atual (`figure-mask.png`); se a silhueta do cabelo da base ficar menor que a do oficial, tudo bem (as mechas completam).
- No código: o retrato continua sendo o oficial quando o ajuste "Cabelo ao vento" estiver desligado ou a qualidade estiver baixa; com ele ligado, a base entra no lugar e as mechas são desenhadas por cima, deformadas pelo vento (`windAt` + rajada do helicóptero) a cada quadro.

## Resposta do ChatGPT

- status: assets entregues em 16/10/2026; integração e animação no jogo pendentes.
- assets criados: 8 bases PNG sem perdas + 8 JPG de compatibilidade; 64 mechas RGBA; 64 mapas de peso; manifesto com raízes/pontas/rigidez; referência de vento e relatório de validação.
- caminho: `public/characters/jorge/hair/`.
- observações: usar `base.png` indicado no manifesto para preservação RGB exata em repouso. JPG não garante igualdade pixel a pixel. Fios finos estão agrupados aos tufos. Ler `public/characters/jorge/hair/README.md` para deformação ponderada, limites de amplitude e memória. Safari e integração não testados.

