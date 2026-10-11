---
id: 2026-10-11-rua-us-08-pedestres
status: pending
requested_by: claude
priority: high
character: "Pedestres da rua (figurantes)"
asset_type: character sprite sheets pixel art (animação)
destination: public/base/rua/npcs/
---

# Pedido 08 — Estilo dos NPCs e folhas de animação dos pedestres

## Objetivo
Os pedestres da rua americana, no estilo da referência: pequenos em relação às fachadas, silhuetas legíveis, roupas e paleta de cidade americana dos anos 80. Cada um com as animações de que a rua precisa.

## O que gerar
**12 pedestres**, uma folha por pessoa, **208×264** cada (8 colunas × 6 linhas de quadros **26×44**). Pessoa adulta com **38 px** do pé ao topo da cabeça, **pé no centro da última linha do quadro (x=13, y=43)**, virada para a **direita**.

Linhas da folha (de cima para baixo), quadros da esquerda para a direita; colunas que sobrarem ficam transparentes:
0. parado de lado, respirando — 4 quadros
1. andando de lado — 8 quadros (ciclo completo)
2. andando para baixo (vindo na direção da câmera) — 6 quadros
3. andando para cima (de costas) — 6 quadros
4. parado de frente — 4 quadros
5. ação própria do personagem (abaixo) — 6 quadros (em loop)

| Arquivo | Pessoa | Ação (linha 5) |
|---|---|---|
| `executivo.png` | homem de terno cinza com pasta | olhar o relógio |
| `operario.png` | homem de regata branca e jeans | enxugar a testa |
| `mulher-vestido-vermelho.png` | mulher de vestido vermelho e bolsa | procurar algo na bolsa |
| `mulher-loira.png` | mulher loira de blusa clara e saia | acenar para alguém |
| `jovem-jaqueta.png` | jovem de jaqueta jeans e boné | balançar a cabeça ouvindo walkman |
| `idoso-chapeu.png` | idoso de chapéu e bengala (anda devagar) | jogar milho para os pombos |
| `entregador.png` | entregador de boné com uma caixa | ajeitar a caixa nos braços |
| `senhora-carrinho.png` | senhora com carrinho de feira | arrumar as sacolas |
| `jaqueta-couro.png` | homem de jaqueta de couro preta | fumar |
| `estudante.png` | estudante de mochila | ler um livro |
| `corredor.png` | corredor de agasalho | alongar |
| `mulher-executiva.png` | mulher de tailleur azul com pasta | olhar o relógio |

Também: `guia-npcs.png` (**640×60**) com os 12 lado a lado, parados de frente, na escala, para conferência.

- Fundo: transparente. Estilo: pixel art fiel à referência (contorno de 1 px, luz do alto à esquerda). Formato: PNG RGBA, alfa binário.

## Consistência obrigatória
- Referência: `creative-requests/refs/2026-10-11-rua-americana-dhpp/referencia-aprovada.png` (as pessoas na calçada).
- Escala e grade: `docs/RUA_AMERICANA_ESPEC.md` e pedido 01. Variedade de tons de pele, idades e silhuetas.
- Sem logotipos ou marcas nas roupas.

## Contexto da cena
Os pedestres andam pela calçada nos dois sentidos (o jogo espelha a folha para a esquerda), às vezes param (linhas 0/4) e fazem a ação (linha 5). Linhas 2 e 3 servem para atravessar a calçada para perto/longe da câmera.

## Arquivos esperados
- `public/base/rua/npcs/<nome>.png` para os 12 da tabela
- `public/base/rua/npcs/guia-npcs.png`

## Observações técnicas para integração
Pé sempre no mesmo ponto (x=13, y=43) em todos os quadros, para a pessoa não "escorregar". Nada de sombra no chão (o jogo desenha).

## Resposta do ChatGPT
- status:
- assets criados:
- observações:
