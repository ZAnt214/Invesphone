# Depoimento na rua

Uma testemunha ouvida na própria cena, de madrugada, na frente da casa da Rua das Acácias. É o depoimento da base
(caderno, legenda escrita, expressões, piscar e boca no ritmo da fala, pistas no marca-texto) com outro lugar e outra luz.

Código: `src/rua/streetDepo.js` e `src/rua/streetDepo.css` (tudo dentro de `.sd`). Abre por cima da casa com
`openStreetDepo(host, id, {onClose, onClue, sound, clock})`, onde `id` é um depoimento de `src/interrogation/registry.ts`.

## Como entra no jogo

- Na casa, depois que a PM afasta três curiosos, ela avisa pelo rádio que um deles é o Jorge, vigia da rua, e que o
  separou na fita. Nessa hora o Jorge entra em `discoveredPeople` e `summonedPeople`, e aparece o botão **Jorge** na barra
  de baixo (`#t-depo`, com o ponto âmbar pulsando até ser tocado).
- Tocar no botão pausa a casa, silencia o som dela e abre a conversa. Ao sair, a casa volta como estava.
- O progresso é o mesmo do depoimento da base (`src/case/depositions.ts`): o que for perguntado na rua já conta lá. Ao
  fazer a pergunta final, o Jorge fica `interviewed` e o botão some; o que ficar faltando (por exemplo, o croqui da
  rua, que depende de material da equipe) continua na base como "retomar".

## Arte oficial

- Fundo: `public/cenarios/rua-acacias/frente-noite.jpg` (fachada, muro, portão, calçada) e `frente-noite-poste.png` (o poste, por cima dos curiosos). Se não carregar, o fundo desenhado em código entra no lugar.
- Curiosos atrás da fita: `public/characters/curiosos/fundo/curioso-01..08.png`, escurecidos para a madrugada, em duas fileiras (`CROWD_ART`). O rapaz filmando solta flash; a moça olhando o celular tem o rosto aceso; o holofote do helicóptero os clareia quando passa.
- Os curiosos ficam na penumbra (`crowdLayer`, ajuste `depo.shade`): desenhados numa camada própria e escurecidos só onde há gente, mais fundo nas pernas e longe do poste, com a sombra da copa da árvore balançando sobre os rostos e o giroflex varrendo a fila. Quem os revela é luz de verdade: o flash do celular e o holofote do helicóptero.
- Fitas de isolamento num canvas próprio (`#sd-tape`, resolução cheia, só a faixa y 172..304 da tela, na mesma camada do fundo): o contorno da fita é um recorte e a sombra ao longo dela é um gradiente contínuo (sem degraus); a luz da cena entra só dentro da fita.
- Fitas de isolamento como tecido (`spanPts`/`strip`, ajuste `depo.tape`): a do portão vai do poste ao pilar da direita, a dos curiosos vem de fora do quadro até o poste, na altura da cintura (`TAPES`). Cada trecho cede no meio, ondula com o vento (zero nas pontas), torce mostrando o verso sem letra e bate quando o helicóptero passa; os nós ficam por cima do poste e do pilar, com pontas soltas penduradas.
- Retratos de conversa da vizinha, do rapaz e do senhor (`public/characters/curiosos/<id>/expressions/`): prontos, ainda sem depoimento (falta escrever as falas dentro do cânone).

## O que acontece na tela

- Cenário: o portão dos Valença com a fita e um PM, o poste da calçada (a luz vem de cima, o braço sai do quadro), o
  giroflex dos dois lados, os curiosos atrás de outra fita (cada um com corpo, roupa e postura próprios, celulares e
  flashes), a garoa em camadas que só brilha onde a luz pega, pingos, névoa e gotas na lente.
- Câmera: na mão, com molas e paralaxe entre os planos; aproxima na pergunta, fecha devagar no rosto durante a resposta
  e dá um toque de aproximação na frase que vira pista.
- Legenda: a de depoimento, sem caixa, escrita letra por letra no ritmo da fala; cada frase fica o tempo da fala mais
  um tempo de leitura, e tocar na cena completa ou passa. Nome e função ficam fixos no canto direito.
- Pista: depois que ele termina a frase, o trecho é marcado de amarelo na legenda, voa até o caderno e o Lemos anota à
  mão; o contador do caderno sobe e a pista entra no save. A conversa espera a anotação acabar.
- De tempos em tempos passam uma viatura (atrás da câmera: farol e giroflex de frente para o Jorge, sombras na parede,
  som com efeito doppler) e um helicóptero (holofote passando atrás do Jorge, vento do rotor, folhas desfocadas, tremida).
  Nenhum dos dois muda o interrogatório; a viatura só abaixa o caderno quando ninguém está falando.
- Som (sintetizado): chuva, cidade, motor e rádio da viatura chiando, curiosos, carros na água, sirene longe, pingos,
  fita batendo; e os efeitos de caneta, caderno, marca-texto, papel e o toque da pista.

## Ajustes

Em Gráficos > **Depoimento na rua**: `depo.rain`, `depo.lens`, `depo.flyby`, `depo.film`, `depo.camera`. Em Som:
`sfx.depoAmb` e `sfx.depoFx`. A qualidade baixa desliga as gotas na lente e a cor de cinema e reduz a resolução.

## Fachada viva (`depo.life`)

A foto oficial é mexida em código, sem redesenhar: a árvore, a copa atrás do telhado, a folhagem da direita e as moitas balançam com o vento (faixas deslocadas, recortadas por uma máscara de folhagem calculada da própria imagem: cor + densidade dentro de caixas, `buildLife`); a cortina acesa ondula e a luz respira; os reflexos da rua tremem; nuvens passam só onde a máscara diz que é céu; névoa rasteira atravessa a rua. No canvas do meio (`#sd-tape`, tela inteira, resolução cheia): garoa, respingos, pingos do trilho do portão e da calha da garagem, e mariposas na luz do poste. O vento é o mesmo da chuva (`windAt`), então o helicóptero balança tudo junto.

## Desempenho

- Chuva: só uma garoa leve, toda em gotas soltas (sem textura deslizando, que parecia travada): ~170 no plano do meio, atrás do Jorge (`midLife`), e ~34 na frente; respingos nas poças. Pingos do poste espaçados. O risco de cada gota é sempre maior que o deslocamento entre dois quadros.
- Medidor de FPS: Ajustes → Gráficos → Interface → "Medidor de FPS" (`hud.fps`, desligado por padrão; `src/settings/fpsMeter.ts`), em todo o jogo.

- O fundo é desenhado a cada quadro (a cada dois só se o aparelho já precisou aliviar, `DEG>0`). A foto, o poste e o reflexo do giroflex no chão ficam em cache no tamanho do canvas (`bgCache`), refeitos só quando o tamanho muda.
- A garoa do fundo é refeita a cada dois quadros; a da frente, a cada quadro.
- Brilhos (`glow`), gotas na lente e o volume do holofote usam sprites feitos uma vez, não gradientes por quadro. A luz fixa sobre o Jorge é uma imagem pronta; o giroflex nele é um gradiente só.
- Os canvases das folhas do helicóptero só são tocados quando há folha voando.
- **Abrir sem travar:** tocar em "Jorge" travava a tela por alguns segundos, porque abrir pedia tudo de uma vez: baixar e decodificar as imagens, recortar os retratos e, principalmente, preparar as camadas do cabelo (recorte das mechas, bordas de corte, malhas: centenas de ms por expressão). Agora a casa chama `prewarmStreetDepo('jorge')` assim que a testemunha aparece na barra, e isso é feito aos poucos, em segundo plano, cedendo a vez entre uma mecha e outra (a casa continua lisa). Imagens decodificadas, retratos recortados e camadas do cabelo ficam guardados para a página (`imgOnce`, `portraitSet`, `prewarmHair`); abrir ou reabrir o depoimento só monta a cena, e as texturas sobem para a placa de vídeo uma expressão por quadro. Se o jogador tocar antes de terminar, o depoimento aproveita o que já foi feito e o resto continua aos poucos.
- **Onde está o custo no iPhone:** no Safari, a composição das camadas (cada canvas é uma camada) é feita pela GPU e sai barata; o desenho no canvas 2D é feito pela CPU, e é ele que decide se o quadro cabe em 16,7 ms. Por isso o fundo voltou a ter canvas próprio (`#sd-bg`): copiá-lo ampliado para o canvas da fita a cada quadro custava mais do que a fita inteira. O fps oscilando entre 35 e 60 vinha de quadros que passavam do tempo de vez em quando. Medido com o canvas 2D desenhado pela CPU (Chromium com `--disable-accelerated-2d-canvas`, o mais perto do Safari que dá para medir aqui), o trabalho 2D por quadro caiu de ~20 ms para ~11 ms.
- **Fita na placa de vídeo** (`src/rua/tapeGL.js`, canvas `#sd-tapegl`, logo abaixo de `#sd-tape`): os dois trechos, as voltas dos nós e as pontas soltas viram uma malha só, desenhada de uma vez, com a mesma textura impressa (frente e verso), a mesma sombra contínua onde a fita fica de lado, a mesma luz (giroflex, viatura passando, holofote) e a mesma resolução. No 2D eram dezenas de fatias inclinadas e recortadas, a parte mais cara do quadro. O canvas 2D da fita fica só com a garoa do meio. Sem WebGL, volta a fita em 2D.
- **Partes lentas em quadros alternados:** folhas, nuvens, cortina, reflexo na rua, névoa rasteira, a luz do poste no ar e a base da fila de curiosos (gente, penumbra, sombra da copa) são montadas em canvases próprios, metade num quadro e metade no outro (30 vezes por segundo cada), e copiadas 1:1 sobre o fundo em todos os quadros. Entre duas montagens elas andam centésimos de pixel (as folhas, no máximo ~0,1 px com o helicóptero em cima), o que não se distingue de 60. O que é rápido (giroflex, viatura passando, holofote, garoa, fita, Jorge) continua a cada quadro. Além de custar menos, todo quadro custa o mesmo, que é o que deixa o fps parado.
- **Luzes somadas numa só:** vermelho e azul saem do mesmo ponto e são somados como luz, então viram um brilho só com a cor da mistura (16 tons); os três brilhos fixos do poste ficam prontos numa imagem.
- A cena de baixo (a casa) sai da composição depois que o depoimento entra (`.sd-under`, menos o medidor de FPS), e volta ao fechar.
- Os canvases das folhas (`#sd-debM`, `#sd-debN`), o das partículas de pista (`#sd-fx`) e, com o cabelo na placa de vídeo, o da boca (`#sd-ac`) ficam escondidos enquanto estão vazios. O grão do filme fecha (o alfa soma até ficar opaco) em ~2 s e depois para de ser redesenhado.
- Com o cabelo na placa de vídeo, a luz da cena sobre a boca e as pálpebras é pintada só no retângulo do rosto; a base da figura vai numa malha só onde há figura; e só o que muda de uma mecha para outra é enviado à placa (no Safari cada chamada vai para outro processo).
- A sombra e a luz da fita (no 2D de reserva) preenchem só a fita, não o retângulo em volta.
- Sem letreiros por cima da cena (17/10/2026, pela imersão): saíram o REC com o relógio, o "FOCO · CADERNO", a marca do DHPP e o nome e a função do Jorge. Na tela ficam só a rua, o Jorge, o caderno e a legenda; o nome do lugar aparece só nas faixas de cinema da entrada.

## Troca de expressão natural

Vale para o Jorge, para a repórter e para os depoimentos da base (`src/characters/portraitRenderer.ts`):

- A troca vem com uma piscada, e o meio do cruzamento das duas imagens cai com as pálpebras fechadas. Olhos e sobrancelhas mudam por trás delas, sem o "fantasma" de dois olhares sobrepostos no meio da troca.
- O cruzamento acelera e desacelera (smootherstep) em vez de andar reto.
- Na rua, as pálpebras, a boca e o tom da pele usados no piscar acompanham a mistura das duas expressões, em vez de pular para a posição da nova.
- Na rua, a cabeça dá uma pequena "assentada" de reação (sobe ~1 a 2 px e volta em ~0,4 s), maior na surpresa e no susto.
- Duração do cruzamento: 230 ms no Jorge (padrão), 170 ms na repórter (`fadeMs` no cadastro). Uma troca pedida no meio de outra parte do lado mais perto da mistura.
- Com movimento reduzido, a troca é imediata e sem a assentada.

## Entrevista (modo imprensa)

A mesma cena serve para a entrevista do Lemos à repórter da TV Sereno, no portão da casa (`openStreetDepo(host,'reporter',{press:'e1',onPress})`). Direção aprovada em 16/10/2026: o jogo vê pelos olhos do Lemos, a repórter fica exatamente onde o Jorge fica, sem caderno.

- A pergunta dela sai como legenda, com a boca no ritmo e a expressão de `PRESS.e1.qe` (`asking`).
- As respostas possíveis aparecem à esquerda como legendas para tocar: a etiqueta (Cauteloso, Pede testemunhas…) e a frase entre aspas. "Revela uma pista" só aparece se o Lemos já tem a pista (`need`). "Não atender" vira "Seguir sem responder".
- A frase escolhida sai na legenda do Lemos (itálico, com "LEMOS" em cima; ele está atrás da câmera, então não há boca). Depois ela reage com a expressão e a fala de `re` (surpresa com a revelação, satisfeita com o apelo, insistente com a resposta cautelosa, contrariada se ele não atende) e a cena fecha.
- A frase vai para o save com `pressSay('e1', id)` e sai na primeira edição do Jornal Sereno. Na casa, responder acalma a imprensa; não atender a faz insistir mais.
- A arte é a oficial da repórter (`public/characters/reporter/`, cadastrada em `characters.ts` com as marcas do `manifest.json`). Ela não tem camadas de cabelo, então não tem cabelo ao vento nem a garoa no rosto do Jorge. A casa prepara a cena quando a imprensa chega (`prewarmStreetDepo('reporter',{press:'e1'})`).
- Toque na cena completa a legenda ou passa para a próxima, como no depoimento.
- Posição (ajuste de 18/10/2026): a legenda da repórter e a do Lemos ficam centradas embaixo, e as respostas à esquerda com a pergunta dela em cima (a legenda some enquanto ele escolhe). Tudo respeita a área segura do iPhone (`--sl`, `--sb`, `--sr` da casa); o caderno do Jorge também.
- Boca: as folhas de bocas dela são recortes do próprio rosto em 1:1, então a boca é desenhada sem ampliar e sem achatar (`squash:false`, lábio 108 px); assim a pele em volta não escorrega quando ela fala.
- Expressões: ver "Troca de expressão natural" (170 ms nela, 230 ms no Jorge).
- Cabelo: o cadastro já aponta para `public/characters/reporter/hair/manifest.json`; as camadas foram pedidas ao ChatGPT (`creative-requests/inbox/2026-10-18-reporter-cabelo-ao-vento.md`). Quando chegarem, ela ganha o cabelo ao vento e a garoa no rosto do Jorge; até lá, o retrato fica parado.

## Jorge molhado (`depo.wet`)

Ele está na garoa há tempo, e a imagem mostra: gotas presas no cabelo e nos ombros do casaco, o cabelo um pouco mais escuro e a pele úmida devolvendo a luz que chega (o giroflex pela esquerda, o farol do carro que passa, o poste por cima). Cada gota tem a sombra embaixo e um ponto de luz que acende quando o giroflex ou o farol bate; parada, ela quase some no casaco escuro, como gota de verdade.

- É feito no mesmo sombreador do cabelo (`src/rua/hairWind.js`, uniforme `uWet`): as gotas ficam na posição da imagem original (`vO`), então andam junto com a mecha quando o vento a dobra. O que é cabelo, pele e casaco é reconhecido pela cor da própria arte oficial; nada é redesenhado.
- Liga a figura pela placa de vídeo mesmo com "Cabelo ao vento" desligado (aí o vento é zero e o cabelo fica parado). Na qualidade baixa ou num aparelho que já precisou aliviar duas vezes, fica o retrato oficial seco.
- Custo: algumas contas a mais por pixel na placa de vídeo; nada no canvas 2D.
- Ajuste: Gráficos > Depoimento na rua > Jorge molhado.

## Cabelo ao vento

O cabelo do Jorge balança com o mesmo vento da garoa (`windAt`) e é empurrado quando o helicóptero passa. As camadas são do ChatGPT (`public/characters/jorge/hair/`, pedido `creative-requests/completed/2026-10-15-jorge-cabelo-ao-vento.md`): por expressão, uma base sem as mechas soltas (`base.png`), oito mechas e o mapa de peso de cada uma (vermelho: 0 na raiz, 1 na ponta). O personagem declara as camadas em `src/characters/characters.ts` (`hair`) e o código fica em `src/rua/hairWind.js`.

- **Como a mecha dobra:** cada mecha vira uma malha fina (grade de cerca de 6 px da imagem original) presa pelo mapa de peso. Cada ponto gira em volta da raiz da mecha, tanto mais quanto mais perto da ponta, então a mecha dobra na direção do vento sem esticar. Por cima entram ondas que correm da raiz para a ponta e, na rajada, uma turbulência rápida.
- **Giroflex de um lado só:** a viatura está à esquerda, fora do quadro, e o vermelho e o azul saem dela, alternando. Tudo o que a luz toca segue esse lado: o chão molhado, a fila de curiosos (e o contorno deles), a garoa acesa, a fita, a face do poste voltada para a esquerda e o Jorge. Nada acende azul do lado direito. O farol do carro que passa e o helicóptero são outras fontes e continuam com a direção própria.
- **Giroflex no Jorge:** vermelho e azul vêm da esquerda, do lado da viatura. No sombreador ela soma luz (não só tinge): é mais forte do lado de onde vem, atravessa o rosto e pesa mais nas partes claras, com um contorno forte nas bordas da silhueta viradas para ela. No retrato parado (sem WebGL ou com o cabelo desligado), o 2D aplica gradientes mais fortes atravessando o rosto.
- **Laterais:** as mechas rígidas e coladas na cabeça (as laterais, rigidez ≥ 0,8 no manifesto) não giram em volta de um ponto, o que as fazia balançar fora do lugar. O vento as empurra rente à cabeça: para dentro do lado de onde ele vem, para fora do lado para onde vai e para baixo com o helicóptero em cima. O empurrão tem a mesma mola das outras. As do topo continuam dobrando em volta da raiz, e quem está no meio mistura os dois.
- **Bordas de corte:** as mechas foram recortadas com bordas retas onde encostavam em outro cabelo. Essas bordas são achadas uma vez: é a borda da mecha cujo vizinho, na base, é cabelo cinza, e não fundo nem pele. Elas ganham um esfumado de ~13 px que entra conforme a mecha sai do lugar. Em repouso a imagem é a oficial; com vento, o corte reto não aparece.
- **Desempenho:** a figura inteira (base e mechas) é desenhada pela placa de vídeo (WebGL) num canvas próprio, `#sd-hair`, que fica na tela por baixo do canvas do retrato. Nada volta da placa de vídeo para o canvas 2D; na versão anterior, essa cópia custava quase um terço do quadro. A luz da cena sobre o Jorge (escuro geral, âmbar do poste, giroflex, farol da viatura) é calculada no próprio sombreador, com as mesmas camadas do 2D, então até a ponta que sai da silhueta recebe a mesma luz. O canvas 2D do retrato fica só com a boca e o piscar e não é redesenhado quando os dois estão parados. Sem WebGL, ou se o contexto cair, volta o retrato oficial parado.
- **Sem saltos:** o ângulo de cada mecha não é imposto quadro a quadro. Cada mecha é um pêndulo com mola e amortecimento em volta da raiz, que persegue o alvo do vento, passa um pouco e volta. O alvo vem do torque do vento sobre a mecha (produto vetorial da direção da mecha pelo vetor do vento), que é contínuo para qualquer direção, mesmo quando o helicóptero passa por cima e o vento gira. O vento é suavizado como vetor, nunca como ângulo. O estado da física vale para todas as expressões, e todas as expressões do depoimento ficam carregadas e já na placa de vídeo, então trocar de rosto não reinicia nem engasga o cabelo. Numa passagem simulada do helicóptero, a maior mudança de ângulo foi de 2° por quadro, sem picos.
- **Força:**
  - **Brisa:** o cabelo se inclina um pouco para a direita e balança devagar.
  - **Helicóptero:** o vento vem de onde ele está (`HS.sx`). De lado, o cabelo deita para o lado, e as mechas caem sobre a testa e a orelha. Em cima, é achatado para baixo. As mechas mais rígidas do manifesto (as laterais) mexem menos, e a turbulência fica forte enquanto ele está perto.
- **Memória:** ficam carregadas só as expressões que o depoimento usa, com cada mecha recortada na sua caixa. Enquanto carregam, no começo, aparece o retrato oficial, que é igual em repouso.
- **Ajuste:** Gráficos > Depoimento na rua > Cabelo ao vento (`depo.hair`). Desligado, na qualidade baixa, com movimento reduzido ou num aparelho que já precisou aliviar a cena duas vezes, fica o retrato oficial e as camadas saem da memória.
