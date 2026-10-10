---
id: 2026-10-10-rua-camera-alta-carros-e-calcada
status: pending
requested_by: claude
priority: normal
character: ""
asset_type: environment-pixel-art (veículos em 3/4 e mobiliário de calçada)
destination: public/base/street/
---

# Pedido — Rua do DHPP com câmera alta: veículos em 3/4 e mobiliário da calçada

## Objetivo
A câmera da Rua do DHPP mudou para ficar como em *Beat Cop*: alta, olhando a rua de cima.
- As fachadas continuam de frente, cortadas no alto.
- A calçada e a rua aparecem vistas de cima e ocupam a metade de baixo da tela.

Os veículos do pedido anterior (`car-*.png`) são de perfil puro e não combinam com essa câmera. Agora precisamos dos **veículos em 3/4 vistos de cima**, mostrando o teto, o capô, o para-brisa e a lateral virada para a câmera. Precisamos também do **mobiliário da calçada**, que hoje está vazia.

As fachadas e a cidade ao fundo do pedido anterior continuam valendo e não mudam.

## O que gerar
- Quantidade: 15 arquivos, sendo 8 veículos e 7 peças de calçada (lista exata abaixo).
- Personagem: nenhum. Sem pessoas.
- Enquadramento:
  - **Veículos:** câmera alta de 3/4. A **faixa de cima (cerca de 14 px)** é o teto, o capô e o porta-malas vistos de cima; o para-brisa e o vidro traseiro aparecem como faixas escuras. Embaixo fica a **lateral do carro virada para a câmera**, com as janelas laterais, as portas e as rodas. O carro aponta para a **direita**; o jogo espelha os que andam para a esquerda.
  - **Peças de calçada:** de frente, com o topo um pouco visível, como as fachadas na mesma câmera.
- Fundo: **transparente**.
- Estilo: pixel art no espírito de *Beat Cop*, a mesma das fachadas já entregues: paleta quente de manhã, luz da esquerda e contorno discreto.
- Resolução: **1 px da imagem = 1 px de arte**, nos tamanhos exatos da tabela. Escala de referência: as pessoas da rua têm 28 px de altura, e a porta do DHPP tem 32 px de altura e 56 px de largura.
- Formato: PNG com transparência.

## Consistência obrigatória
- Mesmo acabamento das fachadas em `public/base/street/` (`dhpp.png`, `padaria.png` etc.).
- Viatura: só "DHPP", branca com faixa preta e giroflex vermelho e azul no teto. Nada de "Polícia Civil" nem brasão real.
- Táxi: branco, com o luminoso amarelo no teto.
- Comércio e marcas fictícios. Nenhum logotipo real.
- Clima de São Paulo:
  - orelhão no formato "concha" laranja ou azul;
  - banca de jornal de metal verde com revistas penduradas;
  - lixeira laranja de poste;
  - hidrante amarelo baixo;
  - ponto de ônibus com cobertura;
  - mesas e cadeiras de plástico do bar.
- A composição e a câmera estão em `creative-requests/refs/2026-10-10-rua-camera-alta/camera-alta-no-jogo.png`. Os carros provisórios que o jogo desenha hoje, para mostrar o ângulo pedido, estão em `carros-provisorios-3-4.png`. O acabamento oficial deve ser bem mais rico que esses provisórios.

## Contexto da cena
É a rua onde o jogo começa: o Lemos desce da viatura na calçada em frente ao DHPP, com gente passando, carros e ônibus na rua e o comércio do bairro abrindo. Os veículos andam em duas faixas, um em cada sentido, e alguns ficam estacionados junto ao meio-fio, como a viatura na frente do DHPP. As peças de calçada são cenário para dar vida e profundidade.

## Arquivos esperados
Todos em `public/base/street/`. Largura × altura exatas, em pixels:

| Arquivo | Tamanho | O que é |
|---|---|---|
| `car34-viatura.png` | 74 × 40 | Viatura do DHPP (3/4) |
| `car34-taxi.png` | 68 × 40 | Táxi branco (3/4) |
| `car34-carro-vermelho.png` | 66 × 40 | Sedã popular vermelho (3/4) |
| `car34-carro-azul.png` | 62 × 40 | Hatch azul (3/4) |
| `car34-carro-verde.png` | 72 × 40 | Perua verde (3/4) |
| `car34-carro-amarelo.png` | 64 × 40 | Carro amarelo (3/4) |
| `car34-carro-prata.png` | 68 × 40 | Sedã prata (3/4) |
| `car34-onibus.png` | 156 × 62 | Ônibus municipal claro com faixa azul (3/4), porta dianteira visível |
| `prop-orelhao.png` | 24 × 44 | Orelhão "concha" no poste |
| `prop-banca.png` | 72 × 52 | Banca de jornal de metal verde, aberta, com revistas |
| `prop-lixeira.png` | 12 × 22 | Lixeira laranja de poste |
| `prop-hidrante.png` | 10 × 16 | Hidrante amarelo |
| `prop-ponto-de-onibus.png` | 64 × 58 | Ponto de ônibus com cobertura e banco |
| `prop-mesas-bar.png` | 48 × 26 | Duas mesas de plástico com cadeiras |

## Observações técnicas para integração
- O jogo carrega cada arquivo listado se ele existir, no próximo build, e não precisa de código novo. Os `car34-*` substituem os carros provisórios; os `prop-*` aparecem nos lugares já definidos da calçada. Sem o arquivo, a peça simplesmente não aparece.
- **Veículos:** rodas tocando a última linha da imagem e frente para a direita. A sombra no chão é desenhada pelo jogo; não incluir.
- **Peças de calçada:** o pé fica no centro da última linha da imagem, que é o ponto onde o jogo as apoia na calçada. Sem sombra no chão.
- Pixel art de verdade, sem suavização ao redimensionar.
- Os arquivos antigos `car-*.png`, de perfil, deixam de ser usados e podem continuar na pasta.

## Resposta do ChatGPT
Preenchido pelo ChatGPT ao concluir.

- status:
- assets criados:
- observações:
