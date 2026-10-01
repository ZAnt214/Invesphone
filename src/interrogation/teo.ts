import type { InterrogationConfig } from './types'

/** Interrogatório de Téo Duarte, irmão de Caio. Só abre as confrontações quem já levantou o dinheiro, a cinta e o log. */
export const teoInterrogation:InterrogationConfig = {
  id:'teo',
  personId:'teo',
  name:'Téo Duarte',
  depositionLabel:'INTERROGATÓRIO 06',
  idleExpression:'defensive',
  initial:['where'],
  requiredForFinal:['where','caio_out','confess'],
  finalQuestion:'untold',
  closingLabel:'INTERROGATÓRIO ENCERRADO',
  farewell:'Obrigado pela colaboração, Téo. Seu depoimento foi registrado e será encaminhado ao Ministério Público.',
  questions:[
    {
      id:'where',
      question:'Onde você estava naquela noite?',
      answer:'Em casa, dormindo. Pode perguntar pra minha mãe.',
      expression:'defensive',
      unlocks:['caio_out','moto','known']
    },
    {
      id:'caio_out',
      question:'O seu irmão saiu de casa nessa noite?',
      answer:'Saiu. Pegou o Gol umas dez e meia. Disse que ia buscar a namorada.',
      expression:'uncomfortable',
      unlocks:['stayed'],
      highlights:[{ phrase:'Pegou o Gol umas dez e meia', clue:'caio_saiu_22h30' }]
    },
    {
      id:'stayed',
      question:'E você ficou em casa o tempo todo?',
      answer:'Fiquei. Quer dizer… dei uma saída rápida. Mas voltei logo.',
      expression:'nervous'
    },
    {
      id:'moto',
      question:'Essa moto nova. De onde veio o dinheiro?',
      answer:'Juntei trabalhando. Entrega, bico, essas coisas.',
      expression:'lying',
      unlocks:['confront_money']
    },
    {
      id:'known',
      question:'Você conhecia a casa dos Valença?',
      answer:'Nunca pus o pé lá.',
      expression:'lying',
      unlocks:['confront_alarm']
    },
    {
      id:'confront_money',
      requiresClue:'moto_dolares',
      question:'A moto foi paga com dólares em espécie. Quem te deu esse dinheiro?',
      answer:'Foi um adiantamento. O Caio disse que ia ter dinheiro e dividiu comigo.',
      expression:'nervous',
      unlocks:['confront_bank'],
      highlights:[{ phrase:'O Caio disse que ia ter dinheiro e dividiu comigo', clue:'teo_adiantamento' }]
    },
    {
      id:'confront_bank',
      requiresClue:'cinta_bancaria',
      question:'A cinta do dinheiro é do Banco Meridional, de 15 de outubro. De onde veio?',
      answer:'Da Lívia. Ela deu os dólares pro Caio e ele me passou metade.',
      expression:'shaken',
      unlocks:['confess']
    },
    {
      id:'confront_alarm',
      requiresClue:'log_alarme',
      question:'O alarme foi desativado às 23h52 com o código mestre. Quem digitou?',
      answer:'O Caio. A Lívia tinha passado o código por telefone.',
      expression:'shaken',
      unlocks:['confess'],
      highlights:[{ phrase:'A Lívia tinha passado o código', clue:'livia_passou_codigo' }]
    },
    {
      id:'confess',
      question:'O que aconteceu dentro da casa?',
      answer:'Entramos pela garagem. O cachorro já tava preso, a Lívia deixou tudo pronto. Eu só fui com o Caio, juro que não sabia que ia acontecer.',
      expression:'teary',
      highlights:[{ phrase:'Entramos pela garagem', clue:'confissao_teo' },{ phrase:'a Lívia deixou tudo pronto', clue:'confissao_teo' }]
    },
    {
      id:'untold',
      question:'Quer acrescentar alguma coisa?',
      answer:'Eu quero um advogado.',
      expression:'defensive'
    }
  ]
}
