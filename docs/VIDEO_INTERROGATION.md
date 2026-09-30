# Interrogatório em vídeo

Mecânica reutilizável para interrogar um personagem com poucos vídeos.

## Ideia central

Os vídeos não representam perguntas. Representam **estados visuais** do personagem (parado, falando).
Perguntas, respostas, desbloqueios e pistas são dados em `src/interrogation/<personagem>.ts`.

## Peças

- `types.ts`: formato dos dados (`InterrogationConfig`, `VideoState`, `InterrogationQuestion`).
- `logic.ts`: funções puras (quais perguntas aparecem, o que uma resposta libera).
- `videoDirector.ts`: toca trechos dos arquivos com crossfade curto. Cada arquivo tem dois `<video>`; a emenda troca de elemento.
- `InterrogationVideo.tsx`: palco de vídeo sem controles nativos (recorta a base do quadro).
- `DialogueChoices.tsx`: lista de perguntas (PERGUNTAR / JÁ PERGUNTADO).
- `VideoInterrogation.tsx`: junta tudo. Não conhece nenhum personagem.

## Novo personagem

1. Coloque no máximo dois arquivos em `public/videos/<personagem>/`.
2. Crie `src/interrogation/<personagem>.ts` com `files`, `states` (trechos em segundos), `questions`, `initial`, `requiredForFinal` e `finalQuestion`.
3. Guarde o progresso no save (`InterrogationProgress`) e renderize `<VideoInterrogation config=... />`.

## Áudio

Os vídeos ficam sempre mudos. O áudio do arquivo de reação é fala que não corresponde ao texto do jogo.

## Lívia

- `livia-01.mp4`: parada, calada. Trechos calmos em 0,08–2,5 s.
- `livia-02.mp4`: reagindo e falando. Entra em 0,5, 0,75 ou 2,0 s e repete a região de fala 5,17–6,6 s.
- Os dois arquivos trazem texto embutido na base do quadro (legenda e marca). O enquadramento corta esses 18%.
