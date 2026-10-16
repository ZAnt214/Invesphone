---
id: 2026-10-16-reporter-entrevista
status: pending
requested_by: claude
priority: high
character: "reporter"
asset_type: "personagem novo: repórter da TV Sereno, no mesmo formato do Jorge (expressões, máscara da figura, visemas)"
destination: "public/characters/reporter/"
---

# Pedido

## Objetivo
Cena nova aprovada pelo usuário em 16/10/2026: **a entrevista do Lemos à imprensa, na mesma tela do depoimento na rua** (`src/rua/streetDepo.js`, `docs/DEPOIMENTO_NA_RUA.md`). O jogo vê pelos olhos do Lemos: a repórter fica **exatamente onde o Jorge fica no depoimento dele**, de frente, na frente da casa da Rua das Acácias de madrugada, com a fita amarela atrás. A pergunta dela aparece como legenda e o jogador escolhe a resposta; o que o Lemos disser sai no Jornal Sereno (`docs/JORNAL_SERENO.md`).

Hoje não existe repórter oficial; a prévia usa uma das curiosas só como lugar marcado. Precisamos da personagem oficial, **no mesmo formato e no mesmo enquadramento do Jorge**, para o código usar sem adaptação.

## O que gerar
- Quantidade: 1 personagem, 6 expressões, 1 máscara da figura, 1 máscara do rosto, 1 folha de visemas e o manifesto.
- Personagem: repórter de TV da emissora fictícia **TV Sereno**. Mulher, 30 e poucos anos, brasileira, cabelo preso de um jeito prático (trabalhou a noite toda), capa de chuva ou casaco escuro com o crachá de imprensa da TV Sereno no pescoço, maquiagem discreta, gotas de garoa no casaco. São Paulo, outubro de 2002: nada de celular moderno nem logotipo de emissora real.
- Microfone: na mão dela, **apontado para o Lemos (para a câmera)**, na parte de baixo da imagem, com o cubo vermelho "TV SERENO" em letras brancas. O microfone não pode cobrir a boca nem o queixo.
- Expressões (mesma pose, mesmo enquadramento; só o rosto muda):
  - `neutral`: atenta, esperando a resposta;
  - `asking`: inclinada um pouco para a frente, perguntando com firmeza;
  - `insisting`: insistente, sobrancelha franzida, impaciente;
  - `surprised`: surpresa (o Lemos revelou algo);
  - `satisfied`: satisfeita, conseguiu a frase;
  - `annoyed`: contrariada (o Lemos não respondeu).
- Enquadramento: **igual ao retrato do Jorge** (`public/characters/jorge/expressions/neutral.jpg`): busto de frente, olhando direto para a câmera, cabeça no terço de cima, ombros até a borda de baixo. Mesma escala de rosto que o Jorge, para os dois ficarem do mesmo tamanho na mesma cena.
- Fundo: o mesmo tipo de fundo liso escuro dos retratos oficiais, recortado pela máscara da figura.
- Estilo: o mesmo estilo de ilustração plana do Jorge, da Lívia e dos curiosos, com luz noturna fria e um toque do giroflex vermelho de um lado.
- Resolução: 900×1200.
- Formato: JPG para as expressões (como o Jorge), PNG para as máscaras e os visemas.

## Consistência obrigatória
- Referências: `public/characters/jorge/` inteiro (expressões, `figure-mask.png`, `face-mask.png`, `visemes.png`, `manifest.json`) e `public/characters/curiosos/fundo/*.png` (estilo de roupa e luz da rua).
- A mesma pessoa, a mesma roupa e a mesma pose em todas as expressões; olhos e boca no mesmo lugar entre as expressões, para a troca ser suave e os visemas encaixarem.
- Só "TV Sereno". Nenhum nome de emissora ou marca real.

## Contexto da cena
Madrugada, garoa, giroflex batendo no rosto dela, flashes de fotógrafos atrás. É a primeira repórter a chegar ao portão: cansada, mas atrás da frase do investigador. Se o Lemos revela algo ("Não houve arrombamento"), ela fica surpresa e depois satisfeita; se ele se recusa a falar, fica contrariada. Depois ela reaparece na porta do DHPP (outras entrevistas), com a mesma roupa.

## Arquivos esperados
```
public/characters/reporter/expressions/neutral.jpg
public/characters/reporter/expressions/asking.jpg
public/characters/reporter/expressions/insisting.jpg
public/characters/reporter/expressions/surprised.jpg
public/characters/reporter/expressions/satisfied.jpg
public/characters/reporter/expressions/annoyed.jpg
public/characters/reporter/portrait.jpg          (igual ao neutral)
public/characters/reporter/figure-mask.png
public/characters/reporter/face-mask.png
public/characters/reporter/visemes.png
public/characters/reporter/manifest.json
```

## Observações técnicas para integração
- Mesmo canvas 900×1200 e mesmo alinhamento em todas as expressões, sem deslocar a figura.
- `figure-mask.png`: branco na figura (incluindo o microfone e a mão), preto no fundo, borda suave; é o que recorta a repórter por cima da rua.
- `visemes.png`: no formato do Jorge, 6 bocas na ordem A, E, I, O, U, M, folha 2400×120 com células de 400×120, centro da boca em (200, 60).
- `manifest.json`: no formato do `public/characters/jorge/manifest.json` (`character: "reporter"`, `displayName: "Repórter · TV Sereno"`, `basePath`, `resolution`, `expressions`, `expressionMeanings`, `visemes`), e a posição dos olhos e da boca de cada expressão, como nos outros personagens.
- Bordas limpas, sem halo claro ou escuro.

## Resposta do ChatGPT
Preenchido pelo ChatGPT ao concluir.

- status:
- assets criados:
- observações:
