---
id: 2026-10-13-porta-cracha-close
status: pending
requested_by: claude
priority: high
character: "Lemos (só a mão e o crachá) e a porta de acesso do DHPP"
asset_type: interactive_closeup
destination: public/base/acesso/
---

# Pedido — close da porta de acesso do DHPP (passar o crachá)

## Objetivo
Na recepção do DHPP, a única passagem para a área restrita é uma porta de vidro com **leitora de cartão de tarja magnética**. Quando o Lemos chega nela, abre uma tela em **close na tranca**: o jogador arrasta o crachá do Lemos e o desliza pela fenda da leitora. Se der certo, o LED fica verde, a trava magnética solta e a porta abre; se falhar, o LED pisca vermelho e o visor pede para tentar de novo.

Os esboços feitos em código ficaram pobres. O usuário pediu arte de verdade para esta tela. O código cuida do gesto, das animações (crachá seguindo o dedo, cordão esticando, LED, visor, trava) e do som; a arte precisa vir em **camadas separadas** para poder animar.

## O que gerar
- Quantidade: 1 cenário de fundo + 9 camadas/sprites (lista em "Arquivos esperados").
- Personagem: Lemos, **só a mão e a manga** (o jogador é "o investigador ou a investigadora Lemos": não mostrar rosto; mão e punho neutros, paletó escuro como no boneco do jogo).
- Expressão/pose: mão segurando o crachá pela borda de baixo, polegar na frente; o crachá preso a um cordão vermelho que sai de cima (do pescoço, fora do quadro).
- Enquadramento: **close na tranca**, câmera na altura do peito, olhando de frente para a parede ao lado da porta. Da esquerda para a direita: a borda da porta de vidro (batente de aço, vidro jateado com a faixa "DHPP · ACESSO RESTRITO", puxador vertical), no alto a **trava eletromagnética** (barra metálica com LED), o batente/coluna, e na parede a **leitora de tarja** (caixa metálica com visor pequeno de LCD verde, fenda vertical, LED). Acima da leitora, plaquinha vermelha "SÓ AGENTES". Ao fundo, parede de reboco institucional, rodapé, um extintor e placa de saída (discretos, desfocados ou mais escuros).
- Fundo: o cenário é o próprio fundo (a cena do jogo fica escondida por trás).
- Estilo: **pixel art no mesmo estilo da planta da base e da rua do DHPP** (paleta, contorno escuro, luz de cima, sombras projetadas), com mais detalhe por estar em close. Iluminação fria de corredor, reflexo no vidro, metal escovado.
- Resolução: cenário em **1280×592 px** (proporção da tela deitada do jogo, ~2,16:1), pensado para ampliação inteira sem suavizar; sprites na mesma escala do cenário.
- Formato: PNG com transparência nas camadas (o fundo pode ser opaco).

## Consistência obrigatória
- Órgão: **DHPP** (Homicídios). Nada de "Polícia Civil" ou "Polícia de São Paulo"; marca "DHPP | HOMICÍDIOS" igual à do letreiro da base.
- Época: **2002** (cartão de tarja magnética, LCD de segmentos/caracteres, nada de QR code, NFC moderno ou tela touch).
- Crachá: azul-marinho `#1b2a44` no topo com "DHPP" e "DEPARTAMENTO DE HOMICÍDIOS", foto 3×4 compatível com o boneco do Lemos (cabelo escuro, terno escuro, gravata vinho — ver `src/base/base.js`, `LOOK.lemos`), nome **"LEMOS"** (sem primeiro nome), função "INVESTIGAÇÃO", matrícula com **números neutros/ilegíveis**, tarja magnética preta no verso/borda e um holograma dourado pequeno.
- Cores do DHPP já usadas: azul-marinho `#1b2a44`, dourado `#c9a24a`, vermelho de aviso `#b02a24`.
- Referências oficiais: letreiro e porta da base (desenhados em `base.js`, `buildSign`/`buildDoor`), a fachada do DHPP na rua (`src/base/streetArt.js`) e o boneco do Lemos (`public/base/rua/personagens/lemos-rua.png`).

## Contexto da cena
Acontece sempre que o Lemos passa da recepção para o corredor restrito (e na volta, se quisermos). Tom: rotina de trabalho de um investigador, sem drama; a sensação é de "estou entrando num lugar controlado". O momento de sucesso precisa ser satisfatório (LED verde, clac da trava, porta destravando).

## Arquivos esperados
- `public/base/acesso/fundo.png` — cenário completo sem mão, crachá, LEDs acesos nem textos do visor (1280×592).
- `public/base/acesso/porta-aberta.png` — mesma porta já entreaberta (folha deslocada uns 20%), para o momento do sucesso (pode ser só a área da porta, com transparência).
- `public/base/acesso/leitora-led-vermelho.png`, `leitora-led-verde.png`, `leitora-led-apagado.png` — só o LED aceso, com brilho, recortado na posição dele.
- `public/base/acesso/trava-led-vermelho.png`, `trava-led-verde.png` — LED da trava magnética.
- `public/base/acesso/visor-vazio.png` — o LCD apagado (o texto "PASSE O CRACHÁ" / "ACESSO LIBERADO" / "TENTE NOVAMENTE" o código escreve por cima com fonte de pixel).
- `public/base/acesso/mao-cracha.png` — mão + punho + manga segurando o crachá (transparente), com o **ponto do crachá** e o ponto do cordão marcados no `manifest.json`.
- `public/base/acesso/cracha.png` — o crachá sozinho, de frente, alta qualidade (para o momento em que ele entra na fenda e para reuso em outras telas).
- `public/base/acesso/cordao.png` — um trecho reto do cordão vermelho (o código estica e curva).
- `public/base/acesso/manifest.json` — coordenadas (no sistema do `fundo.png`) de: centro da fenda (topo e base), LED da leitora, LED da trava, retângulo do visor, área da porta, ponto de pega do crachá na mão e ponto de saída do cordão.

## Observações técnicas para integração
- Ampliação por inteiro (pixel art nítida), então nada de antialias suave nas bordas dos sprites; contorno escuro igual ao do jogo.
- Deixar ~8% de margem segura nas bordas (o cabeçalho do jogo fica por cima, no alto).
- A fenda deve ser **vertical e bem visível** (é o alvo do gesto); o crachá passa de cima para baixo.
- A mão deve funcionar espelhada? Não: a leitora fica sempre à direita da porta.
- Sem pessoas além da mão do Lemos.

## Resposta do ChatGPT
Preenchido pelo ChatGPT ao concluir.

- status:
- assets criados:
- observações:
