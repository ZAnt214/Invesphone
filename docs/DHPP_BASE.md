# Base do DHPP (`/base/`)

Cena 2D navegável, feita na mesma técnica da Varredura das Acácias: pixel art procedural em canvas, câmera oblíqua, sem arte externa. Código em `src/base/base.js` e `src/base/base.css`; página em `base/index.html`.

## Como funciona
- Lemos anda tocando no chão (BFS em tiles). Arrastar move a câmera. Tocar numa pessoa ou objeto com `hot` leva até lá e abre a conversa.
- Conversas ficam em `DLG` (dados), com páginas, opções e links. Sinal amarelo = ainda não visto (`localStorage base.seen`).
- Lê `varredura.fim` (gravado ao fim da Varredura): o quadro do caso e a mesa de luz mostram só os achados vistos na casa.
- O botão **Aparelho** abre `/invesphone`; **Casa** volta à Varredura. O fim da Varredura leva a `/base/`.

## Salas
Recepção (Plantão), Sala da delegada (Sônia), Sala da equipe (Renata, Denise, Paulo, quadro do caso, mesa de Lemos), Perícia (Maurício, mesa de luz), Sala de depoimentos, Arquivo Morto, pátio com viatura.

## Regras de conteúdo
Falas só usam fatos do início do Caso 01 (cena lida, painel, Thor, valores, log pedido). Nenhum nome de envolvido é citado antes de ser descoberto. Novos textos seguem `docs/CASE01_STORY_BIBLE.md` e `docs/TEAM_MATERIAL_REQUESTS.md`.

## Pendências
- Sprites são pixel art procedural; retratos de Renata, Denise, Paulo e Maurício ainda usam iniciais nos balões (aguardam arte do ChatGPT).
- Os links levam ao app inteiro; ligação direta a Equipe/Pessoas/Arquivo depende de rota no Invesphone.
