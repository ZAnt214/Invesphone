import type { InterrogationConfig } from './types'

/**
 * Depoimento de Caio Duarte, namorado de Lívia (executor). Tom da bíblia do caso: rápido, reativo, pergunta de volta,
 * desqualifica suspeitas, se irrita quando duvidam de Lívia e mente pior quando precisa explicar horários.
 */
export const caioInterrogation:InterrogationConfig = {
  id:'caio',
  personId:'caio',
  name:'Caio Duarte',
  depositionLabel:'DEPOIMENTO 02',
  idleExpression:'defensive',
  initial:['night','knows_house'],
  requiredForFinal:['night','motel_time','car','father'],
  finalQuestion:'untold',
  closingLabel:'DEPOIMENTO ENCERRADO',
  farewell:'Obrigado pela colaboração, Caio. Por enquanto é só. Você está liberado, mas fique à disposição.',
  questions:[
    {
      id:'night',
      question:'Onde você estava na noite de ontem?',
      answer:'Com a Lívia. A gente saiu e foi pra um motel. Fiquei com ela a noite inteira. Por quê, tá duvidando?',
      expression:'defensive',
      unlocks:['motel_time']
    },
    {
      id:'motel_time',
      question:'A que horas vocês chegaram ao motel?',
      answer:'Sei lá, onze, onze e pouco. Eu não fico olhando relógio, ué.',
      expression:'uncomfortable',
      unlocks:['car','show_board'],
      highlights:[{ phrase:'onze, onze e pouco', clue:'caio_horario' }]
    },
    {
      id:'car',
      question:'Você foi de carro?',
      answer:'Fui no Gol. Deixei lá no motel e não saí mais com ele. Mais alguma coisa?',
      expression:'defensive',
      unlocks:['street','confront_gol','show_gol'],
      highlights:[{ phrase:'não saí mais com ele', clue:'caio_horario' }]
    },
    {
      id:'street',
      question:'Você passou pela Rua das Acácias essa noite?',
      answer:'Eu? Não. Eu nem tinha motivo pra passar por lá.',
      expression:'lying'
    },
    {
      id:'knows_house',
      question:'Você conhece a casa dos Valença?',
      answer:'Conheço, já fui lá algumas vezes. O pai dela nunca foi com a minha cara, todo mundo sabe.',
      expression:'uncomfortable',
      unlocks:['father','alarm']
    },
    {
      id:'father',
      question:'Por que o Ricardo não gostava de você?',
      answer:'Dizia que eu era pouca coisa pra filha dele. Que eu só queria o dinheiro da família. Isso é coisa de quem não me conhece.',
      expression:'defensive',
      unlocks:['teo_home','inventory'],
      highlights:[{ phrase:'só queria o dinheiro da família', clue:'brigas_namoro' }]
    },
    {
      id:'alarm',
      question:'Você sabia o código do alarme?',
      answer:'Não. Por que eu saberia? Nunca precisei disso.',
      expression:'lying',
      unlocks:['confront_code']
    },
    {
      id:'inventory',
      question:'A Lívia comentou alguma coisa sobre herança?',
      answer:'Herança? Isso não é da conta de ninguém. A Lívia tá destruída, deixa ela em paz.',
      expression:'defensive'
    },
    {
      id:'teo_home',
      question:'Seu irmão Téo estava com você?',
      answer:'O Téo? O que o Téo tem a ver com isso? Ele nem conhecia a família.',
      expression:'defensive',
      revealsPeople:['teo']
    },
    {
      id:'confront_gol',
      requiresClue:'vigia_gol',
      question:'Um vigia viu o seu Gol parado perto da casa.',
      answer:'Tem Gol branco pra todo lado em São Paulo. Esse vigia viu a placa? Viu quem tava dentro? Então.',
      expression:'lying'
    },
    {
      id:'confront_code',
      requiresClue:'caio_viu_digitando',
      question:'A Lívia disse que você a viu digitando o código do alarme.',
      answer:'Ela digitava na minha frente, ué, eu ia fazer o quê, tapar o olho? Mas eu nunca decorei nada. E não quero mais ouvir você chamando a Lívia de mentirosa.',
      expression:'defensive',
      highlights:[{ phrase:'digitava na minha frente', clue:'caio_viu_digitando' }]
    },
    {
      id:'show_gol',
      requiresMaterial:'ficha_veiculo_gol',
      question:'O Gol branco que o vigia viu está no seu nome. Onde ele estava às onze e meia?',
      answer:'No motel, já falei. Carro no meu nome não quer dizer que era eu dirigindo. Eu deixei lá e não saí mais.',
      expression:'lying',
      highlights:[{ phrase:'Carro no meu nome', clue:'caio_gol_dele' }]
    },
    {
      id:'show_board',
      requiresMaterial:'quadro_horarios',
      question:'Só duas horas têm registro: o alarme às 23:52 e o motel às 00:56. O que você fez entre uma e outra?',
      answer:'Eu já disse que cheguei onze e pouco. Esse quadro tá errado, ou o motel anotou errado. Eu não fico olhando relógio.',
      expression:'lying',
      highlights:[{ phrase:'Esse quadro tá errado', clue:'caio_sem_intervalo' }]
    },
    {
      id:'untold',
      question:'Tem alguma coisa que você ainda não contou?',
      answer:'Não. Eu gostava da Lívia. Eu jamais faria mal à família dela.',
      expression:'lying'
    }
  ]
}
