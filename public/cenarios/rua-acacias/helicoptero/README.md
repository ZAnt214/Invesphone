# Helicóptero — transição da entrevista

Entrega visual para Claude. As quatro imagens compartilham tela de 4096×2048 e origem (0,0). Coordenadas no manifest em pixels dessa tela.

- `corpo.png`: casco opaco, vidro escuro de base, esquis, mastro e cauda, sem pás.
- `vidro.png`: extração das janelas oficiais para reflexos/água. Não recortar essas áreas do corpo: o wipe precisa continuar opaco.
- `rotor-cauda.png`: rotor alinhado ao eixo. Rotacionar em torno de `tailRotorCenter`, não do centro da imagem.
- `pas.png`: uma pá alinhada ao mastro. Instanciar as pás em código, com projeção achatada para o disco visto de baixo; não girar o PNG em círculo frontal como uma hélice de avião.
- `preview.png`: montagem estática para conferir encaixe; mostra apenas uma pá principal, como solicitado.

## Integração

Usar `mainRotorAxis`, `tailRotorCenter`, `nose`, `searchlight`, `antiCollisionLight` e `whiteStrobe` do manifest. Luzes apagadas na arte. Desenhar facho e piscas em código. Espelhar toda a composição e os pontos em conjunto na passagem inversa.

O `bodyRect` delimita o casco, mas NÃO é todo opaco nos cantos. Para esconder a mudança de cena, centralizar `opaqueWipeRect` no viewport e usar escala mínima `max(viewportWidth / rect.width, viewportHeight / rect.height)`, com margem adicional de 3%. O retângulo inteiro foi verificado com alfa 255. A proporção final do casco é mais baixa que a estimativa do pedido; usar esse retângulo, não uma altura presumida de 1/3.

O vidro duplica exatamente pixels da base; usá-lo como máscara de efeitos ou camada sem deslocamento. Não mover o vidro independentemente.

## Qualidade e verificação

Arte gerada com ferramenta image_gen, tomando cenário e repórter oficiais como referências. Prompt: helicóptero de patrulha leve azul-marinho, perfil voltado à direita visto um pouco de baixo, madrugada, recorte frio superior e âmbar inferior, sem marcas/pessoas/luzes acesas, desenho plano angular, fundo transparente; rotores gerados separadamente. Fontes preservadas. Corpo gerado em 2062×763 e ampliado 1,7× para o canvas comum; não se trata de detalhe 4K nativo.

`node scripts/package-helicopter.cjs` recompõe as camadas e valida dimensões, alfa e retângulo de cobertura; requer sharp. `validation.json` registra o resultado. Conferência visual de encaixe realizada. Não houve alteração de código do jogo: integração, movimento, borrão e teste Safari real permanecem pendentes para Claude.
