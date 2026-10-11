---
id: 2026-10-11-rua-us-04-predios-esquinas-becos
status: completed
requested_by: claude
priority: high
character: ""
asset_type: environment pixel art (prédios, becos com profundidade, esquinas, céu)
destination: public/base/rua/fachadas/ e public/base/rua/fundo/
---

# Pedido 04 — Prédios das pontas, becos com profundidade, esquinas e céu

## Objetivo
Completar o quarteirão em volta do DHPP: os dois becos que o ladeiam (com profundidade real, como na referência), os dois prédios residenciais e as duas esquinas com as ruas transversais, mais a faixa de céu.

## O que gerar
- `beco-oeste.png` e `beco-leste.png` — **58×330** cada. Beco estreito e fundo: paredes laterais recuadas fugindo para o fundo (a da esquerda na sombra, a da direita mais clara), portão de grade de ferro no meio, escadas de incêndio nas paredes, caçambas, sacos de lixo e caixas lá dentro, prédio do fundo com janelas acesas. Os dois diferentes entre si (não espelhar).
- `predio-oeste.png` e `predio-leste.png` — **120×330** cada. Prédio residencial de tijolo (cores diferentes entre os dois), porta de entrada com 3 degraus recuados, janelas com ar-condicionado e vasos, escada de incêndio, cornija.
- `esquina-oeste.png` e `esquina-leste.png` — **110×330** cada. A rua transversal fugindo para o fundo em perspectiva (asfalto, calçadas dos dois lados, prédios ao longo dela diminuindo), com o canto do prédio da quadra seguinte. A oeste é a **N 9TH ST**, a leste a **W OAK ST** (as placas são peças separadas, pedido 06).
- `fundo/ceu.png` — **64×340**: faixa de céu de manhã (azul no alto, clareando para o horizonte), para repetir na horizontal atrás dos telhados.
- Fundo: transparente (exceto o céu). Estilo: pixel art fiel à referência. Formato: PNG RGBA, alfa binário.

## Consistência obrigatória
- Referência: `creative-requests/refs/2026-10-11-rua-americana-dhpp/referencia-aprovada.png` (os becos dos dois lados do DHPP).
- Escala e alinhamento de andares: `docs/RUA_AMERICANA_ESPEC.md` e pedido 01.
- Sem marcas, sem referências brasileiras.

## Contexto da cena
Becos: x 498–556 e 726–784. Prédios: x 110–230 e 1052–1172. Esquinas: x 0–110 e 1172–1282. A calçada principal continua na frente de tudo; na esquina, ela vira e entra na transversal.

## Arquivos esperados
- `public/base/rua/fachadas/beco-oeste.png`, `beco-leste.png`
- `public/base/rua/fachadas/predio-oeste.png`, `predio-leste.png`
- `public/base/rua/fachadas/esquina-oeste.png`, `esquina-leste.png`
- `public/base/rua/fundo/ceu.png`

## Observações técnicas para integração
Pé da imagem = linha da calçada principal. Na esquina, o asfalto da transversal chega até o pé da imagem (o jogo desenha a faixa de pedestres por cima, na calçada).

## Resposta do ChatGPT

- status: completed em 11/10/2026.
- assets criados: 7 PNGs oficiais, nos caminhos abaixo.
- observações: arquivos na escala e na grade de `src/base/ruaAssets.js`, com transparência e recortes conferidos. O carregador existente os consome automaticamente.
- validação: dimensões e células conferidas; carregamento dos 91 PNGs e entrada no DHPP passaram em cinco tamanhos de tela; `npm run build` passou. Teste de renderização em Canvas nativo, sem afirmar teste em Safari real.
- detalhes e procedência: `docs/RUA_AMERICANA_ASSETS_ENTREGUES.md`.

- `public/base/rua/fachadas/beco-leste.png`
- `public/base/rua/fachadas/beco-oeste.png`
- `public/base/rua/fachadas/esquina-leste.png`
- `public/base/rua/fachadas/esquina-oeste.png`
- `public/base/rua/fachadas/predio-leste.png`
- `public/base/rua/fachadas/predio-oeste.png`
- `public/base/rua/fundo/ceu.png`
