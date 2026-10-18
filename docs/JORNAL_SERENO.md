# Jornal Sereno

A imprensa acompanha o Caso 01, "Lar Doce Lar". Cada fato importante que entra no save faz sair uma edição do Jornal Sereno, e o jornal abre sozinho na base do DHPP. A direção foi aprovada a partir da prévia "Jornal Sereno" (artifact, outubro de 2026).

Código:

- `src/news/newspaper.js`: a folha na tela, a fila, a câmera, o grifo, os rabiscos e a aba da caderneta.
- `src/news/editions.js`: as edições (primeira página, matéria completa, grifo, rabiscos).
- `src/news/press.js`: o que o Lemos diz à imprensa e a gravação no save.
- `src/news/newsAudio.js`: sons sintetizados.
- `src/news/newspaper.css`: estilos, todos dentro de `.np`.

A integração fica em `src/base/base.js`, no bloco "Jornal Sereno". Os retratos do jornal (`public/news/rostos/`) são recortes dos retratos oficiais; a foto da casa é `public/cenarios/rua-acacias/frente-noite.jpg`. Em retícula, só com filtro de CSS.

## Quando sai cada edição

Os fatos vêm de `newsFacts(save, fimDaVarredura)`.

| Edição | Sai quando | Fato no save |
|---|---|---|
| 1º dia · "Lar doce lar" | A varredura da casa terminou | `varredura.fim` |
| 2º dia · "A filha fala" | Lívia foi ouvida | `interviewed` inclui `livia` |
| 3º dia · "Ninguém arrombou a porta" | A perícia mandou o close da fechadura | material `fechadura_porta` ou pista `livia_porta_aberta` |
| 5º dia · "Onde estão os dólares?" | A trilha do dinheiro apareceu | pista `extrato_ricardo`, `moto_dolares` ou `cinta_bancaria` |
| 7º dia · edição extra (A, B ou C) | O relatório foi protocolado | `ending` |

O texto é a versão da imprensa: não é prova e não antecipa culpa além do que já é público naquele momento do caso. Para mudar quando uma edição sai, mexa em `newsFacts` e no `need` da edição.

## Abre sozinho, sem interromper

Não há botão para abrir o jornal. Quando um fato libera uma edição:

1. Ela é publicada 2 s depois do fato.
2. Entra na fila e espera a tela ficar livre por 1,5 s.

A tela está livre quando não há:

- conversa, depoimento, quadro do caso ou foto aberta;
- leitora de crachá, caderneta ou ajustes;
- faixas de cinema na tela;
- Lemos a caminho de alguém que o jogador tocou.

Várias edições abrem uma de cada vez, na ordem do caso.

- **Com o jornal aberto:** o jogo para de desenhar (como no depoimento) e os cartões de descoberta e os avisos esperam.
- **Edição nova:** toca a vinheta de notícia nova e a folha cai aberta, desdobrando, no impacto.
- **Primeira vez com este registro:** num caso já em andamento, as edições anteriores entram como lidas e só a mais nova abre.

## Na folha

- **Navegar:**
  - arrastar, com inércia;
  - pinça;
  - toque duplo para aproximar e afastar;
  - minimapa;
  - no teclado: setas, + e −, PgUp/PgDn e Esc.

  Com o celular em pé o jogo está girado; o jornal recebe o ponto já nas coordenadas do jogo.
- **Duas páginas:** a primeira página e a matéria completa ("Continua na página", setas do rodapé).
- **Grifo:** cada edição tem um trecho tracejado. Tocar nele passa o marca-texto e guarda a edição na caderneta como versão da imprensa, nunca como prova.
- **Rabiscos do Lemos:** circulados e notas adesivas aparecem quando ele já sabe algo que o jornal não sabia (por exemplo, "ninguém arrombou!" na edição do 1º dia, se a pista da porta já está no save).
- **Botões:**
  - Edições: a gaveta com as edições publicadas;
  - Guardar;
  - Fechar.

## O que o Lemos diz à imprensa

As falas possíveis ficam em `PRESS` (`src/news/press.js`), uma lista por momento: `e1` no portão da casa, `e2` na saída do DHPP depois da Lívia, `e4` depois da pista do dinheiro. O que ele disse fica no save do caso, em `press: {e1:'aberto', ...}`, gravado por `pressSay(momento, id, fatos)`:

- A primeira resposta é a que vale.
- Uma fala que revela pista (`need`) só pode ser dita se o Lemos já tem a pista.

A edição daquele momento publica a fala:

- **Quadro "O que diz o DHPP":** a foto do Lemos, a frase entre aspas e "Investigador Lemos, no portão da casa". Para "Sem comentários" ou se ele não atendeu, sai só uma linha.
- **Texto da edição:**
  - "Não descartamos nenhuma hipótese" vira o resumo da polícia.
  - Revelar que não houve arrombamento muda a linha fina e a pergunta da capa para "Quem tinha a chave?".
  - O apelo abre o quadro "DHPP pede ajuda".
  - Dizer o valor muda a manchete para "Onde estão os US$ 5 mil?".

Na casa, o evento "Imprensa no portão" decide `e1`. "Lemos atende" abre a **entrevista** (a cena do depoimento na rua em modo imprensa, ver `docs/DEPOIMENTO_NA_RUA.md`, "Entrevista"): a repórter da TV Sereno pergunta, o jogador escolhe a frase do Lemos entre as de `PRESS.e1` (a que revela pista só aparece se ele já tem `porta_intacta`), ela reage e a frase é gravada com `pressSay`. "Ninguém fala agora" grava `ausente` sem abrir a cena. As entrevistas de `e2` e `e4`, na base, ainda não têm cena.

## Caderneta

A aba **Jornal** (depois de "Caso") lista as edições publicadas, da mais nova para a mais antiga, com "guardada" e o grifo. "Ler" reabre a edição. O registro do jornal fica em `invesphone.jornal`, separado do save:

- publicadas;
- lidas;
- guardadas;
- grifos.

Ele entra em `CASE_STORAGE`, então "Recomeçar" o apaga.

## Ajustes

- **Gráficos > Interface > Jornal animado** (`news.anim`): a folha desdobrando, a página virando e os rabiscos à mão. Desligado, tudo aparece pronto. `prefers-reduced-motion` faz o mesmo.
- **Som > Vinheta do jornal** (`sfx.newsSting`): o plantão de notícia nova.
- **Som > Jornal** (`sfx.news`): o papel, o marca-texto e a caneta.

## Fontes

O jogo não baixa fontes de fora. Os títulos do jornal usam apelidos com `local()` (`NP Imp`, `NP Disp`, `NP Cond` em `newspaper.css`) que pegam a fonte condensada e a serifada do aparelho (Avenir Next Condensed e Didot no iPhone). A manchete se ajusta sozinha ao número de linhas (`data-l`) e à largura, e o corpo encolhe se passar do rodapé. O HUD usa Cormorant e Jost, e os rabiscos usam Caveat, que já vêm com o jogo.
