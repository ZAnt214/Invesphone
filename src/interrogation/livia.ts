import type { InterrogationConfig } from './types'

/**
 * Interrogatório de Lívia: só dados. O visual vem de src/characters (retrato oficial animado por expressão).
 * Cada pergunta diz a expressão com que ela responde; nada de regra especial no JSX.
 */
export const liviaInterrogation:InterrogationConfig = {
  id:'livia',
  personId:'livia',
  name:'Lívia Valença',
  depositionLabel:'DEPOIMENTO 01',
  idleExpression:'tired',
  initial:['arrival','entering'],
  requiredForFinal:['where_were','after','breakin','caio_code','fights','mother_last'],
  finalQuestion:'untold',
  closingLabel:'DEPOIMENTO ENCERRADO',
  questions:[
    {
      id:'arrival',
      question:'Que horas você chegou em casa?',
      answer:'Eu não sei exatamente… devia ser uma da manhã, talvez um pouco depois. Eu não fiquei olhando a hora.',
      expression:'tired',
      unlocks:['caio_together']
    },
    {
      id:'caio_together',
      question:'Você estava com o Caio?',
      answer:'Estava. A gente ficou junto a noite toda.',
      expression:'defensive',
      unlocks:['where_were','parents_relationship']
    },
    {
      id:'where_were',
      question:'Onde vocês estavam?',
      answer:'Num motel. A gente foi pra lá depois que saiu.',
      expression:'uncomfortable'
    },
    {
      id:'entering',
      question:'O que você viu quando entrou?',
      answer:'A sala tava toda bagunçada. Tinha coisa fora do lugar… eu achei que tinham entrado lá. Eu chamei pela minha mãe… ninguém respondeu.',
      expression:'shaken',
      unlocks:['after','door_open']
    },
    {
      id:'after',
      question:'E depois?',
      answer:'Eu subi. Fui no quarto deles. Eu… eu vi os dois lá.',
      expression:'shaken'
    },
    {
      id:'door_open',
      question:'A porta estava aberta quando você chegou?',
      answer:'Não… quer dizer… eu abri normalmente. Eu tenho chave.',
      expression:'nervous',
      unlocks:['breakin'],
      clues:['porta_intacta']
    },
    {
      id:'breakin',
      question:'Tinha algum sinal de arrombamento?',
      answer:'Eu não reparei nisso. Eu só vi a casa daquele jeito e achei que alguém tinha entrado.',
      expression:'defensive',
      unlocks:['alarm_code'],
      clues:['porta_intacta']
    },
    {
      id:'alarm_code',
      question:'Quem sabia o código do alarme?',
      answer:'Eu… meu pai, minha mãe… eu também sabia. Meu irmão provavelmente sabia.',
      expression:'nervous',
      unlocks:['caio_code'],
      clues:['livia_codigo']
    },
    {
      id:'caio_code',
      question:'E o Caio sabia?',
      answer:'Não. Pelo menos… eu nunca passei o código pra ele.',
      expression:'nervous',
      clues:['inconsistencia_caio_codigo']
    },
    {
      id:'parents_relationship',
      question:'Seus pais gostavam do seu relacionamento com ele?',
      answer:'Não muito. Meu pai principalmente. Ele achava que o Caio não era bom pra mim.',
      expression:'defensive',
      unlocks:['fights','mother_last']
    },
    {
      id:'fights',
      question:'Vocês discutiam por causa disso?',
      answer:'Família discute. Mas não era nada… desse tamanho.',
      expression:'uncomfortable',
      clues:['brigas_namoro']
    },
    {
      id:'mother_last',
      question:'Quando foi a última vez que você falou com sua mãe?',
      answer:'Antes de sair. A gente ia conversar quando eu voltasse.',
      expression:'shaken'
    },
    {
      id:'untold',
      question:'Tem alguma coisa que você ainda não contou pra gente?',
      answer:'Não. Eu contei tudo.',
      expression:'nervous'
    }
  ]
}
