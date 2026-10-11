# Base do DHPP (`/base/`)

Cena 2D navegável, feita na mesma técnica da Varredura das Acácias: pixel art procedural em canvas, câmera oblíqua, sem arte externa. Código em `src/base/base.js` e `src/base/base.css`; página em `base/index.html`.

## Como funciona
- Tela deitada como na Varredura: com o celular em pé o app gira 90° (botão de girar na barra para voltar ao modo em pé).
- Móveis desenhados em pé na câmera oblíqua, luz por cômodo multiplicada sobre a cena (ambiente × lâmpadas), brilho nas lâmpadas, sol das janelas com poeira e vapor do café.
- Atmosfera: sombras das pessoas a partir da lâmpada mais próxima (e do sol lá fora), reflexo no piso encerado da recepção e da perícia, luz dos monitores, ventilador de teto da delegada, nuvens passando, poeira no ar, cigarro com fumaça na sala de depoimentos, bandeiras tremulando, carros na rua, pombos que voam quando Lemos chega perto, folhas caindo, faxineira com rodo e piso molhado, porta de vidro automática e gradação de cor.
- Pós-processamento (estilo HD-2D), por padrão **sem ler o quadro de volta**, porque no Safari copiar o canvas a cada quadro (para o WebGL ou para outro canvas) trava a GPU — ao minimizar e voltar, o iOS derrubava o WebGL e o jogo ficava mais leve, o que denunciou o gargalo. A profundidade de campo usa versões desfocadas, feitas uma vez, do chão, das paredes, dos móveis e das pessoas (`blurOf`), desenhadas no lugar das nítidas acima e abaixo da faixa de Lemos (`dofW`; o chão em tiras recortadas com opacidade crescente, `dofGround`) — o `backdrop-filter` foi descartado porque no iPhone ele não acompanha o canvas e deixava um fantasma atrasado ao mover o mapa; o brilho são halos somados nas fontes de luz (`glowPass`, incluindo as janelas); o clima de cor de cada sala (`GRADE` em `base.js`: interrogatório frio, delegada quente, arquivo amarelado) é um preenchimento em `soft-light`; a vinheta é o `#vig` em CSS, com intensidade por sala. Os personagens ganham luz de contorno da lâmpada mais próxima (ou do sol). `?fx=0` desliga tudo; `?fx=gl` liga a versão em WebGL (`src/base/post.js`: bloom por shader, desfoque gaussiano, aberração, desenho em 2x com ampliação nítida e resolução dinâmica), mantida para comparação. `__base.prof()` mostra os tempos. O laço de desenho não cria listas novas por quadro (fileiras, partículas, gradientes e luz de contorno são reaproveitados) para evitar engasgos do coletor de memória.
- Zoom por pinça, roda ou toque duplo, com níveis de detalhe: de longe aparecem os nomes das salas; de perto, nomes da equipe, rostos finos, piscar e textos miúdos. A conversa aproxima a câmera sozinha.
- Lemos anda tocando no chão (BFS em tiles). Arrastar move a câmera. Tocar numa pessoa ou objeto com `hot` leva até lá e abre a conversa.
- Conversas ficam em `DLG` (dados), com páginas, opções e links. Sinal amarelo = ainda não visto (`localStorage base.seen`).
- Lê `varredura.fim` (gravado ao fim da Varredura): o quadro do caso e a mesa de luz mostram só os achados vistos na casa.
- O botão **Aparelho** abre `/invesphone`; **Casa** volta à Varredura. O fim da Varredura leva a `/base/`.

## Rua do DHPP (lado de fora)

Direção aprovada em 11/10/2026: rua americana em pixel art, fiel à referência (`docs/DIRECAO_RUA_AMERICANA_DHPP.md`), com o DHPP no centro, simetria e profundidade. Substitui o visual anterior (PIX/3D, que saiu do jogo). Medidas, composição, camadas e nomes de arquivos: `docs/RUA_AMERICANA_ESPEC.md` e `src/base/ruaAssets.js`.

A cena (`src/base/street.js`) tem fachadas de frente e rua horizontal, câmera elevada (calçada, meio-fio, vagas e duas faixas de trânsito vistas de cima). O quarteirão, simétrico em torno do DHPP: esquina com a transversal N 9TH ST, prédio residencial, DINER, GROCERY, beco, **DHPP** (pórtico de pedra em arco com o escudo e a placa DHPP, escadaria recuada, porta dupla, luminárias, bandeiras dos EUA, nº 87; dois guardas no alto da escadaria), beco, PAWN SHOP, LAUNDRY, prédio residencial e esquina com a W OAK ST. Na calçada: caixa de correio, parquímetros, lixeiras, sacos, hidrante, placas, telefone público, postes, caixas de jornal, semáforos com o nome das ruas. No asfalto: vaga hachurada da viatura do DHPP em frente à delegacia, tracejado branco, faixa dupla amarela, bueiros (um solta vapor), faixas de pedestres nas esquinas. Trânsito: faixa de cima para a esquerda, de baixo para a direita, cada carro seguindo o da frente, com fumaça do escapamento. Pessoas pequenas em relação às fachadas (38 px), pombos.

O jogo começa ali: Lemos ao lado da viatura, o sinal amarelo sobre a porta do DHPP. Tocar na calçada anda; tocar no prédio do DHPP leva o Lemos ao pé da escadaria, ele sobe, os guardas batem continência, a porta abre e ele entra (a planta aparece na recepção). Na planta, tocar no pátio leva Lemos até a porta da frente e volta para a calçada, no pé da escadaria. A câmera segue o Lemos na horizontal e mostra a rua inteira na altura, como a referência; mesma rotação de tela e mesmo cabeçalho da base ("Rua do DHPP").

Arte: cada peça é um PNG oficial em `public/base/rua/`, encomendado ao ChatGPT nos pedidos `creative-requests/inbox/2026-10-11-rua-us-01` a `-11` (guia de estilo, fachada do DHPP, comércio, prédios/becos/esquinas, chão, mobiliário, veículos, pedestres, guardas, Lemos e efeitos). O build lista os PNGs presentes (`__RUA_ART__` em `vite.config.ts`); para cada peça que já chegou o jogo usa a oficial, e para as que faltam desenha um **provisório** em código no mesmo retângulo e escala (`streetArt.js`), só para desenvolver. As camadas animadas (porta, bandeiras, luzes, neon, máquinas), as folhas de pessoas (linhas e quadros da especificação), carros (rodas e giroflex), pombos, vapor e fumaça entram do mesmo jeito. Provisório não é entrega final.

## Equipe nas mesas

Sônia, Maurício, Renata, Paulo e Denise têm na base a mesma conversa do app Equipe: tocar no integrante mostra os assuntos e diligências disponíveis agora; Lemos pergunta, o integrante responde e o save do caso é gravado (assuntos, materiais, pistas e pessoas reveladas). Materiais recebidos abrem no visualizador. O sinal amarelo acende quando há assunto ou pedido novo. Chamar alguém para depoimento ainda é pelo aparelho (próxima etapa: depoimentos na sala).

## Depoimentos na sala

A mesa da sala de depoimentos lista quem a investigação já descobriu e o que dá para fazer com cada um: chamar (Téo só com as provas contra ele), ouvir, retomar quando há perguntas novas ou rever o depoimento registrado. O depoimento é o mesmo componente ilustrado do Invesphone (`src/interrogation`), montado por cima da cena (`src/base/deposition.tsx`) e gravando no save único (`src/case/depositions.ts`); deitado, o retrato fica à esquerda e as perguntas à direita. Quem foi chamado espera na cena: o primeiro na cadeira da sala, os outros no sofá da recepção (Lívia e Caio nunca juntos). As conversas da equipe que citam alguém oferecem chamar ou ouvir ali mesmo.

O Invesphone está sendo trazido para dentro das cenas por etapas, cada mecânica no seu lugar físico: Equipe nas mesas (feito), depoimentos na sala de depoimentos (feito), pistas no quadro, arquivo no Arquivo Morto, relatório na sala da delegada. O celular fica com o que é de celular: mensagens, ligações e notificações.

## Salas
Recepção (Plantão), Sala da delegada (Sônia), Sala da equipe (Renata, Denise, Paulo, quadro do caso, mesa de Lemos), Perícia (Maurício, mesa de luz), Sala de depoimentos, Arquivo Morto. Lá fora, a Rua do DHPP.

## Regras de conteúdo
Falas só usam fatos do início do Caso 01 (cena lida, painel, Thor, valores, log pedido). Nenhum nome de envolvido é citado antes de ser descoberto. Novos textos seguem `docs/CASE01_STORY_BIBLE.md` e `docs/TEAM_MATERIAL_REQUESTS.md`.

## Pendências
- Sprites são pixel art procedural; retratos de Renata, Denise, Paulo e Maurício ainda usam iniciais nos balões (aguardam arte do ChatGPT).
- Os links levam ao app inteiro; ligação direta a Equipe/Pessoas/Arquivo depende de rota no Invesphone.
