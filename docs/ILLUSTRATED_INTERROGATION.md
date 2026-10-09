# Interrogatório com retrato ilustrado

Mecânica reutilizável para interrogar qualquer personagem que tenha arte oficial.

## Peças

- `src/characters/types.ts`: formato de um personagem (`CharacterDef`), das imagens por expressão (`ExpressionAsset`) e das marcas de olhos e boca.
- `src/characters/characters.ts`: cadastro dos personagens com arte oficial. Hoje: Lívia, com as 6 expressões do ChatGPT (`neutral`, `tired`, `uncomfortable`, `defensive`, `nervous`, `shaken`).
- `src/characters/expressions.ts`: ajustes de corpo por expressão (afundar, tremor, frequência de piscar).
- `src/characters/mouth.ts`: transforma o texto falado numa linha do tempo de formas de boca (A, E, I, O, U e M/B/P; outras consoantes entreabrem; pontuação é pausa).
- `src/characters/portraitRenderer.ts`: desenha a imagem da expressão num canvas e anima: respiração, deriva de câmera, troca suave entre expressões, piscar e boca sincronizada.
- `src/characters/CharacterPortrait.tsx`: componente do retrato animado. `CharacterFace.tsx`: rosto recortado do retrato neutro para listas e perfis (sem arquivo extra).
- `src/interrogation/`: dados e lógica (`livia.ts`, `logic.ts`), `IllustratedInterrogation.tsx` e `DialogueChoices.tsx`.

## Como a imagem é usada

Cada expressão é uma imagem oficial; nada é redesenhado. Cada imagem tem marcas em pixels do próprio arquivo:

- `align`: ponto médio entre os olhos e escala, para a cabeça não pular quando uma expressão troca por outra (as imagens não vêm perfeitamente alinhadas).
- `eyes`: onde ficam os olhos, para piscar. A pálpebra usa a cor da pele amostrada da imagem e os cílios a cor mais escura do olho.
- `mouth`: cantos, largura e limite do queixo. Serve para posicionar e dimensionar as formas de boca e, se o personagem não tiver formas próprias, para abrir o lábio de baixo em tiras.

### Formas de boca (visemas)

`visemes` do personagem aponta para um arquivo com as formas de boca lado a lado (`public/characters/livia/visemes.png`: A, E, I, O, U, M/B/P, recortadas da referência de animação do ChatGPT). Enquanto fala, a forma da letra atual entra sobre a boca da expressão: a cor de pele da forma é ajustada à da imagem, a borda é suave e a escala vem da largura da boca da expressão. Ao terminar a fala a boca original volta.

Com `faceMask` no personagem (PNG em tons de cinza do interior do rosto, `public/characters/<id>/face-mask.png`), a imagem neutra é a base imutável (cabelo, pescoço, corpo e fundo) e só o interior do rosto, com borda suave, vem da imagem de cada expressão e se mistura com a anterior em 0,34 s. A máscara é gerada por `scripts/make-face-mask.py` a partir do retrato neutro e de um polígono do rosto; ela deixa de fora as mechas de cabelo que entram no rosto, para não deformarem quando a expressão troca. Sem `faceMask`, a troca usa regiões de feições: ela dura 0,34 s e só mistura as regiões das feições (sobrancelhas e olhos; boca), sobre a imagem da expressão anterior, que vira a nova no fim. Cabeça, cabelo, corpo e fundo não se misturam (o fundo é único e a cabeça é alinhada por olhos, cabelo e pescoço), então não há fantasma de contorno. As regiões estão em `MORPH_REGIONS` no renderer. Expressão sem imagem (ex.: `angry`) usa a neutra.

### Silhueta e sala do depoimento

Com `figureMask` no personagem (PNG branco com transparência, `public/characters/<id>/figure-mask.png`), o retrato pode sair com fundo transparente (`<CharacterPortrait transparent/>`), mostrando a imagem inteira em vez do recorte do rosto (até o peito, para o depoente aparecer sentado à mesa; o tampo fica na altura em que a arte da Lívia apoia as mãos): a silhueta da imagem neutra recorta tudo o que o renderer desenhou, e como corpo e cabelo vêm sempre da neutra (base fixa da `faceMask`), ela vale para todas as expressões. A máscara é gerada por `scripts/make-figure-mask.py <id>` (preenche o fundo azulado a partir das bordas, parando nos contornos do desenho; os ajustes usados no Caso 01 estão no próprio script). Confira o recorte sobre uma cor forte depois de gerar.

A tela de depoimento usa isso na direção "olhar do Lemos": a tela inteira é a sala (parede, luminária com facho e poeira, mesa e caneca com vapor em primeiro plano), com o depoente à distância (`.ii-actor`) e a câmera balançando devagar. O caderno do Lemos é um objeto inclinado por cima da cena (perguntas à mão com a fonte Caveat de `public/fonts/`, as duas últimas já feitas riscadas). Em pé, depoente em cima e caderno embaixo; deitado (container query `room`), caderno à esquerda e depoente à direita. O foco alterna pela fase: escolhendo a pergunta (`ii-pick`), a sala desfoca e escurece; ouvindo a resposta (`ii-listen`), o caderno abaixa e desfoca, e o rosto volta ao foco. O visor mostra REC com o tempo de gravação e o que está em foco. A sala é viva (`RoomFx.tsx`): poeira que só brilha dentro do facho, luminária balançando no fio, queda de luz no corpo do depoente e falhas da lâmpada (com estalo) mais frequentes quanto maior a pressão; com pressão alta as bordas da imagem fecham e avermelham. O som (`roomAudio.ts`, gerado na hora, sem arquivos) tem o ar da sala, o zumbido da luminária, o chiado da fita, o relógio de parede, ruídos esparsos (cadeira, passos no corredor, duto de ar, trânsito), coração com pressão alta, e as ações do Lemos (caneta escrevendo e circulando a pergunta, folha virando, caderno baixando, marca-texto na pista, respiração antes da resposta). Tudo respeita o som desligado em Ajustes e o "reduzir movimento". A pergunta feita fica circulada em vermelho enquanto ele responde; pistas anotadas viram marca-texto. Tudo está no fim de `illustrated-interrogation.css` (`.ii-room`), sem nada específico de personagem.

## Fala

A resposta aparece em legendas curtas dentro da imagem. Para cada legenda, a boca segue as letras por um tempo um pouco menor que o de leitura. Sem áudio.

## Expressão por pergunta

Em `src/interrogation/livia.ts`, cada pergunta tem `expression`. A lógica não sabe nada de personagem específico.

## Nova imagem de expressão

Coloque o arquivo em `public/characters/<id>/expressions/<expressao>.jpg` (o ChatGPT entrega ali, com `README.md` e `manifest.json`; a Lívia está em 900x1200) e acrescente em `assets` do personagem: `src`, `align` (olhos e escala), `eyes` e `mouth` (medidos na imagem). Imagens de uma mesma expressão devem ter o mesmo enquadramento; o `align` corrige pequenas diferenças.

## Personagem novo

1. Confira `public/characters/<id>/expressions/` (assets do ChatGPT) e cadastre em `characters.ts` (recorte, `face` e as marcas de cada imagem).
2. Crie `src/interrogation/<id>.ts` com `personId`, perguntas, expressões, pistas e desbloqueios.
3. Renderize `<IllustratedInterrogation config=... />` e guarde o progresso no save.

## Acessibilidade

Com "reduzir movimento" ligado, não há respiração, deriva nem tremor. Piscar, olhar e a boca sincronizada continuam, porque fazem parte da fala.

## Anotar pistas na resposta

Depois de cada resposta, a resposta aparece em frases no painel e o jogador toca nas frases importantes para anotar. Nos dados, a pergunta declara `highlights: [{ phrase, clue }]`: a frase que contém `phrase` registra a pista `clue` (via `onClue`); qualquer outra frase fica anotada como sem valor. As frases anotadas são salvas em `progress.noted` (`<pergunta>:<índice>`). Perguntas só com `clues` (sem `highlights`) continuam registrando a pista sozinhas. As respostas já feitas podem ser reabertas na lista "Já perguntado" (inclusive depois de encerrar o depoimento) para anotar o que ficou para trás, e ao encerrar o painel mostra quantas pistas foram anotadas.

## Elenco com depoimento

`src/interrogation/registry.ts` reúne os depoimentos por personagem: Lívia, Caio, Rafael, Cida, Jorge e Téo (o interrogatório do capítulo 4, com confrontações que exigem moto, cinta bancária e log do alarme). O progresso de cada um fica em `GameSave.depositions[id]` (Lívia segue em `liviaInterrogation`, de saves antigos). Um depoimento concluído marca a pessoa em `interviewed`. Pistas vêm das frases anotadas (`highlights`); só a "Registrar confissão" do Téo garante `confissao_teo` para não travar a história.

Caio, Téo, Rafael, Cida e Jorge usam o pacote do ChatGPT (`expressions/*.jpg` com `tired`, `uncomfortable`, `defensive`, `nervous`, `shaken`, `lying`, `teary`, mais `visemes.png`). `scripts/measure-cast.py` mede olhos e alinhamento de cada imagem (`src/characters/castMarks.json`) e gera `face-mask.png`; `cast(...)` em `characters.ts` monta o personagem. Os depoimentos escolhem só expressões que existem no pacote. Os textos seguem `docs/CASE01_STORY_BIBLE.md`.

As folhas de visemas do elenco (`public/characters/<id>/visemes.png`) são geradas por `scripts/make-cast-visemes.py` a partir do retrato oficial de cada um: recorte da boca com os lábios apagados e a vogal desenhada com as cores dos lábios dele, no mesmo formato e medidas da folha da Lívia. A célula M é o recorte original, com os lábios fechados.

As expressões `tired`, `defensive`, `nervous`, `shaken` e `teary` do elenco são feitas por `scripts/make-cast-expressions.py` (deformação contínua do retrato oficial, campos gaussianos em sobrancelhas, pálpebras e cantos da boca), como `uncomfortable` e `lying` (`scripts/generate-clean-cast-expressions.py`). As antigas, coladas em blocos, cortavam mechas e mudavam o tom do rosto. Depois de refazer, rode `scripts/measure-cast.py`.
