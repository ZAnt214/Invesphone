import type { InterrogationConfig } from './types'

/** Depoimento de Cida (inocente). Tom da bíblia: cuidadosa, respeitosa, evita julgar a família. */
export const cidaInterrogation:InterrogationConfig = {
  id:'cida',
  personId:'cida',
  name:'Cida',
  depositionLabel:'DEPOIMENTO 04',
  idleExpression:'tired',
  initial:['where','climate'],
  requiredForFinal:['where','confirm','climate','dog'],
  finalQuestion:'untold',
  closingLabel:'DEPOIMENTO ENCERRADO',
  farewell:'Obrigado pela colaboração, dona Cida. Por enquanto é só. A senhora está liberada.',
  questions:[
    {
      id:'where',
      question:'Onde a senhora estava na noite do crime?',
      answer:'Na casa da minha irmã, no Jabaquara. Dormi lá e só voltei de manhã, quando me ligaram.',
      expression:'tired',
      unlocks:['confirm']
    },
    {
      id:'confirm',
      question:'Alguém pode confirmar?',
      answer:'Minha irmã e o marido dela. E o vizinho que me trouxe de volta de manhã.',
      expression:'tired',
      unlocks:['show_term'],
      highlights:[{ phrase:'Minha irmã e o marido dela', clue:'alibi_cida' }]
    },
    {
      id:'climate',
      question:'Como era o clima na casa?',
      answer:'Eu não gosto de falar da vida dos patrões, moço. Mas andava pesado. Dona Helena ficou mais calada nas últimas semanas, e o seu Ricardo e a Lívia discutiam por causa do namoro.',
      expression:'uncomfortable',
      unlocks:['dog','visits'],
      highlights:[{ phrase:'discutiam por causa do namoro', clue:'brigas_namoro' }]
    },
    {
      id:'visits',
      question:'O Caio frequentava a casa?',
      answer:'Ia de vez em quando. O seu Ricardo não gostava, mas eu não me meto. Eu só cuido da casa.',
      expression:'uncomfortable'
    },
    {
      id:'dog',
      question:'E o cachorro, o Thor? Ele costuma ficar no canil?',
      answer:'De noite, nunca. O Thor dorme solto no quintal. Só prendia quando vinha visita brava, e nesse dia não tinha visita nenhuma.',
      expression:'uncomfortable',
      unlocks:['office'],
      highlights:[{ phrase:'De noite, nunca', clue:'cao_canil' }]
    },
    {
      id:'office',
      question:'A senhora conhece bem o escritório do seu Ricardo?',
      answer:'Eu limpo lá. Ele era organizado nas gavetas de cima, as de baixo ele raramente mexia.',
      expression:'neutral',
      unlocks:['confront_office']
    },
    {
      id:'confront_office',
      requiresClue:'escritorio_revirado',
      question:'O escritório estava revirado. O que a senhora achou?',
      answer:'Achei estranho. Abriram umas gavetas que ele quase nunca usava e deixaram as mais óbvias fechadas. Quem mexeu ali parecia que queria mostrar bagunça.',
      expression:'shaken',
      highlights:[{ phrase:'parecia que queria mostrar bagunça', clue:'busca_dirigida' }]
    },
    {
      id:'show_term',
      requiresMaterial:'termo_declaracao_terceiro_cida',
      question:'Sua irmã assinou um termo confirmando que a senhora dormiu na casa dela. Está certo?',
      answer:'Está, moço. Ela nunca mentiu pra mim e não ia mentir por mim. Eu só queria ter estado na casa dos patrões pra poder ajudar.',
      expression:'teary',
      pressure:-6,
      highlights:[{ phrase:'Está, moço', clue:'cida_alibi_termo' }]
    },
    {
      id:'untold',
      question:'Quer acrescentar alguma coisa?',
      answer:'Eu cuidei daquela família quinze anos. Dói muito.',
      expression:'teary'
    }
  ]
}
