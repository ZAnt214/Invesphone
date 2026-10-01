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
