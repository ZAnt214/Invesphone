import type { InterrogationConfig } from './types'

const base = import.meta.env.BASE_URL

/**
 * Interrogatório de Lívia.
 *
 * Só existem dois arquivos de vídeo, e eles não são "uma pergunta cada":
 *  - livia-01: ela parada, calada, olhando para baixo (áudio é só ambiente).
 *  - livia-02: ela reagindo e falando (o áudio é fala que não corresponde ao texto do jogo, então nunca toca).
 * Os estados abaixo são só faixas de tempo nesses dois arquivos.
 * Os saltos entre momentos do vídeo vêm de uma comparação de quadros (videoGraph.ts): só emenda onde a pose é quase igual.
 */
export const liviaInterrogation:InterrogationConfig = {
  id:'livia',
  personId:'livia',
  name:'Lívia Valença',
  depositionLabel:'DEPOIMENTO 01',
  files:{
    neutral:`${base}videos/livia/livia-01.mp4`,
    reaction:`${base}videos/livia/livia-02.mp4`
  },
  states:{
    // parada: passeia por quase todo o arquivo, inclusive os trechos em que ela mexe as mãos
    idle:{ file:'neutral', range:[0.1,9.8], run:[5.5,9.0], startRange:[0.1,3.0] },
    // falando: usa o meio do arquivo, onde ela gesticula mais; cada estado começa numa região diferente
    response:{ file:'reaction', range:[0.3,9.7], run:[3.0,5.0], startRange:[1.6,4.4] },
    reactionA:{ file:'reaction', range:[0.3,9.7], run:[3.0,5.0], startRange:[3.6,6.4] },
    reactionB:{ file:'reaction', range:[0.3,9.7], run:[3.0,5.0], startRange:[5.2,8.2] }
  },
  idleState:'idle',
  initial:['arrival','entering'],
  requiredForFinal:['where_were','door_open','breakin','caio_code','fights'],
  finalQuestion:'untold',
  closingLabel:'DEPOIMENTO ENCERRADO',
  questions:[
    // linha 1: horário e o Caio
    {
      id:'arrival',
      question:'Que horas você chegou em casa?',
      answer:'Eu não sei exatamente… devia ser uma da manhã, talvez um pouco depois. Eu não fiquei olhando a hora.',
      videoState:'response',
      unlocks:['caio_together']
    },
    {
      id:'caio_together',
      question:'Você estava com o Caio?',
      answer:'Estava. A gente ficou junto a noite toda.',
      videoState:'reactionA',
      unlocks:['where_were','parents_relationship']
    },
    {
      id:'where_were',
      question:'Onde vocês estavam?',
      answer:'A gente rodou de carro, depois ficou num lugar… eu não lembro o nome. A gente só queria ficar sozinho.',
      videoState:'reactionB'
    },
    // linha 2: entrada na casa
    {
      id:'entering',
      question:'O que você viu quando entrou?',
      answer:'A casa estava toda apagada. Achei estranho o silêncio. Fui até o quarto deles, abri a porta e… eu não consegui nem gritar.',
      videoState:'response',
      unlocks:['door_open','breakin']
    },
    {
      id:'door_open',
      question:'A porta estava aberta?',
      answer:'Estava trancada. Eu usei minha chave, como sempre faço.',
      videoState:'reactionA',
      clues:['porta_intacta']
    },
    {
      id:'breakin',
      question:'Tinha sinal de arrombamento?',
      answer:'Não vi nada quebrado. Nem porta, nem janela. É isso que eu não entendo.',
      videoState:'reactionB',
      unlocks:['alarm_code'],
      clues:['porta_intacta']
    },
    // linha 3: alarme
    {
      id:'alarm_code',
      question:'Quem sabia o código do alarme?',
      answer:'Meus pais, eu… o Rafael também, acho. A Cida sabia o antigo.',
      videoState:'response',
      unlocks:['caio_code'],
      clues:['livia_codigo']
    },
    {
      id:'caio_code',
      question:'E o Caio?',
      answer:'O Caio? Não. Eu nunca passei o código pra ele. Ele só me viu digitando uma vez, mas nunca precisou saber.',
      videoState:'reactionB',
      clues:['inconsistencia_caio_codigo']
    },
    // linha 4: os pais e o namoro
    {
      id:'parents_relationship',
      question:'Seus pais gostavam do relacionamento?',
      answer:'Meu pai não engolia o Caio. Minha mãe fingia que aceitava, mas vivia me cobrando.',
      videoState:'reactionA',
      unlocks:['fights']
    },
    {
      id:'fights',
      question:'Vocês discutiam por causa disso?',
      answer:'Discutíamos, sim. Toda família discute… mas nunca a ponto de eu querer que acontecesse uma coisa dessas.',
      videoState:'response',
      clues:['brigas_namoro']
    },
    // final
    {
      id:'untold',
      question:'Tem alguma coisa que você ainda não contou pra gente?',
      answer:'…Eu devia ter ligado pra alguém antes de entrar no quarto. Mas eu fiquei parada na porta, olhando. Eu só… não consegui.',
      videoState:'reactionB'
    }
  ]
}
