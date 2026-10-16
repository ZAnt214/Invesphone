---
id: 2026-10-16-reporter-entrevista
status: pending
requested_by: claude
priority: high
character: "reporter_tv"
asset_type: "personagem novo: repórter de TV, meio corpo de frente, com expressões"
destination: "public/characters/reporter/"
---

# Pedido

## Objetivo
Cena nova: **a entrevista do Lemos à imprensa**, vista **pelos olhos do Lemos**. A câmera é o rosto dele: a repórter fica de frente para o jogador, a um passo de distância, com o microfone apontado para a câmera, fazendo a pergunta. O jogador escolhe a resposta, e o que o Lemos disser sai no Jornal Sereno (`docs/JORNAL_SERENO.md`).

Hoje não existe repórter oficial no jogo; nas prévias usamos uma das curiosas só como lugar marcado. Precisamos da personagem oficial.

A primeira entrevista acontece de madrugada, no portão da casa da Rua das Acácias (05:20, garoa). As próximas são na porta do DHPP (fim de tarde e noite).

## O que gerar
- Quantidade: 1 personagem, 6 expressões (mais as variações de boca abaixo).
- Personagem: repórter de TV da emissora fictícia **TV Sereno**, mulher, 30 e poucos anos, brasileira, cabelo preso de um jeito prático (já trabalhou a noite toda), capa de chuva ou blazer escuro com o crachá de imprensa da TV Sereno no pescoço, maquiagem discreta. São Paulo, outubro de 2002: nada de celular moderno, nada de logotipo de emissora real.
- Expressão/pose (uma imagem por expressão, mesma pose e mesmo enquadramento):
  - `neutral`: atenta, esperando a resposta;
  - `asking`: inclinada para a frente, perguntando com firmeza;
  - `insisting`: insistente, sobrancelha franzida, um pouco impaciente;
  - `surprised`: surpresa (quando o Lemos revela algo);
  - `satisfied`: satisfeita, conseguiu a frase;
  - `annoyed`: contrariada (quando o Lemos não responde).
- Enquadramento: meio corpo, de frente, olhando direto para a câmera (para o Lemos). A mão direita segura o microfone **apontado para a câmera**, na metade de baixo da imagem, de modo que a cabeça do microfone fique grande, em primeiro plano. O microfone tem o cubo vermelho com "TV SERENO" em branco.
- Fundo: transparente (PNG). Se não der, fundo liso escuro e uma máscara da figura (`figure-mask.png`), como nos outros personagens.
- Estilo: o mesmo estilo de ilustração plana dos retratos oficiais (Lívia, Caio, Jorge, curiosos), com a mesma luz noturna fria e o rosto bem legível.
- Resolução: 900×1200.
- Formato: PNG com alfa.

## Bocas para a fala (opcional, mas ajuda muito)
Como nos outros depoimentos, uma folha de visemas (`visemes.png`) com a boca dela em repouso, meio aberta e aberta, alinhada ao `neutral`, para a boca mexer enquanto ela pergunta.

## Consistência obrigatória
- Referência de estilo e luz: `public/characters/curiosos/fundo/*.png`, `public/characters/livia/expressions/neutral.jpg`, `public/characters/jorge/portrait.jpg`.
- A mesma pessoa, a mesma roupa e a mesma pose em todas as expressões: só o rosto (e um pouco da inclinação) muda. Os olhos e a boca precisam ficar no mesmo lugar entre as expressões para a troca ser suave.
- Nada de nome de emissora real ou marca brasileira: só "TV Sereno".

## Contexto da cena
Madrugada, garoa, giroflex da viatura batendo no rosto dela de vez em quando, flashes dos fotógrafos atrás. Ela está cansada mas faminta pela notícia: é a primeira a chegar ao portão e quer a frase do investigador. Depois de uma revelação ("Não houve arrombamento"), ela fica surpresa e satisfeita; se o Lemos se recusa a falar, fica contrariada.

## Arquivos esperados
- `public/characters/reporter/expressions/neutral.png`
- `public/characters/reporter/expressions/asking.png`
- `public/characters/reporter/expressions/insisting.png`
- `public/characters/reporter/expressions/surprised.png`
- `public/characters/reporter/expressions/satisfied.png`
- `public/characters/reporter/expressions/annoyed.png`
- `public/characters/reporter/visemes.png` (opcional)
- `public/characters/reporter/manifest.json`: para cada expressão, a posição dos olhos e da boca (como no `manifest.json` da Lívia e do Caio).

## Observações técnicas para integração
- Mesmo canvas 900×1200 e mesmo alinhamento em todas as expressões (sem deslocar a figura).
- O microfone faz parte da imagem; ele vai ser animado junto com a figura (respiração e um leve avanço quando ela pergunta).
- A cabeça dela deve ficar no terço de cima da imagem e o microfone no terço de baixo: no jogo (tela deitada, 844×390) a figura ocupa a altura toda, cortada na cintura.
- Bordas limpas, sem halo claro ou escuro (o fundo do jogo é escuro e vai ter luz por trás).

## Resposta do ChatGPT
Preenchido pelo ChatGPT ao concluir.

- status:
- assets criados:
- observações:
