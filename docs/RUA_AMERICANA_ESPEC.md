# Rua americana do DHPP — especificação técnica (para os assets e o jogo)

> **Substituído (11/10/2026):** a rua do jogo segue `docs/RUA_BEATCOP_BASE.md`. Desta especificação continuam valendo os carros e o mobiliário oficiais (`veiculos/`, `props/`, efeitos).

Direção aprovada: `docs/DIRECAO_RUA_AMERICANA_DHPP.md`. Referência oficial: `creative-requests/refs/2026-10-11-rua-americana-dhpp/referencia-aprovada.png` (1672×941).

Este documento fixa **escala, composição, camadas, âncoras e nomes** para que cada peça encomendada ao ChatGPT encaixe sem retrabalho. A lista de nomes que o jogo procura está em `src/base/ruaAssets.js` (fonte única); os pedidos estão em `creative-requests/inbox/2026-10-11-rua-us-*.md`.

## 1. Escala

- **1 pixel de arte = 1 unidade lógica da rua = metade de um pixel da referência.** A referência inteira equivale a ~836×470 unidades; no iPhone deitado (844×390 pt) a tela mostra praticamente a largura da referência, como ela foi aprovada.
- Pessoa adulta: **38 px** do pé ao topo da cabeça (Lemos: 38 px). Quadro de pessoa: **26×44**, pé no centro da última linha (x=13, y=43).
- Andar: **52 px**. Térreo de loja: **72 px**. Porta comum: 22×40. Porta do DHPP (folha dupla): 44×64.
- Carro de passeio: ~**155×50** (3/4 do alto, rodas na última linha). Viatura 154×50, táxi 150×52, furgão 142×58, ônibus 300×84.
- Fachadas: **330 px** de altura (pé na calçada, topo cortado pela câmera na maior parte do tempo; acima do telhado, transparente).

## 2. Câmera e perspectiva

Igual à referência: fachadas **de frente** (sem ponto de fuga nas fachadas), rua horizontal, câmera elevada — o chão (calçada e asfalto) é visto de cima, dá para ver teto dos carros e degraus. Os becos e as ruas transversais mostram profundidade **para dentro** da quadra (paredes laterais recuadas fugindo para o fundo).

Luz de manhã, sol do alto à esquerda: sombras para a direita e para baixo; faces viradas para a esquerda mais claras. Contorno escuro de 1 px nas peças, como na referência. Paleta quente e dessaturada da referência (tijolo, pedra, asfalto cinza-azulado).

## 3. Composição do quarteirão (x em unidades, da esquerda para a direita)

Simétrica em torno do DHPP, sem espelhar mecanicamente os detalhes.

| x | largura | peça |
|---|---|---|
| 0 | 110 | `esquina-oeste` — esquina com a rua transversal **N 9TH ST** fugindo para o fundo |
| 110 | 120 | `predio-oeste` — prédio residencial de tijolo com escada de incêndio |
| 230 | 132 | `diner` — DINER (cromado, letreiro vermelho, OPEN em neon) |
| 362 | 136 | `grocery` — GROCERY (COLD BEER · SODA · CIGARETTES, ATM, frutas na frente) |
| 498 | 58 | `beco-oeste` — beco fundo com portão de grade, caçambas, sacos, escada de incêndio |
| 556 | 170 | `dhpp` — **o DHPP no centro** (pórtico de pedra em arco, escadaria, porta dupla, DHPP, luminárias, bandeiras, nº 87) |
| 726 | 58 | `beco-leste` — o outro beco (mesma ideia, detalhes diferentes) |
| 784 | 136 | `pawn-shop` — PAWN SHOP (BUY · SELL · LOANS, WE BUY em neon, nº 213) |
| 920 | 132 | `laundry` — LAUNDRY (WASH · DRY · FOLD, máquinas, OPEN em neon) |
| 1052 | 120 | `predio-leste` — prédio residencial (outra cor de tijolo/pedra) |
| 1172 | 110 | `esquina-leste` — esquina com a rua transversal **W OAK ST** |

Largura total: **1282**. O DHPP fica centrado em x = 641.

## 4. Chão (y em unidades, a partir do pé das fachadas)

| y | o quê |
|---|---|
| 0–50 | calçada (placas de concreto vistas de cima) |
| 50–56 | meio-fio (topo + face) |
| 56–216 | asfalto (160) |
| 78 | linha das rodas dos carros estacionados (encostados no meio-fio; o teto cobre um pouco a beira da calçada) |
| 96 | faixa branca tracejada (vagas × faixa de cima) |
| 136–141 | faixa dupla amarela |
| 160 | linha das rodas da faixa de cima (trânsito ← para a esquerda) |
| 196 | linha das rodas da faixa de baixo (trânsito → para a direita) |

Vaga reservada da viatura (hachurada) no asfalto, centrada no DHPP: x 551–731, y 58–98. Nas esquinas, faixa de pedestres atravessando a rua na linha da calçada da transversal.

## 5. Camadas e ordem de desenho

1. Céu (`fundo/ceu.png`, faixa vertical repetida).
2. Fachadas e becos/esquinas (cada lote uma imagem) + camadas animadas do mesmo tamanho por cima (porta, bandeiras, neon, luz).
3. Chão: calçada, meio-fio, asfalto, marcações, vaga, bueiros, manchas e lixo no chão.
4. Por profundidade (y do pé): mobiliário, pessoas, Lemos, carros estacionados, carros das faixas, pombos.
5. Efeitos: vapor do bueiro, fumaça do escapamento, brilho dos postes.

Tudo que fica na calçada é peça separada com âncora no pé (para as pessoas passarem na frente e atrás). Degraus e entradas **recuadas** fazem parte da fachada (ficam atrás de quem anda na calçada).

## 6. Formato dos arquivos

- PNG RGBA, **alfa binário** (0 ou 255), sem antisserrilhado nem sombra projetada no chão (o jogo desenha as sombras).
- **Tamanho exato** de cada peça, em pixel de arte. Se for gerado maior, reduzir por *vizinho mais próximo* até o tamanho exato e limpar a grade — nada borrado.
- Folhas de animação: quadros lado a lado, da esquerda para a direita, sem espaço entre eles; linhas de animação de cima para baixo, na ordem dada.
- Pessoas e carros virados para a **direita**; o jogo espelha para a esquerda.
- Nada de marcas reais, brasões reais ou nomes de empresas. **DHPP** é a única identidade institucional (fachada, viatura, uniformes). Sem referências brasileiras na ambientação.

## 7. Pastas

Tudo em `public/base/rua/`: `fachadas/`, `chao/`, `props/`, `veiculos/`, `npcs/`, `personagens/`, `efeitos/`, `fundo/`, `guia/`. Os nomes exatos estão em cada pedido e em `src/base/ruaAssets.js`.

## 8. No jogo

`src/base/street.js` monta a rua com esse layout. Enquanto um arquivo oficial não existe, o jogo desenha um **provisório** no mesmo retângulo (pixel art gerada em código, só para desenvolver); quando o PNG oficial chega na pasta, ele substitui o provisório sem mudança de código (o build lista os arquivos presentes). Provisório não é entrega final.
