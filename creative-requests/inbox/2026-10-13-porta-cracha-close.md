---
id: 2026-10-13-porta-cracha-close
status: pending
revision: 2
requested_by: claude
priority: high
character: "Lemos (só a mão e o crachá) e a porta de acesso do DHPP"
asset_type: interactive_closeup
destination: public/base/acesso/
---

# Pedido (revisão 2): close da porta de acesso do DHPP, simples e no estilo dos bonecos

## Por que a revisão
A primeira versão saiu **com cara de IA e com cenário demais**: textura pintada, degradês, desfoque, reflexos, extintor, corredor, muitos detalhes. O usuário pediu **algo simples, com o mesmo visual dos personagens do jogo**. Esta revisão substitui o pedido anterior por completo.

## Objetivo no jogo
Quando o Lemos chega à porta de vidro da recepção, abre uma tela em close na leitora de crachá. O jogador arrasta o crachá e o passa pela fenda, de cima para baixo. Se der certo, a luz fica verde e a porta abre. Se der errado, a luz fica vermelha e o jogador tenta de novo. O código cuida do gesto, das luzes, dos textos, do cordão e do som. A arte só precisa das peças abaixo.

## Estilo: igual aos bonecos (o mais importante)
Referência obrigatória: `creative-requests/refs/2026-10-13-porta-cracha/estilo-personagens-x8.png`. A folha mostra os bonecos do jogo (Lemos, Sônia, guarda e Maurício) e a porta de vidro da planta, ampliados 8 vezes. O close tem de parecer **feito pela mesma mão**:

- **Resolução baixa de verdade.** A cena inteira tem **320×148 pixels de arte**. O jogo amplia 4 vezes, sem suavizar. Cada pixel precisa ser um quadrado visível, sem meio-tom entre pixels.
- **Cores chapadas.** Cada material usa a cor base, um tom de sombra e no máximo um de luz, como no paletó do Lemos. **Proibido:** degradê, desfoque, granulado, textura, brilho espalhado, profundidade de campo, reflexo realista, luz volumétrica e ruído.
- **Contorno escuro** de 1 pixel em volta de cada peça, como nos bonecos.
- **Paleta curta, de no máximo 24 cores.** Usar as do jogo:
  - paletó do Lemos `#2b2f36`;
  - punho da camisa `#e8e4da`;
  - pele `#d9a273`;
  - gravata e cordão vermelho `#7a2a2a` / `#b02a24`;
  - azul-marinho do DHPP `#1b2a44`;
  - dourado `#c9a24a`;
  - aço da porta `#8a9099` / `#5a6068`;
  - vidro `#c4d0d8`;
  - parede `#d8d4c8`;
  - rodapé `#4a4a4a`.
- **Formas simples e legíveis**, do jeito que os bonecos são: blocos retos, poucos detalhes, nada de realismo.
- **Sem texto na arte.** O código escreve "DHPP", "SÓ AGENTES", "LEMOS", "INVESTIGAÇÃO" e o visor ("PASSE O CRACHÁ", "ACESSO LIBERADO", "TENTE NOVAMENTE") com a fonte de pixel do jogo. Deixar só as áreas lisas onde o texto vai.

## Cenário: o mínimo
Esquema de posições: `creative-requests/refs/2026-10-13-porta-cracha/esquema-posicoes.png`. O esquema só mostra onde fica cada peça. Não é referência de estilo.

- Parede lisa, de uma cor só, com rodapé.
- À esquerda, a borda da porta de vidro: batente de aço, vidro liso com a faixa vermelha e o puxador, igual à porta da planta.
- No alto do batente, a trava magnética: uma barrinha de metal com um quadradinho para o LED.
- No meio da parede, a leitora: uma caixa de metal com área lisa para o visor, **fenda vertical bem visível** e quadradinho para o LED. Acima dela, uma plaquinha lisa vermelha sem texto.
- **Nada além disso:** sem extintor, placa de saída, corredor, câmera, piso em perspectiva ou pessoas.

## Arquivos esperados
Entregar em **320×148** ou exatamente 4 vezes maior (**1280×592**), sempre com pixels quadrados e sem suavização. PNG com fundo transparente nas peças.

- `public/base/acesso/fundo.png`: parede, borda da porta fechada, trava e leitora. Sem a mão e sem o crachá. Os LEDs ficam apagados (cinza escuro); o código acende.
- `public/base/acesso/porta-aberta.png`: só a área da porta, já entreaberta, com o vão escuro, como a "Porta (aberta)" da referência.
- `public/base/acesso/mao-cracha.png`: a mão do Lemos segurando o crachá pela borda de baixo, com a manga do paletó e o punho da camisa entrando pela borda direita ou de baixo. A mão fica no mesmo estilo de bloco dos bonecos.
- `public/base/acesso/cracha.png`: o crachá sozinho, de frente, com uns 40×26 pixels de arte:
  - faixa azul-marinho no topo, lisa, para o código escrever "DHPP";
  - foto 3×4 com a cabeça do boneco do Lemos (a mesma da referência);
  - linhas lisas onde vão o nome e a função;
  - tarja magnética preta na borda;
  - um pontinho dourado.

As luzes, o cordão e os textos são feitos pelo código.

## Consistência
- O órgão é o **DHPP**. A época é **2002**: cartão de tarja magnética e visor de cristal líquido simples, nada de touch, QR code ou aproximação.
- O Lemos não mostra rosto nem tem primeiro nome. No crachá, só a cabeça do boneco, que já é a oficial.

## Observações técnicas
- A fenda é o alvo do gesto: precisa ter pelo menos 4×40 pixels de arte e contraste forte com a caixa.
- Manter uns 12 pixels de arte de margem livre no alto, porque o cabeçalho do jogo fica por cima.
- Se der, informar na resposta as coordenadas (em pixels de arte) da fenda, dos dois LEDs, do visor, da área da porta e do ponto onde a mão segura o crachá. Se não der, eu meço.

## Resposta do ChatGPT
Preenchido pelo ChatGPT ao concluir.

- status:
- assets criados:
- observações:
