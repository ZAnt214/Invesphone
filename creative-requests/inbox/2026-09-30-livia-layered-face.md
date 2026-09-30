---
id: 2026-09-30-livia-layered-face
status: pending
requested_by: claude
priority: high
character: livia
asset_type: layered-face-rig
destination: public/characters/livia/rig/
---

# Pedido

## Objetivo
Trocar as 11 imagens inteiras por um retrato em **camadas**, para a expressão mudar de forma contínua (sobrancelha sobe, olho abre, boca muda) em vez de trocar a imagem de uma vez. Hoje cada expressão é uma imagem completa e a troca aparece como um pulo, mesmo escondida num piscar. Com as partes separadas, o código move e mistura sobrancelhas, olhos e boca sobre a **mesma cabeça**, que nunca troca.

Esta é a base para todos os próximos personagens: o formato abaixo vira o padrão do projeto.

## O que gerar
Tudo em **900×1200, PNG com transparência**, no **mesmo quadro e na mesma posição** do `public/characters/livia/expressions/neutral.jpg` (canvas idêntico, sem recorte, para o encaixe ser exato pelas coordenadas).

**A. Base (1 de cada)**
1. `background.png`: só o fundo, liso, escuro, sem textura e sem a personagem (opaco).
2. `body.png`: tronco (blusa, ombros, mãos e mesa, como no neutral), sem pescoço visível acima da gola. Fundo transparente.
3. `head.png`: cabeça no **pose do neutral**: cabelo (coque e mechas), orelhas, pele, nariz e pescoço, **sem sobrancelhas, sem olhos (incluindo olheiras), sem boca**. Onde esses traços estavam, a pele deve estar lisa e contínua. Fundo transparente.
4. `hair_front.png`: só as mechas de cabelo que passam **na frente do rosto** (se houver), na posição do neutral. Fundo transparente. Se não houver nenhuma, entregue o arquivo vazio.

**B. Partes por expressão** (as 11 existentes: `neutral, tired, uncomfortable, defensive, nervous, shaken, apprehensive, lying, teary, false_relief, slightly_tired`). Para cada uma, 3 arquivos:
- `brows_<expressao>.png`: as duas sobrancelhas **e** as rugas de testa/entre as sobrancelhas dessa expressão.
- `eyes_<expressao>.png`: os dois olhos com pálpebras, cílios, olheiras e esclera, **sem íris e sem pupila** (a esclera fica branca e inteira no lugar delas). Aberto como na imagem oficial.
- `mouth_<expressao>.png`: a boca **fechada** dessa expressão (lábios, aparelho se visível).

**C. Olhos comuns (1 de cada)**
- `iris_left.png` e `iris_right.png`: íris + pupila + brilho de cada olho, sozinhos, centralizados no próprio arquivo (pode ser um recorte pequeno, por exemplo 80×80, desde que o centro seja a origem).
- `eyes_half.png` e `eyes_closed.png`: os dois olhos **meio fechados** e **fechados**, no pose do neutral, para o piscar (pálpebras, cílios e olheiras, sem íris).

Total: 4 base + 33 partes + 4 olhos = 41 arquivos.

## Consistência obrigatória
- Partes e base **vêm da arte oficial** já entregue (mesmo traço, cor e sombreado): cada expressão deve ficar **igual à imagem oficial atual** quando `brows + eyes + mouth` dela são colocados sobre `head + body + background`. Isso é o critério de aceite.
- Os traços de **todas** as expressões devem encaixar no mesmo `head.png` (pose do neutral). Nas expressões em que a cabeça original estava inclinada ou mais baixa (por exemplo `defensive`, `lying`), reposicione o traço para a cabeça do neutral, mantendo a expressão.
- Não mudar rosto, cabelo, olheiras (exceto a variação de cada expressão), aparelho nos dentes, roupa, iluminação ou proporções.
- Olhos: na esclera, sem sombra da íris. A íris é uma camada separada que o código vai mover (olhar) e recortar pelo formato da esclera.

## Contexto da cena
Interrogatório da Lívia no celular. O código vai:
- mostrar `background + body + head`, depois `eyes`, `iris`, `brows`, `mouth` e `hair_front` por cima;
- **misturar suavemente** as partes entre uma expressão e outra (em poucas centenas de ms), com leve movimento de sobrancelha e abertura de olho;
- desenhar piscar com `eyes_half` e `eyes_closed`, olhar com `iris_*` e fala com as formas de boca (`visemes.png`), como hoje.

## Arquivos esperados
Pasta `public/characters/livia/rig/`:
- `background.png`, `body.png`, `head.png`, `hair_front.png`
- `brows_<expressao>.png`, `eyes_<expressao>.png`, `mouth_<expressao>.png` (11 expressões)
- `iris_left.png`, `iris_right.png`, `eyes_half.png`, `eyes_closed.png`
- `manifest.json` com: resolução (900×1200), lista das expressões e, para `iris_left` e `iris_right`, o ponto (x, y) do centro de cada íris no pose do neutral.

## Observações técnicas para integração
- Mesmo canvas 900×1200 em **todos** os arquivos, sem recorte (as coordenadas são as do neutral). Arquivos quase vazios comprimem bem, então está ok.
- Bordas com anti-aliasing suave, sem halo claro ou escuro (nada de borda branca/preta residual de recorte).
- Sem texto, sem guias, sem HUD.
- Se alguma parte não puder sair 100% igual à oficial, liste no bloco de resposta qual e por quê; prefiro ser avisado a receber uma versão redesenhada.
- Prioridade, se precisar entregar em etapas: (1) A e C, (2) as expressões que o fluxo usa agora: `apprehensive, slightly_tired, defensive, uncomfortable, shaken, nervous, lying, false_relief, teary`, (3) `neutral, tired`.

## Resposta do ChatGPT
Preenchido pelo ChatGPT ao concluir.

- status:
- assets criados:
- observações:
