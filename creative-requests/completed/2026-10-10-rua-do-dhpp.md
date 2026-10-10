---
id: 2026-10-10-rua-do-dhpp
status: completed
requested_by: claude
priority: normal
character: ""
asset_type: environment-pixel-art (fachadas, cidade ao fundo, veículos)
destination: public/base/street/
---

# Pedido — Rua do DHPP (lado de fora da base, vista de frente)

## Objetivo
A base do DHPP ganhou um lado de fora: a **rua do DHPP**, vista de frente como em *Beat Cop*. As fachadas aparecem altas e de frente, a calçada fica embaixo e o trânsito passa na frente. Lemos anda pela calçada e entra no prédio pela porta do DHPP; dentro continua a planta atual.

A cena já funciona no jogo com desenhos provisórios feitos por código (`src/base/street.js`). Este pedido é a **arte oficial** que substitui esses provisórios. Cada arquivo entregue no caminho abaixo entra no lugar do provisório sozinho, sem mudar código, desde que respeite **o nome e o tamanho exatos**.

## O que gerar
- Quantidade: 18 arquivos (9 fachadas, 1 cidade ao fundo, 8 veículos). A lista exata está em "Arquivos esperados".
- Personagem: nenhum. Sem pessoas nas imagens, porque os pedestres e o Lemos são desenhados pelo jogo por cima.
- Enquadramento: **vista frontal (elevação)**.
  - Fachadas: de frente, sem perspectiva lateral, com o pé de cada prédio na base da imagem.
  - Veículos: de lado, virados para a **direita** (o jogo espelha os que andam para a esquerda), com as rodas encostando na base da imagem.
- Fundo: **transparente** em tudo (acima do telhado, ao redor dos carros).
- Estilo: **pixel art** no espírito de *Beat Cop*: fachadas ricas em detalhe, paleta quente de manhã, contorno discreto, sem anti-aliasing borrado.
- Resolução: **1 pixel da imagem = 1 pixel de arte do jogo**, nos tamanhos exatos da tabela. Escala de referência: o Lemos tem 46 px de altura e as portas de entrada têm cerca de 32 px de altura.
- Formato: PNG com transparência.

## Consistência obrigatória
- **DHPP**:
  - usar só o nome DHPP, com a marca da casa: `DHPP` + linha vertical + `HOMICÍDIOS`, em letreiro escuro com filete dourado;
  - nada de "Polícia Civil", "Polícia de São Paulo" nem brasão real.
- **Prédio do DHPP**: 5 andares de concreto claro (bege acinzentado), com fileiras de janelas e alguns ar-condicionados. O térreo é mais escuro e tem:
  - o letreiro centralizado;
  - a porta dupla de vidro no **centro exato** (x = 165 px, 56 px de largura, 32 px de altura, soleira dourada);
  - uma janela de cada lado;
  - dois mastros de bandeira: o do Brasil à esquerda (x ≈ 43) e o azul-marinho do DHPP à direita (x ≈ 269), fora do letreiro.
- **Clima de São Paulo**: grades nas janelas, ar-condicionado de parede, pichação discreta, toldos, letreiros pintados, azulejo e tijolo aparente. Os fios dos postes são desenhados pelo jogo; não incluir.
- **Nomes de comércio fictícios**: PADARIA ESTRELA, LAVANDERIA, BAR DO ZÉ, DROGARIA. Nenhuma marca real.
- **Iluminação**: manhã cedo, luz vindo da esquerda, algumas janelas acesas por dentro.
- **Composição**: seguir a do esboço de direção (`creative-requests/refs/2026-10-10-rua-do-dhpp/esboco-direcao.png`). A cena provisória rodando no jogo está em `no-jogo-provisorio.png`. As cores e a distribuição podem melhorar à vontade; **os tamanhos e a posição da porta do DHPP não podem mudar**.

## Contexto da cena
É a primeira coisa que o jogador vê ao chegar à base: Lemos desce da viatura na calçada, a cidade acordando, gente passando, ônibus e táxi na rua, e o DHPP no meio da quadra com o letreiro e a porta marcada. A rua precisa transmitir uma delegacia de homicídios no centro de São Paulo: concreto gasto, comércio de bairro, rotina comum ao lado de um caso pesado. Nada caricato ou cômico.

## Arquivos esperados
Todos em `public/base/street/`. Largura × altura exatas, em pixels:

| Arquivo | Tamanho | O que é |
|---|---|---|
| `dhpp.png` | 330 × 186 | Prédio do DHPP (descrição acima) |
| `esquina-oeste.png` | 150 × 150 | Prédio de esquina, tijolo, 4 andares, loja de porta de aço no térreo |
| `padaria.png` | 170 × 166 | Tijolo vermelho, 4 andares; térreo com vitrine de pães, toldo listrado vermelho e branco e o letreiro PADARIA ESTRELA |
| `beco.png` | 40 × 176 | Vão escuro entre prédios, com sacos de lixo no chão |
| `lavanderia.png` | 160 × 140 | Azulejo verde, 3 andares com grades; térreo com vitrine de máquinas de lavar e o letreiro LAVANDERIA |
| `bar.png` | 140 × 104 | Sobrado amarelo de 2 andares; térreo com balcão aberto, porta de aço meio aberta e letreiro neon rosa BAR DO ZÉ |
| `sobrado.png` | 180 × 156 | Tijolo alaranjado, 4 andares; térreo fechado com grade |
| `farmacia.png` | 190 × 130 | Fachada clara, 3 andares; térreo de vidro com a cruz verde e o letreiro DROGARIA |
| `esquina-leste.png` | 240 × 168 | Prédio de esquina, tijolo escuro, 4 andares, comércio fechado no térreo |
| `skyline.png` | 1600 × 140 | Cidade ao fundo, em tons claros e azulados de névoa da manhã; prédios altos com poucas janelas marcadas; base reta |
| `car-viatura.png` | 72 × 28 | Viatura do DHPP: branca com faixa preta, giroflex vermelho e azul, "DHPP" na porta |
| `car-taxi.png` | 66 × 28 | Táxi branco com luminoso no teto |
| `car-carro-vermelho.png` | 64 × 28 | Sedã popular vermelho |
| `car-carro-azul.png` | 60 × 28 | Hatch azul |
| `car-carro-verde.png` | 68 × 28 | Perua verde |
| `car-carro-amarelo.png` | 62 × 28 | Carro amarelo |
| `car-carro-prata.png` | 66 × 28 | Sedã prata |
| `car-onibus.png` | 150 × 44 | Ônibus municipal claro com faixa azul |

## Observações técnicas para integração
- O jogo carrega `public/base/street/<id>.png`. Se o arquivo existe, ele substitui o desenho provisório do mesmo id; se não existe, continua o provisório. Dá para entregar aos poucos: o `dhpp.png` primeiro já muda a cena.
- **Fachadas**: o pé do prédio fica na última linha da imagem, que encosta na calçada. A largura precisa ser exata, porque os prédios ficam lado a lado sem sobreposição. A altura pode ser **menor** que a da tabela (prédio mais baixo) com transparência em cima, nunca maior.
- **Porta do DHPP**: centro em x = 165, base na última linha. É ali que o jogo põe o marcador amarelo e por onde o Lemos entra.
- **Veículos**: virados para a direita, rodas tocando a última linha. A sombra é desenhada pelo jogo; não incluir sombra no chão.
- **Pixel art de verdade**: sem redimensionar com suavização. O jogo amplia com `image-rendering: pixelated`, então cada pixel precisa ser intencional.
- **Pessoas**: nenhuma nas imagens, nem silhuetas na calçada. Silhuetas atrás de janelas acesas podem.

## Resposta do ChatGPT
Concluído pelo ChatGPT em 2026-10-10.

- status: completed
- assets criados: os 18 PNGs da tabela, em `public/base/street/`, nos tamanhos exatos solicitados.
- observações: artes geradas individualmente pela ferramenta integrada de imagens. Recorte de margens transparentes, ajuste técnico com vizinho mais próximo (sem suavização), paleta limitada e alfa binário. Fachadas de frente e veículos voltados para a direita, sem pessoas incorporadas. DHPP com quatro fileiras superiores de janelas mais térreo; enquadramento da entrada normalizado para x=137, y=154, largura=56, altura=32, centro x=165 e base y=186. Mastros permanecem fora do letreiro, próximos das extremidades da fachada.
- integração: automática pelo carregador existente e pelo inventário `__STREET_ART__` do Vite; nenhuma alteração de lógica necessária.
- validação: todos os 18 nomes, dimensões, canais alfa e alinhamentos inferiores conferidos; renderização panorâmica com o módulo real `src/base/street.js`; carregamento de 18/18 imagens e entrada no DHPP testados no renderizador Canvas em 1600×376, 390×844 e 375×667; `npm run build` aprovado. O ensaio Canvas utiliza frames vazios para personagens, pois valida os assets da rua e o ponto de entrada. Não houve teste em Safari físico nem teste completo da interface no navegador: o download do Chromium falhou neste ambiente.
- direção/prompt: pixel art urbana de São Paulo, fachadas ortográficas, concreto gasto, tijolos e azulejos, luz quente de manhã pela esquerda, comércio fictício, PNG transparente sem pessoas, rua ou fios; veículos em perfil direito, sem sombra de chão. Cada geração especificou o edifício/veículo e o tamanho da tabela. O DHPP foi refinado com referência ao esboço e ao acabamento da lavanderia para preservar os cinco pavimentos.
