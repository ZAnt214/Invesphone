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

# Partida completa

`full-playthrough.mjs` joga o caso pela interface, do primeiro toque (pular a ligação) ao final A: segue o cartão da Home, vasculha a cena, chama e ouve cada pessoa que aparece (anotando todas as frases), esgota Equipe e diligências em ciclos e monta o relatório. Falha se o jogo travar, se a Home rolar a página ou se houver erro de script/HTTP. Leva cerca de 9 min.

```
node tools/e2e/full-playthrough.mjs
```

# Outros testes

- `team-actions.mjs`: atalhos de pessoas nas conversas, materiais apresentados em depoimento, provas de apoio, relatório e ordem das mensagens.
- `screens-fit.mjs`: nenhuma tela rola a página nem passa da largura (390×844 e 375×667), sem conteúdo cortado.
- `../audit/case-audit.mjs` (não precisa de navegador): confere ids, desbloqueios, arquivos e simula a progressão para achar pista, pergunta, conversa ou diligência que nunca fica disponível. Rode depois de mexer em dados do caso.
