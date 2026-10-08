# Base do DHPP (`/base/`)

Cena 2D navegável, feita na mesma técnica da Varredura das Acácias: pixel art procedural em canvas, câmera oblíqua, sem arte externa. Código em `src/base/base.js` e `src/base/base.css`; página em `base/index.html`.

## Como funciona
- Tela deitada como na Varredura: com o celular em pé o app gira 90° (botão de girar na barra para voltar ao modo em pé).
- Móveis desenhados em pé na câmera oblíqua, luz por cômodo multiplicada sobre a cena (ambiente × lâmpadas), brilho nas lâmpadas, sol das janelas com poeira e vapor do café.
- Atmosfera: sombras das pessoas a partir da lâmpada mais próxima (e do sol lá fora), reflexo no piso encerado da recepção e da perícia, luz dos monitores, ventilador de teto da delegada, nuvens passando, poeira no ar, cigarro com fumaça na sala de depoimentos, bandeiras tremulando, carros na rua, pombos que voam quando Lemos chega perto, folhas caindo, faxineira com rodo e piso molhado, porta de vidro automática e gradação de cor.
- Pós-processamento (`src/base/post.js`, WebGL, estilo HD-2D): o canvas 2D é desenhado normalmente e vira textura; por cima entram brilho das luzes (bloom), profundidade de campo tilt-shift focada em Lemos (mais forte durante conversas), clima de cor por sala (`GRADE` em `base.js`: interrogatório frio, delegada quente, arquivo amarelado), vinheta e aberração leve nas bordas. Os personagens ganham luz de contorno da lâmpada mais próxima (ou do sol). Sem WebGL, ou se a GPU não acompanhar (mais de 20 ms por quadro), volta sozinho ao 2D puro. Para testar: `?fx=0` desliga, `?fx=1` força ligado. Desempenho: com o WebGL ligado o 2D é desenhado em até 2x (não 3x) e o shader amplia nítido até a resolução da tela, levando a fração do movimento da câmera para não perder suavidade; se o aparelho perder quadros, a resolução de desenho desce um degrau (2 → 1,75 → 1,5 → 1,25) e não volta a ele. `?rs=2` fixa a escala para teste e `__base.prof()` mostra os tempos. O laço de desenho não cria listas novas por quadro (fileiras, partículas, gradientes e luz de contorno são reaproveitados) para evitar engasgos do coletor de memória.
- Zoom por pinça, roda ou toque duplo, com níveis de detalhe: de longe aparecem os nomes das salas; de perto, nomes da equipe, rostos finos, piscar e textos miúdos. A conversa aproxima a câmera sozinha.
- Lemos anda tocando no chão (BFS em tiles). Arrastar move a câmera. Tocar numa pessoa ou objeto com `hot` leva até lá e abre a conversa.
- Conversas ficam em `DLG` (dados), com páginas, opções e links. Sinal amarelo = ainda não visto (`localStorage base.seen`).
- Lê `varredura.fim` (gravado ao fim da Varredura): o quadro do caso e a mesa de luz mostram só os achados vistos na casa.
- O botão **Aparelho** abre `/invesphone`; **Casa** volta à Varredura. O fim da Varredura leva a `/base/`.

## Equipe nas mesas

Sônia, Maurício, Renata, Paulo e Denise têm na base a mesma conversa do app Equipe: tocar no integrante mostra os assuntos e diligências disponíveis agora; Lemos pergunta, o integrante responde e o save do caso é gravado (assuntos, materiais, pistas e pessoas reveladas). Materiais recebidos abrem no visualizador. O sinal amarelo acende quando há assunto ou pedido novo. Chamar alguém para depoimento ainda é pelo aparelho (próxima etapa: depoimentos na sala).

## Depoimentos na sala

A mesa da sala de depoimentos lista quem a investigação já descobriu e o que dá para fazer com cada um: chamar (Téo só com as provas contra ele), ouvir, retomar quando há perguntas novas ou rever o depoimento registrado. O depoimento é o mesmo componente ilustrado do Invesphone (`src/interrogation`), montado por cima da cena (`src/base/deposition.tsx`) e gravando no save único (`src/case/depositions.ts`); deitado, o retrato fica à esquerda e as perguntas à direita. Quem foi chamado espera na cena: o primeiro na cadeira da sala, os outros no sofá da recepção (Lívia e Caio nunca juntos). As conversas da equipe que citam alguém oferecem chamar ou ouvir ali mesmo.

O Invesphone está sendo trazido para dentro das cenas por etapas, cada mecânica no seu lugar físico: Equipe nas mesas (feito), depoimentos na sala de depoimentos (feito), pistas no quadro, arquivo no Arquivo Morto, relatório na sala da delegada. O celular fica com o que é de celular: mensagens, ligações e notificações.

## Salas
Recepção (Plantão), Sala da delegada (Sônia), Sala da equipe (Renata, Denise, Paulo, quadro do caso, mesa de Lemos), Perícia (Maurício, mesa de luz), Sala de depoimentos, Arquivo Morto, pátio com viatura.

## Regras de conteúdo
Falas só usam fatos do início do Caso 01 (cena lida, painel, Thor, valores, log pedido). Nenhum nome de envolvido é citado antes de ser descoberto. Novos textos seguem `docs/CASE01_STORY_BIBLE.md` e `docs/TEAM_MATERIAL_REQUESTS.md`.

## Pendências
- Sprites são pixel art procedural; retratos de Renata, Denise, Paulo e Maurício ainda usam iniciais nos balões (aguardam arte do ChatGPT).
- Os links levam ao app inteiro; ligação direta a Equipe/Pessoas/Arquivo depende de rota no Invesphone.
