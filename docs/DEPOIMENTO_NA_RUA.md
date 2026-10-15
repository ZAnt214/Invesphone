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
