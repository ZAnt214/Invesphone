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
