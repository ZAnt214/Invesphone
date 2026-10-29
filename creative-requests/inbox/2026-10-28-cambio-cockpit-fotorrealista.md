---
id: 2026-10-28-cambio-cockpit-fotorrealista
status: pending
requested_by: claude
priority: high
character: ""
asset_type: "interior de carro fotorrealista em camadas"
destination: "public/cambio/art/"
---

# Pedido

## Objetivo
Arte **fotorrealista** do cockpit do simulador **Câmbio Manual** (`/cambio`, código em `apps/cambio-manual/`). A página é usada por um aluno de autoescola para treinar no iPhone deitado. Ele usa embreagem, câmbio, acelerador, setas, faróis, limpadores, ar e chave.

Hoje o painel é todo desenhado em código (vetor). Ele funciona, mas não parece um carro de verdade. O dono do projeto quer olhar a tela e sentir que está sentado no banco do motorista, com profundidade, materiais e luz reais.

O código já está pronto para receber as camadas: assim que `public/cambio/art/manifest.json` existir, a página troca o desenho pelas fotos. Os comandos continuam funcionando por cima das imagens (volante girando, alavancas, chave, botões giratórios, manopla, pisca-alerta, freio de mão e pedais). Testado com um pacote falso no mesmo contrato: `apps/cambio-manual/e2e/make-test-art.py` e `e2e/cockpit-art.mjs`.

## O que gerar
- Quantidade: 1 painel-base + 13 peças separadas (lista em "Arquivos esperados").
- Assunto: interior de um **hatch compacto moderno** (anos 2020, mercado brasileiro), visto do banco do motorista. Volante à esquerda, câmbio manual de 5 marchas + ré.
- **Desenho original.** Não copiar o interior de nenhuma montadora ou modelo real. Sem logotipo, emblema, nome de marca ou texto de fabricante em lugar nenhum (nem no miolo do volante, nem na tela, nem nos botões). Nos botões, só símbolos genéricos (setas, triângulo do alerta, ventilador, A/C, recirculação, desembaçador).
- Ponto de vista: olho do motorista, sentado, um pouco acima do aro do volante, olhando para a frente. Painel na **horizontal** (celular deitado).
- Materiais:
  - plástico preto texturizado fosco (soft-touch) no painel;
  - detalhes em preto brilhante (piano black) em volta da tela e do ar;
  - prata acetinado discreto;
  - volante revestido de couro preto com costura vermelha;
  - **molduras laranja-avermelhadas nas duas saídas de ar laterais** (o dono gosta desse detalhe).
- Luz: dia nublado claro entrando pelo para-brisa, de cima e um pouco da direita. Sombras suaves e reais. Reflexo leve no topo do painel e no vidro da tela. Sem sol direto estourado.
- Estilo: foto de interior realista (render fotorrealista), nitidez alta, sem pessoas, sem mãos, sem objetos soltos.
- Resolução: **4 px por unidade** do mapa (o mapa tem 900 × 420 unidades; o painel-base tem 1200 × 420 unidades = **4800 × 1680 px**).
- Formato: PNG RGBA (com transparência).

## Consistência obrigatória
- As posições seguem **exatamente** o mapa `creative-requests/refs/2026-10-28-cambio-cockpit/mapa-de-camadas.jpg` (em unidades; multiplicar por 4 para px). A imagem `layout-atual.jpg` é o cockpit vetorial de hoje, só como guia de posição e proporção, **não de estilo**.
- O volante, o quadro, as alavancas, a chave, a tela, o pisca-alerta, os três botões giratórios do ar, a fileira de botões do ar e a manopla precisam ficar onde o mapa marca. É ali que o dedo toca.
- Padrão do câmbio gravado no topo da manopla: `1 3 5` em cima, `2 4 R` embaixo, com as linhas do H.

## Contexto da cena
É a tela principal do simulador, com o celular deitado e em tela cheia. A estrada, a chuva e os limpadores são desenhados em código atrás do para-brisa. Os ponteiros, a velocidade, a marcha e as luzes-espia do quadro também são desenhados em código, assim como a tela da central e os LEDs dos botões. A arte é o carro em volta disso tudo, parado e limpo, pronto para ser animado.

## Arquivos esperados
Todos em `public/cambio/art/`.

1. `painel-base.png` — **4800 × 1680**, a cena estática inteira, alinhada pela esquerda com o mapa. Ela tem 1200 unidades de largura porque celulares mais largos mostram mais do lado do passageiro; as unidades 0–900 são as do mapa.
   - Inclui: colunas A, painel inteiro, capô/viseira do quadro, coluna de direção (sem volante), miolo da ignição (sem a chave), saídas de ar (laterais com moldura laranja-avermelhada, centrais pretas), moldura da tela flutuante com a fileira de teclas embaixo, painel do ar com os furos dos três botões giratórios, os 4 botões do ar, os 3 botões à esquerda do volante (abaixo da saída de ar esquerda), console com nicho USB/12V, abertura do câmbio com a **coifa de couro** e o lado do passageiro com o porta-luvas.
   - **Transparente**: todo o para-brisa (acima da linha do painel, cerca de y < 110 unidades, seguindo a curva do painel), a **janela do quadro** (retângulo 172,160 → 368,258, cantos arredondados de raio 18) e o **vidro da tela** (539,96 → 701,176).
   - **Sem**: volante, alavancas, chave, botões giratórios, manopla, pisca-alerta, freio de mão e pedais. São camadas próprias.
2. `volante.png` — **1600 × 1600**: volante inteiro de frente, centrado (eixo no centro da imagem = 270,293 do mapa). Diâmetro externo do aro ≈ 362 unidades (1448 px).
   - Três raios. Botões nos raios: no esquerdo, áudio (vol+, vol−, modo, mudo); no direito, piloto automático + computador de bordo, só com símbolos.
   - Miolo liso com a marca "AIRBAG" discreta. Fundo transparente. Ele gira em código.
3. `alavanca-esquerda.png` — alavanca de setas/faróis, **horizontal**, saindo da coluna (direita da imagem) para a esquerda, com o anel giratório de luzes na ponta. Tamanho ≈ 188 × 22 unidades (752 × 88 px). Pivô na ponta da coluna (borda direita, meio da altura).
4. `alavanca-direita.png` — alavanca do limpador, espelhada (sai da coluna para a direita, pivô na borda esquerda), com o anel do intervalo/limpador traseiro na ponta.
5. `chave.png` — chave de ignição encaixada, vista de frente: lâmina + cabeça plástica preta, apontando para baixo. ≈ 25 × 60 unidades (100 × 240 px). Pivô no centro do miolo, a 10 unidades (40 px) do topo.
6. `botao-giratorio.png` — um botão giratório do ar visto de frente, ≈ 40 × 40 unidades (160 × 160 px), com recartilhado na borda e o **marcador apontando para cima**. O código usa o mesmo nos três e gira.
7. `manopla.png` — manopla do câmbio vista de cima/de trás, ≈ 40 × 32 unidades (160 × 128 px), com o padrão H gravado. Sem a coifa (a coifa está no painel-base).
8. `pisca-alerta-desligado.png` e `pisca-alerta-ligado.png` — o botão do triângulo, 32 × 32 unidades (128 × 128 px). No ligado, o triângulo vermelho aceso.
9. `freio-de-mao-baixo.png` e `freio-de-mao-puxado.png` — a ponta da alavanca do freio de mão aparecendo à direita do câmbio, na posição baixada e na puxada. Caixa de 60 × 90 unidades (240 × 360 px), colocada em 672,334.
10. `pedal-embreagem.png`, `pedal-freio.png` (80 × 40 unidades, 320 × 160 px) e `pedal-acelerador.png` (60 × 70 unidades, 240 × 280 px) — só a sapata de borracha de cada pedal, de frente. O código monta braço, curso e inclinação.
11. `manifest.json` no formato abaixo. Os valores de `w`/`h` precisam bater com o tamanho real de cada PNG, e `pivot` vem em px da própria imagem:

```json
{
  "version": 1,
  "scale": 4,
  "layers": {
    "base":          { "file": "painel-base.png", "w": 4800, "h": 1680 },
    "wheel":         { "file": "volante.png", "w": 1600, "h": 1600, "pivot": [800, 800] },
    "stalkL":        { "file": "alavanca-esquerda.png", "w": 752, "h": 88, "pivot": [752, 44] },
    "stalkR":        { "file": "alavanca-direita.png", "w": 752, "h": 88, "pivot": [0, 44] },
    "key":           { "file": "chave.png", "w": 100, "h": 240, "pivot": [50, 40] },
    "knob":          { "file": "botao-giratorio.png", "w": 160, "h": 160 },
    "gearKnob":      { "file": "manopla.png", "w": 160, "h": 128 },
    "hazardOff":     { "file": "pisca-alerta-desligado.png", "w": 128, "h": 128 },
    "hazardOn":      { "file": "pisca-alerta-ligado.png", "w": 128, "h": 128 },
    "handbrakeDown": { "file": "freio-de-mao-baixo.png", "w": 240, "h": 360 },
    "handbrakeUp":   { "file": "freio-de-mao-puxado.png", "w": 240, "h": 360 },
    "pedalClutch":   { "file": "pedal-embreagem.png", "w": 320, "h": 160 },
    "pedalBrake":    { "file": "pedal-freio.png", "w": 320, "h": 160 },
    "pedalGas":      { "file": "pedal-acelerador.png", "w": 240, "h": 280 }
  }
}
```

## Observações técnicas para integração
- **Encaixe**: a página posiciona cada peça pelo `pivot` no ponto do mapa. Se uma peça sair maior ou menor, basta corrigir `w`/`h`/`pivot` no manifest, mas o pivô precisa ser o eixo real de giro (centro do volante, ponta da coluna das alavancas, centro do miolo da chave).
- **Bordas limpas**, sem halo claro: as peças passam sobre o painel escuro.
- **Sombras**: a sombra que o volante projeta no painel e no quadro é feita em código (porque o volante gira). Não pintar a sombra do volante no painel-base. Sombras de contato fixas (botões no painel, coifa no console) podem ir pintadas.
- **Nada pintado que mude com o estado**: LEDs dos botões, luzes do quadro, conteúdo da tela, setas e faróis acendem em código. Na arte, ficam apagados.
- **Peso**: o celular baixa tudo de uma vez, então mantenha o total abaixo de ~12 MB. Se precisar, use PNG com paleta/quantização nas peças pequenas. O painel-base pode ficar maior.
- Validação sugerida (como no pacote do helicóptero): um `preview.png` montado com as camadas nas posições do manifest, para conferir o encaixe antes de entregar.

## Atualização de 29/10/2026 (moldura da cabine e retrovisores)
O cockpit vetorial ganhou moldura da cabine e retrovisores. Novo guia de posição: `creative-requests/refs/2026-10-28-cambio-cockpit/mapa-moldura.jpg`; a imagem `layout-atual.jpg` foi atualizada.

**Desenhado em código, por cima da arte. Não pintar no `painel-base.png`:**
- teto (faixa de cima até y ≈ 26 nas laterais e ≈ 12 no centro);
- para-sóis, que abaixam ao toque;
- serigrafia preta do para-brisa;
- os três retrovisores, com o reflexo animado;
- o quadro de instrumentos, que passou a ter conta-giros e velocímetro analógicos com tela central. A janela do quadro continua a mesma.

**Colunas A:** continuam no `painel-base.png`, nesta posição (unidades do mapa, x a partir da borda esquerda da cena de 900):

| Coluna | Borda | Topo (y = 0) | Base (no painel) |
|---|---|---|---|
| Esquerda | externa | x = 28 | (142, 119) |
| Esquerda | interna | x = 92 | (186, 114) |
| Direita (espelhada) | externa | x = 872 | (758, 119) |
| Direita (espelhada) | interna | x = 808 | (714, 114) |

- O tweeter fica na base de cada coluna, no topo do painel.
- Fora das colunas, acima da linha do painel, a arte fica transparente: ali aparecem a janela lateral e o retrovisor.

**Retrovisores externos:** ficam do lado de fora das colunas, desenhados em código.
- Esquerdo: caixa (2, 60) → (102, 122).
- Direito: caixa (808, 66) → (892, 120).
- Não pintar retrovisores na arte.

## Resposta do ChatGPT
Preenchido pelo ChatGPT ao concluir.

- status:
- assets criados:
- observações:
