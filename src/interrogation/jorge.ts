import type { InterrogationConfig } from './types'

/** Depoimento de Jorge, vigia da rua. */
export const jorgeInterrogation:InterrogationConfig = {
  id:'jorge',
  personId:'jorge',
  name:'Jorge',
  depositionLabel:'DEPOIMENTO 05',
  idleExpression:'neutral',
  initial:['shift'],
  requiredForFinal:['shift','saw','time','plate','alarm'],
  finalQuestion:'untold',
  closingLabel:'DEPOIMENTO ENCERRADO',
  farewell:'Obrigado pela colaboração, seu Jorge. Por enquanto é só. O senhor está liberado.',
  questions:[
    {
      id:'shift',
      question:'O senhor estava de ronda na noite passada?',
      answer:'Estava. Faço a rua das oito da noite às seis da manhã. Nunca saio do posto.',
      expression:'neutral',
      unlocks:['saw','house']
    },
    {
      id:'saw',
      question:'Viu alguém ou alguma coisa suspeita?',
      answer:'Vi um Gol branco parado perto da casa dos Valença, com o farol apagado.',
      expression:'defensive',
      unlocks:['time','plate'],
      highlights:[{ phrase:'Gol branco parado perto da casa', clue:'vigia_gol' }]
    },
    {
      id:'time',
      question:'A que horas foi isso?',
      answer:'Antes das onze e meia. Eu olhei o relógio porque o carro já tava parado fazia tempo.',
      expression:'neutral',
      highlights:[{ phrase:'Antes das onze e meia', clue:'vigia_horario' }]
    },
    {
      id:'plate',
      question:'Viu a placa ou quem estava no carro?',
      answer:'A placa eu não vi. Eram dois vultos dentro. Um deles desceu e foi pro portão da garagem.',
      expression:'uncomfortable',
      highlights:[{ phrase:'dois vultos', clue:'dois_no_carro' }]
    },
    {
      id:'house',
      question:'O senhor viu a Lívia chegar?',
      answer:'Vi. Chegou a pé, perto de uma da manhã. Parecia assustada, andava rápido.',
      expression:'neutral',
      unlocks:['alarm','dog']
    },
    {
      id:'alarm',
      question:'Ouviu o alarme disparar?',
      answer:'Alarme nenhum disparou. A casa ficou quieta a noite toda.',
      expression:'apprehensive',
      highlights:[{ phrase:'Alarme nenhum disparou', clue:'painel_alarme' }]
    },
    {
      id:'dog',
      question:'E o cachorro? Ouviu latir?',
      answer:'Nem um latido. O Thor late até pra gato, aquele cachorro.',
      expression:'apprehensive',
      unlocks:['why'],
      highlights:[{ phrase:'Nem um latido', clue:'cao_canil' }]
    },
    {
      id:'why',
      question:'Por que o senhor não avisou a polícia?',
      answer:'Avisar de quê? Carro parado não é crime. Eu anotei no caderno.',
      expression:'uncomfortable'
    },
    {
      id:'confront_fight',
      requiresClue:'brigas_namoro',
      question:'O senhor já viu o Caio brigando com a família?',
      answer:'Vi o seu Ricardo expulsando o rapaz do portão, uns dias antes. Gritou que não queria ele ali.',
      expression:'nervous',
      highlights:[{ phrase:'expulsando o rapaz do portão', clue:'ricardo_expulsa_caio' }]
    },
    {
      id:'untold',
      question:'Mais alguma coisa que o senhor viu?',
      answer:'O Gol saiu de novo perto da meia-noite e meia. Achei que era entrega. Não era.',
      expression:'shaken',
      highlights:[{ phrase:'perto da meia-noite e meia', clue:'gol_saiu_meia_noite' }]
    }
  ]
}
