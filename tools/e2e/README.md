# Teste de ponta a ponta: app Equipe

`team-materials.mjs` abre o jogo no Chromium (390×844) e confere:

- **A**: no começo do caso nenhuma diligência avançada aparece;
- **B**: percorre todas as conversas e diligências das 5 pessoas, confere que as 23 chegam, que cada anexo abre no visualizador e que cada imagem carrega (sem erro HTTP nem de script);
- **C**: o Tel. Helena fica bloqueado até o auto de apreensão do celular e abre depois;
- **D**: sem ouvir o Téo e sem as pistas certas, antecedentes, matrícula, termo de Cida e fachada da LAN não aparecem.

```
npm run build
npx vite preview --port 4173 --host 127.0.0.1 &
node tools/e2e/team-materials.mjs        # todos (cerca de 3 min)
ONLY=D node tools/e2e/team-materials.mjs # só um bloco (A, B, C ou D)
```

Precisa do Playwright com Chromium (`BASE` muda a URL).
