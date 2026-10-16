# Repórter · TV Sereno

Entrega visual para `2026-10-16-reporter-entrevista`. Seis expressões frontais 900×1200 no estilo do Jorge, microfone com marca fictícia, casaco e crachá de imprensa. `portrait.jpg` é cópia binária de `expressions/neutral.jpg`.

## Integração pelo Claude

- Cadastrar `reporter` em `src/characters/characters.ts` usando as expressões e `marks` de `manifest.json`. Os nomes novos não pertencem necessariamente à união atual de expressões; ampliar os tipos/dados quando integrar.
- `marks[expression].eyes`, `.mouth` e `.align` usam pixels do canvas 900×1200, no formato dos rigs existentes. `align.eyeMid` fica fixo em todas as expressões para não reposicionar a figura. As elipses dos olhos acompanham a abertura das pálpebras; variações desses centros não significam movimento da cabeça.
- `figure-mask.png`: branco opaco na figura, transparente fora, com antialiasing. O alfa é o canal de recorte: o `destination-in` atual de `streetDepo.js` depende disso. Inclui mão, microfone, fio e cabelo. Não converter para RGB opaco preto/branco.
- `face-mask.png`: máscara RGB/cinza branco no rosto e preto fora, como a referência do Jorge. Se usada em Canvas destination-in, converter luminância em alfa primeiro.
- `visemes.png`: 2400×120; seis células 400×120 na ordem A, E, I, O, U, M; centro (200,60), largura nominal 108. Usar a borda esfumada já implementada no jogo. Rig da boca: centro x447, rimY535, halfWidth60. São recortes com pele ao redor, como o Jorge, não ícones transparentes isolados.
- `asking` comunica a aproximação pela expressão, sem transladar a figura. Não aplicar ajustes de alinhamento diferentes ao corpo entre expressões.
- Nenhum arquivo de código ou save foi alterado. Entrevista, escolhas, reflexo no Jornal Sereno, transições, fala e testes no Safari/iPhone ficam para integração pelo Claude.

## Conferência

As seis imagens foram decodificadas e comparadas: fora do retângulo facial expandido para blocos JPEG (x288..608, y240..624), todos os canais são idênticos. Dimensões, identidade do portrait, estrutura dos arquivos e alfa da figura verificados. Bocas inspecionadas sobre o retrato com a mesma máscara radial usada pelo renderer; isso é uma prévia estática, não um teste do jogo. `validation.json` registra o escopo. `reference-expressions.png`: neutral, asking, insisting / surprised, satisfied, annoyed.

## Produção e prompts

Arte criada com a ferramenta integrada de geração de imagens, a partir de Jorge neutral e curioso-02 como referências. Preparação técnica: normalização de escala, alfa, composição localizada das expressões sobre a base fixa, ajustes de centro da boca, recortes e exportação.

Prompt-base: uma repórter brasileira de 33 anos, cabelo castanho preso em coque baixo prático, pele morena, olhar atento e cansado, casaco escuro com garoa, crachá de imprensa, microfone com cubo vermelho e texto branco exato “TV SERENO” estendido ao observador abaixo do rosto; busto frontal no enquadramento do Jorge, ilustração plana angular, luz fria com reflexo vermelho lateral, fundo transparente, sem marcas reais ou objetos modernos.

Prompts de edição, sempre preservando identidade, pose, cabelo, roupas, mãos, microfone, luz e enquadramento:
- asking: sobrancelha interrogativa firme e boca ligeiramente aberta.
- insisting: sobrancelhas franzidas, olhos impacientes e lábios firmes.
- surprised: sobrancelhas elevadas, olhos abertos e boca entreaberta.
- satisfied: pequeno sorriso fechado, sobrancelhas relaxadas, satisfação profissional.
- annoyed: sobrancelha assimétrica, olhar semicerrado e cantos da boca caídos.
- visemas: alterar somente lábios/interior da boca em seis recortes fixos; A oval aberto, E aberto horizontal com dentes, I estreito horizontal, O redondo, U pequeno e arredondado, M fechado. Preservar a pele e a posição em cada célula.
