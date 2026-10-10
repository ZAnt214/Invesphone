# Quadro do Caso 01

O quadro da sala da equipe (base do DHPP) é onde o jogador organiza o caso. Código em `src/board/`; abre pelo objeto `quadro` da base (`startBoard` em `src/base/base.js`).

## Regras

- **Etapas = capítulos**: o quadro abre sempre no capítulo atual (o mesmo do aparelho) e mostra só o que ele pede, num layout próprio por capítulo (`CHAPTERS` em `boardData.ts`): 1 a cena com o croqui; 2 as pessoas com as falas de cada uma e o acesso; 3 a linha da noite, as falas sobre horário e o motivo; 4 o dinheiro e o motivo; 5 as pessoas, as provas principais e o relatório. Capítulo novo abre com o cartão do capítulo; os anteriores ficam no topo para rever; os seguintes não aparecem.
- **Entrada de cinema**: ao abrir, a luz acende, a câmera passa por trás do Lemos (de costas, olhando o quadro) e chega à cortiça; sempre que o quadro abre (4,6 s, com som gerado em `src/board/cineAudio.ts`: chuva, trânsito, relógio, interruptor e luminária falhando, respiração do Lemos, grave de cinema e papel; luz azulada da janela, facho com poeira, granulado leve; a câmera fica parada enquanto a luz acende e depois faz um só avanço contínuo), com a parede inteira do caso (papéis, fotos e fios fora de foco, sem nada que adiante a investigação) em volta do capítulo; um toque pula e "Não mostrar de novo" desliga (fica só uma aproximação curta). Arte oficial: `public/characters/lemos/back.png` (no quadro, a versão leve `public/thumbs/characters/lemos/back.webp`).
- **Painel do capítulo** (à esquerda): título, pergunta do capítulo e o **próximo passo** com atalho (falar com alguém da equipe na base, chamar, ouvir ou retomar alguém). Os passos vêm de `src/case/nextSteps.ts`, a mesma regra da tela inicial do aparelho. Tocar num papel mostra o detalhe no próprio painel. No capítulo 5 o painel vira o relatório.
- **Só entra o que o jogador já tem**: pistas do save (`clues`) e as fotos da varredura (`varredura.fim`). Pessoas só depois de descobertas (`discoveredPeople`), com carimbo de chamada/ouvida.
- **Toda pista mostra a origem**: varredura, material ou conversa da equipe (de `teamData`) e a frase exata dos depoimentos, só quando aquela pergunta foi feita.
- **Fios do jogador**: o jogador liga uma pista a uma pessoa. Se a pista sustenta uma pergunta prevista no depoimento dela (`requiresClue`, ou `requiresMaterial` cujo material exige a pista), o fio fica vermelho ("Dá para confrontar") e leva ao depoimento. Senão fica a lápis ("Só hipótese"). O fio não libera nem trava nada: os confrontos continuam aparecendo no depoimento quando a pista é registrada.
- **Linha da noite**: registros (log do alarme 23:52, nota do motel 00:56) ficam presos na hora; falas sobre horário entram quando o jogador as põe na linha. O quadro mostra o intervalo de 1h04 e a fala de Caio contra o registro, sem tirar a conclusão.
- **Relatório**: depois da confissão (`task>=8`), o jogador marca executores e mentor nas fotos, escolhe o motivo e circula pelo menos 3 provas. A regra do final é a mesma do aparelho (`src/case/report.ts`).
- Sem tarefas, contadores ou porcentagem. O quadro nunca diz quem é culpado.

## Dados

- Posição de cada pista e imagens oficiais: `src/board/boardData.ts` (`CARDS`). Pista nova do caso precisa de uma entrada ali para aparecer no quadro.
- Quem disse e o que sustenta confronto vêm de `src/interrogation/*.ts` e `src/team/teamData.ts`; não duplicar.
- Estado do quadro no save: `board` (`links`, `placed`, `seen`, `roles`, `motive`, `proofs`).

## Carregamento

- O quadro mostra fotos e rostos pequenos: usa as versões leves de `public/thumbs/` (mesma imagem reduzida, feita por `scripts/make-board-thumbs.py`; rodar de novo quando um asset mudar). "Ver o original" abre o arquivo oficial inteiro. Se faltar uma versão leve, a imagem cai no original sozinha.
- A base baixa o código, o Lemos de costas, a parede do fundo e as fontes do quadro logo depois de começar (`preloadBoard` em `src/base/board.tsx`), então a primeira abertura não espera a rede. Se ainda assim abrir antes, a entrada de cinema espera a imagem do Lemos (no máximo 1,5 s).
