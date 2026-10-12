# Arquivo Morto (Invesphone): como trabalhamos

Projeto feito em conjunto por ChatGPT e Claude. Cada um tem uma responsabilidade principal e os dois trabalham na mesma experiência.

## Divisão

- **ChatGPT**: direção criativa e visual. Cria personagens (aparência, idade aparente, roupas, cabelo), expressões, poses, retratos, imagens de interrogatório, variações emocionais e a consistência visual entre cenas. Também sugere como uma expressão ou imagem entra na narrativa.
- **Claude**: código e funcionamento. Lógica, arquitetura, React, TypeScript, CSS, componentes, save, progressão, árvores de diálogo, desbloqueios, pistas, integração dos assets, animações da interface, mobile, Safari/iPhone, build, bugs, organização e GitHub.

Fluxo: o ChatGPT cria o asset, o dono do projeto o coloca no repositório (ou o envia na conversa), e Claude identifica, liga ao personagem certo, integra à mecânica, anima, conecta a perguntas, pistas e save, testa, corrige e faz o commit.

## Regras sobre assets

- A imagem enviada é o visual oficial. Não redesenhar o personagem em CSS, não trocar por avatar genérico, não gerar outro personagem.
- Pode recortar, posicionar, animar, aplicar estados, transições e efeitos de câmera. Não pode alterar a identidade visual.
- Personagem sem asset oficial: deixar a estrutura pronta para receber e, só se necessário para desenvolver, usar placeholder temporário (as iniciais). Trocar quando o asset chegar.
- Reusar os assets oficiais em lista de pessoas, interrogatório, perfil, mensagens, evidências e arquivos.

## Expressões

Os retratos têm estados como `neutral`, `tired`, `uncomfortable`, `defensive`, `nervous`, `shaken`, `angry`, `sad`, `confident`, `scared`. A estrutura é dados por personagem:

```ts
characters.livia.assets = { neutral: {…}, nervous: {…} }   // uma imagem oficial por expressão, com as marcas de olhos e boca
```

e a pergunta escolhe a expressão nos dados (`expression: 'nervous'`). Regra narrativa fica nos dados, nunca espalhada pelo JSX.

## Nada acoplado à Lívia

Lívia é só o primeiro personagem. Componentes genéricos (`CharacterPortrait`, `CharacterScene`, `IllustratedInterrogation`, `DialogueChoices`) e dados separados por personagem. Nada de `LiviaPortrait.tsx` se a única diferença for o asset.

## Interrogatórios

Direção aprovada: sem depender de vídeo. Retrato ilustrado com expressões, microanimações discretas (respiração, leve movimento, piscar quando possível, trocas suaves de expressão, pequenos movimentos de câmera), diálogo interativo, perguntas ramificadas, pistas, desbloqueios e save. A ilustração continua sendo o centro.

Estado do código hoje: `src/characters/` tem o retrato animado genérico (uma imagem oficial por expressão com troca suave, piscar, boca sincronizada com a fala, rosto recortado para listas) e `src/interrogation/` tem dados e lógica das perguntas e o componente `IllustratedInterrogation`. A Lívia é o primeiro personagem. Guia: `docs/ILLUSTRATED_INTERROGATION.md`. A mecânica por vídeo foi removida (continua no histórico do git).

## Personagem novo

Quando o ChatGPT criar as imagens de alguém: localizar os assets, entender os estados existentes, cadastrar o personagem, criar/configurar o interrogatório, conectar perguntas, expressões, pistas, desbloqueios e save, e testar o fluxo completo.

## Como entregar

- Analisar o código existente antes de mexer. Não recriar o que já existe. Preservar save e compatibilidade.
- **Nenhuma tela do jogo exige arrastar para ver o conteúdo principal.** Resumos, fichas, mensagens, painéis e finais precisam caber inteiros na tela do celular (testar em 390×844 e 375×667): compactar o layout e, se o conteúdo variar, encolher o conjunto para caber. Só listas longas e naturalmente roláveis (ex.: anotações, mensagens) podem rolar, dentro do próprio componente. Nunca rolagem da página.
- Testar no mobile e pensar em Safari/iPhone. Rodar `npm run build` e corrigir erros de TypeScript/Vite. Verificar regressões.
- Só está pronto quando funciona, não quando o código foi escrito.
- Trabalhar em branch, abrir PR e mergear na `main` (squash). Não commitar `package-lock.json` nem `tsconfig.tsbuildinfo`.
- O Chromium dos testes automáticos não toca H.264; vídeos precisam de conversão temporária no teste. Safari real só no aparelho.


## Pedidos visuais ao ChatGPT

Quando você precisar de um asset visual novo, uma variação de personagem, expressão, pose, enquadramento ou outro material criativo que pertença à responsabilidade do ChatGPT, **não peça ao usuário para copiar uma solicitação manualmente**.

Crie um arquivo de pedido em:

`creative-requests/inbox/`

Use o modelo:

`creative-requests/TEMPLATE.md`

Cada pedido deve ser específico e conter:
- objetivo no jogo;
- personagem;
- asset necessário;
- expressão/pose;
- enquadramento;
- resolução/formato;
- referência oficial que deve ser preservada;
- quantidade;
- caminho de destino esperado;
- detalhes técnicos úteis para integração.

Exemplo de nome:

`creative-requests/inbox/2026-09-30-livia-extra-expressions.md`

Depois que o ChatGPT criar os assets, consuma diretamente os arquivos gerados no caminho registrado pelo pedido concluído.

O canal `creative-requests/` é a forma oficial de comunicação Claude → ChatGPT para demandas visuais do projeto.


## Fonte canônica do Caso 01

Antes de criar ou alterar qualquer conteúdo narrativo do Caso 01, leia:

- docs/CASE01_STORY_BIBLE.md — fonte de verdade narrativa completa.
- docs/CASE01_CANON.json — resumo estruturado das regras imutáveis, horários, solução, provas aceitas e finais.

Se uma fala antiga, placeholder, comentário de código ou tela entrar em conflito com esses arquivos, corrija o conteúdo para ficar de acordo com a bíblia. Não altere culpados, papéis, horários-chave, motivo central ou lógica das pistas sem uma mudança explicitamente aprovada pelo usuário.


## Fluxo oficial do Caso 01

Antes de alterar progressão, desbloqueios, ordem de tarefas, chamadas, interrogatórios, linha do tempo, finanças ou finais do Caso 01, consulte:

- `docs/CASE01_GAME_FLOW.md` — fluxo detalhado cena por cena, do primeiro toque ao epílogo.
- `docs/CASE01_GAME_FLOW.json` — estrutura resumida e legível por código com atos, cenas, viradas, desbloqueios e relatório final.
- `docs/CASE01_STORY_BIBLE.md` — verdade narrativa completa.
- `docs/CASE01_CANON.json` — fatos imutáveis.

O princípio de implementação é: **informação gera ação**. Não libere telas ou apps sem motivo narrativo. Cada descoberta relevante deve abrir um confronto, documento, retorno de equipe, nova tela ou mudança de estado coerente.

Se o fluxo atual em `src/App.tsx` for mais simples que o GAME FLOW, faça a migração gradualmente, preservando mecânicas boas e save. Não invente uma ordem nova em paralelo.


## Equipe operacional e solicitações

A mecânica oficial está em `docs/TEAM_MATERIAL_REQUESTS.md`.

O app Equipe funciona como **lista de integrantes + conversa individual por especialista**.

Ao alterar essa área:
- não recriar abas globais "Canal / Solicitar material";
- cada integrante tem função e especialidade próprias;
- pedidos aparecem dentro da conversa da pessoa responsável;
- pedidos só ficam disponíveis quando há base investigativa;
- materiais podem registrar pistas no save;
- nenhum integrante deve oferecer prova futura antes do gatilho narrativo;
- Sônia coordena e orienta, mas não resolve o caso;
- novos pedidos precisam declarar `memberId`.


## Investigação orientada por eventos — sem tarefas visíveis

O Caso 01 **não usa tarefas/missões como linguagem para o jogador**.

Mesmo que `game.task` permaneça temporariamente no código como marcador interno:
- não mostrar "Abrir tarefa", "Tarefa atual", contagem de tarefas ou percentual;
- não criar puzzles artificiais só para avançar;
- avançar o caso por fatos: evidência recebida, depoimento encerrado, material retornado, contradição, novo suspeito ou confissão;
- a home deve mostrar situação do caso + última atualização operacional;
- ações contextuais devem levar ao app natural (Equipe, Pessoas, Pistas, Arquivo, cena ou relatório).

Referência: seção 52 de `docs/CASE01_GAME_FLOW.md`.


## Nome e marca do órgão

O órgão de investigação do jogo é o **DHPP** (Homicídios). Sempre usar esse nome nos textos da interface (cabeçalhos, ligação, ajustes, finais); não usar "Polícia de São Paulo", "Polícia Civil" nem outro órgão. A marca d'água do órgão é a mesma em todo o jogo: `DHPP` + linha + `HOMICÍDIOS` (ver `.ii-mark`/`.ds-mark` nos depoimentos e `.hm-mark` na tela inicial).


## Conversas naturais da equipe

O app Equipe é uma mecânica narrativa, não um catálogo de ações.

Regras:
- cada integrante possui personalidade e linguagem próprias;
- novos assuntos aparecem conforme pistas, depoimentos e contradições;
- assuntos discutidos são persistidos em `teamTopics`;
- algumas diligências exigem conversa prévia;
- respostas devem soar humanas e contextualizadas;
- não usar textos genéricos como "solicitação recebida";
- o agente pode interpretar tecnicamente, mas não resolver a dedução para o jogador;
- ao expandir o caso, adicionar tanto conversas quanto pedidos, não apenas pedidos.

Fonte detalhada: `docs/TEAM_MATERIAL_REQUESTS.md`.


## Descoberta progressiva de pessoas

Nunca exponha todo o elenco do caso desde o início.

Trate separadamente:
- `discoveredPeople`: pessoa identificada pela investigação;
- `summonedPeople`: Lemos escolheu chamá-la;
- `interviewed`: depoimento concluído.

Perguntas de depoimento podem usar `revealsPeople` para introduzir novos nomes.

Conversas e diligências da equipe também podem usar `revealsPeople`.

Regras:
- descobrir não convoca automaticamente;
- convocar não significa culpa;
- pessoas ainda não descobertas não devem aparecer na interface nem ser tratadas pelo texto como conhecidas;
- novos nomes precisam surgir de informação narrativa concreta;
- uma pessoa ouvida pode revelar outra, criando cadeias de investigação;
- personagens essenciais devem preferencialmente ter rota alternativa de descoberta para evitar soft-lock.

Fonte: `docs/TEAM_MATERIAL_REQUESTS.md`, seção "Descoberta progressiva de pessoas".


## Pacote oficial de evidências do Caso 01

Os materiais visuais da equipe **já estão prontos** no repositório.

Antes de criar placeholder, mock, documento, foto de perícia ou anexo, consulte:
- `docs/CASE01_EVIDENCE_ASSETS.md`
- `public/evidence/case01/manifest.json`
- `src/evidence/case01Materials.ts`

As diligências possuem `assetPaths` oficiais.

Obrigatório:
- reutilizar esses arquivos;
- não redesenhar evidência em JSX/CSS;
- não inventar outros horários, nomes, banco, valores ou conteúdo;
- anexar o material na conversa do agente que o entregou;
- abrir fotos/documentos em visualizador com zoom no mobile;
- para gravações, usar as falas existentes em `src/interrogation/` como fonte de verdade.

Os SVGs em `public/evidence/case01/` são assets oficiais, não placeholders.


## Direção visual da rua: Beat Cop com o visual da base (aprovada em 11/10/2026)

A rua do DHPP usa a perspectiva de Beat Cop (fachadas de frente até o topo da tela, calçada vista de cima, rua horizontal com carros de lado), com o visual da planta da base e da casa: fachadas e janelas no estilo da base, o letreiro, a porta e as bandeiras reais do DHPP, os bonecos da planta, e os carros e o mobiliário oficiais do ChatGPT (`public/base/rua/veiculos`, `props`). Antes de mexer, ler `docs/RUA_BEATCOP_BASE.md`. O usuário pediu: nada de gerador externo de imagem (o que não for PNG oficial é desenhado em código) e nada de nomes de negócios brasileiros. As direções anteriores (PIX/3D e a rua americana em `docs/DIRECAO_RUA_AMERICANA_DHPP.md`) ficam só como histórico.

## Sistema de câmera

Antes de alterar enquadramento, zoom, follow, gestos, transições ou prioridades de foco, ler `docs/CAMERA_DIRECTION_SYSTEM.md`. A política compartilhada fica em `src/camera/cameraDirector.js`, mas cada cena continua dona da projeção e dos limites. Preservar a perspectiva Beat Cop da rua, a câmera oblíqua da base/casa, a escala inteira da pixel art, a carência após controle manual e `prefers-reduced-motion`. Usar `?cameraDebug=1` para inspecionar modo, prioridade, alvo e dead zone.


## Mundo vivo

Rua, base e casa têm rotinas próprias: cada personagem tem função, ritmo e lugares de trabalho, escolhe por peso o que fazer sem repetir, e reage ao Lemos e aos fatos do save, sem avançar a história sozinho. Antes de mexer em NPCs, falas ambientes ou som ambiente, ler `docs/LIVING_WORLD_SYSTEM.md`.

- Peças comuns ficam em `src/world/life.js` (escolha com memória, falas sem repetição, registro de acontecimentos, painel `?debug=1`).
- O som ambiente, sintetizado, fica em `src/world/ambientAudio.js`.
- Falas que dependem do caso precisam de condição no save.


## HUD do Lemos

Na rua e na base, a interface é o HUD do Lemos: o retrato num mostrador, a caderneta, a faixa do ambiente, a última descoberta e a pista anexada, com luz, partículas e som. Antes de mexer no cabeçalho, nas descobertas, na caderneta ou no que é anunciado ao jogador, ler `docs/HUD_LEMOS.md`. Código em `src/hud/`. O que é novo sai da comparação com o save do caso: para anunciar algo, grave no save, não chame o HUD direto.

## Ajustes: todo efeito pode ser desligado

Todo efeito visual ou sonoro (os que já existem e os que vierem) precisa estar em `src/settings/gameSettings.ts`, na categoria certa — tudo o que é visual fica na seção **Gráficos**, junto da qualidade gráfica (categorias Luz e sol, Atmosfera, Bordas da tela, Vida no cenário; criar outra dentro de Gráficos se nenhuma servir), e o que é som fica na seção **Som**, com nome curto, descrição e a opção de desligar. O código do efeito consulta `fxOn(id)` (ou o objeto `F` em `street.js`) antes de desenhar ou tocar, e reage na hora a `onFxChange`.

- As telas de ajustes são geradas desse registro: o botão de engrenagem no cabeçalho do jogo (`src/settings/settingsPanel.ts`, que gira junto com o jogo no celular em pé) e o app Ajustes do aparelho (`src/EffectsSettings.tsx`). Não escrever opção à mão em nenhuma das duas.
- O aparelho será descontinuado: o que hoje só existe no app Ajustes deve ter equivalente no painel do jogo.
- A qualidade gráfica continua valendo por cima (a baixa desliga efeitos pesados mesmo que estejam ligados aqui).
