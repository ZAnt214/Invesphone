# Repórter — cabelo ao vento

Entrega ao Claude, 18/10/2026. Seis expressões oficiais, sete mechas por expressão, 900×1200.

O manifesto já é consumido por `src/characters/characters.ts`. Nenhuma mudança de lógica foi necessária. Usar as bases PNG indicadas no manifesto; os JPGs são apenas compatibilidade.

## Conteúdo e preservação

- Camadas 01–05: laterais e topo presos, rigidez alta.
- Camadas 06–07: fios diante das orelhas, rigidez baixa.
- Coque fixo; não foi acrescentado nenhum fio à silhueta em repouso.
- Máscaras de peso em cinza, canal vermelho, preto na raiz, branco na ponta, zero fora da mecha.
- `validation.json`: recomposição sem vento = RGB decodificado do JPG oficial, sem diferença; fora da seleção de cabelo, base idêntica ao retrato.
- `reference-expressions.png`: ordem neutral, asking, insisting / surprised, satisfied, annoyed.

## Produção

`source/underpaint.png` é o preenchimento inferior produzido com image_gen, a partir do neutral oficial. **Não usar essa imagem como retrato**: ela só fornece os pixels encobertos pelas mechas. `scripts/package-reporter-hair.cjs` extrai os pixels originais, conserva os demais pixels de cada expressão e empacota as camadas e os mapas de peso. Reexecutar com Node e sharp disponível (o diretório pode ser indicado por CODEX_PRIMARY_RUNTIME_NODE_MODULES).

Prompt: remover somente os fios soltos diante das orelhas e as pontas externas, preenchendo com continuação plausível de cabelo preso, pele ou fundo conforme a região; preservar pessoa, pose, enquadramento, roupa, texto e luz. Edição pelo image_gen integrado, sem API externa.

## Conferência do Claude

1. Abrir a entrevista da repórter, com `depo.hair` ligado, nas seis expressões.
2. Conferir carregamento de todas as camadas e troca de expressão sem salto.
3. Calibrar brisa e helicóptero: começar com deslocamento de ponta de aproximadamente 1,5 e 5 pixels da imagem fonte, respectivamente. O campo `motion` é orientação, não configura o motor atual.
4. Manter raízes fixas, topo com movimento discreto e coque imóvel. Os fios frontais devem reagir mais.
5. Conferir em especial as bordas das orelhas e têmporas, a 400×430 no jogo. A separação usa máscara opaca para conservar exatamente o RGB; o motor já aplica esfumado em movimento.
6. Conferir qualidade baixa, efeito desligado, movimento reduzido e fallback sem WebGL. Os retratos oficiais não foram alterados.

Safari real e calibração de amplitude não foram testados nesta entrega. A checagem pixel a pixel não substitui essa conferência em movimento.
