# Cabelo do Jorge — entrega para integração

Oito expressões; oito mechas por expressão, com pesos, raízes e pontas. Todos os mapas e retratos têm canvas 900×1200. Os fios finos acompanham os tufos do topo/laterais em vez de arquivos separados.

## Usar a base PNG
`manifest.json` aponta para `base.png`: esta é a base sem perdas para uso no jogo. `base.jpg` atende ao formato originalmente pedido, mas recompactar JPEG altera pixels e não preserva a igualdade exata. A composição source-over das oito mechas sobre a base PNG reproduziu o RGB decodificado de cada retrato oficial sem diferença. `validation.json` registra os resultados.

## Movimento
- Ler pesos no canal vermelho, divididos por 255. Preto fica preso; branco recebe o deslocamento máximo. Alfa pertence à mecha, não ao mapa de peso.
- Aplicar deformação contínua ponderada pela máscara; manter a raiz fixa. Não girar o recorte inteiro rigidamente: os tufos têm sobreposição e isso pode abrir emendas.
- Começar com deslocamento nominal de 1,5 px na brisa e até 4 px na rajada, em coordenadas da imagem original; modular pela rigidez. A folha de referência usa deslocamento horizontal com componente vertical de 12%.
- Os limites são conservadores. Rajadas maiores precisam de revisão visual das emendas e da pintura inferior, especialmente onde fios finos se sobrepõem. A igualdade em repouso não garante ausência de artefatos sob qualquer deformação.
- Preservar a máscara existente para o corpo/base. Desenhar pontas móveis sem recortá-las rigidamente pela silhueta original. Não alterar olhos, boca, bigode, visemas ou retratos oficiais.
- Carregar apenas a expressão necessária e descartar texturas sem uso; cada canvas completo ocupa memória mesmo quando o PNG é pequeno. Não manter as 64 mechas decodificadas simultaneamente no iPhone.
- Quando o efeito estiver desligado, qualidade baixa ou movimento reduzido, manter o retrato oficial. Integrar ao registro de ajustes do projeto.

## Validação e limites
Verificados dimensões, alpha das mechas, gradação dos pesos, caminhos e recomposição RGB em repouso nas oito expressões. Referência visual estática de três intensidades incluída. Animação no componente do jogo, vento sincronizado, transições, FPS e Safari real ainda precisam ser implementados/testados pelo Claude. Nenhum código do jogo foi alterado nesta entrega.

## Produção
Pintura inferior criada com geração de imagem a partir do neutral oficial, solicitando apenas cabelo curto sob as mechas. A edição foi limitada tecnicamente à cobertura opaca das camadas extraídas; o restante usa os pixels de cada expressão oficial. Mechas extraídas das fontes originais com máscaras de cabelo, divisão em oito grupos e sobreposição. Os pontos/rigidez são parâmetros iniciais de direção, ajustáveis na integração.
