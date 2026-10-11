# Rua do DHPP: perspectiva Beat Cop com o visual da base

Aprovada pelo usuário em 11/10/2026 ("Sim, pode aplicar no jogo"), a partir da proposta desenhada pelo Claude (fachadas de frente até o topo da tela, calçada vista de cima, rua horizontal com carros de lado, como em Beat Cop) com o visual da planta da base e da casa. Substitui as direções anteriores da rua: PIX/3D e a rua americana de `docs/DIRECAO_RUA_AMERICANA_DHPP.md` / `docs/RUA_AMERICANA_ESPEC.md`.

## Regras

- Tudo que não é PNG oficial é desenhado em código pelo Claude (`src/base/streetArt.js`), sem gerador externo de imagem.
- As fachadas seguem a planta: paleta da base, janelas com moldura branca e vidro azul, ar-condicionado e floreiras.
- O DHPP fica no centro. Ele reaproveita o **letreiro** (`buildSign`) e a **porta** (`buildDoor`) da base, ampliados sem suavizar, além de dois mastros com as bandeiras do Brasil e do DHPP, desenhadas com o mesmo pano da base.
- Os nomes do comércio são americanos: GROCERY, DINER, PAWN SHOP, LAUNDRY e BARBER. Nada de nomes de negócios brasileiros.
- Lemos e os pedestres usam os bonecos da planta (`personFrames`), em escala 1:1.
- Peças oficiais do ChatGPT em uso:
  - carros: `public/base/rua/veiculos/`, ×1,2 (a viatura parada alterna o giroflex nos quadros 2–3);
  - mobiliário: `props/`, ×1,3;
  - efeitos `fumaca-escape` e `pombo`.
- Fachadas, chão e pedestres do ChatGPT (`fachadas/`, `chao/`, `npcs/`) continuam no repositório, mas saíram da cena.

## Medidas (px de mundo)

| Medida | Valor |
|---|---|
| Base das fachadas `GY` | 560 |
| Calçada | 130 |
| Faixas | `ROAD+214` (sentido esquerda) e `ROAD+290` (sentido direita) |
| Vagas | `PARK=CURB+76` |
| Calçada de baixo | começa em `NEAR=ROAD+300` |
| Altura total | 1125 |
| Largura do quarteirão | 2480 |

O quarteirão, em ordem: GROCERY 240, apt 260, DINER 280, beco 110, DHPP 620, beco 60, PAWN 250, LAUNDRY 240, apt 180, BARBER 240.

## Câmera

Mostra cerca de 760 px de mundo na altura, o que deixa as fachadas até o topo da tela e a calçada e as faixas visíveis. A câmera segue o Lemos na horizontal e na vertical, com ele a 60% da altura. Quando a altura da tela comporta a rua inteira, ela aparece toda. A tela é girada para paisagem, como na base.

## Testes

Feitos em 844×390, 390×844 e 375×667:

- fluxo rua → DHPP → rua;
- trânsito (sem carros sobrepostos);
- regressões do quadro e dos NPCs da base.
