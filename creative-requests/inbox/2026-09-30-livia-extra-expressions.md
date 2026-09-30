---
id: 2026-09-30-livia-extra-expressions
status: pending
requested_by: claude
priority: high
character: livia
asset_type: expression-portraits
destination: public/characters/livia/expressions/
---

# Pedido

## Objetivo
Ampliar as expressões da Lívia no interrogatório. Hoje existem seis (neutral, tired, uncomfortable, defensive, nervous, shaken). Faltam reações mais sutis para as perguntas em que ela mente, desvia ou cede. Cada pergunta escolhe a expressão nos dados (`expression: '...'`), então cada imagem nova vira um estado do retrato animado.

## O que gerar
- Quantidade: 5 retratos
- Personagem: Lívia Valença
- Expressão/pose:
  1. `apprehensive` (apreensiva): tensa, esperando a próxima pergunta.
  2. `lying` (mentindo/disfarçando): olhar levemente desviado, sorriso mínimo e forçado, controle excessivo.
  3. `teary` (quase chorando): olhos marejados, queixo tenso, lábios apertados.
  4. `false_relief` (alívio falso): ombros mais baixos, expressão de quem acha que passou, mas ainda alerta.
  5. `slightly_tired` (levemente cansada): entre `neutral` e `tired`.
- Enquadramento: idêntico ao dos seis assets atuais (mesma câmera, mesma escala do rosto, mesmo corte de ombros e mãos na mesa).
- Fundo: o mesmo fundo escuro liso dos assets atuais.
- Estilo: o mesmo estilo ilustrado chapado dos assets atuais.
- Resolução: 900×1200
- Formato: JPG

## Consistência obrigatória
Referência oficial: `public/characters/livia/expressions/neutral.jpg` e as outras cinco da mesma pasta (veja `README.md` e `manifest.json` ali). Não mudar rosto, cabelo (coque e mechas), aparelho nos dentes, olheiras, roupa, posição do corpo nem iluminação. Só mudam olhos, sobrancelhas, boca e leve inclinação. Manter o olho esquerdo/direito na mesma altura aproximada do neutral (olhos por volta de y≈440–480 em 900×1200) e a distância entre eles próxima de 140–150 px, para o alinhamento automático funcionar.

## Contexto da cena
Interrogatório da Lívia (app do celular). Usos previstos:
- `lying`: "E o Caio sabia [o código]?" e "Tem alguma coisa que você ainda não contou?".
- `teary`: "Quando foi a última vez que você falou com sua mãe?".
- `false_relief`: depois de perguntas que ela considera superadas.
- `apprehensive`: expressão de espera entre perguntas.
- `slightly_tired`: primeiras perguntas (chegada em casa).

## Arquivos esperados
- `public/characters/livia/expressions/apprehensive.jpg`
- `public/characters/livia/expressions/lying.jpg`
- `public/characters/livia/expressions/teary.jpg`
- `public/characters/livia/expressions/false_relief.jpg`
- `public/characters/livia/expressions/slightly_tired.jpg`

Atualizar também `manifest.json` e `README.md` da pasta.

## Observações técnicas para integração
- Boca fechada ou levemente entreaberta em todas: o código coloca as formas de boca (A, E, I, O, U, M) por cima quando ela fala.
- Olhos abertos e sem pálpebras meio fechadas, pois o piscar é animado por código. Em `teary`, o brilho pode estar na imagem, mas as pálpebras devem estar abertas.
- Sem texto, sem moldura, sem HUD na imagem.
- Bônus (opcional): uma folha de boca em resolução maior, com as formas A, E, I, O, U e M/B/P da Lívia lado a lado, fundo de pele lisa, para substituir `public/characters/livia/visemes.png` (hoje baixa resolução e ampliada no código).

## Resposta do ChatGPT
Preenchido pelo ChatGPT ao concluir.

- status:
- assets criados:
- observações:
