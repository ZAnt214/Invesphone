# Base do DHPP (`/base/`)

Cena 2D navegável, feita na mesma técnica da Varredura das Acácias: pixel art procedural em canvas, câmera oblíqua, sem arte externa. Código em `src/base/base.js` e `src/base/base.css`; página em `base/index.html`.

## Como funciona
- Tela deitada como na Varredura: com o celular em pé o app gira 90° (botão de girar na barra para voltar ao modo em pé).
- Móveis desenhados em pé na câmera oblíqua, luz por cômodo multiplicada sobre a cena (ambiente × lâmpadas), brilho nas lâmpadas, sol das janelas com poeira e vapor do café.
- Atmosfera: sombras das pessoas a partir da lâmpada mais próxima (e do sol lá fora), reflexo no piso encerado da recepção e da perícia, luz dos monitores, ventilador de teto da delegada, nuvens passando, poeira no ar, cigarro com fumaça na sala de depoimentos, bandeiras tremulando, carros na rua, pombos que voam quando Lemos chega perto, folhas caindo, faxineira com rodo e piso molhado, porta de vidro automática e gradação de cor.
- Pós-processamento (estilo HD-2D), por padrão **sem ler o quadro de volta**, porque no Safari copiar o canvas a cada quadro (para o WebGL ou para outro canvas) trava a GPU — ao minimizar e voltar, o iOS derrubava o WebGL e o jogo ficava mais leve, o que denunciou o gargalo. A profundidade de campo usa versões desfocadas, feitas uma vez, do chão, das paredes, dos móveis e das pessoas (`blurOf`), desenhadas no lugar das nítidas acima e abaixo da faixa de Lemos (`dofW`; o chão em tiras recortadas com opacidade crescente, `dofGround`) — o `backdrop-filter` foi descartado porque no iPhone ele não acompanha o canvas e deixava um fantasma atrasado ao mover o mapa; o brilho são halos somados nas fontes de luz (`glowPass`, incluindo as janelas); o clima de cor de cada sala (`GRADE` em `base.js`: interrogatório frio, delegada quente, arquivo amarelado) é um preenchimento em `soft-light`; a vinheta é o `#vig` em CSS, com intensidade por sala. Os personagens ganham luz de contorno da lâmpada mais próxima (ou do sol). `?fx=0` desliga tudo; `?fx=gl` liga a versão em WebGL (`src/base/post.js`: bloom por shader, desfoque gaussiano, aberração, desenho em 2x com ampliação nítida e resolução dinâmica), mantida para comparação. `__base.prof()` mostra os tempos. O laço de desenho não cria listas novas por quadro (fileiras, partículas, gradientes e luz de contorno são reaproveitados) para evitar engasgos do coletor de memória.
- Zoom por pinça, roda ou toque duplo, com níveis de detalhe: de longe aparecem os nomes das salas; de perto, nomes da equipe, rostos finos, piscar e textos miúdos. A conversa aproxima a câmera sozinha. O acompanhamento usa dead zone, antecipação do próximo tile, carência após gesto manual e perfis próprios para delegada, equipe, perícia, depoimentos, hall e arquivo (`docs/CAMERA_DIRECTION_SYSTEM.md`).
- Lemos anda tocando no chão (BFS em tiles). Arrastar move a câmera. Tocar numa pessoa ou objeto com `hot` leva até lá e abre a conversa.
- Conversas ficam em `DLG` (dados), com páginas, opções e links. Sinal amarelo = ainda não visto (`localStorage base.seen`).
- Lê `varredura.fim` (gravado ao fim da Varredura): o quadro do caso e a mesa de luz mostram só os achados vistos na casa.
- O botão **Aparelho** abre `/invesphone`; **Casa** volta à Varredura. O fim da Varredura leva a `/base/`.

## Rua do DHPP (lado de fora)

Direção atual, aprovada em 11/10/2026: **perspectiva Beat Cop com o visual da base/casa** (`docs/RUA_BEATCOP_BASE.md`). Substitui as direções anteriores da rua (PIX/3D e a rua americana com fachadas e pedestres do ChatGPT).

A cena (`src/base/street.js`, pintura em `src/base/streetArt.js`) mostra as fachadas de frente até o topo da tela, a calçada vista de cima e a rua horizontal com os carros de lado. O quarteirão (2480 px): GROCERY, prédio residencial, DINER, beco, **DHPP** no centro (fachada bege de siding com as janelas da planta, o mesmo letreiro DHPP | HOMICÍDIOS e a mesma porta da base, ampliados, escadinha e dois mastros com as bandeiras do Brasil e do DHPP tremulando), beco, PAWN SHOP, LAUNDRY, prédio residencial e BARBER. Os prédios vizinhos são de tijolo, com janelas no estilo da planta (moldura branca, vidro azul, ar-condicionado, floreira), cornija e escada de incêndio. Calçada de lajotas com postes, parquímetros, hidrante, lixeiras, caixas de jornal e telefone público; asfalto com vagas, tracejado branco, faixa dupla amarela e bueiros; uma segunda calçada embaixo, com ponto de ônibus e banco. Lemos e os pedestres usam os mesmos bonecos da planta. Carros e mobiliário são os PNGs oficiais de `public/base/rua/veiculos` e `props` (ampliados ×1,2 e ×1,3). Trânsito: faixa de cima para a esquerda, de baixo para a direita, cada carro seguindo o da frente, com fumaça. Pombos.

O jogo começa ali: Lemos ao lado da viatura do DHPP parada em frente à porta, o sinal amarelo sobre o DHPP. Tocar na calçada anda; tocar no prédio do DHPP leva o Lemos até a porta, ela acende e ele entra (a planta aparece na recepção). Na planta, tocar no pátio leva Lemos até a porta da frente e volta para a calçada. Enquadramento: cerca de 760 px de mundo na altura (fachadas até o topo, calçada e as faixas), dead zone e look-ahead no sentido do movimento, composição contextual da fachada e controles manuais; mesma rotação de tela e mesmo cabeçalho da base ("Rua do DHPP").

## Equipe nas mesas

Sônia, Maurício, Renata, Paulo e Denise têm na base a mesma conversa do app Equipe: tocar no integrante mostra os assuntos e diligências disponíveis agora; Lemos pergunta, o integrante responde e o save do caso é gravado (assuntos, materiais, pistas e pessoas reveladas). Materiais recebidos abrem no visualizador. O sinal amarelo acende quando há assunto ou pedido novo. Chamar alguém para depoimento ainda é pelo aparelho (próxima etapa: depoimentos na sala).

## Depoimentos na sala

A mesa da sala de depoimentos lista quem a investigação já descobriu e o que dá para fazer com cada um: chamar (Téo só com as provas contra ele), ouvir, retomar quando há perguntas novas ou rever o depoimento registrado. O depoimento é o mesmo componente ilustrado do Invesphone (`src/interrogation`), montado por cima da cena (`src/base/deposition.tsx`) e gravando no save único (`src/case/depositions.ts`); deitado, o retrato fica à esquerda e as perguntas à direita. Quem foi chamado espera na cena: o primeiro na cadeira da sala, os outros no sofá da recepção (Lívia e Caio nunca juntos). As conversas da equipe que citam alguém oferecem chamar ou ouvir ali mesmo.

O Invesphone está sendo trazido para dentro das cenas por etapas, cada mecânica no seu lugar físico: Equipe nas mesas (feito), depoimentos na sala de depoimentos (feito), pistas no quadro, arquivo no Arquivo Morto, relatório na sala da delegada. O celular fica com o que é de celular: mensagens, ligações e notificações.

## Salas e organização (aprovada em 13/10/2026)
Uma só entrada, pela **Recepção** (área pública): atendimento, espera (sofá, cadeira, bebedouro) e o painel de senha. A separação acontece lá dentro, numa divisória de vidro: o balcão do **Plantão** (atrás do vidro), uma **porta de vidro com leitor de crachá** (abre só para os agentes, com bipe e luz verde; o **Guarda**, `guarda` em `NPCDEF`/`RT`, fica ao lado) e a placa "Área restrita · só agentes". Essa porta (`GATE_X`) é a única passagem para o **Corredor restrito** (`acesso` em `ROOM_RECT`), que liga a Sala da equipe (Renata, Denise, Paulo, quadro do caso, mesa de Lemos; dela se chega à Sala da delegada e à Perícia, com a gaiola de provas), a Sala de depoimentos (com espelho de observação) e o Arquivo Morto. Quem vem depor espera na recepção. Lá fora, a Rua do DHPP; a fachada (rua e planta) é de concreto aparente com térreo de granito e a faixa institucional azul-marinho.

## Regras de conteúdo
Falas só usam fatos do início do Caso 01 (cena lida, painel, Thor, valores, log pedido). Nenhum nome de envolvido é citado antes de ser descoberto. Novos textos seguem `docs/CASE01_STORY_BIBLE.md` e `docs/TEAM_MATERIAL_REQUESTS.md`.

## Pendências
- Sprites são pixel art procedural; retratos de Renata, Denise, Paulo e Maurício ainda usam iniciais nos balões (aguardam arte do ChatGPT).
- Os links levam ao app inteiro; ligação direta a Equipe/Pessoas/Arquivo depende de rota no Invesphone.
