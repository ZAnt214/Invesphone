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
  requiredForFinal:['where_were','after','breakin','caio_code','fights','mother_last'],
  finalQuestion:'untold',
  closingLabel:'DEPOIMENTO ENCERRADO',
  questions:[
    {
      id:'arrival',
      question:'Que horas você chegou em casa?',
      answer:'Eu não sei exatamente… devia ser uma da manhã, talvez um pouco depois. Eu não fiquei olhando a hora.',
      videoState:'response',
      expression:'tired',
      unlocks:['caio_together']
    },
    {
      id:'caio_together',
      question:'Você estava com o Caio?',
      answer:'Estava. A gente ficou junto a noite toda.',
      videoState:'reactionA',
      expression:'defensive',
      unlocks:['where_were','parents_relationship']
    },
    {
      id:'where_were',
      question:'Onde vocês estavam?',
      answer:'Num motel. A gente foi pra lá depois que saiu.',
      videoState:'reactionB',
      expression:'uncomfortable'
    },
    {
      id:'entering',
      question:'O que você viu quando entrou?',
      answer:'A sala tava toda bagunçada. Tinha coisa fora do lugar… eu achei que tinham entrado lá. Eu chamei pela minha mãe… ninguém respondeu.',
      videoState:'response',
      expression:'shaken',
      unlocks:['after','door_open']
    },
    {
      id:'after',
      question:'E depois?',
      answer:'Eu subi. Fui no quarto deles. Eu… eu vi os dois lá.',
      videoState:'reactionB',
      expression:'shaken'
    },
    {
      id:'door_open',
      question:'A porta estava aberta quando você chegou?',
      answer:'Não… quer dizer… eu abri normalmente. Eu tenho chave.',
      videoState:'reactionA',
      expression:'nervous',
      unlocks:['breakin'],
      clues:['porta_intacta']
    },
    {
      id:'breakin',
      question:'Tinha algum sinal de arrombamento?',
      answer:'Eu não reparei nisso. Eu só vi a casa daquele jeito e achei que alguém tinha entrado.',
      videoState:'reactionB',
      expression:'defensive',
      unlocks:['alarm_code'],
      clues:['porta_intacta']
    },
    {
      id:'alarm_code',
      question:'Quem sabia o código do alarme?',
      answer:'Eu… meu pai, minha mãe… eu também sabia. Meu irmão provavelmente sabia.',
      videoState:'response',
      expression:'nervous',
      unlocks:['caio_code'],
      clues:['livia_codigo']
    },
    {
      id:'caio_code',
      question:'E o Caio sabia?',
      answer:'Não. Pelo menos… eu nunca passei o código pra ele.',
      videoState:'reactionB',
      expression:'nervous',
      clues:['inconsistencia_caio_codigo']
    },
    {
      id:'parents_relationship',
      question:'Seus pais gostavam do seu relacionamento com ele?',
      answer:'Não muito. Meu pai principalmente. Ele achava que o Caio não era bom pra mim.',
      videoState:'reactionA',
      expression:'defensive',
      unlocks:['fights','mother_last']
    },
    {
      id:'fights',
      question:'Vocês discutiam por causa disso?',
      answer:'Família discute. Mas não era nada… desse tamanho.',
      videoState:'response',
      expression:'uncomfortable',
      clues:['brigas_namoro']
    },
    {
      id:'mother_last',
      question:'Quando foi a última vez que você falou com sua mãe?',
      answer:'Antes de sair. A gente ia conversar quando eu voltasse.',
      videoState:'reactionA',
      expression:'shaken'
    },
    {
      id:'untold',
      question:'Tem alguma coisa que você ainda não contou pra gente?',
      answer:'Não. Eu contei tudo.',
      videoState:'reactionB',
      expression:'nervous'
    }
  ]
}
