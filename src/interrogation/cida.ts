import type { InterrogationConfig } from './types'

/** Depoimento de Cida, funcionária da família. */
export const cidaInterrogation:InterrogationConfig = {
  id:'cida',
  personId:'cida',
  name:'Cida',
  depositionLabel:'DEPOIMENTO 04',
  idleExpression:'tired',
  initial:['where','climate'],
  requiredForFinal:['where','confirm','climate','caio','code'],
  finalQuestion:'untold',
  closingLabel:'DEPOIMENTO ENCERRADO',
  farewell:'Obrigado pela colaboração, dona Cida. Por enquanto é só. A senhora está liberada.',
  questions:[
    {
      id:'where',
      question:'Onde a senhora estava na noite do crime?',
      answer:'Na casa da minha irmã, em Osasco. Dormi lá e só voltei de manhã, quando me ligaram.',
      expression:'tired',
      unlocks:['confirm']
    },
    {
      id:'confirm',
      question:'Alguém pode confirmar?',
      answer:'Minha irmã e o marido dela. E o vizinho que me trouxe de volta de manhã.',
      expression:'tired',
      highlights:[{ phrase:'Minha irmã e o marido dela', clue:'alibi_cida' }]
    },
    {
      id:'climate',
      question:'Como era o clima na casa?',
      answer:'Pesado. Dona Helena chorava escondida por causa do namoro da Lívia.',
      expression:'sad',
      unlocks:['caio','money'],
      highlights:[{ phrase:'Dona Helena chorava escondida', clue:'brigas_namoro' }]
    },
    {
      id:'caio',
      question:'O Caio ia lá?',
      answer:'Ia. Seu Ricardo não deixava ele passar do portão. A Lívia levava ele escondido pela garagem.',
      expression:'uncomfortable',
      unlocks:['code'],
      highlights:[{ phrase:'levava ele escondido pela garagem', clue:'caio_garagem' }]
    },
    {
      id:'code',
      question:'Quem sabia o código do alarme?',
      answer:'A família e eu. E a Lívia sempre digitava com o Caio do lado, ela nem se importava.',
      expression:'uncomfortable',
      highlights:[{ phrase:'digitava com o Caio do lado', clue:'caio_viu_digitando' }]
    },
    {
      id:'money',
      question:'O seu Ricardo andava preocupado com dinheiro?',
      answer:'Andava. Chegou uma carta de cobrança semana passada. Ele escondeu na gaveta do escritório.',
      expression:'apprehensive',
      unlocks:['dog'],
      highlights:[{ phrase:'carta de cobrança', clue:'carta_cobranca' }]
    },
    {
      id:'dog',
      question:'E o cachorro, o Thor?',
      answer:'Quem prende ele no canil é a Lívia ou o seu Ricardo. O Thor é bravo com estranho, mas nunca late pra Lívia.',
      expression:'neutral'
    },
    {
      id:'confront_office',
      requiresClue:'escritorio_revirado',
      question:'O escritório foi revirado. A senhora guarda alguma coisa ali?',
      answer:'A gaveta ele trancava, só ele mexia. Quem revirou sabia onde procurar.',
      expression:'shaken',
      highlights:[{ phrase:'sabia onde procurar', clue:'busca_dirigida' }]
    },
    {
      id:'untold',
      question:'Quer acrescentar alguma coisa?',
      answer:'Eu cuidei daquela família quinze anos.',
      expression:'sad'
    }
  ]
}
