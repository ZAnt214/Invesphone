# Rua americana — pacote visual entregue em 11/10/2026

Pedido expresso do usuário: rua americana fiel à referência aprovada, com profundidade, composição simétrica e DHPP preservado. Os onze pedidos do Claude estão concluídos em `creative-requests/completed/2026-10-11-rua-us-*`.

Foram entregues **91 PNGs** em `public/base/rua/`. O carregador automático existente, implementado pelo Claude, encontra todos eles pelos nomes de `src/base/ruaAssets.js`; não foi necessário alterar lógica ou narrativa.

| Pedido | Material | PNGs |
|---|---|---:|
| 01 | Guia de escala e paleta | 2 |
| 02 | DHPP, porta, bandeiras e luzes | 10 |
| 03 | Lojas, neon e máquinas | 12 |
| 04 | Prédios, esquinas, becos e céu | 7 |
| 05 | Chão e marcações | 11 |
| 06 | Mobiliário, semáforo e placas | 20 |
| 07 | Veículos com animação | 9 |
| 08 | Doze pedestres e guia visual | 13 |
| 09 | Dois guardas do DHPP | 2 |
| 10 | Lemos, oito linhas de animação | 1 |
| 11 | Vapor, escape, pombo e luz | 4 |

## Integração para o Claude

Usar os PNGs oficiais nos caminhos já previstos, preservando a escala, as animações, o nome DHPP e a ambientação americana. As folhas de pessoas usam células 26×44, oito colunas, pés em y=43 e colunas excedentes transparentes. Os panos, luzes e portas usam o tamanho completo da fachada, para sobreposição direta. A porta tem 44×64 em x=63/y=244, com a escadaria nos 22 px inferiores.

Se surgir qualquer necessidade visual adicional durante a integração ou teste no aparelho, criar um pedido específico em `creative-requests/inbox/`, incluindo dimensões, quadros e referência; não pedir ao usuário para copiar solicitações.

## Conferência

- 91/91 arquivos previstos encontrados, dimensões exatas e nenhum arquivo vazio.
- Alfa binário nas peças que exigem recorte; halos permitem alfa parcial.
- Células de pessoas verificadas: quadros usados preenchidos, excedentes transparentes e pés na última linha.
- Renderizador real de `src/base/street.js` carregou os 91 PNGs e completou a entrada no DHPP em 1282×556, 844×390, 667×375, 390×844 e 375×667.
- Revisão visual da rua montada e das folhas geradas.
- `npm run build` passou (TypeScript e Vite).

A verificação de renderização usou Canvas nativo com imagens locais. Ela não substitui teste de navegador e Safari/iPhone real pelo Claude.

## Procedência

Arte produzida com a ferramenta integrada imagegen, a partir da referência aprovada. Recorte e empacotamento técnico com ImageMagick; medidas geométricas, paleta e sinalização tipográfica rasterizadas. Prompts registrados, identificadores de origem, dimensões e hashes dos arquivos estão em `creative-requests/refs/2026-10-11-rua-americana-dhpp/producao-prompts.json`. A paleta também está em `public/base/rua/guia/paleta.json`.
