# Invesphone

Base independente do Floot para **Arquivo Morto**, um jogo narrativo de investigação criminal em formato found-phone.

## Páginas

- `/` — **Varredura das Acácias**: a cena 2D do Caso 01 (estilo colônia/Norland), página inicial do site. Código em `src/varredura/` (canvas, sem React), entrada em `index.html`.
- `/invesphone` — o app Invesphone (celular do caso), mantido inteiro para ser adaptado à nova página. Entrada em `invesphone/index.html`.

As duas entradas são declaradas em `vite.config.ts` (`build.rollupOptions.input`).

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

A primeira experiência implementada é a ligação animada da Delegada Sônia, com som ativado por interação do usuário para compatibilidade com Safari/iPhone, seguida pela abertura do sistema DHPP.
