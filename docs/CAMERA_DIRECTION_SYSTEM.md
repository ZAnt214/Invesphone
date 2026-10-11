# Sistema de direção de câmera

Implementação de outubro de 2026 para Rua do DHPP, interior da base, Varredura da Rua das Acácias e depoimentos ilustrados. A câmera continua integrada aos renderizadores existentes; não existe um segundo canvas, uma projeção paralela nem uma dependência gráfica nova.

## Diagnóstico inicial

### Rua do DHPP

- A projeção Beat Cop e a escala inteira já estavam corretas, mas o acompanhamento usava um `lerp` fixo por quadro e mantinha Lemos perto do centro.
- Não havia dead zone, look-ahead, controle manual, zoom próprio nem composição específica para a fachada do DHPP.
- A resposta mudava com o FPS e a rua ignorava gestos de câmera que já existiam no interior.
- A composição vertical era boa no enquadramento padrão, mas não reagia à aproximação da entrada nem ao sentido do deslocamento.

### Interior do DHPP

- Pinça, arrasto, toque duplo, âncora do zoom e limites já existiam e foram preservados.
- O acompanhamento apontava diretamente para Lemos ou para o interlocutor, com a mesma regra em todas as salas.
- O `lerp` já era temporal, mas não havia dead zone, antecipação de caminho, estabilização ao parar, perfis por cômodo nem carência depois do controle manual.
- As conversas aproximavam a câmera, porém o foco e o acompanhamento não possuíam uma política explícita de prioridade.

### Casa da Rua das Acácias

- A cena já tinha visão geral, zoom de pixel, pinça ancorada, arrasto, limites, seleção de agentes e foco de ocorrências.
- O acompanhamento puxava o agente selecionado diretamente para o centro, sem considerar caminho, cômodo ou tempo desde o gesto manual.
- O foco de uma ocorrência e o acompanhamento normal podiam disputar a mesma posição.
- A planta já separava camadas, ordenava sprites pelo pé e fazia culling; esses sistemas foram preservados.

### Interrogatórios e retratos

- `portraitRenderer.ts` já limita e alinha a arte oficial, compõe expressões e desativa deriva/tremor em redução de movimento.
- A sala aplicava um balanço contínuo de câmera. O efeito chamava atenção mesmo sem ação narrativa e podia causar desconforto.
- O foco entre rosto, legenda e caderno já era orientado pela fase; faltava usar a própria fase como motivo do reenquadramento.

### Interface do celular e pós-processamento

- O Invesphone é uma interface, não um mundo navegável. Ele mantém viewport estável e não recebe pan, parallax ou follow artificial.
- `src/base/post.js` continua responsável apenas pelos passes visuais opcionais. A política de câmera permanece no Canvas 2D para não introduzir leituras de quadro nem custo extra no Safari.

## Arquitetura

`src/camera/cameraDirector.js` reúne somente a política compartilhada:

- prioridades de controle;
- carência do controle manual;
- foco temporário e interrupção;
- cálculo de dead zone e look-ahead;
- damping exponencial independente do FPS;
- overlay de diagnóstico.

Cada cena continua dona de sua geometria, projeção, limites, zoom e conversão entre tela e mundo. Essa divisão evita quebrar a perspectiva oblíqua da base/casa ou a projeção frontal da rua.

## Prioridades

Da maior para a menor:

| Prioridade | Uso |
|---|---|
| `narrative` | Evento narrativo obrigatório e não interrompível |
| `critical` | Entrada, saída e interação crítica |
| `context` | Foco solicitado ou acontecimento contextual |
| `manual` | Arrasto, pinça, roda e zoom do jogador |
| `follow` | Acompanhamento normal do personagem |
| `ambient` | Ajuste ambiental discreto |

Um foco acima de `manual` só bloqueia o gesto se declarar `interruptible: false`. Focos contextuais usados hoje são interrompíveis. O controle manual mantém a câmera por 2,6 s na rua/base e 2,8 s na casa; o follow só retorna depois dessa janela ou quando o jogador escolhe explicitamente um novo alvo.

## Perfis por ambiente

### Rua

- Mantém fachadas frontais, calçada vista de cima, rua horizontal e carros laterais.
- Escala final sempre inteira; `imageSmoothingEnabled` continua desligado.
- Dead zone horizontal de 13% e vertical de 12% da área visível.
- Look-ahead de até 125 px de mundo no sentido da caminhada.
- Ao se aproximar intencionalmente da porta, enquadra Lemos e DHPP juntos e sobe discretamente o centro para valorizar a fachada.
- Ao parar, retorna devagar a uma composição estável, sem oscilação.
- Pinça, roda, arrasto e toque duplo usam zoom próprio entre 1× e 2,75× e preservam o ponto sob o gesto.
- Nos extremos, o clamp mantém o quadro dentro do quarteirão; quando o viewport é maior que o mundo, centraliza o eixo em vez de gerar área inválida.

### Interior do DHPP

Perfis em `CAMERA_ROOMS` ajustam dead zone, viés e atração pelo centro arquitetônico:

| Área | Direção |
|---|---|
| Sala da delegada | Plano menor, levemente deslocado para preservar mesa e interlocução |
| Equipe | Dead zone mais larga e pouca atração, adequada à circulação entre mesas |
| Perícia | Plano compacto que mantém bancada e personagem legíveis |
| Interrogatório | Composição estável e fechada, com espaço para o cartão de conversa |
| Hall | Plano mais aberto para portas e circulação |
| Arquivo | Plano compacto para estantes e objeto interativo |
| Exterior/paredes | Dead zone mais permissiva, sem atração artificial por cômodo |

O próximo tile da rota determina o look-ahead. Quando Lemos para, a recentralização começa após 550 ms e permanece parcial para evitar que a câmera “procure” o centro. Conversas podem focalizar interlocutor/objeto sem apagar o enquadramento do cartão.

### Casa

- A visão geral existente (`FITZ`) continua sendo a referência espacial e os limites incluem terreno e margens úteis.
- O agente selecionado usa dead zone, antecipação do próximo tile e leve atração pelo cômodo atual.
- Em zoom de detalhe, a atração pelo cômodo cresce para manter móveis e objeto investigado no mesmo contexto.
- Arrasto, pinça, roda e toque duplo suspendem o acompanhamento. Selecionar novamente um agente retoma o follow de forma explícita.
- `panTo` de uma ocorrência recebe prioridade contextual e não concorre com o follow durante o foco.
- A seleção, a câmera e o zoom existentes não entram no save; a progressão investigativa permanece inalterada.

### Interrogatórios

- O plano deixou de balançar continuamente.
- Escolha da pergunta abre discretamente o quadro para o caderno.
- Pergunta aproxima 0,8%; resposta aproxima 2,2%; pressão alta permite no máximo 3,5%.
- O ponto de transformação fica na região superior central, preservando rosto, expressão, legenda e mesa.
- A transição usa easing amortecido e só ocorre quando a fase muda.
- Com redução de movimento, não há reenquadramento, transição, respiração, deriva ou tremor.

### Celular de Lemos

- Não recebe câmera de mundo. Navegação, documentos e fotografias preservam a natureza de interface.
- A passagem rua/base ↔ aparelho continua pelas transições curtas existentes, sem pan ou zoom que altere coordenadas de toque.

## Zoom e coordenadas

- Base e casa preservam os limites e o snapping existentes.
- Rua ganhou zoom ancorado: antes de trocar a escala, o sistema calcula o ponto de mundo sob o centro do gesto e recompõe a câmera para mantê-lo no mesmo ponto da tela.
- A rua quantiza a escala final para inteiro. Casa/base quantizam pelo DPR existente, evitando pixels irregulares sem impedir níveis úteis em telas Retina.
- Toda conversão usa as funções existentes `PX/PY`, `s2w` e o fator de rotação atual. O controlador compartilhado não interpreta coordenadas de toque.
- Mudanças de orientação passam por `resize`, recalculam a área útil e reaplicam clamps da cena.

## Eventos e transições

Os eventos implementados são intencionais e curtos:

- retorno à rua: plano de estabelecimento de 480 ms;
- chegada/entrada no DHPP: enquadramento conjunto de Lemos e fachada;
- entrada no interior: foco de transição de 420 ms;
- abertura de conversa: foco no interlocutor/objeto;
- ocorrência da casa: foco contextual de 650 ms;
- fases do interrogatório: reenquadramento CSS de 720 ms.

Não há zoom automático em interação comum, balanço permanente, camera shake global ou revelação antecipada de ponto investigativo.

## Mobile, HUD e áreas úteis

- Base e rua continuam usando a rotação artificial existente; a transformação dos gestos passa por `PX/PY` antes de chegar à câmera.
- A casa mantém `HUDPAD` no clamp para descontar cabeçalho e dock, em vez de usar o centro geométrico bruto.
- Conversas em paisagem deslocam o alvo horizontalmente; em retrato, verticalmente, deixando espaço para o cartão.
- Dead zones são proporcionais ao viewport e, portanto, não pressupõem uma única proporção.
- Os limites tratam viewport maior que o mundo, condição importante em 844×390, 390×844 e 375×667 após rotação/DPR.

## Acessibilidade

`prefers-reduced-motion: reduce`:

- amplia a dead zone;
- remove look-ahead;
- encurta focos automáticos para no máximo 160 ms;
- elimina o reenquadramento da sala de interrogatório;
- preserva pinça, arrasto, seleção, zoom e legibilidade;
- não adiciona tremor nem movimento respiratório global.

## Diagnóstico

Acrescente `?cameraDebug=1` à URL da base ou da casa. O overlay mostra:

- cena/cômodo;
- modo e prioridade ativos;
- posição e zoom;
- dead zone;
- alvo efetivo.

Os painéis `?debug=1` e de desempenho existentes continuam independentes. `window.__base` e `window.__acacias` continuam disponíveis para inspeção durante desenvolvimento.

## Desempenho

- O damping é O(1) por quadro e usa `dt`.
- Não foram adicionados canvases auxiliares, matrizes, leituras de pixels ou estados React por quadro.
- Culling, listas de desenho, ordenação por profundidade, camadas e pós-processamento existentes foram preservados.
- O overlay só desenha quando `cameraDebug=1`.

## Testes realizados

- `node tools/camera-system-test.mjs`: 12 verificações de dead zone, look-ahead, equivalência a 30/60 FPS, carência manual, prioridade narrativa, interrupção contextual e redução de movimento.
- `node --check`: controlador, rua, base e casa.
- `git diff --check`.
- `npm run build`: TypeScript, Vite e geração do PWA aprovados.

O teste automatizado `tools/e2e/screens-fit.mjs` foi solicitado para 390×844 e 375×667, mas não pôde iniciar: o ambiente não contém o executável Chromium e o instalador recebeu um arquivo vazio/inválido. A superfície de navegador remota também não alcança o servidor local. Por isso, gestos reais, animação em movimento, 844×390 e Safari/iPhone físico permanecem como validação manual obrigatória antes da publicação em loja.

## Comparação funcional

| Antes | Depois |
|---|---|
| Personagem puxado continuamente para o centro | Dead zone e espaço no sentido do movimento |
| `lerp` da rua dependente de quadros | Damping temporal estável |
| Mesma composição em todas as salas | Perfis por cômodo e atração arquitetônica moderada |
| Gesto manual perdido assim que o follow voltava | Carência explícita e retorno previsível |
| Rua sem câmera manual/zoom | Pan, pinça, roda, toque duplo e âncora |
| Casa centralizava o agente | Cômodo, rota e visão geral participam do quadro |
| Balanço contínuo no interrogatório | Mudanças curtas motivadas por pergunta/resposta |
| Prioridades implícitas | Política compartilhada e depurável |

Capturas “antes/depois” e vídeo de deslocamento não foram produzidos porque não houve navegador executável neste ambiente. Não substituir por imagens estáticas fabricadas: a comparação deve ser capturada na mesma revisão, viewport e posição de mundo quando o teste em navegador estiver disponível.

## Problemas conhecidos e próximos passos

- Validar pinch, rotação artificial, safe areas, notch/Dynamic Island e retorno de background em Safari real.
- Executar `screens-fit.mjs` e um percurso rua → DHPP → rua assim que houver Chromium compatível.
- Capturar os mesmos pontos nos três viewports e um vídeo curto caminhando nos dois sentidos.
- Medir conforto e legibilidade em movimento com pessoas reais; ajustar somente constantes de perfil, sem trocar a perspectiva aprovada.
- Eventos narrativos futuros podem usar `narrative` não interrompível, mas devem oferecer avanço/skip quando durarem além de uma transição curta.
