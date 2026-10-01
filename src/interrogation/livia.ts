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
  idleExpression:'apprehensive',
  initial:['arrival','entering'],
  requiredForFinal:['where_were','after','breakin','caio_code','fights','mother_last'],
  finalQuestion:'untold',
  closingLabel:'DEPOIMENTO ENCERRADO',
  farewell:'Obrigado pela colaboração, Lívia. Por enquanto é só. Você está liberada.',
  questions:[
    {
      id:'arrival',
      question:'Que horas você chegou em casa?',
      answer:'Eu não sei exatamente… devia ser uma da manhã, talvez um pouco depois. Eu não fiquei olhando a hora.',
      expression:'slightly_tired',
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
      highlights:[{ phrase:'eu abri normalmente', clue:'porta_intacta' }]
    },
    {
      id:'breakin',
      question:'Tinha algum sinal de arrombamento?',
      answer:'Eu não reparei nisso. Eu só vi a casa daquele jeito e achei que alguém tinha entrado.',
      expression:'defensive',
      unlocks:['alarm_code','confront_door'],
      highlights:[{ phrase:'Eu não reparei nisso', clue:'porta_intacta' }]
    },
    {
      id:'alarm_code',
      question:'Quem sabia o código do alarme?',
      answer:'Eu… meu pai, minha mãe… eu também sabia. Meu irmão provavelmente sabia.',
      expression:'nervous',
      unlocks:['caio_code'],
      highlights:[{ phrase:'eu também sabia', clue:'livia_codigo' }]
    },
    {
      id:'caio_code',
      question:'E o Caio sabia?',
      answer:'Não. Pelo menos… eu nunca passei o código pra ele.',
      expression:'lying',
      unlocks:['confront_code'],
      highlights:[{ phrase:'nunca passei o código', clue:'inconsistencia_caio_codigo' }]
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
      expression:'false_relief',
      unlocks:['confront_family','confront_estate'],
      highlights:[{ phrase:'Família discute', clue:'brigas_namoro' }]
    },
    {
      id:'mother_last',
      question:'Quando foi a última vez que você falou com sua mãe?',
      answer:'Antes de sair. A gente ia conversar quando eu voltasse.',
      expression:'teary'
    },
    {
      id:'confront_door',
      requiresClue:'porta_intacta',
      question:'A porta estava intacta e você tem chave. Quem abriu pra eles?',
      answer:'Ninguém! Eu não sei como entraram. Eu tenho chave, mas eu não estava lá.',
      expression:'nervous',
      highlights:[{ phrase:'Eu tenho chave', clue:'livia_chave' }]
    },
    {
      id:'confront_code',
      requiresClue:'inconsistencia_caio_codigo',
      question:'Você disse que nunca passou o código. Como o Caio saberia?',
      answer:'Ele… ele me viu digitando uma vez, no portão. Eu nunca falei o número pra ele.',
      expression:'lying',
      highlights:[{ phrase:'me viu digitando', clue:'caio_viu_digitando' }]
    },
    {
      id:'confront_family',
      requiresClue:'brigas_namoro',
      question:'Seu pai chegou a ameaçar você por causa do namoro?',
      answer:'Ele disse que ia cortar minha parte da herança se eu continuasse com o Caio.',
      expression:'shaken',
      highlights:[{ phrase:'cortar minha parte da herança', clue:'ameaca_heranca' }]
    },
    {
      id:'confront_estate',
      requiresClue:'pergunta_inventario',
      question:'Você andou perguntando sobre inventário antes das mortes.',
      answer:'Eu só queria entender o que ia acontecer com a gente. Qualquer filha perguntaria.',
      expression:'defensive'
    },
    {
      id:'untold',
      question:'Tem alguma coisa que você ainda não contou pra gente?',
      answer:'Não. Eu contei tudo.',
      expression:'lying'
    }
  ]
}
