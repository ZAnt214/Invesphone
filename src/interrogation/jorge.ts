import type { InterrogationConfig } from './types'

/** Depoimento de Jorge, vigia da rua (inocente). Tom da bíblia: objetivo, fala em carro, horário aproximado e rua. */
export const jorgeInterrogation:InterrogationConfig = {
  id:'jorge',
  personId:'jorge',
  name:'Jorge',
  depositionLabel:'DEPOIMENTO 05',
  idleExpression:'neutral',
  initial:['shift'],
  requiredForFinal:['shift','saw','time','plate'],
  finalQuestion:'untold',
  closingLabel:'DEPOIMENTO ENCERRADO',
  farewell:'Obrigado pela colaboração, seu Jorge. Por enquanto é só. O senhor está liberado.',
  questions:[
    {
      id:'shift',
      question:'O senhor estava de ronda na noite passada?',
      answer:'Estava. Faço a rua das oito da noite às seis da manhã. Fico mais perto do posto, na esquina.',
      expression:'neutral',
      unlocks:['saw','alarm']
    },
    {
      id:'saw',
      question:'Viu alguma coisa suspeita?',
      answer:'Um Gol branco parado perto da casa dos Valença, com o farol apagado.',
      expression:'defensive',
      unlocks:['time','plate'],
      highlights:[{ phrase:'Gol branco parado perto da casa', clue:'vigia_gol' }]
    },
    {
      id:'time',
      question:'A que horas foi isso?',
      answer:'Umas onze e meia, mais ou menos. Olhei o relógio porque o carro já tava parado fazia tempo.',
      expression:'neutral',
      highlights:[{ phrase:'Umas onze e meia', clue:'vigia_horario' }]
    },
    {
      id:'plate',
      question:'Viu a placa ou quem estava no carro?',
      answer:'A placa eu guardei só até a metade. Quem tava dentro eu não sei dizer. Eu lembro mais de carro do que de gente.',
      expression:'uncomfortable',
      unlocks:['why']
    },
    {
      id:'alarm',
      question:'Ouviu o alarme da casa disparar?',
      answer:'Alarme nenhum disparou. A rua ficou quieta a noite toda.',
      expression:'uncomfortable',
      unlocks:['dog'],
      highlights:[{ phrase:'Alarme nenhum disparou', clue:'painel_alarme' }]
    },
    {
      id:'dog',
      question:'E o cachorro? Ouviu latir?',
      answer:'Nem um latido. Aquele cachorro late até pra gato.',
      expression:'uncomfortable',
      highlights:[{ phrase:'Nem um latido', clue:'cao_canil' }]
    },
    {
      id:'why',
      question:'Por que o senhor não avisou a polícia?',
      answer:'Avisar de quê? Carro parado não é crime. Eu anotei no caderno.',
      expression:'uncomfortable'
    },
    {
      id:'untold',
      question:'Mais alguma coisa que o senhor viu?',
      answer:'Só o carro. Eu não conheço bem a família, eu só cuido da rua. Sinto muito pelo que aconteceu.',
      expression:'shaken'
    }
  ]
}
