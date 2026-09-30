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
- Testar no mobile e pensar em Safari/iPhone. Rodar `npm run build` e corrigir erros de TypeScript/Vite. Verificar regressões.
- Só está pronto quando funciona, não quando o código foi escrito.
- Trabalhar em branch, abrir PR e mergear na `main` (squash). Não commitar `package-lock.json` nem `tsconfig.tsbuildinfo`.
- O Chromium dos testes automáticos não toca H.264; vídeos precisam de conversão temporária no teste. Safari real só no aparelho.
