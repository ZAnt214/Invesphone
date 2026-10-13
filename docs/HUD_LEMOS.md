# HUD do Lemos

Interface da rua e da base do DHPP: quase nada fica na tela até algo acontecer. Quando acontece, vem com luz, partículas, desfoque e som. A direção foi aprovada a partir das sugestões do artifact "HUD do Lemos" (3ª rodada, evolução da Noir).

Código:

- `src/hud/hud.js`: mostrador, faixa do ambiente, descoberta, evidência, caderneta e partículas.
- `src/hud/hud.css`: estilos e animações.
- `src/hud/hudAudio.js`: sons.

A integração com o jogo fica em `src/base/base.js` (bloco "HUD do Lemos") e no cabeçalho de `base/index.html`.

## O que fica sempre na tela

- **Retrato do Lemos** (`.lh-dial`), feito com um recorte do rosto da foto oficial do crachá (`public/characters/lemos/hud-rosto.jpg`, 144×144, tirado de `cracha-foto.png`):
  - mostrador de 60 marcas girando devagar;
  - brilho correndo pelo aro;
  - grão de filme parado;
  - uma luz que passa pelo rosto de vez em quando;
  - luz verde de "em serviço".

  Quando chega uma descoberta, o brilho do aro acelera (`#app.lh-alert`).
- **Nome, lugar e hora:** "LEMOS", "Investigação · DHPP" e "lugar · hora" (`#where-n`, `#clk`).
- **Botões finos à direita:**
  - caderneta (`#b-book`, com o número de pistas);
  - visão geral da rua;
  - girar;
  - casa;
  - ajustes;
  - aparelho.

  Os IDs são os mesmos do cabeçalho antigo.

## Acontecimentos

| Momento | Gatilho | O que aparece |
|---|---|---|
| Faixa do ambiente | Lemos entra num cômodo (`updateUI`) ou chega à rua (`setWhere`) | Reflexo de lente; o nome sai do desfoque letra por letra, com o subtítulo ("DHPP · Área restrita", "DHPP · Atendimento ao público", "São Paulo · outubro de 2002"); depois o nome perde o foco e some devagar (sem partículas). Espera Lemos ficar 450 ms no cômodo e não repete o mesmo lugar em menos de 45 s. |
| Nova descoberta | Chegou no save um material da equipe, uma pessoa identificada ou um depoimento registrado | Cartão de vidro no canto de baixo com sino, faixa de luz e palavras saindo do desfoque; fio de 8 s. Tocar abre o material na galeria (fotos e documentos com `assetPaths`) ou a caderneta. Vários ao mesmo tempo viram um cartão só ("· +N"), com prioridade para o material. |
| Pista anexada | Pista nova em `clues` | O documento brilha no centro, se comprime num ponto de luz e voa em rastro até a caderneta; na chegada, ondas, faíscas, o número rola e aparece "Anexado ao caso". No máximo três seguidas; as outras só somam no número. |

O jogo descobre o que é novo comparando o save do caso com o que o HUD já mostrou (`invesphone.hud.seen`). Assim, o que chegou pelo aparelho também é anunciado ao voltar para a base.

Na primeira vez, sem esse registro, ele só anota o estado atual, sem anunciar nada. A fila espera conversa, depoimento, galeria e leitora de crachá fecharem.

## Caderneta

Painel da direita, com o resto da tela escurecido. As abas são:

- **Pessoas:** quem a investigação já conhece (`discoveredPeople`), com foto, papel e situação do depoimento. O alvo marca alguém como suspeito.
- **Pistas:** as pistas registradas, da mais nova para a mais antiga; as ainda não vistas aparecem como "novo".
- **Suspeitas:** as pessoas marcadas e as suspeitas escritas pelo jogador.
- **Hipóteses:** escritas pelo jogador; dá para descartar (riscar) e reabrir.
- **Notas:** lembretes livres.

Pessoas e pistas vêm do save do caso. O que o jogador escreve fica em `invesphone.caderneta`, separado do save, para não colidir com o aparelho. "Recomeçar" nos Ajustes apaga também a caderneta e `invesphone.hud.seen`.

## Ajustes

Ficam em `src/settings/gameSettings.ts`:

- **Gráficos > Interface:**
  - "Luz e partículas da interface" (`hud.particles`);
  - "Nome da sala ao entrar" (`hud.room`);
  - "Retrato animado" (`hud.portrait`).
- **Som > Sons da interface** (`sfx.hud`).

A qualidade gráfica reduz o número de partículas: na baixa, 40%. Quem usa a opção de movimento reduzido do aparelho vê tudo sem animação.

## Detalhes técnicos

- **Partículas e luz:** num canvas próprio (`.lh-fx`) que só roda enquanto há algo animando, com soma de luz (`lighter`) e sprites de brilho.
- **Posições:** medidas por `offsetLeft`/`offsetTop` dentro de `#app`, então funcionam com a tela girada.
- **Sem desfoque do fundo:** os cartões não usam `backdrop-filter`, porque no Safari o desfoque por cima do canvas deixa rastro. O "vidro" é um gradiente escuro.
- **Fontes:** Cormorant Garamond (itálico 600) e Jost, hospedadas em `public/fonts`.
- **Desempenho:**
  - o mostrador gira como uma camada só (`will-change: transform` no `svg`), sem repintar as marcas a cada quadro;
  - `isolation: isolate` no mostrador e na foto, para os modos de mistura não lerem o canvas do jogo que muda a cada quadro;
  - faixa, cartão, evidência, caderneta e o canvas de partículas ficam com `visibility: hidden` quando parados, para não serem compostos;
  - o canvas de partículas usa no máximo 1,5× de densidade;
  - o sinal amarelo da equipe só recalcula quando o save muda (`teamNewsCount` em `base.js`).
