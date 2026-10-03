# Gerador dos documentos e croquis do Caso 01

Gera os 9 documentos e os 2 croquis de `public/evidence/case01/new/` em estilo simplificado (cartão de papel liso sobre o fundo escuro do jogo, sem efeitos de realismo).

- `base.py`: cabeçalho DHPP, carimbos, assinaturas e renderização.
- `docs1.py`: laudo preliminar. `docs2.py`: termo da irmã de Cida, auto de apreensão do celular, modelo de termo de depoimento. `docs3.py`: ficha do Gol, consulta de antecedentes, quadro de horários. `docs4.py`: matrícula do imóvel e capa do inquérito.
- `croq.py`: os dois croquis (residência e rua).
- `render.js`: captura a página com Playwright (Chromium).

Requisitos: Python 3, Node com Playwright, e as fontes do npm `@fontsource` (special-elite, courier-prime, caveat, reenie-beanie, vt323, ibm-plex-mono) instaladas em `/tmp/fonts` (`npm i --prefix /tmp/fonts ...`). Cada script grava PNG em `out/`; converta para JPG (qualidade ~88; croquis em 1600×1200) e copie para `public/evidence/case01/new/`.

Regras de conteúdo: ver `docs/CASE01_CANON.json`. Não citar pessoas ainda não descobertas pelo jogador (ex.: Téo antes da cinta bancária).
