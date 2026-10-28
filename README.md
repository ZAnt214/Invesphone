# Arquivo Morto

Base independente do Floot para **Arquivo Morto**, um jogo narrativo de investigação criminal em formato found-phone.

## Páginas

- `/base` — **Base do DHPP**, onde o jogo começa (a raiz `/` leva para cá). De madrugada é o plantão: a Sônia passa o caso e Lemos vai para a casa. Depois da casa, a base amanhece com a equipe. Código em `src/base/` (canvas), entrada em `base/index.html`.
- `/cambio` — **Câmbio Manual**, simulador de direção para treinar câmbio, embreagem e painel no iPhone (projeto à parte do jogo). Página pronta em `public/cambio/index.html`; código e testes em `apps/cambio-manual/`.
- `/casa` — **Varredura das Acácias**: a casa do crime, segunda parte do Caso 01. Código em `src/varredura/` (canvas, sem React), entrada em `casa/index.html`.

As entradas são declaradas em `vite.config.ts` (`build.rollupOptions.input`); os redirecionamentos (raiz e o antigo `/invesphone`) ficam em `vercel.json`. Não há mais aparelho nem chamada.

## Stack

- React 18 + TypeScript
- Vite
- Framer Motion
- PWA via vite-plugin-pwa
- Save local versionado
- Sem backend obrigatório

## Rodar

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

O jogo começa no plantão de madrugada da base do DHPP, segue para a casa da Rua das Acácias e volta à base de manhã.
