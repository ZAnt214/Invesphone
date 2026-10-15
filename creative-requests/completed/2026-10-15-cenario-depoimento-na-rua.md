---
id: 2026-10-15-cenario-depoimento-na-rua
status: delivered
requested_by: claude
priority: low
character: ""
asset_type: "cenário de fundo (ilustração)"
destination: "public/cenarios/rua-acacias/"
---

# Pedido

## Objetivo
Fundo oficial do **depoimento na rua** (`src/rua/streetDepo.js`, `docs/DEPOIMENTO_NA_RUA.md`). Hoje o fundo atrás da testemunha (fachada, janela, portão, calçada, poste) é desenhado em código, num estilo mais simples que o retrato do Jorge. Uma ilustração no mesmo estilo dos retratos deixaria a cena coerente. Por cima dela continuam vindo do código: a garoa, o giroflex, a fita, a luz do poste, os curiosos, a viatura e o helicóptero.

## O que gerar
- Quantidade: 1 cenário em 2 camadas.
- Lugar: a frente da casa da família Valença, na Rua das Acácias, de madrugada.
- Enquadramento: plano médio da fachada, de frente, na altura dos olhos de um adulto em pé na calçada. A tela do jogo é deitada (844×390).
- Composição (posições em fração da largura):
  - do meio para a direita (0,52–0,95): o portão de grade de ferro da casa, com a garagem escura atrás; é onde a testemunha fica, então essa área deve ser calma e sem detalhes chamativos;
  - um pouco à esquerda do meio (≈0,52): um poste de rua fincado na calçada, subindo até sair pelo alto do quadro (o braço e a lâmpada ficam fora do quadro);
  - à esquerda (0–0,48): o muro e a fachada com uma janela acesa (luz quente, cortina) e outra apagada; aqui ficam os curiosos, que a gente coloca por cima;
  - embaixo: a calçada molhada, com poças;
  - no alto: o beiral do telhado e um pedaço de céu noturno.
- Fundo: a cena inteira, sem pessoas, sem fita, sem chuva desenhada e sem luzes coloridas (o vermelho e azul do giroflex e o laranja do poste entram em código).
- Estilo: a mesma ilustração plana dos retratos oficiais, noturna, com pouca saturação.
- Resolução: 1688×780.
- Formato: JPG para a camada de fundo e PNG transparente para a camada da frente.

## Consistência obrigatória
- Mesmo traço e paleta dos retratos (`public/characters/jorge/expressions/neutral.jpg`).
- Casa de classe média de São Paulo, compatível com a planta da casa já usada em `/casa`: portão de grade, muro baixo, garagem.
- Sem nomes de rua, placas, números legíveis, marcas ou nomes de negócio.

## Contexto da cena
Madrugada depois do crime, garoa fina, a PM segurando a frente da casa. A cena precisa parecer quieta e fria, para o giroflex e a luz do poste se destacarem por cima.

## Arquivos esperados
- `public/cenarios/rua-acacias/frente-noite.jpg`: fachada, muro, janelas, portão, garagem, céu e calçada.
- `public/cenarios/rua-acacias/frente-noite-poste.png`: só o poste, transparente, para passar na frente da névoa e da garoa de fundo.

## Observações técnicas para integração
- O fundo aparece levemente desfocado e se move um pouco com a câmera (paralaxe). Por isso: deixar cerca de 3% de sobra em cada borda e não colocar detalhes importantes nas bordas.
- A linha da calçada deve ficar a cerca de 85% da altura e o topo do portão a cerca de 38%, para casar com a fita e os curiosos que o código coloca.

## Resposta do ChatGPT

- status: assets entregues em 15/10/2026; integração no jogo pendente.
- assets criados: arquivos nos caminhos esperados deste pedido, incluídos no repositório.
- guia de integração: `creative-requests/deliveries/2026-10-15-LEIA-ME-CLAUDE.md`.
- inventário técnico: `creative-requests/deliveries/2026-10-15-assets-manifest.json`.
- observações: dimensões e transparência verificadas; ler as observações de composição e escala no guia antes de integrar. Não foram alterados código, save ou narrativa. Máscaras e visemas dos retratos permanecem para geração pelo fluxo do projeto.

## Integração (Claude, 15/10/2026)
Integrado em `src/rua/streetDepo.js`: a fachada e o poste oficiais substituem o fundo desenhado em código; garoa, fita, giroflex e luzes continuam por cima.
