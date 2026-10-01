import type { InterrogationConfig } from './types'

/** Depoimento de Rafael Valença, filho do casal. */
export const rafaelInterrogation:InterrogationConfig = {
  id:'rafael',
  personId:'rafael',
  name:'Rafael Valença',
  depositionLabel:'DEPOIMENTO 03',
  idleExpression:'slightly_tired',
  initial:['night','home'],
  requiredForFinal:['night','pay','fights','code'],
  finalQuestion:'untold',
  closingLabel:'DEPOIMENTO ENCERRADO',
  farewell:'Obrigado pela colaboração, Rafael. Sinto muito pela sua perda. Você está liberado.',
  questions:[
    {
      id:'night',
      question:'Onde você estava ontem à noite?',
      answer:'Na lan house, perto do metrô. Fiquei jogando até tarde.',
      expression:'slightly_tired',
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
      answer:'Quando fechou, quase duas da manhã. Quando eu cheguei já tinha gente na rua.',
      expression:'tired',
      unlocks:['message']
    },
    {
      id:'message',
      question:'Você falou com a sua mãe antes de sair?',
      answer:'Mandei mensagem dizendo que ia ficar mais um pouco. Ela respondeu pra eu não demorar.',
      expression:'teary'
    },
    {
      id:'home',
      question:'Como era o clima em casa?',
      answer:'Ruim. Eles brigavam por causa do Caio. Meu pai gritava e minha mãe tentava acalmar.',
      expression:'uncomfortable',
      unlocks:['fights']
    },
    {
      id:'fights',
      question:'Seu pai chegou a ameaçar a Lívia?',
      answer:'Na semana passada, no jantar. Ele disse que ia tirar a parte dela da herança. Ela saiu da mesa.',
      expression:'nervous',
      unlocks:['code','caio'],
      highlights:[{ phrase:'tirar a parte dela da herança', clue:'ameaca_heranca' }]
    },
    {
      id:'code',
      question:'Você sabia o código do alarme?',
      answer:'Sabia. Todo mundo da casa sabia: eu, a Lívia, meus pais.',
      expression:'slightly_tired',
      highlights:[{ phrase:'Todo mundo da casa sabia', clue:'livia_codigo' }]
    },
    {
      id:'caio',
      question:'O que você acha do Caio?',
      answer:'Não gosto dele. Ele olha a casa como se já fosse dele.',
      expression:'defensive',
      highlights:[{ phrase:'olha a casa como se já fosse dele', clue:'caio_cobica' }]
    },
    {
      id:'confront_agenda',
      requiresClue:'agenda_helena',
      question:'A agenda da sua mãe fala em tensão por causa do namoro. O que você sabia?',
      answer:'Que ela tava com medo. Medo do que a Lívia ia fazer por causa dele. Ela me disse isso uma vez, chorando.',
      expression:'shaken',
      highlights:[{ phrase:'Medo do que a Lívia ia fazer', clue:'helena_medo_livia' }]
    },
    {
      id:'untold',
      question:'Quer acrescentar mais alguma coisa?',
      answer:'Só queria minha mãe de volta.',
      expression:'teary'
    }
  ]
}
