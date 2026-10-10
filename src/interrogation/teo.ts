import type { InterrogationConfig } from './types'

/** Interrogatório de Téo Duarte, irmão de Caio. Só abre as confrontações quem já levantou o dinheiro, a cinta e o log. */
export const teoInterrogation:InterrogationConfig = {
  id:'teo',
  personId:'teo',
  name:'Téo Duarte',
  depositionLabel:'INTERROGATÓRIO 06',
  idleExpression:'defensive',
  initial:['where'],
  requiredForFinal:['where','caio_out','prepared','confess'],
  finalQuestion:'untold',
  closingLabel:'INTERROGATÓRIO ENCERRADO',
  farewell:'Obrigado pela colaboração, Téo. Seu depoimento foi registrado e será encaminhado ao Ministério Público.',
  questions:[
    {
      id:'where',
      question:'Onde você estava naquela noite?',
      answer:'Em casa. Dormindo.',
      expression:'defensive',
      unlocks:['caio_out','moto','known']
    },
    {
      id:'caio_out',
      question:'O seu irmão saiu de casa nessa noite?',
      answer:'Saiu. Pegou o Gol umas dez e meia. Foi buscar a namorada.',
      expression:'uncomfortable',
      unlocks:['stayed'],
      highlights:[{ phrase:'Pegou o Gol umas dez e meia', clue:'caio_saiu_22h30' }]
    },
    {
      id:'stayed',
      question:'E você ficou em casa o tempo todo?',
      answer:'Fiquei. Quer dizer… saí um pouco. Mas voltei.',
      expression:'nervous'
    },
    {
      id:'moto',
      question:'Essa moto nova. De onde veio o dinheiro?',
      answer:'Juntei. Bico, entrega.',
      expression:'lying',
      unlocks:['confront_money']
    },
    {
      id:'known',
      question:'Você conhecia a casa dos Valença?',
      answer:'Nunca fui.',
      expression:'lying'
    },
    {
      id:'confront_money',
      requiresClue:'moto_dolares',
      question:'A moto foi paga com dólares em espécie. Quem te deu esse dinheiro?',
      answer:'Foi um adiantamento. O Caio disse que ia ter dinheiro e me deu uma parte, só isso.',
      expression:'nervous',
      unlocks:['confront_bank'],
      highlights:[{ phrase:'O Caio disse que ia ter dinheiro', clue:'teo_adiantamento' }]
    },
    {
      id:'confront_bank',
      requiresClue:'cinta_bancaria',
      question:'A cinta do dinheiro é do Banco Meridional, de 15 de outubro. De onde veio?',
      answer:'Eu entrei com o Caio pra pegar o dinheiro. Foi dentro daquela casa, tá? Eu levei uma parte. Não vou falar do resto.',
      expression:'shaken',
      unlocks:['confront_alarm'],
      highlights:[{ phrase:'Eu entrei com o Caio', clue:'teo_entrou_com_caio' }]
    },
    {
      id:'confront_alarm',
      requiresClue:'log_alarme',
      question:'O alarme foi desativado às 23h52 com o código mestre. Quem digitou?',
      answer:'O Caio digitou. Eu não sabia o número. Quando a gente chegou, ele já sabia o que fazer.',
      expression:'shaken',
      unlocks:['prepared'],
      highlights:[{ phrase:'O Caio digitou', clue:'caio_digitou_alarme' }]
    },
    {
      id:'prepared',
      requiresClue:'caio_viu_digitando',
      question:'Antes de entrar, o que vocês já sabiam sobre a casa?',
      answer:'O Caio já chegou com tudo: horário, o código, que o cachorro ia estar preso e onde procurar o dinheiro. Isso já estava acertado antes de eu ir.',
      expression:'shaken',
      unlocks:['confess'],
      highlights:[{ phrase:'Isso já estava acertado antes de eu ir', clue:'plano_preparado_antes' }]
    },
    {
      id:'confess',
      requiresClue:'livia_thor_caio',
      question:'Quem preparou essas informações com o Caio?',
      answer:'A Lívia deixou tudo pronto. O código, o cachorro… O Caio me passou o resto. Eu entrei com ele. É isso.',
      expression:'teary',
      highlights:[{ phrase:'A Lívia deixou tudo pronto', clue:'confissao_teo' }]
    },
    {
      id:'untold',
      question:'Quer acrescentar alguma coisa?',
      answer:'Não tenho mais nada pra dizer. Quero um advogado.',
      expression:'defensive'
    }
  ]
}
