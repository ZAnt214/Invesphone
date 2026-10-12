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

Mostra cerca de 760 px de mundo na altura, o que deixa as fachadas até o topo da tela e a calçada e as faixas visíveis. A câmera usa dead zone, mostra mais espaço no sentido em que Lemos caminha e estabiliza gradualmente quando ele para. Perto da entrada, compõe Lemos e a fachada do DHPP sem trocar a perspectiva. Arrasto, pinça, roda e toque duplo permitem olhar/inspecionar; a escala final continua inteira e o zoom fica ancorado no gesto. Quando a altura da tela comporta a rua inteira, ela aparece toda. A tela é girada para paisagem, como na base. Arquitetura e diagnóstico: `docs/CAMERA_DIRECTION_SYSTEM.md`.

## Testes

Feitos em 844×390, 390×844 e 375×667:

- fluxo rua → DHPP → rua;
- trânsito (sem carros sobrepostos);
- regressões do quadro e dos NPCs da base.

## Luz, sombra e qualidade (out/2026)

- Sol da manhã do alto à esquerda, uma regra só:
  - nas fachadas, o que sai da parede faz sombra para a direita e para baixo, e os recuos escurecem no alto e à esquerda;
  - no chão, as sombras dos objetos caem para a direita e para cá (`SUN` em `streetArt.js`).
- Becos com profundidade; DHPP com pórtico recuado, embasamento e arandelas acesas.
- Câmera em escala inteira de pixel.
- O que entra em cada qualidade e as medições: `docs/GRAPHICS_UPGRADE.md`.

## Rua viva (12/10/2026): trânsito visível, vagas, semáforos e gente

- **Câmera/composição** (`view()` em `src/base/street.js`): a escala inteira é a maior em que a faixa essencial (`BAND_TOP..BAND_BOT` em `streetArt.js`: térreo das lojas até a mão de baixo do trânsito) cabe abaixo do cabeçalho (`hudTop` vem de `base.js`). A vertical da câmera é fixa na composição, só o X segue o Lemos. Via compacta (`NEAR=ROAD+262`, faixas em `ROAD+116` e `ROAD+230`), para o trânsito aparecer no iPhone 3x também.
- **Trânsito**: 7 carros por mão (~112–120 px/s), mix ponderado (`POOL`), um seguindo o outro, luz de freio, roda girando pela distância andada, ônibus e táxi. Faixa de cima vai para o oeste, a de baixo para o leste.
- **Semáforos** (`SIGS`, `CROSSWALKS`): verde/amarelo/vermelho oficiais (`semaforo.png`), linha de retenção, pedestre aperta o botão e o verde fecha depois de 7 s; bipe no vermelho. Pedestres atravessam na faixa (82%) ou no meio-fio livre; carros cedem a quem está na pista.
- **Vagas** (`SLOTS`, 9 vagas + a da viatura): carros de frente para o oeste; eventos de estacionar (carro reciclado fora da tela vira estacionando, com seta) e de sair da vaga (seta, espera brecha, entra na faixa).
- **Gente**: 30 pedestres (32 aparências), 2 guardas nos degraus, dono da mercearia, garçom, barbeiro (postos fixos com poses), entregador.
- **Acontecimentos** (`events()`): sair/entrar de vaga, entrega do furgão (entregador leva caixa à mercearia/diner e volta), corredor, viatura com sirene. Tudo por escolha ponderada com intervalo mínimo (`EVOPTS`), registrado em `?debug=1`.

## Imersão: desgaste, luz e partículas (12/10/2026)

- **Desgaste** (`paintWear` em `streetArt.js`, pintado uma vez): escorridos sob peitoris e cornijas, lama no pé das paredes, reboco soltando, trincas, calhas de ferro, cartazes e rabiscos no beco; no chão, sombra dos prédios na calçada com manchas de sol nos becos, poças que refletem o céu, sarjeta suja, chiclete, bitucas e sujeira nas faixas.
- **Luz** (`street.js`): janelas acesas brilham, algumas com TV tremulando; as vitrines jogam uma poça de luz na calçada; nuvens passam devagar e sombreiam a rua (qualidade média+).
- **Ar**: vento em rajadas leva folhas e papéis pela calçada e sarjeta; moscas rondam o lixo; os 3 bueiros soltam vapor; fios balançam entre os postes. `prefers-reduced-motion` desliga o que se move.

## Vida dentro dos prédios (12/10/2026)

- **Prédios de baixo** (`src/base/streetFG.js`): primeiro plano visto de cima, só os telhados (o interior não aparece): platibanda logo depois da calçada de cá e terraços com ar-condicionado, ventilação, caixa d'água, casa de escada, claraboias, antenas, poças e remendos.
- **Janelas**: bustos em código atrás do vidro (olhando para fora, ao telefone, tomando café, vendo TV com luz azul, regando planta, digitando no DHPP, acenando para o Lemos quando ele para perto). Algumas janelas ficam vazias ou com cortina.
- **Varandas** nos apartamentos (porta de vidro com interior, laje, vasos, varal); quem está lá usa o boneco da planta, atrás do guarda-corpo.
- **Lojas**: garçom andando, clientes sentados, caixa, barbeiro e cliente, atrás do vidro das vitrines.
- **Câmera**: no celular na horizontal o quadro padrão mostra só a faixa essencial (escala inteira de pixel). O botão "visão geral" no cabeçalho (ou o pinça) afasta até a escala 1 e mostra a rua inteira com os telhados dos prédios de baixo; a pinça agora vai até 0,34x.

## Prédios mais realistas (12/10/2026)

- **De cima (fachadas)**: cada lote tem número de andares próprio (`floors` em `LOT`, `street.js`); acima dos mais baixos aparece o céu, com caixa d'água, chaminé e antena no telhado. Alguns têm uma passagem estreita ao lado (`inset`), então os prédios não ficam todos grudados.
- **De baixo (telhados)**: larguras sorteadas, vãos de serviço entre eles, recuos diferentes da calçada e alturas diferentes (o mais alto faz sombra no vizinho). O interior nunca aparece.

## Primeiro plano em paralaxe — direção A (aprovada em 12/10/2026)

`src/base/streetFront.js`: os prédios do lado de cá ficam entre a câmera e a rua. Vemos a parede dos fundos do último andar (tijolo, janelas só com vidro/cortina/persiana, ar-condicionado, floreira, escada de incêndio, cano de descida) e o telhado recortado (caixa d'água, chaminé, respiros, antena, parabólica, casa de máquinas), com varais entre alguns prédios. Larguras, alturas e vãos sorteados. Escala de pixel um passo acima da rua (`s+1`) e paralaxe horizontal; o topo de cada prédio fica 1,5× a escala da rua acima da linha `BAND_BOT`, então os mais altos chegam perto da faixa amarela em qualquer aparelho. Translúcido onde algo importante passa atrás (ônibus parado no ponto, pedestre atravessando). O interior nunca aparece.

## Bordas da tela — direção L (aprovada em 12/10/2026)

`edgeBlur()` e `edges()` em `street.js` e `#etint` (base.css): desfoque leve crescendo para as bordas só no cenário fixo (cópia desfocada da camada fixa, presa ao mundo; carros, pessoas e primeiro plano ficam nítidos por cima), cantos um pouco mais escuros e quentes, luz do sol vazando do canto de cima à esquerda (enfraquece quando a câmera vai para a direita) e ~20 partículas de luz desfocadas perto das bordas, que andam com a câmera e com o vento. Qualidade baixa: só os cantos escuros; `prefers-reduced-motion`: partículas paradas.

## Desempenho da rua (13/10/2026)

Medido com Chromium, CPU 4x mais lenta, tela 844×390 @3x, desenho de um quadro com a câmera andando: **613 ms → 167 ms** (3,7× mais rápido), sem mudar o visual.
- O desfoque das bordas não lê a tela de volta: usa uma cópia já desfocada do cenário fixo (`edgeBlur`). O `backdrop-filter` foi descartado porque no Safari chegava um quadro atrasado e deixava um fantasma da cena ao andar. A cor das bordas (cantos âmbar, canto frio) é `#etint`, em CSS.
- Luz macia (fachos, raios, bolhas, brilho do sol, luz do canto, calor do lado do sol, partículas) é somada numa camada de 1/4 da resolução e entra na tela numa passada só (`LT`). A passada `soft-light` de tela cheia saiu.
- Sombras do que não se move (mobiliário, semáforos, árvores) são pintadas uma vez na camada fixa (`bakeShadows`); as de carros e pessoas vão direto para a tela com silhuetas macias guardadas (`softSil`), sem a camada intermediária de tela cheia.
