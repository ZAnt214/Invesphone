# HUD do Lemos

Interface da rua e da base do DHPP: quase nada fica na tela até algo acontecer. Quando acontece, vem com luz, partículas, desfoque e som. A direção foi aprovada a partir das sugestões do artifact "HUD do Lemos" (3ª rodada, evolução da Noir).

Código:

- `src/hud/hud.js`: retrato, faixas de cinema com o nome do lugar, descoberta, evidência, caderneta e partículas.
- `src/hud/hud.css`: estilos e animações.
- `src/hud/hudAudio.js`: sons.

A integração com o jogo fica em `src/base/base.js` (bloco "HUD do Lemos") e no cabeçalho de `base/index.html`.

## O que fica sempre na tela

- **Retrato do Lemos** (`.lh-dial`): o recorte do rosto da foto oficial do crachá (`public/characters/lemos/hud-rosto.jpg`, 144×144, tirado de `cracha-foto.png`) num círculo de 30 px, sem moldura, com a luz verde de "em serviço". Quando chega uma descoberta, um anel âmbar fino pulsa duas vezes em volta do rosto (`#app.lh-alert`). O mostrador de 60 marcas, o brilho do aro, o grão e a luz passando pelo rosto saíram em 14/10/2026 a pedido do usuário.
- **Nome, lugar e hora:** "LEMOS" e, embaixo, "lugar · hora" em letra fina (`#where-n`, `#clk`).
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
| Faixas de cinema | Lemos fica 450 ms num lugar importante com a tela livre (`hudRoomTick` em `src/base/base.js`, a cada 200 ms) | Faixas pretas entram de cima e de baixo; na de baixo, o nome do lugar em caixa-alta espaçada, um traço e o subtítulo em âmbar. Ficam uns 3 s e saem juntas. Enquanto estão na tela, nada fica por cima (ver "Tela limpa durante as faixas"). Aparece **uma vez por sessão** em cada lugar. Ver "Onde o título aparece". |
| Nova descoberta | Chegou no save um material da equipe, uma pessoa identificada ou um depoimento registrado | Cartão de vidro no canto de baixo com sino, faixa de luz e palavras saindo do desfoque; fio de 8 s. Tocar abre o material na galeria (fotos e documentos com `assetPaths`) ou a caderneta. Vários ao mesmo tempo viram um cartão só ("· +N"), com prioridade para o material. |
| Pista anexada | Pista nova em `clues` | O documento brilha no centro, se comprime num ponto de luz e voa em rastro até a caderneta; na chegada, ondas, faíscas, o número rola e aparece "Anexado ao caso". No máximo três seguidas; as outras só somam no número. |

O jogo descobre o que é novo comparando o save do caso com o que o HUD já mostrou (`invesphone.hud.seen`). Assim, o que chegou pelo aparelho também é anunciado ao voltar para a base.

Na primeira vez, sem esse registro, ele só anota o estado atual, sem anunciar nada. A fila espera conversa, depoimento, galeria e leitora de crachá fecharem.

## Onde o título aparece

O nome do lugar só entra nos lugares que pesam na história; nos lugares de passagem ele ficaria repetindo e cansaria. A lista fica em `ROOM_TITLE` (`src/base/base.js`), com o subtítulo de cada um. Para incluir ou tirar um lugar, mexa só nela.

| Lugar | Aparece? | Subtítulo | Por quê |
|---|---|---|---|
| Rua do DHPP | sim | São Paulo · outubro de 2002 | Chegada: situa tempo e lugar |
| Prédio do DHPP (recepção ou pátio, ao chegar) | sim, com o nome "DHPP" | Departamento de Homicídios | Chegada ao prédio |
| Sala da delegada | sim | DHPP · Delegada Sônia Prado | Primeira ordem do caso |
| Sala de depoimentos | sim | DHPP · Depoimentos | Onde as pessoas são ouvidas |
| Perícia | sim | DHPP · Material do caso | Onde as provas chegam |
| Arquivo Morto | sim | DHPP · Casos encerrados | O lugar que dá nome ao jogo |
| Sala da equipe | não | | Lemos passa por ela o tempo todo |
| Corredor restrito, corredores | não | | Passagem |

A recepção e o pátio contam como um lugar só, o prédio (`PLACE_OF`). A faixa do prédio entra logo na chegada, mesmo com Lemos andando para alguém, e a leitora de crachá espera ela ficar 2,4 s na tela antes de abrir.

Cada lugar aparece uma vez por sessão do navegador: o que já foi mostrado fica em `sessionStorage` (`invesphone.hud.lugares`), então ir ao aparelho e voltar, ou o iPhone recarregar a aba, não repete. Nos outros lugares, o nome continua no cabeçalho, pequeno.

A tela precisa estar livre: sem conversa, depoimento, quadro, foto, caderneta, leitora de crachá ou tela de abertura, e sem Lemos a caminho de alguém que o jogador tocou (`P1.pend`). Como quase sempre se chega às salas importantes tocando em alguém (a Sônia, a mesa de depoimento), o nome entra quando a conversa fecha, se Lemos ainda estiver ali. Se as faixas forem cortadas nos primeiros 2,5 s porque o jogador abriu algo, o lugar não conta como mostrado e o nome volta depois.

### Tela limpa durante as faixas

Enquanto as faixas estão na tela, `#app` ganha a classe `lh-cine`:

- o cabeçalho (retrato e botões), o aviso de mensagem (`#toast`) e os cartões de descoberta e de pista somem;
- avisos novos esperam as faixas saírem (`toast` em `base.js` e a fila do HUD);
- os personagens não começam balão de fala (`bubble`);
- abrir conversa, depoimento, quadro, foto, caderneta ou a leitora de crachá tira as faixas na hora (`HUD.stopRoom`).

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
  - "Nome do lugar ao entrar" (`hud.room`);
  - "Retrato animado" (`hud.portrait`).
- **Som > Sons da interface** (`sfx.hud`).

A qualidade gráfica reduz o número de partículas: na baixa, 40%. Quem usa a opção de movimento reduzido do aparelho vê tudo sem animação.

## Detalhes técnicos

- **Partículas e luz:** num canvas próprio (`.lh-fx`) que só roda enquanto há algo animando, com soma de luz (`lighter`) e sprites de brilho.
- **Posições:** medidas por `offsetLeft`/`offsetTop` dentro de `#app`, então funcionam com a tela girada.
- **Sem desfoque do fundo:** os cartões não usam `backdrop-filter`, porque no Safari o desfoque por cima do canvas deixa rastro. O "vidro" é um gradiente escuro.
- **Fontes:** Cormorant Garamond (itálico 600) e Jost, hospedadas em `public/fonts`.
- **Desempenho:**
  - faixa, cartão, evidência, caderneta e o canvas de partículas ficam com `visibility: hidden` quando parados, para não serem compostos;
  - o canvas de partículas usa no máximo 1,5× de densidade;
  - o sinal amarelo da equipe só recalcula quando o save muda (`teamNewsCount` em `base.js`).
