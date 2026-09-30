# Interrogatório com retrato ilustrado

Mecânica reutilizável para interrogar qualquer personagem que tenha arte oficial.

## Peças

- `src/characters/types.ts`: formato de um personagem (`CharacterDef`), do rig do rosto (`FaceRig`) e das expressões (`Expression`).
- `src/characters/characters.ts`: cadastro dos personagens com arte oficial. Hoje: Lívia.
- `src/characters/expressions.ts`: parâmetros de cada expressão (sobrancelhas, pálpebra, olhar, corpo, boca em repouso, piscadas, tremor). Valem para qualquer personagem.
- `src/characters/mouth.ts`: transforma o texto falado numa linha do tempo de abertura da boca (vogais abrem, b/m/p fecham, pontuação é pausa).
- `src/characters/portraitRenderer.ts`: desenha o retrato num canvas e o anima por recortes do próprio arquivo: respiração, deriva de câmera, piscar, olhar, sobrancelhas, boca sincronizada.
- `src/characters/CharacterPortrait.tsx`: componente do retrato animado. `CharacterFace.tsx`: rosto recortado do retrato para listas e perfis (sem arquivo extra).
- `src/interrogation/`: dados e lógica (`livia.ts`, `logic.ts`), `IllustratedInterrogation.tsx` e `DialogueChoices.tsx`.

## Como a imagem é usada

O retrato oficial não é redesenhado. O rig só marca onde ficam olhos, sobrancelhas e boca (em pixels do arquivo) e de onde tirar as cores (pele, esclera, cílios, interior da boca). Olhos, sobrancelhas e boca são recortes do próprio arquivo que se movem; a única coisa pintada é a cor da pele sobre a sobrancelha apagada e o interior escuro da boca aberta, ambos amostrados da imagem.

## Fala

A resposta aparece em legendas curtas dentro da imagem. Para cada legenda, a boca segue as letras por um tempo um pouco menor que o de leitura. Sem áudio.

## Expressão por pergunta

Em `src/interrogation/livia.ts`, cada pergunta tem `expression`. A lógica não sabe nada de personagem específico.

## Imagens de expressão do ChatGPT

Quando existirem imagens oficiais por expressão, basta cadastrar em `expressionAssets` do personagem:

```ts
expressionAssets: { nervous: `${base}characters/livia/nervous.png` }
```

Para as expressões com imagem própria o renderizador usa a imagem e desliga o rig. As demais continuam animadas a partir do retrato neutro.

## Personagem novo

1. Coloque o retrato em `public/characters/<id>/` e cadastre em `characters.ts` (recorte, `face`, e o `rig` se for animar o rosto).
2. Crie `src/interrogation/<id>.ts` com `personId`, perguntas, expressões, pistas e desbloqueios.
3. Renderize `<IllustratedInterrogation config=... />` e guarde o progresso no save.

## Acessibilidade

Com "reduzir movimento" ligado, não há respiração, deriva nem tremor. Piscar, olhar e a boca sincronizada continuam, porque fazem parte da fala.
