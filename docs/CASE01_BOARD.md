# Quadro do Caso 01

O quadro da sala da equipe (base do DHPP) é onde o jogador organiza o caso. Código em `src/board/`; abre pelo objeto `quadro` da base (`startBoard` em `src/base/base.js`).

## Regras

- **Visual de filme**: a parede de investigação na penumbra (cortiça, luminária, polaroides, fichas pautadas escritas a pincel, fio vermelho, cartão preso com fita), aprovada em 14/10/2026.
- **Etapas = capítulos**: o quadro abre sempre no capítulo atual (o mesmo do aparelho). As abas mostram "Caso" (a árvore do caso inteiro) e os capítulos já alcançados; os seguintes não aparecem.
- **Árvore de dedução por capítulo** (`TREE` em `boardData.ts`): lê-se da esquerda para a direita. A pergunta do capítulo é a raiz (cartão à direita) e três galhos são perguntas menores (fichas no meio). Cada galho tem um ou dois espaços para evidências (à esquerda).
- **Pasta de evidências** (embaixo): só o que o jogador já tem e que pertence ao capítulo (`pool`). Tocar numa evidência mostra o que ela é e de onde veio (varredura, material, conversa da equipe ou a frase do depoimento) e o botão "Ver o original"; depois, tocar num espaço vazio prende a foto. Tocar numa foto presa devolve para a pasta. A pasta rola na horizontal quando há muitas e fica separada da árvore. A aba da pasta diz o que fazer agora: 1 pegar uma foto, 2 tocar num espaço vazio (que acende “prender aqui”), 3 tocar na ficha pronta para deduzir.
- **Deduzir**: com os espaços cheios, a ficha mostra "Toque para deduzir" e abre a ficha com a pergunta e as respostas (frases, ou rostos quando a pergunta é sobre pessoas; só aparecem pessoas já descobertas). O jogo confere na hora: resposta certa e evidências que a sustentam acendem o galho (fio vermelho, dedução escrita na ficha e um bilhete do Lemos). Resposta errada: bilhete da Sônia dizendo onde olhar, sem dar a resposta, e as fotos voltam para a pasta. Resposta certa com evidências que não a sustentam: a Sônia pede para trocar as fotos. Sem punição, sem contador.
- **Conclusão**: com os três galhos acesos, a raiz acende com o carimbo "CONFERE" e a conclusão do capítulo. Galho sem material ainda diz "Ainda falta material". Capítulo resolvido nunca fica sem saída: o cartão da conclusão e a aba da pasta mostram o próximo passo com botão (ir para o capítulo atual, o relatório ou a próxima ação da investigação).
- **Caso inteiro** (aba "Caso"): cada capítulo é um galho de "Quem fez o quê?"; os fechados mostram a conclusão, o atual fica destacado e os seguintes ficam tracejados.
- **Nada trava a história**: a árvore não libera nem tranca depoimentos, materiais ou capítulos; o caso continua andando pelos fatos. O próximo passo (de `src/case/nextSteps.ts`, a mesma regra da tela inicial) fica num botão no topo.
- **Relatório**: depois da confissão (`task>=8`), "Relatório" no topo e na raiz do capítulo 5. Vem preenchido com o que a árvore do capítulo 5 fechou (executores, mentor, motivo); o jogador confere os papéis, escolhe pelo menos 3 provas e protocola. A regra do final é a mesma do aparelho (`src/case/report.ts`).
- O quadro nunca rola: só a pasta e a lista de provas do relatório rolam, dentro delas.

## Dados

- Árvores dos capítulos: `TREE` em `src/board/boardData.ts` (pergunta, espaços com as pistas aceitas, respostas, a certa, e as falas do Lemos e da Sônia). Pista nova que deva entrar no quadro vai no `pool` do capítulo e, se servir para algum galho, no `need` dele. Imagens oficiais das pistas: `CARDS`; sem imagem, o papel usa o rosto de quem disse.
- Quem disse e o que sustenta confronto vêm de `src/interrogation/*.ts` e `src/team/teamData.ts`; não duplicar.
- Estado do quadro no save: `board` (`tree` com as evidências presas, o galho aceso e a resposta; `seen`, `roles`, `motive`, `proofs`). `links` e `placed` são do quadro antigo e ficam só por compatibilidade.

## Carregamento

- O quadro mostra fotos e rostos pequenos: usa as versões leves de `public/thumbs/` (mesma imagem reduzida, feita por `scripts/make-board-thumbs.py`; rodar de novo quando um asset mudar). "Ver o original" abre o arquivo oficial inteiro. Se faltar uma versão leve, a imagem cai no original sozinha.
- O carregamento do jogo é em duas fases (`src/preload/`): antes de entrar na base, o cartão de abertura mostra uma barra enquanto baixa o essencial do momento do caso (a entrada e a parede do quadro, os rostos conhecidos e o retrato completo de quem senta primeiro na sala de depoimentos); depois, o resto do caso baixa aos poucos, um arquivo por vez, parando quando algo da frente precisa da rede. Quem é chamado para depor passa na frente da fila. Tudo fica no cache do aparelho e funciona sem rede.
- A entrada de cinema começa na hora, sem espera: no cartão de abertura a base já deixa o Lemos decodificado e a cortiça e a parede do fundo desenhadas (`prewarm` em `src/base/board.tsx`); ao abrir, o quadro só copia esses desenhos. Quando o Lemos vai até o quadro ou passa perto dele, a base já monta o quadro escondido (`prepareBoard`), sem som, animação ou save; ao chegar, ele só aparece e a entrada começa no mesmo quadro. Longe do quadro, ele é desmontado; se o caso mudar, é refeito.
