import type { InterrogationConfig } from './types'

/** Depoimento de Rafael Valença (inocente). Tom da bíblia: informal, culpado por ter ficado fora de casa. */
export const rafaelInterrogation:InterrogationConfig = {
  id:'rafael',
  personId:'rafael',
  name:'Rafael Valença',
  depositionLabel:'DEPOIMENTO 03',
  idleExpression:'tired',
  initial:['night','home'],
  requiredForFinal:['night','pay','fights','inventory'],
  finalQuestion:'untold',
  closingLabel:'DEPOIMENTO ENCERRADO',
  farewell:'Obrigado pela colaboração, Rafael. Sinto muito pela sua perda. Você está liberado.',
  questions:[
    {
      id:'night',
      question:'Onde você estava ontem à noite?',
      answer:'Na lan house, perto do metrô. Se eu tivesse em casa… cara, eu fiquei jogando, nem pensei.',
      expression:'teary',
      unlocks:['pay','leave']
    },
    {
      id:'pay',
      question:'Alguém pode confirmar isso?',
      answer:'O dono. Eu paguei a hora no caixa, tem o recibo.',
      expression:'tired',
      highlights:[{ phrase:'paguei a hora no caixa', clue:'lan_paga' }]
    },
    {
      id:'leave',
      question:'A que horas você saiu de lá?',
      answer:'Quando fechou, quase duas da manhã. Quando eu voltei já tinha gente na rua.',
      expression:'tired',
      unlocks:['message']
    },
    {
      id:'message',
      question:'Você falou com a sua mãe antes de sair?',
      answer:'Mandei mensagem umas dez e quinze, avisando que ia ficar mais um pouco. Ela respondeu pra eu não demorar. Eu devia ter voltado.',
      expression:'teary'
    },
    {
      id:'home',
      question:'Como era o clima em casa?',
      answer:'Ruim. Eu tentava ficar fora. Eles brigavam por causa do Caio, quase toda semana.',
      expression:'uncomfortable',
      unlocks:['fights','dog'],
      highlights:[{ phrase:'brigavam por causa do Caio', clue:'brigas_namoro' }]
    },
    {
      id:'fights',
      question:'Seu pai chegou a ameaçar a Lívia?',
      answer:'Ouvi um pedaço de uma conversa. Ele falou que podia cortar a parte dela da herança e que não ia deixar o Caio se aproveitar do dinheiro da família.',
      expression:'nervous',
      unlocks:['inventory','caio'],
      highlights:[{ phrase:'cortar a parte dela da herança', clue:'ameaca_heranca' }]
    },
    {
      id:'inventory',
      question:'A Lívia comentou alguma coisa sobre herança ou inventário?',
      answer:'Uma semana antes, mais ou menos, ela começou a perguntar como funcionava inventário. Eu achei que era por causa das brigas.',
      expression:'uncomfortable',
      highlights:[{ phrase:'perguntar como funcionava inventário', clue:'pergunta_inventario' }]
    },
    {
      id:'dog',
      question:'E o Thor? Ele costuma ficar no canil?',
      answer:'De noite, não. O Thor dorme solto. Estranhei quando me falaram que ele tava preso.',
      expression:'nervous',
      highlights:[{ phrase:'O Thor dorme solto', clue:'cao_canil' }]
    },
    {
      id:'caio',
      question:'O que você acha do Caio?',
      answer:'A gente não é próximo. Eu evito. Nunca teve conversa entre a gente.',
      expression:'defensive'
    },
    {
      id:'confront_agenda',
      requiresClue:'agenda_helena',
      question:'A agenda da sua mãe fala em preocupação com a Lívia e o Caio.',
      answer:'Ela vivia preocupada. Queria conversar com a Lívia, mas ia adiando. Agora ela não vai mais conversar com ninguém.',
      expression:'shaken'
    },
    {
      id:'untold',
      question:'Quer acrescentar mais alguma coisa?',
      answer:'Só queria ter voltado mais cedo pra casa.',
      expression:'teary'
    }
  ]
}
