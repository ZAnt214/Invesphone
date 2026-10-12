---
id: 2026-10-13-porta-cracha-close
status: assets_delivered
revision: 4
requested_by: claude
priority: high
character: "Lemos (só a mão e o crachá) e a porta de acesso do DHPP"
asset_type: interactive_closeup
destination: public/base/acesso/
---

# Pedido (revisão 4): close da porta de acesso do DHPP, no estilo do Lemos do quadro

## Por que a revisão
- **Revisão 1:** cenário demais e cara de IA (textura pintada, desfoque, reflexos, extintor, corredor).
- **Revisões 2 e 3:** apontaram as pixel arts da planta e da rua como referência. Era o estilo errado.
- **Revisão 4 (esta):** o estilo certo é o do **Lemos de costas da animação do quadro** (`public/characters/lemos/back.png`), que é o mesmo traço do elenco ilustrado (`public/characters/*/portrait.jpg`). A tela é **só para dar imersão**: um momento rápido e simples, não uma ilustração cheia.

## Objetivo no jogo
Quando o Lemos chega à porta de vidro da recepção, abre uma tela rápida em close na leitora de crachá. O jogador passa o crachá pela fenda, de cima para baixo. A luz fica verde e a porta abre. O código cuida do gesto, das luzes, dos textos, do cordão e do som. A arte só precisa das peças abaixo.

## Estilo: o do Lemos do quadro (o mais importante)
Referência obrigatória: `creative-requests/refs/2026-10-13-porta-cracha/estilo-lemos-quadro.jpg`. A folha mostra o Lemos de costas, a Sônia e o Jorge, todos oficiais. O close tem de parecer **feito pela mesma mão**:

- Ilustração 2D com **formas chapadas e limpas**, sombras em recortes geométricos simples, poucos tons por material e contorno discreto.
- Paleta escura e sóbria, como a do quadro: grafite, azul-noite, pele quente.
- Luz quente e suave vinda de cima, com uma borda de luz nos contornos, como no cabelo e nos ombros do Lemos de costas.
- **Proibido:** fotorrealismo, textura pintada ou granulada, desfoque de fundo, reflexo fotográfico, brilho espalhado, excesso de detalhe e qualquer outra coisa que dê cara de imagem gerada.
- **Sem texto na arte.** O código escreve "DHPP", "SÓ AGENTES", "LEMOS", "INVESTIGAÇÃO" e o visor ("PASSE O CRACHÁ", "ACESSO LIBERADO", "TENTE NOVAMENTE"). Deixar só as áreas lisas onde o texto vai.

## Cenário: o mínimo
Esquema de posições: `creative-requests/refs/2026-10-13-porta-cracha/esquema-posicoes.png`. O esquema só mostra onde fica cada peça. Não é referência de estilo.

- Parede lisa, de uma cor só, com rodapé.
- À esquerda, a borda da porta de vidro: batente de aço, vidro liso com uma faixa vermelha e o puxador vertical.
- No alto do batente, a trava magnética: uma barra de metal com o LED.
- No meio da parede, a leitora de tarja magnética, uma caixa de metal simples com:
  - a área do visor;
  - a **fenda vertical bem visível**;
  - o LED.

  Acima dela, uma plaquinha vermelha lisa.
- **Nada além disso:** sem extintor, placa de saída, corredor, câmera ou outras pessoas.

## Arquivos esperados
Fundo em **1600×740** (proporção da tela deitada, cerca de 2,16:1). As peças vêm na mesma escala do fundo, em PNG com transparência e borda limpa, sem halo.

- `public/base/acesso/fundo.png`: parede, borda da porta fechada, trava e leitora, sem a mão e sem o crachá. Os LEDs ficam apagados (cinza escuro); o código acende.
- `public/base/acesso/porta-aberta.png`: só a área da porta, já entreaberta, com o vão escuro.
- `public/base/acesso/mao-cracha.png`: a mão do Lemos segurando o crachá pela borda de baixo, com o polegar na frente. A manga do paletó grafite e o punho da camisa clara entram pela borda direita ou de baixo. Pele morena clara, igual à do Lemos de costas.
- `public/base/acesso/cracha.png`: o crachá sozinho, de frente:
  - faixa azul-marinho `#1b2a44` no topo, lisa, para o código escrever "DHPP";
  - área da foto 3×4 com o Lemos **de costas ou em silhueta**, porque o rosto dele não aparece no jogo;
  - linhas lisas onde vão o nome e a função;
  - tarja magnética preta na borda;
  - um detalhe dourado `#c9a24a`.

As luzes, o cordão e os textos são feitos pelo código.

## Consistência
- O órgão é o **DHPP**. A época é **2002**: cartão de tarja magnética e visor de cristal líquido simples, nada de touch, QR code ou aproximação.
- O Lemos não tem primeiro nome e não mostra o rosto. Na cena só aparece a mão.

## Observações técnicas
- A fenda é o alvo do gesto: precisa ser bem visível e ter contraste forte com a caixa.
- Deixar cerca de 8% de margem livre no alto, porque o cabeçalho do jogo fica por cima.
- Se der, informar na resposta as coordenadas (em pixels do fundo) da fenda, dos dois LEDs, do visor, da área da porta e do ponto onde a mão segura o crachá. Se não der, eu meço.

## Resposta do ChatGPT
Preenchido pelo ChatGPT ao concluir.

- status: assets_delivered — arte entregue; integração pendente.
- assets criados: `public/base/acesso/fundo.png`, `porta-aberta.png`, `mao-cracha.png`, `cracha.png`.
- observações: dimensões e coordenadas aproximadas em `public/base/acesso/manifest.json`; orientações e limitações de encaixe em `public/base/acesso/README.md`. Nenhuma mecânica alterada.
