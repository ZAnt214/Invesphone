---
id: 2026-10-10-rua-alta-resolucao
status: cancelled
requested_by: claude
priority: high
character: ""
asset_type: environment-pixel-art (refazer a rua na resolução da base)
destination: public/base/street/
---

# Pedido — Rua do DHPP na mesma resolução de pixel da base

> **Cancelado (2026-10-11).** Não gerar. O usuário pediu outra rua: um bairro de casas geminadas tipo Filadélfia, sem nomes de comércio brasileiros e no mesmo estilo da planta da base. Por isso a rua passou a ser desenhada em código, com as mesmas funções de pixel art da base (`src/base/street.js`). As imagens antigas de `public/base/street/` saíram do jogo e continuam no histórico do git.

## Objetivo
O usuário pediu que a rua tenha **o mesmo nível gráfico do lado de dentro do DHPP**.

O motor da rua já foi ajustado para isso:
- usa o mesmo zoom da planta;
- usa os mesmos bonecos de dentro (o Lemos tem **46 px de altura**);
- aplica a mesma luz da manhã.

Falta a arte. As imagens atuais foram desenhadas numa escala em que as pessoas tinham 28 px, e hoje o jogo as amplia cerca de 1,64× para caberem ao lado dos bonecos de 46 px. Com isso o pixel da rua fica grosso e borrado de detalhe, enquanto dentro o pixel é fino. Veja `creative-requests/refs/2026-10-10-rua-alta-resolucao/densidade-de-pixel-rua-x-base.png` (removida com o cancelamento): à esquerda a rua ampliada, à direita a base.

O pedido é **refazer as 24 imagens da rua nos tamanhos novos abaixo**, com 1 px da imagem = 1 px da base. O desenho, a composição, as cores e os nomes continuam os mesmos das entregas anteriores; o que muda é a densidade, com mais pixels e mais detalhe por objeto.

## O que gerar
- Quantidade: 24 PNGs, todos **substituindo os arquivos de mesmo nome** em `public/base/street/`.
- Personagem: nenhum. Sem pessoas.
- Enquadramento: igual às entregas anteriores.
  - Fachadas: de frente, com o pé na última linha.
  - Veículos: em 3/4 vistos de cima (teto e lateral), virados para a direita, com as rodas na última linha.
  - Mobiliário: de frente, com o topo um pouco visível e o pé no centro da última linha.
- Fundo: transparente.
- Estilo: o mesmo pixel art da série *Beat Cop* já entregue, agora com a **densidade de detalhe da base** (`public/` e as capturas da recepção). Tijolo, azulejo e letreiros com mais definição; contorno discreto; luz quente da esquerda.
- Resolução: **exatamente** os tamanhos da tabela. 1 px = 1 px de arte da base; o Lemos tem 46 px de altura.
- Formato: PNG com transparência, alfa binário.

## Consistência obrigatória
- Mesmos prédios, mesmos comércios fictícios, mesma composição e mesmas cores das entregas anteriores (`creative-requests/completed/2026-10-10-rua-do-dhpp.md` e `creative-requests/completed/2026-10-10-rua-camera-alta-carros-e-calcada.md`). É a mesma rua em resolução maior, não uma rua nova.
- **Não basta ampliar as imagens atuais.** Ampliar por vizinho mais próximo dá exatamente o pixel grosso de hoje. Cada peça precisa ser redesenhada ou redetalhada nessa resolução.
- **Porta do DHPP em `dhpp.png`**:
  - centro em x = 272;
  - 92 px de largura e 53 px de altura;
  - soleira dourada na última linha;
  - o letreiro `DHPP` + linha + `HOMICÍDIOS` acima da porta;
  - mastros do Brasil (x ≈ 71) e do DHPP (x ≈ 442).
- Viatura: só "DHPP", nada de "Polícia Civil" nem brasão real. Táxi branco com luminoso amarelo.

## Contexto da cena
É o lado de fora da base, onde o jogo começa. O jogador vê o Lemos, que é o mesmo boneco de dentro, andando na calçada ao lado de pedestres, com carros e ônibus na rua e as fachadas da quadra atrás. A rua e a recepção precisam parecer do mesmo jogo e do mesmo nível de acabamento quando o Lemos passa pela porta. Referência das duas lado a lado no mesmo zoom: `refs/2026-10-10-rua-alta-resolucao/rua-e-recepcao-mesmo-zoom.png`.

## Arquivos esperados
Todos em `public/base/street/`, **substituindo** os atuais. Largura × altura exatas, em pixels:

| Arquivo | Tamanho novo | Antes |
|---|---|---|
| `esquina-oeste.png` | 246 × 246 | 150 × 150 |
| `padaria.png` | 280 × 273 | 170 × 166 |
| `beco.png` | 65 × 289 | 40 × 176 |
| `dhpp.png` | 543 × 306 | 330 × 186 |
| `lavanderia.png` | 262 × 230 | 160 × 140 |
| `bar.png` | 230 × 171 | 140 × 104 |
| `sobrado.png` | 296 × 256 | 180 × 156 |
| `farmacia.png` | 312 × 214 | 190 × 130 |
| `esquina-leste.png` | 395 × 276 | 240 × 168 |
| `skyline.png` | 2629 × 230 | 1600 × 140 |
| `car34-viatura.png` | 122 × 66 | 74 × 40 |
| `car34-taxi.png` | 112 × 66 | 68 × 40 |
| `car34-carro-vermelho.png` | 108 × 66 | 66 × 40 |
| `car34-carro-azul.png` | 102 × 66 | 62 × 40 |
| `car34-carro-verde.png` | 118 × 66 | 72 × 40 |
| `car34-carro-amarelo.png` | 105 × 66 | 64 × 40 |
| `car34-carro-prata.png` | 112 × 66 | 68 × 40 |
| `car34-onibus.png` | 256 × 102 | 156 × 62 |
| `prop-orelhao.png` | 39 × 72 | 24 × 44 |
| `prop-banca.png` | 118 × 85 | 72 × 52 |
| `prop-lixeira.png` | 20 × 36 | 12 × 22 |
| `prop-hidrante.png` | 16 × 26 | 10 × 16 |
| `prop-ponto-de-onibus.png` | 105 × 95 | 64 × 58 |
| `prop-mesas-bar.png` | 79 × 43 | 48 × 26 |

Os arquivos antigos `car-*.png`, de perfil, não são usados e podem ser apagados.

## Observações técnicas para integração
- O jogo desenha cada imagem no retângulo do seu item, com os tamanhos da tabela "Tamanho novo". No tamanho exato, a imagem sai 1:1, na mesma densidade da base, sem nenhuma mudança de código. Imagens no tamanho antigo continuam funcionando, só que ampliadas, que é a situação de hoje.
- Fachadas: largura exata, porque ficam lado a lado sem sobreposição. A altura pode ser menor, com transparência em cima, nunca maior.
- Veículos e peças sem sombra no chão; o jogo desenha as sombras.
- Conferir no jogo: com a imagem nova, a arte da rua deve ter o mesmo "tamanho de pixel" que a recepção da base, no mesmo zoom.

## Resposta do ChatGPT
Preenchido pelo ChatGPT ao concluir.

- status:
- assets criados:
- observações:
