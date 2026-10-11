---
id: 2026-10-11-rua-us-03-fachadas-comercio
status: pending
requested_by: claude
priority: high
character: ""
asset_type: environment pixel art (fachadas + neon animado)
destination: public/base/rua/fachadas/
---

# Pedido 03 — Fachadas do comércio: DINER, GROCERY, PAWN SHOP, LAUNDRY

## Objetivo
As quatro lojas que ladeiam o DHPP na referência aprovada (duas de cada lado), com o térreo comercial e os andares residenciais de tijolo acima.

## O que gerar
Cada fachada com **330 px de altura**, pé na calçada na última linha, transparente acima do telhado:
- `diner.png` — **132×330**. Térreo cromado (faixas de metal), letreiro vermelho **DINER**, janelões com clientes sentados ao balcão, placa **OPEN**, porta com vidro. Acima: tijolo vermelho, janelas com ar-condicionado e vasos, escada de incêndio preta.
- `grocery.png` — **136×330**. Letreiro verde **GROCERY** com a faixa **COLD BEER · SODA · CIGARETTES**, vitrine com cartazes, placa **ATM**, caixotes de frutas e verduras encostados na fachada (parte da imagem), porta. Acima: tijolo, janelas, escada de incêndio.
- `pawn-shop.png` — **136×330**. Letreiro branco **PAWN SHOP** com **BUY · SELL · LOANS**, vitrine com guitarra e TV, **WE BUY** em neon (apagado na imagem base), porta com o número **213**, placa de "proibido estacionar" não (essa é peça separada). Acima: tijolo amarelado, janelas, escada de incêndio com sacada.
- `laundry.png` — **132×330**. Letreiro azul **LAUNDRY** com **WASH · DRY · FOLD**, janelões com as máquinas de lavar, **OPEN** em neon (apagado na base). Acima: tijolo marrom, janelas com ar-condicionado.
- Camadas animadas do **mesmo tamanho** da fachada correspondente, transparentes fora do que muda:
  - `diner-neon-0.png`, `diner-neon-1.png` — OPEN aceso / apagado.
  - `pawn-shop-neon-0.png`, `pawn-shop-neon-1.png` — WE BUY aceso / meio aceso (piscando).
  - `laundry-neon-0.png`, `laundry-neon-1.png` — OPEN aceso / apagado.
  - `laundry-maquinas-0.png`, `laundry-maquinas-1.png` — roupas girando nas máquinas (2 quadros).
- Profundidade em todas: vitrines e portas recuadas, letreiros e sacadas saindo da parede com sombra, peitoris e vergas salientes, escadas de incêndio com a sombra na parede.
- Fundo: transparente. Estilo: pixel art fiel à referência. Formato: PNG RGBA, alfa binário (o brilho do neon pode ter alfa parcial).

## Consistência obrigatória
- Referência: `creative-requests/refs/2026-10-11-rua-americana-dhpp/referencia-aprovada.png` (as quatro lojas).
- Escala: `docs/RUA_AMERICANA_ESPEC.md` (andar 52 px, térreo 72 px, porta 22×40, pessoa 38 px) e o guia do pedido 01.
- Nomes genéricos em inglês como na referência; nenhuma marca real.
- Janelas e andares alinhados com os do DHPP e dos prédios vizinhos (andares a cada 52 px a partir do térreo de 72 px).

## Contexto da cena
Lado esquerdo do DHPP: DINER (x 230–362) e GROCERY (x 362–498). Lado direito: PAWN SHOP (x 784–920) e LAUNDRY (x 920–1052). As pessoas andam na calçada na frente delas.

## Arquivos esperados
- `public/base/rua/fachadas/diner.png`, `grocery.png`, `pawn-shop.png`, `laundry.png`
- `public/base/rua/fachadas/diner-neon-0.png`, `diner-neon-1.png`
- `public/base/rua/fachadas/pawn-shop-neon-0.png`, `pawn-shop-neon-1.png`
- `public/base/rua/fachadas/laundry-neon-0.png`, `laundry-neon-1.png`, `laundry-maquinas-0.png`, `laundry-maquinas-1.png`

## Observações técnicas para integração
Pé da imagem = linha da calçada. Largura exata (as fachadas ficam encostadas, sem sobreposição). Nada saindo para a calçada além da linha do pé (caixotes e degraus ficam dentro da imagem).

## Resposta do ChatGPT
- status:
- assets criados:
- observações:
