# Câmbio Manual — simulador de treino para iPhone

Simulador de carro com câmbio manual (padrão 1-3-5 / 2-4-R, neutro no centro) para treinar
alavanca, embreagem e acelerador no celular, em pé (vertical), no Safari.

## Estrutura

```
src/
  sim/car.ts          física: motor (curva de torque, atrito, marcha lenta/anti-stall, corte),
                      embreagem por atrito com ponto de acoplamento, relações, veículo, subida,
                      freios, diagnóstico de motor apagado, tranco, sobregiro
  sim/shifter.ts      alavanca em H: corredores, neutro, detentes, sincronizador, trava de ré, mola
  audio/engineAudio.ts  síntese Web Audio: combustão por rpm/carga, admissão, câmbio, rodagem,
                      partida, engate, arranhada, tranco, motor apagando
  train/feedback.ts   explicação de cada erro (o que aconteceu + como corrigir)
  train/runners.ts    6 exercícios de alavanca + 6 aulas de direção
  train/progress.ts   progresso salvo (localStorage)
  sim/vehicle.ts      sistemas de bordo: ignição, luzes, setas, limpadores, A/C, piloto automático
                      e limitador, Stop&Go (ISG), HAC, combustível, computador de bordo (7 telas)
  ui/cockpit/         visão do motorista em tela cheia (iPhone na horizontal): para-brisa, volante
                      com o quadro visto pelo aro, alavancas arrastáveis, chave giratória, multimídia,
                      pisca-alerta, botões giratórios do ar, câmbio no console, freio de mão, pedais;
                      close-ups para botões pequenos; "Onde fica?" e ajustes no menu discreto
  ui/cockpit/Cabin.tsx  moldura da cabine e corpo do painel: teto, serigrafia do para-brisa, colunas A
                      com tweeter, para-sóis que abaixam ao toque, topo do painel iluminado, grade do
                      desembaçador, friso, assoalho com carpete
  ui/cockpit/ClusterSvg.tsx  quadro: conta-giros e velocímetro com aros cromados e tela central
  ui/cockpit/art.ts   modo foto: carrega o pacote de arte fotorrealista de public/cambio/art/ (camadas
                      PNG + manifest.json com tamanhos e pivôs) e troca o desenho pelas fotos; sem o
                      pacote, fica o desenho vetorial. Contrato no pedido
                      creative-requests/inbox/2026-10-28-cambio-cockpit-fotorrealista.md
  sim/mirrors.ts      retrovisores: câmera virtual de cada espelho (yaw/pitch), avaliação do ajuste
                      (lateral do carro e horizonte nos externos, vidro traseiro centralizado no
                      interno), motor elétrico, carro que vem atrás, treino e dicas
  ui/cockpit/Mirrors.tsx  reflexo desenhado em canvas (rua de trás, lateral do próprio carro, carro de
                      trás com faróis à noite, gotas, repetidor da seta); comando E/D + setas na porta;
                      interno ajustado com o dedo e alavanca dia/noite
  ui/panel/           peças compartilhadas: luzes-espia, para-brisa, ajuste "Meu carro", exercício
  core/sim.ts         loop único: física a 240 Hz, áudio, treino, interface
  ui/                 painel, alavanca, pedais, instrutor, progresso
tests/                testes de unidade da física e da alavanca
e2e/iphone.mjs        teste de ponta a ponta com toques reais (multitoque) em 390×844
```

## Comandos

```
npm run build      # dist/index.html (React via CDN) e dist/test.html (React embutido)
npm test           # física e alavanca
npm run typecheck
npm run e2e        # Chromium emulando iPhone
node e2e/cockpit.mjs # cockpit horizontal em tela cheia (54 verificações)
node e2e/mirrors.mjs # retrovisores: comando elétrico, interno com o dedo, treino e aviso ao sair
node e2e/cockpit-art.mjs # modo foto com um pacote de arte de teste (e2e/make-test-art.py)
```

O registro npm não estava acessível no ambiente de desenvolvimento, então o build usa esbuild
diretamente (o mesmo transpilador do Vite). Migrar para Vite é trocar `build.mjs` por
`vite.config.ts` — o código-fonte não depende do bundler.
