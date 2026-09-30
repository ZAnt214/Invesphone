# Interrogatório em vídeo

Mecânica reutilizável para interrogar um personagem com poucos vídeos.

## Ideia central

Os vídeos não representam perguntas. Representam **estados visuais** do personagem (parado, falando).
Perguntas, respostas, desbloqueios e pistas são dados em `src/interrogation/<personagem>.ts`.

## Peças

- `types.ts`: formato dos dados (`InterrogationConfig`, `VideoState`, `InterrogationQuestion`).
- `logic.ts`: funções puras (quais perguntas aparecem, o que uma resposta libera).
- `videoDirector.ts`: passeia pelos arquivos com crossfade curto. Cada arquivo tem dois `<video>`; a emenda troca de elemento.
- `videoGraph.ts`: tabela de momentos parecidos, gerada por comparação de quadros.
- `InterrogationVideo.tsx`: palco de vídeo sem controles nativos (recorta a base do quadro).
- `DialogueChoices.tsx`: lista de perguntas (PERGUNTAR / JÁ PERGUNTADO).
- `VideoInterrogation.tsx`: junta tudo. Não conhece nenhum personagem.

## Novo personagem

1. Coloque no máximo dois arquivos em `public/videos/<personagem>/`.
2. Crie `src/interrogation/<personagem>.ts` com `files`, `states` (faixas de tempo em segundos), `questions`, `initial`, `requiredForFinal` e `finalQuestion`.
3. Guarde o progresso no save (`InterrogationProgress`) e renderize `<VideoInterrogation config=... />`.

## Áudio

Os vídeos ficam sempre mudos. O áudio do arquivo de reação é fala que não corresponde ao texto do jogo.

## Continuidade

Cada estado é um "passeio" pelo tempo do arquivo: o vídeo toca contínuo e, ao fim de um trecho longo, salta para outro momento com pose quase idêntica (crossfade de 180 a 260 ms). Os saltos vêm de `videoGraph.ts`, gerado comparando quadros dos arquivos (12 quadros por segundo). Momentos exibidos há pouco são evitados, então a sequência não se repete de forma perceptível. As respostas começam em regiões diferentes do arquivo (`startRange`).

Se trocar os vídeos, o grafo precisa ser gerado de novo (comparação de quadros dentro de cada arquivo e entre os dois).

## Legenda

A resposta aparece como legenda dentro do vídeo, em blocos curtos com tempo de leitura proporcional ao tamanho.

## Lívia

- `livia-01.mp4`: parada e calada, com as mãos se mexendo no meio do arquivo. Estado `idle` percorre quase tudo.
- `livia-02.mp4`: reagindo e falando. Os estados de resposta começam no meio do arquivo, onde ela mais gesticula.
- Os dois arquivos trazem texto embutido na base do quadro (legenda e marca). O enquadramento corta esses 18%.
