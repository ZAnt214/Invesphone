import type { InterrogationConfig } from './types'

/** Depoimento de Caio Duarte, namorado de Lívia. Só dados: o visual vem de src/characters. */
export const caioInterrogation:InterrogationConfig = {
  id:'caio',
  personId:'caio',
  name:'Caio Duarte',
  depositionLabel:'DEPOIMENTO 02',
  idleExpression:'apprehensive',
  initial:['night','knows_house'],
  requiredForFinal:['night','motel_time','car','father','inventory'],
  finalQuestion:'untold',
  closingLabel:'DEPOIMENTO ENCERRADO',
  farewell:'Obrigado pela colaboração, Caio. Por enquanto é só. Você está liberado, mas não saia da cidade.',
  questions:[
    {
      id:'night',
      question:'Onde você estava na noite de ontem?',
      answer:'Com a Lívia. A gente saiu de uma festa e foi pra um motel. Fiquei com ela a noite inteira.',
      expression:'defensive',
      unlocks:['motel_time']
    },
    {
      id:'motel_time',
      question:'A que horas vocês chegaram ao motel?',
      answer:'Umas onze horas, eu acho. Não fiquei olhando o relógio.',
      expression:'uncomfortable',
      unlocks:['car'],
      highlights:[{ phrase:'Umas onze horas', clue:'caio_horario' }]
    },
    {
      id:'car',
      question:'Você foi de carro?',
      answer:'Fui no Gol. Deixei estacionado lá e não saí mais com ele.',
      expression:'defensive',
      unlocks:['street','confront_gol'],
      highlights:[{ phrase:'não saí mais com ele', clue:'caio_horario' }]
    },
    {
      id:'street',
      question:'Você passou pela rua da casa dos Valença essa noite?',
      answer:'Passei nada. Eu nem moro perto de lá.',
      expression:'lying'
    },
    {
      id:'knows_house',
      question:'Você conhece a casa dos Valença?',
      answer:'Conheço. Já fui lá algumas vezes. O pai dela nunca foi com a minha cara.',
      expression:'uncomfortable',
      unlocks:['father','alarm']
    },
    {
      id:'father',
      question:'Por que o Ricardo não gostava de você?',
      answer:'Dizia que eu era pouca coisa pra filha dele. Que eu só queria o dinheiro da família.',
      expression:'defensive',
      unlocks:['inventory','teo_home'],
      highlights:[{ phrase:'só queria o dinheiro da família', clue:'brigas_namoro' }]
    },
    {
      id:'alarm',
      question:'Você sabia o código do alarme?',
      answer:'Não. Nunca precisei saber.',
      expression:'lying',
      unlocks:['confront_code']
    },
    {
      id:'inventory',
      question:'A Lívia comentou alguma coisa sobre herança ou inventário?',
      answer:'Ela perguntava de vez em quando como funcionava. Acho que era só curiosidade.',
      expression:'uncomfortable',
      highlights:[{ phrase:'perguntava de vez em quando como funcionava', clue:'pergunta_inventario' }]
    },
    {
      id:'teo_home',
      question:'Seu irmão Téo estava com você?',
      answer:'O Téo? Não. Ele tava em casa. Por quê?',
      expression:'defensive'
    },
    {
      id:'confront_gol',
      requiresClue:'vigia_gol',
      question:'Um vigia viu o seu Gol parado perto da casa. Como explica?',
      answer:'Deve ter sido outro Gol. Tem muito Gol branco em São Paulo. Tá bom… eu passei na rua uma vez só, pra pegar um casaco da Lívia. Não entrei.',
      expression:'lying',
      highlights:[{ phrase:'eu passei na rua uma vez só', clue:'caio_admite_rua' }]
    },
    {
      id:'confront_code',
      requiresClue:'caio_viu_digitando',
      question:'A Lívia disse que você a viu digitando o código do alarme.',
      answer:'Ela digitava na minha frente toda vez, ela nem escondia. Mas eu nunca decorei nada.',
      expression:'lying',
      highlights:[{ phrase:'digitava na minha frente', clue:'caio_viu_digitando' }]
    },
    {
      id:'untold',
      question:'Tem alguma coisa que você ainda não contou?',
      answer:'Não. Eu amava a Lívia. Eu jamais machucaria a família dela.',
      expression:'lying'
    }
  ]
}
