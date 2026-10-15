# Assets — Rua das Acácias — 15/10/2026

Pacote de criação visual para os três pedidos: curiosos de depoimento, cenário de depoimento na rua e veículos vistos de cima. Contém 33 imagens, com nomes e diretórios solicitados. Não inclui alteração de código nem integração testada no jogo.

## Conteúdo
- 15 retratos JPG 900×1200: vizinha, rapaz e senhor; neutral, uncomfortable, nervous, defensive, tired.
- 8 figuras de fundo PNG RGBA 300×600: curioso-01 a curioso-08. Os três primeiros correspondem aos retratos; os outros são figurantes independentes.
- Fachada JPG 1688×780 e poste PNG RGBA 1688×780.
- 8 veículos PNG RGBA 64×84, frente para baixo, traseira para cima.

## Integração
1. Copiar a pasta public para a raiz do projeto, verificando eventuais arquivos já existentes antes de substituir.
2. Usar os retratos no sistema genérico e gerar máscaras/visemas com os scripts do projeto. Neutral mantém a boca fechada. Não há máscaras nem visemas neste pacote.
3. Ligar os oito figurantes ao fundo do depoimento e preservar a ausência de novas provas ou papéis no crime.
4. Desenhar frente-noite.jpg como fundo. O poste está somente na camada transparente: sobrepor usando o mesmo enquadramento e posicionar a base na calçada. Conferir a composição na cena real, pois a fachada gerada tem a guia aproximadamente a 77% da altura (o pedido sugeria cerca de 85%).
5. Chuva, fita, luz do poste, giroflex, viatura e helicóptero continuam sob controle do código. Não duplicar o poste desenhado em código.
6. Trocar os veículos provisórios em drawCarPx pelas imagens de public/base/rua/veiculos/cima/. Usar imageSmoothingEnabled=false e escala inteira. O desenho mantém proporções naturais dentro de 64×84; a margem lateral pode exceder 4 pixels. Textos de teto são detalhes gráficos e têm legibilidade limitada nessa resolução.
7. Conferir transições de expressão, máscaras e alinhamento no componente real antes de encerrar os pedidos. Testar mobile 844×390, 390×844 e 375×667 conforme layout do jogo. Safari real não foi testado nesta entrega.

## Verificação feita
Todos os 33 arquivos foram decodificados; dimensões e presença de alpha nos PNGs foram verificadas. Inspeção visual de retratos, figuras e carros em folhas de contato. O manifest.json lista caminhos, dimensões e tamanho em bytes. Nenhuma alteração de save, narrativa ou código foi feita.

## Origem e direção
Imagens criadas com o gerador integrado de imagens, usando o retrato oficial de Jorge e os oito PNGs laterais oficiais do repositório como referências. Expressões derivadas dos respectivos retratos neutros. Exportação técnica para os formatos solicitados; carros reduzidos com vizinho mais próximo. A figura 07 foi refeita para evitar semelhança com Jorge.

Prompts de direção: retratos frontais em ilustração angular plana, fundo azul-marinho e paleta discreta; mudar somente olhos, sobrancelhas e boca entre emoções. Figuras de cintura para cima com transparência, roupas de madrugada e poses variadas. Fachada frontal noturna com janela quente à esquerda e portão escuro à direita, sem pessoas ou efeitos. Veículos em pixel art vistos quase de cima, eixo vertical, faróis abaixo e lanternas acima, preservando cores e características dos modelos de referência.
