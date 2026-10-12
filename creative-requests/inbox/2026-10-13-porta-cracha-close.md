---
id: 2026-10-13-porta-cracha-close
status: pending
revision: 3
requested_by: claude
priority: high
character: "Lemos (só a mão e o crachá) e a porta de acesso do DHPP"
asset_type: interactive_closeup
destination: public/base/acesso/
---

# Pedido (revisão 3): close da porta de acesso do DHPP, simples e no estilo da rua

## Por que a revisão
- **Revisão 1:** saiu com cara de IA e com cenário demais (textura pintada, degradês, desfoque, reflexos, extintor, corredor).
- **Revisão 2:** apontou os bonecos da planta como referência. Era o estilo errado.
- **Revisão 3 (esta):** o estilo certo é o **dos personagens da rua** (o Lemos da rua, o guarda do DHPP, os pedestres). A tela é **só para dar imersão**: um momento rápido e simples, não uma ilustração cheia.

## Objetivo no jogo
Quando o Lemos chega à porta de vidro da recepção, abre uma tela rápida em close na leitora de crachá. O jogador passa o crachá pela fenda, de cima para baixo. A luz fica verde e a porta abre. O código cuida do gesto, das luzes, dos textos, do cordão e do som. A arte só precisa das peças abaixo.

## Estilo: igual aos personagens da rua (o mais importante)
Referência obrigatória: `creative-requests/refs/2026-10-13-porta-cracha/estilo-rua-x8.png`. A folha mostra o Lemos da rua, o guarda do DHPP e dois pedestres, ampliados 8 vezes, tirados de `public/base/rua/personagens/lemos-rua.png` e `public/base/rua/npcs/`. O close tem de parecer **feito pela mesma mão**:

- **Mesma pixel art da rua, em escala de close.** A cena tem **320×148 pixels de arte** e o jogo amplia 4 vezes, sem suavizar. Cada pixel precisa ser um quadrado visível.
- **Mesmo tratamento dos personagens:**
  - contorno escuro quase preto;
  - sombreado em poucos tons;
  - pele quente;
  - tecidos com 3 a 4 tons e um pouco de pixel solto para textura, como no terno do Lemos.
- **Paleta da rua:** `public/base/rua/guia/paleta.json` / `paleta.png`. Não sair dela.
- **Proibido:** degradê suave, desfoque, brilho espalhado, profundidade de campo, reflexo fotográfico, luz volumétrica e ruído de IA.
- **Sem texto na arte.** O código escreve "DHPP", "SÓ AGENTES", "LEMOS", "INVESTIGAÇÃO" e o visor ("PASSE O CRACHÁ", "ACESSO LIBERADO", "TENTE NOVAMENTE") com fonte de pixel. Deixar só as áreas lisas onde o texto vai.

## Cenário: o mínimo
Esquema de posições: `creative-requests/refs/2026-10-13-porta-cracha/esquema-posicoes.png`. O esquema só mostra onde fica cada peça. Não é referência de estilo.

- Parede lisa institucional, com rodapé.
- À esquerda, a borda da porta de vidro: batente de aço, vidro com a faixa vermelha e o puxador.
- No alto do batente, a trava magnética: uma barrinha de metal com o LED.
- No meio da parede, a leitora de tarja magnética, uma caixa de metal com:
  - a área do visor;
  - a **fenda vertical bem visível**;
  - o LED.

  Acima dela, uma plaquinha vermelha lisa.
- **Nada além disso:** sem extintor, placa de saída, corredor, câmera, piso em perspectiva ou outras pessoas.

## Arquivos esperados
Entregar em **320×148** ou exatamente 4 vezes maior (**1280×592**), sempre com pixels quadrados e sem suavização. PNG com fundo transparente nas peças.

- `public/base/acesso/fundo.png`: parede, borda da porta fechada, trava e leitora. Sem a mão e sem o crachá. Os LEDs ficam apagados (cinza escuro); o código acende.
- `public/base/acesso/porta-aberta.png`: só a área da porta, já entreaberta, com o vão escuro.
- `public/base/acesso/mao-cracha.png`: a mão do Lemos segurando o crachá pela borda de baixo, com a manga do terno cinza e o punho da camisa creme entrando pela borda direita ou de baixo. Pele, terno e contorno iguais aos do Lemos da rua.
- `public/base/acesso/cracha.png`: o crachá sozinho, de frente, com uns 40×26 pixels de arte:
  - faixa azul-marinho no topo, lisa, para o código escrever "DHPP";
  - foto 3×4 com o rosto do Lemos da rua (o mesmo da referência);
  - linhas lisas onde vão o nome e a função;
  - tarja magnética preta na borda;
  - um pontinho dourado.

As luzes, o cordão e os textos são feitos pelo código.

## Consistência
- O órgão é o **DHPP**. A época é **2002**: cartão de tarja magnética e visor de cristal líquido simples, nada de touch, QR code ou aproximação.
- O Lemos não tem primeiro nome e, na cena, só aparece a mão. Na foto do crachá vai o rosto do sprite oficial da rua, sem redesenhar.

## Observações técnicas
- A fenda é o alvo do gesto: precisa ter pelo menos 4×40 pixels de arte e contraste forte com a caixa.
- Manter uns 12 pixels de arte de margem livre no alto, porque o cabeçalho do jogo fica por cima.
- Se der, informar na resposta as coordenadas (em pixels de arte) da fenda, dos dois LEDs, do visor, da área da porta e do ponto onde a mão segura o crachá. Se não der, eu meço.

## Resposta do ChatGPT
Preenchido pelo ChatGPT ao concluir.

- status:
- assets criados:
- observações:
