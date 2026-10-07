/* Equipe do Caso 01: integrantes, assuntos de conversa, diligências e as regras de quando cada um fica disponível.
   Compartilhado pelo app Equipe do Invesphone e pelas mesas da base do DHPP (src/base), que gravam no mesmo save. */
import { case01MaterialAssets } from '../evidence/case01Materials'

/** O pedaço do save do caso que a Equipe lê e escreve. */
export type TeamGame = {
  task:number
  clues:string[]
  interviewed:string[]
  teamTopics?:string[]
  requestedMaterials?:string[]
  teamLog?:string[]
  discoveredPeople?:string[]
}

export type TeamMemberId = 'sonia'|'mauricio'|'renata'|'paulo'|'denise'

export type TeamMaterialRequest = {
  id:string
  memberId:TeamMemberId
  label:string
  kind:'FOTO'|'GRAVAÇÃO'|'DOCUMENTO'|'PERÍCIA'
  description:string
  minTask?:number
  minInterviews?:number
  requiresClues?:string[]
  requiresInterviewed?:string[]
  requiresTopics?:string[]
  revealsPeople?:string[]
  /** Para que serve o material (o que ele permite fazer no caso). Quando registra pistas, o app acrescenta isso sozinho. */
  use?:string
  /** Arquivos visuais oficiais já produzidos para esta diligência. */
  assetPaths?:readonly string[]
  clueIds?:string[]
  requestTime:string
  response:{time:string;from:string;text:string}
}

export type TeamDialogue = {
  id:string
  memberId:TeamMemberId
  label:string
  minTask?:number
  minInterviews?:number
  requiresClues?:string[]
  requiresInterviewed?:string[]
  requiresTopics?:string[]
  revealsPeople?:string[]
  /** Pessoas que a resposta põe em jogo: a conversa oferece chamá-las (ou retomar o depoimento). */
  callPeople?:string[]
  /** Pistas que esta conversa registra (a leitura da cena vem do perito, não de uma tela à parte). */
  clueIds?:string[]
  user:{time:string;text:string}
  agent:{time:string;text:string}
}

export const teamDialogues:TeamDialogue[] = [
  // Sônia: direção e leitura estratégica. Ela orienta, nunca entrega a solução.
  {
    id:'sonia_primeira_leitura',memberId:'sonia',label:'O que está te incomodando nessa cena?',
    minTask:1,
    user:{time:'04:33',text:'Sônia, antes de eu falar com eles: o que mais te incomoda nessa primeira leitura?'},
    agent:{time:'04:34',text:'A pressa em chamar de roubo. Porta intacta, cachorro preso e coisa de valor no lugar. Eu começaria separando fato de cenário.'}
  },
  {
    id:'sonia_roubo_encenado',memberId:'sonia',label:'Você também acha que a bagunça foi montada?',
    requiresClues:['escritorio_revirado','valores_intactos'],
    user:{time:'04:53',text:'Quanto mais olho, mais essa bagunça me parece feita pra ser vista. Você está com a mesma impressão?'},
    agent:{time:'04:54',text:'Impressão, sim. Prova, ainda não. Guarda isso como hipótese e vê se a perícia e os depoimentos sustentam. Não casa com uma versão cedo demais.'}
  },
  {
    id:'sonia_janela',memberId:'sonia',label:'Temos uma hora sem explicação no álibi.',
    requiresClues:['log_alarme','nota_motel'],
    user:{time:'05:34',text:'Alarme às 23:52. Motel às 00:56. Tem mais de uma hora que os dois não conseguem cobrir.'},
    agent:{time:'05:35',text:'Então não pergunta mais se o álibi existe. Pergunta o que aconteceu dentro dessa janela. E fala com eles separados de novo.'}
  },
  {
    id:'sonia_papeis',memberId:'sonia',label:'Acho que não foi todo mundo com o mesmo papel.',
    requiresClues:['cinta_bancaria','confissao_teo'],
    user:{time:'06:42',text:'A participação está ficando clara, mas não acho que todo mundo entrou nisso do mesmo jeito.'},
    agent:{time:'06:43',text:'É aí que você fecha o caso de verdade. Quem planejou, quem abriu caminho, quem entrou e quem recebeu. Não mistura participação com função.'}
  },

  {
    id:'sonia_versoes_cedendo',memberId:'sonia',label:'As versões deles estão cedendo em pontos diferentes.',
    requiresClues:['livia_porta_aberta','caio_sem_intervalo'],
    user:{time:'05:58',text:'A Lívia mudou na porta e o Caio não consegue explicar o intervalo. Cada um escorrega num ponto diferente.'},
    agent:{time:'05:59',text:'Cada um escorrega onde mais precisa de detalhe: ela no acesso, ele no horário. Versões que combinavam e começam a divergir assim costumam ter sido preparadas. Volta a eles separados e não entrega o que você já tem.'}
  },
  // Maurício: cena, vestígios e leitura física.
  {
    id:'mauricio_cena',memberId:'mauricio',label:'Me dá sua leitura da casa antes da coleta.',
    minTask:1,clueIds:['porta_intacta','escritorio_revirado','valores_intactos'],
    user:{time:'04:37',text:'Maurício, me fala da casa antes de vocês começarem a recolher. O que não bate?'},
    agent:{time:'04:38',text:'A entrada está limpa demais pra invasão. E o escritório está bagunçado, mas tem coisa óbvia de valor que ninguém tocou. Eu não chamaria isso de busca às cegas.'}
  },
  {
    id:'mauricio_painel',memberId:'mauricio',label:'O painel do alarme foi mexido ou forçado?',
    requiresTopics:['mauricio_cena'],clueIds:['painel_alarme'],
    user:{time:'04:46',text:'E o painel? Tem sinal de violação ou alguém operou normalmente?'},
    agent:{time:'04:47',text:'Nada de força. Teclado inteiro, tampa no lugar. Quem desligou sabia o que estava fazendo ou tinha o código. Posso te mandar o registro fotográfico de perto.'}
  },
  {
    id:'mauricio_canil',memberId:'mauricio',label:'Thor poderia ter sido preso depois?',
    requiresTopics:['mauricio_cena'],clueIds:['cao_canil'],
    user:{time:'04:49',text:'Sobre o cachorro: dá pra saber se colocaram ele no canil durante a confusão?'},
    agent:{time:'04:50',text:'Não parece. O canil está normal, sem sinal de contenção improvisada. Pra mim ele foi colocado ali antes de a casa virar cena.'}
  },
  {
    id:'mauricio_quartos',memberId:'mauricio',label:'E os quartos do andar de cima?',
    requiresTopics:['mauricio_cena'],clueIds:['quarto_livia','vitimas_dormindo'],
    user:{time:'04:51',text:'E lá em cima? Os quartos também estão mexidos?'},
    agent:{time:'04:52',text:'O quarto do casal está como quem foi surpreendido dormindo, sem sinal de luta ao redor. O quarto da Lívia está intacto, arrumado, como se ninguém tivesse passado por lá. A bagunça ficou toda embaixo.'}
  },
  {
    id:'mauricio_busca',memberId:'mauricio',label:'Essa bagunça parece uma busca real?',
    requiresClues:['escritorio_revirado','valores_intactos'],
    user:{time:'04:56',text:'Olha o escritório pra mim como perito, não como policial. Isso parece alguém procurando coisa de verdade?'},
    agent:{time:'04:57',text:'Parece alguém tentando produzir bagunça. Gaveta sem importância aberta, ponto óbvio intacto, objeto caro à vista. Se procuraram algo, sabiam exatamente o que queriam.'}
  },

  // Renata: cruzamentos, registros e inteligência.
  {
    id:'renata_prioridades',memberId:'renata',label:'O que você consegue cruzar já?',
    minInterviews:2,
    user:{time:'05:02',text:'Renata, com essas primeiras versões, o que dá pra cruzar sem depender de suposição?'},
    agent:{time:'05:03',text:'Horário, veículo e sistema da casa. Se eu tiver os nomes fechados e a janela aproximada, consigo puxar alarme e começar pelos registros objetivos.'}
  },
  {
    id:'renata_alarme',memberId:'renata',label:'Vale puxar o histórico completo do alarme?',
    minInterviews:4,requiresTopics:['renata_prioridades'],
    user:{time:'05:13',text:'As versões já estão minimamente separadas. Puxa o alarme inteiro ou só a madrugada?'},
    agent:{time:'05:14',text:'Inteiro. Quero ver padrão, quem costuma armar e qualquer desativação fora do horário. Se tiver código mestre no meio, isso muda bastante a leitura.'}
  },
  {
    id:'renata_gol',memberId:'renata',label:'O Gol e o horário do alarme se cruzam?',
    callPeople:['caio'],
    requiresClues:['vigia_gol','log_alarme'],
    user:{time:'05:22',text:'Jorge coloca o Gol na rua e o alarme cai às 23:52. Isso está perto demais pra ignorar.'},
    agent:{time:'05:23',text:'Concordo, mas ainda são duas peças separadas. O próximo passo é descobrir onde Caio diz que estava nesse intervalo e achar um registro independente.'}
  },
  {
    id:'renata_dinheiro',memberId:'renata',label:'Quero abrir uma linha financeira sobre Ricardo.',
    minTask:5,
    user:{time:'06:01',text:'A cena não parece roubo comum, mas tem uma quantia específica faltando. Abre a parte financeira do Ricardo.'},
    agent:{time:'06:02',text:'Faço isso. Vou separar movimentação recente de dívida antiga. Se o dinheiro estava em casa e alguém sabia, a origem tem que deixar rastro.'}
  },
  {
    id:'renata_cinta',memberId:'renata',label:'Essa cinta pode ligar o dinheiro ao Ricardo?',
    minTask:6,requiresClues:['extrato_ricardo'],
    user:{time:'06:18',text:'Tem uma cinta bancária junto do dinheiro ligado ao Téo. Dá pra fechar origem?'},
    agent:{time:'06:19',text:'Se agência, data e valor baterem com a movimentação do Ricardo, deixa de ser dinheiro genérico. Me manda os dados da cinta e eu cruzo.'}
  },

  // Paulo: rua, testemunhas e estabelecimentos.
  {
    id:'paulo_rua',memberId:'paulo',label:'O que você conseguiu da rua até agora?',
    minTask:1,revealsPeople:['jorge'],
    user:{time:'04:40',text:'Paulo, o que tem do lado de fora? Vizinho, porteiro, vigia, carro?'},
    agent:{time:'04:41',text:'Achei um nome útil: Jorge. É vigia da rua e presta atenção em carro e movimento. Vou separar ele dos curiosos. Se você quiser, já dá pra chamar ele pra depor.'}
  },
  {
    id:'paulo_jorge',memberId:'paulo',label:'Jorge parece confiável sobre o Gol?',
    callPeople:['jorge'],
    requiresInterviewed:['jorge'],
    user:{time:'05:07',text:'Falei com o Jorge. Ele cravou o Gol, mas não quem estava dentro. Você compra essa lembrança?'},
    agent:{time:'05:08',text:'Do carro, sim. Ele trabalha olhando placa, modelo e movimento da rua. Pessoa dentro ele não viu. Eu usaria o carro, não inventaria ocupante.'}
  },
  {
    id:'paulo_rafael',memberId:'paulo',label:'Confere a história da LAN do Rafael.',
    callPeople:['rafael'],
    requiresInterviewed:['rafael'],
    user:{time:'05:09',text:'Rafael diz que ficou na LAN. Consegue verificar sem avisar ele antes?'},
    agent:{time:'05:10',text:'Consigo. Vou no caixa, peço registro e horário. Se pagou sessão e ficou logado, dá pra fechar esse pedaço sem depender da palavra dele.'}
  },
  {
    id:'paulo_motel',memberId:'paulo',label:'Precisamos de um horário independente do motel.',
    requiresClues:['log_alarme'],
    user:{time:'05:24',text:'O alarme me deu 23:52. Agora eu preciso saber quando Lívia e Caio realmente chegaram no motel.'},
    agent:{time:'05:25',text:'Vou direto no estabelecimento. Não quero memória de atendente; quero cupom, ficha ou qualquer registro com hora impressa.'}
  },

  // Denise: versões, gravações e consistência dos depoimentos.
  {
    id:'denise_alibis_fechados',memberId:'denise',label:'Dá pra tirar Rafael e Cida da linha de suspeita?',
    requiresClues:['rafael_lan_confirmada','cida_alibi_termo'],
    user:{time:'05:56',text:'Com o recibo e a fachada da LAN, e o termo da irmã da Cida: dá pra fechar esses dois?'},
    agent:{time:'05:57',text:'Pelo que está em papel, sim. Recibo e fachada pro Rafael, termo e confirmação de terceiros pra Cida. Registro os dois como descartados no inquérito. Isso não resolve nada, só tira gente da frente do que sobra.'}
  },
  {
    id:'denise_livia',memberId:'denise',label:'Como a Lívia se comportou no primeiro depoimento?',
    callPeople:['livia'],
    requiresInterviewed:['livia'],
    user:{time:'05:04',text:'Denise, você ficou no registro da Lívia. Alguma coisa no jeito dela te chamou atenção?'},
    agent:{time:'05:05',text:'Ela controla bem a fala. Fica emocional quando fala da mãe, mas nos horários responde mais rápido e com menos detalhe. Não é prova de nada, só vale comparar depois.'}
  },
  {
    id:'denise_caio_livia',memberId:'denise',label:'As versões de Lívia e Caio estão iguais demais?',
    callPeople:['caio', 'livia'],
    requiresInterviewed:['livia','caio'],
    user:{time:'05:16',text:'Compara os dois pra mim. Eles lembram das mesmas coisas ou estão repetindo a mesma estrutura?'},
    agent:{time:'05:17',text:'A estrutura está parecida demais: noite juntos, motel, volta depois. Mas quando você olha detalhe de horário, cada um escorrega pra um lado. Eu guardaria os áudios.'}
  },
  {
    id:'denise_contradicoes',memberId:'denise',label:'Quais respostas mudaram depois das provas?',
    callPeople:['caio', 'livia'],
    requiresClues:['inconsistencia_caio_codigo'],
    user:{time:'05:40',text:'Quero as mudanças de versão separadas das simples diferenças de memória.'},
    agent:{time:'05:41',text:'A mais limpa até agora é o código. Primeiro Caio não sabia; depois aparece a explicação de que ele teria visto Lívia digitando. Isso é mudança, não esquecimento.'}
  },

  // Conversas que abrem as diligências de material novo (cada uma depende de uma base investigativa).
  {
    id:'mauricio_porta',memberId:'mauricio',label:'Dá pra afirmar que ninguém forçou a porta?',
    callPeople:['livia'],
    requiresClues:['porta_intacta'],
    user:{time:'04:43',text:'Maurício, a porta da frente: dá pra afirmar que ninguém forçou?'},
    agent:{time:'04:44',text:'Fechadura e batente inteiros. Sem marca de alavanca, sem lasca, sem nada torcido. Quem entrou não precisou forçar. Vou te mandar de perto, com escala, pra ficar registrado.'}
  },
  {
    id:'mauricio_laudo',memberId:'mauricio',label:'Já dá pra ter um laudo preliminar do local?',
    minInterviews:2,requiresTopics:['mauricio_cena'],
    user:{time:'05:20',text:'Já ouvi duas versões. Dá pra eu ter um laudo preliminar do local?'},
    agent:{time:'05:21',text:'Dá. Preliminar mesmo: descreve o que está lá e o que não está, sem apontar ninguém. O que depende de laboratório fica de fora por enquanto. Te mando.'}
  },
  {
    id:'renata_placa',memberId:'renata',label:'Consegue puxar o Gol que o Jorge viu?',
    callPeople:['caio'],
    requiresClues:['vigia_gol'],
    user:{time:'05:11',text:'O Jorge viu um Gol branco perto da casa. Consegue puxar de quem é?'},
    agent:{time:'05:12',text:'Consigo. Gol branco de 98 não é raro, mas com o modelo e o que o Jorge lembrou eu fecho rápido. Te mando a ficha da consulta.'}
  },
  {
    id:'renata_quadro',memberId:'renata',label:'Monta a noite num quadro só?',
    callPeople:['caio', 'livia'],
    requiresClues:['log_alarme','nota_motel'],
    user:{time:'05:36',text:'Monta a noite num quadro pra mim: o que eu tenho com hora certa?'},
    agent:{time:'05:37',text:'Só duas pontas por registro: o alarme e a entrada no motel. O resto eu deixo em branco de propósito, porque hora de memória não entra no quadro. Te mando a prancheta.'}
  },
  {
    id:'renata_imovel',memberId:'renata',label:'O que consta do imóvel no cartório?',
    requiresClues:['pergunta_inventario'],
    user:{time:'05:46',text:'A Lívia perguntou sobre inventário antes das mortes. O que consta do imóvel no cartório?'},
    agent:{time:'05:47',text:'Posso puxar a matrícula: quem é dono no papel e como o imóvel está registrado. É documento seco, não diz quem queria o quê. Mando assim que sair.'}
  },
  {
    id:'renata_antecedentes',memberId:'renata',label:'Os irmãos Duarte têm antecedentes?',
    callPeople:['teo'],
    requiresInterviewed:['teo'],
    user:{time:'06:30',text:'Já ouvi o Téo. Os dois irmãos têm algum antecedente?'},
    agent:{time:'06:31',text:'Vou consultar os dois. Adianto: ficha limpa não inocenta ninguém, só diz que não há registro anterior. Te mando a consulta.'}
  },
  {
    id:'paulo_cida',memberId:'paulo',label:'Alguém de fora confirma o álibi da Cida?',
    callPeople:['cida'],
    requiresClues:['alibi_cida'],
    user:{time:'05:50',text:'A Cida disse que estava com a família. Alguém de fora confirma isso por escrito?'},
    agent:{time:'05:51',text:'Uma irmã dela, que mora no Jabaquara, confirmou sem pressão. Tomei por termo pra constar. É versão de família, não é prova de ouro, mas bate com o que a Cida contou.'}
  },
  {
    id:'paulo_lan_foto',memberId:'paulo',label:'Documenta o lugar da LAN, não só o recibo.',
    requiresClues:['lan_paga'],
    user:{time:'05:15',text:'Além do recibo, quero o lugar documentado. Fachada da LAN, como está.'},
    agent:{time:'05:16',text:'Fotografei por fora, a fachada e a vitrine. Não puxei registro de mais ninguém além do que já te entreguei.'}
  },
  {
    id:'denise_capa',memberId:'denise',label:'O inquérito já está formalizado?',
    minTask:1,
    user:{time:'04:59',text:'Denise, o inquérito já está formalizado? Quero a capa certa no arquivo.'},
    agent:{time:'05:00',text:'Instaurado em 17/10. Já numerei e montei a capa. Te mando a imagem pra você ver como ficou.'}
  },
  {
    id:'denise_termo',memberId:'denise',label:'Como fica o termo de depoimento?',
    minInterviews:1,
    user:{time:'05:06',text:'Os depoimentos seguem algum modelo de termo? Quero ver como vai ficar o registro.'},
    agent:{time:'05:07',text:'Seguem. Cabeçalho do DHPP, qualificação, perguntas e respostas, assinatura e testemunhas. Te mando o modelo em branco.'}
  }
]

export const teamMaterialRequests:TeamMaterialRequest[] = [
  {
    id:'fotos_cena',memberId:'mauricio',label:'Fotos completas da cena',kind:'FOTO',
    use:'Registro fotográfico da casa. Serve para rever os pontos da cena sem voltar lá.',
    assetPaths:case01MaterialAssets.fotos_cena,
    description:'Entrada, sala, cozinha, escritório, corredor, os dois quartos e o canil.',
    minTask:1,requiresTopics:['mauricio_cena'],requestTime:'04:39',
    response:{time:'04:42',from:'Perícia',text:'Separei o pacote antes da coleta. Tem entrada, sala, cozinha, escritório, corredor, os dois quartos e o canil. Estou te enviando na ordem em que fotografamos.'}
  },
  {
    id:'fotos_painel',memberId:'mauricio',label:'Close do painel do alarme',kind:'FOTO',
    use:'Mostra o painel sem sinal de força: quem desligou o alarme tinha o código.',
    assetPaths:case01MaterialAssets.fotos_painel,
    description:'Fotografias do teclado, visor e estado do painel antes da manipulação.',
    requiresClues:['painel_alarme'],requiresTopics:['mauricio_painel'],requestTime:'04:48',
    response:{time:'04:51',from:'Perícia',text:'Enviei os closes. Teclado inteiro, visor e tampa. Fotografei antes de tocar em qualquer coisa.'}
  },
  {
    id:'gravacoes_depoimentos',memberId:'denise',label:'Separar gravações dos depoimentos',kind:'GRAVAÇÃO',
    use:'Permite comparar o que cada um disse. Use para checar mudanças de versão.',
    assetPaths:case01MaterialAssets.gravacoes_depoimentos,
    description:'Áudios individuais para comparar versões e mudanças de resposta.',
    minInterviews:2,requiresTopics:['denise_caio_livia'],requestTime:'05:18',
    response:{time:'05:20',from:'Cartório',text:'Separei Lívia e Caio em arquivos diferentes e marquei os trechos de horário. Assim dá pra ouvir um sem contaminar a lembrança do outro.'}
  },
  {
    id:'comprovante_lan',memberId:'paulo',label:'Buscar comprovante da LAN house',kind:'DOCUMENTO',
    assetPaths:case01MaterialAssets.comprovante_lan,
    description:'Registro de pagamento e horário vinculado a Rafael.',
    requiresInterviewed:['rafael'],requiresTopics:['paulo_rafael'],clueIds:['lan_paga'],requestTime:'05:11',
    response:{time:'05:14',from:'Equipe Externa',text:'Fechou. A LAN tinha registro de caixa e sessão. Rafael estava lá no período relevante; estou anexando a cópia.'}
  },
  {
    id:'log_alarme',memberId:'renata',label:'Puxar log completo do alarme',kind:'PERÍCIA',
    assetPaths:case01MaterialAssets.log_alarme,
    description:'Histórico de ativações e desativações do sistema da residência.',
    minInterviews:4,requiresTopics:['renata_alarme'],clueIds:['log_alarme'],requestTime:'05:15',
    response:{time:'05:18',from:'Inteligência',text:'Chegou. Tem uma desativação por código mestre às 23:52. Esse é o evento fora do padrão que eu estava procurando.'}
  },
  {
    id:'registro_motel',memberId:'paulo',label:'Buscar registro do motel',kind:'DOCUMENTO',
    assetPaths:case01MaterialAssets.registro_motel,
    description:'Comprovante independente do horário de entrada de Lívia e Caio.',
    requiresClues:['log_alarme'],requiresTopics:['paulo_motel'],clueIds:['nota_motel'],requestTime:'05:26',
    response:{time:'05:31',from:'Equipe Externa',text:'Consegui o cupom. Entrada registrada às 00:56. Não é lembrança de funcionário, está impresso.'}
  },
  {
    id:'docs_financeiros',memberId:'renata',label:'Levantar documentos financeiros de Ricardo',kind:'DOCUMENTO',
    assetPaths:case01MaterialAssets.docs_financeiros,
    description:'Extratos e cobranças para separar dívida antiga de movimentação recente.',
    minTask:5,requiresTopics:['renata_dinheiro'],clueIds:['extrato_ricardo','carta_cobranca'],requestTime:'06:03',
    response:{time:'06:10',from:'Financeiro',text:'Separei o que é cobrança antiga do que é movimentação recente. Tem um extrato que merece atenção; mandei junto com a carta pra você comparar.'}
  },
  {
    id:'analise_cinta',memberId:'renata',label:'Cruzar a cinta bancária',kind:'PERÍCIA',
    assetPaths:case01MaterialAssets.analise_cinta,
    description:'Conferir banco, agência, data e valor da cinta encontrada com o dinheiro.',
    minTask:6,requiresClues:['extrato_ricardo'],requiresTopics:['renata_cinta'],revealsPeople:['teo'],clueIds:['cinta_bancaria','moto_dolares'],requestTime:'06:20',
    response:{time:'06:26',from:'Financeiro',text:'Bateu nos quatro pontos: Banco Meridional, agência 0431, 15/10/2002, US$ 5.000. A cinta veio com dólares em espécie, e a ponta do fio é uma moto nova paga à vista: o nome é Téo Duarte, irmão do Caio. Vale chamar esse rapaz.'}
  },

  {
    id:'croqui_residencia',memberId:'mauricio',label:'Croqui da residência',kind:'DOCUMENTO',
    use:'Serve para se localizar na casa quando a equipe falar de um ambiente ou de um ponto fotografado.',
    assetPaths:case01MaterialAssets.croqui_residencia,
    description:'Planta da casa com os pontos fotografados numerados.',
    minTask:1,requiresTopics:['mauricio_cena'],requestTime:'04:40',
    response:{time:'04:45',from:'Perícia',text:'Montei o croqui com os pontos fotografados numerados: casa, canil e circulação. Serve pra você se localizar quando eu falar de um ambiente.'}
  },
  {
    id:'fechadura_porta',memberId:'mauricio',label:'Close da fechadura da porta',kind:'FOTO',
    use:'Para apresentar a Lívia: a fechadura não foi forçada e ela tem chave.',
    assetPaths:case01MaterialAssets.fechadura_porta,
    description:'Fechadura e batente da porta principal, com escala.',
    requiresClues:['porta_intacta'],requiresTopics:['mauricio_porta'],requestTime:'04:45',
    response:{time:'04:46',from:'Perícia',text:'Aqui o close da fechadura com a escala encostada. Sem marca de força.'}
  },
  {
    id:'trava_canil',memberId:'mauricio',label:'Foto da trava do canil',kind:'FOTO',
    use:'Para apresentar a Rafael: o Thor não se trancou sozinho.',
    assetPaths:case01MaterialAssets.trava_canil,
    description:'Trinco do canil por fora, com Thor ao fundo.',
    requiresClues:['cao_canil'],requiresTopics:['mauricio_canil'],requestTime:'04:52',
    response:{time:'04:53',from:'Perícia',text:'O ferrolho está fechado por fora, do jeito que se fecha todo dia. O Thor está lá dentro, calmo.'}
  },
  {
    id:'escritorio_comparativo',memberId:'mauricio',label:'Foto comparativa do escritório',kind:'FOTO',
    use:'Mostra o contraste: gavetas sem importância abertas e o que vale à vista. Sustenta a bagunça encenada.',
    assetPaths:case01MaterialAssets.escritorio_comparativo,
    description:'Gavetas laterais abertas e o que ficou intacto à vista.',
    requiresClues:['escritorio_revirado','valores_intactos'],requiresTopics:['mauricio_busca'],requestTime:'04:58',
    response:{time:'05:02',from:'Perícia',text:'Fotografei como está: gavetas laterais abertas, papéis fora do lugar, e o relógio, o notebook e o cofre intactos à vista.'}
  },
  {
    id:'laudo_preliminar_local',memberId:'mauricio',label:'Laudo preliminar do local',kind:'PERÍCIA',
    use:'Base do relatório: separa o que o local mostra do que é interpretação. Não aponta autoria.',
    assetPaths:case01MaterialAssets.laudo_preliminar_local,
    description:'Descrição técnica do local, sem apontar autoria.',
    minInterviews:2,requiresTopics:['mauricio_laudo'],requestTime:'05:21',
    response:{time:'05:25',from:'Perícia',text:'Segue o laudo preliminar. Ele descreve o estado do local e deixa explícito que não atribui autoria a ninguém.'}
  },
  {
    id:'ficha_veiculo_gol',memberId:'renata',label:'Ficha do Gol que o vigia viu',kind:'DOCUMENTO',
    use:'Para apresentar a Caio: o Gol que o vigia viu está no nome dele (o carro, não quem dirigia).',
    assetPaths:case01MaterialAssets.ficha_veiculo_gol,
    description:'Consulta de veículo do Gol branco citado pelo vigia.',
    requiresClues:['vigia_gol'],requiresTopics:['renata_placa'],requestTime:'05:12',
    response:{time:'05:14',from:'Inteligência',text:'Consulta feita: Gol branco, 98, em nome do Caio Duarte, situação regular. Isso diz de quem é o carro, não quem estava dirigindo.'}
  },
  {
    id:'quadro_horarios',memberId:'renata',label:'Quadro de horários da noite',kind:'DOCUMENTO',
    use:'Para apresentar a Caio: só o alarme (23:52) e o motel (00:56) têm registro; o intervalo é o que ele tem de explicar.',
    assetPaths:case01MaterialAssets.quadro_horarios,
    description:'Linha do tempo feita à mão: só o que tem registro.',
    requiresClues:['log_alarme','nota_motel'],requiresTopics:['renata_quadro'],requestTime:'05:37',
    response:{time:'05:40',from:'Inteligência',text:'Montei na prancheta. Alarme às 23:52, motel às 00:56. Marquei o intervalo entre os dois e deixei o resto em branco.'}
  },
  {
    id:'matricula_imovel',memberId:'renata',label:'Matrícula do imóvel',kind:'DOCUMENTO',
    use:'Para apresentar a Lívia: a casa é dos pais no papel, e o que ela receberia dependia deles.',
    assetPaths:case01MaterialAssets.matricula_imovel,
    description:'Certidão de registro do imóvel da Rua das Acácias.',
    requiresClues:['pergunta_inventario'],requiresTopics:['renata_imovel'],requestTime:'05:47',
    response:{time:'05:55',from:'Inteligência',text:'Saiu a matrícula. Os proprietários constam como Ricardo e Helena Valença. Não tem valor nenhum no documento, é registro puro.'}
  },
  {
    id:'consulta_antecedentes',memberId:'renata',label:'Consulta de antecedentes dos irmãos Duarte',kind:'DOCUMENTO',
    use:'Mostra que não há registro anterior dos irmãos. Não é álibi nem acusação, e não entra no relatório.',
    assetPaths:case01MaterialAssets.consulta_antecedentes,
    description:'Resultado da consulta em nome de Caio e Téo.',
    requiresInterviewed:['teo'],requiresTopics:['renata_antecedentes'],requestTime:'06:31',
    response:{time:'06:34',from:'Inteligência',text:'Consulta feita para os dois: nada consta. Lembrando que isso é ausência de registro, não é álibi nem acusação.'}
  },
  {
    id:'croqui_rua',memberId:'paulo',label:'Croqui da Rua das Acácias',kind:'DOCUMENTO',
    use:'Para apresentar a Jorge: marca o que ele enxergava da guarita (o carro, não o portão).',
    assetPaths:case01MaterialAssets.croqui_rua,
    description:'Guarita, poste, casa e o ponto onde o Gol foi visto.',
    requiresInterviewed:['jorge'],requiresTopics:['paulo_jorge'],requestTime:'05:09',
    response:{time:'05:12',from:'Equipe Externa',text:'Desenhei a rua: guarita do Jorge, poste, a casa e o ponto onde ele viu o Gol, com distância aproximada. É o que ele enxergava dali.'}
  },
  {
    id:'termo_declaracao_terceiro_cida',memberId:'paulo',label:'Termo de declaração da irmã de Cida',kind:'DOCUMENTO',
    use:'Para apresentar a Cida: a irmã confirma a noite em família e sustenta o álibi dela.',
    assetPaths:case01MaterialAssets.termo_declaracao_terceiro_cida,
    description:'Declaração de familiar sobre a noite de 16/10.',
    requiresClues:['alibi_cida'],requiresTopics:['paulo_cida'],requestTime:'05:51',
    response:{time:'05:58',from:'Equipe Externa',text:'Segue o termo assinado pela irmã dela, com a impressão do polegar. Ela confirma a noite em família.'}
  },
  {
    id:'foto_fachada_lan',memberId:'paulo',label:'Foto da fachada da LAN house',kind:'FOTO',
    use:'Para apresentar a Rafael: situa o estabelecimento onde o recibo foi emitido.',
    assetPaths:case01MaterialAssets.foto_fachada_lan,
    description:'Fachada e vitrine do estabelecimento.',
    requiresClues:['lan_paga'],requiresTopics:['paulo_lan_foto'],requestTime:'05:16',
    response:{time:'05:19',from:'Equipe Externa',text:'Aqui a fachada. Pra constar no inquérito onde o recibo foi emitido.'}
  },
  {
    id:'termo_apreensao_celular_helena',memberId:'denise',label:'Auto de apreensão do celular de Helena',kind:'DOCUMENTO',
    use:'Libera o conteúdo do celular de Helena, em Tel. Helena.',
    assetPaths:case01MaterialAssets.termo_apreensao_celular_helena,
    description:'Cadeia de custódia do aparelho apreendido na casa.',
    requiresInterviewed:['livia'],requiresTopics:['denise_livia'],requestTime:'05:06',
    response:{time:'05:10',from:'Cartório',text:'Lacrei o aparelho de Helena. Está no auto com lacre, testemunhas e etiqueta de custódia. Com o auto assinado, o acesso ao conteúdo já está liberado no seu telefone, em Tel. Helena.'}
  },
  {
    id:'capa_inquerito',memberId:'denise',label:'Capa do inquérito',kind:'DOCUMENTO',
    use:'Formaliza o inquérito (instaurado em 17/10). Não muda o caso: é o registro oficial.',
    assetPaths:case01MaterialAssets.capa_inquerito,
    description:'Capa do inquérito do Caso 01.',
    minTask:1,requiresTopics:['denise_capa'],requestTime:'05:00',
    response:{time:'05:02',from:'Cartório',text:'Essa é a capa. Instauração em 17/10 e minha assinatura como escrivã.'}
  },
  {
    id:'termo_depoimento_modelo',memberId:'denise',label:'Modelo do termo de depoimento',kind:'DOCUMENTO',
    use:'Formulário dos depoimentos. Cada depoimento encerrado sai neste formato, assinado no resumo.',
    assetPaths:case01MaterialAssets.termo_depoimento_modelo,
    description:'Formulário em branco usado nos depoimentos.',
    minInterviews:1,requiresTopics:['denise_termo'],requestTime:'05:07',
    response:{time:'05:09',from:'Cartório',text:'Esse é o modelo em branco. Todo depoimento sai neste formato, assinado ao final.'}
  }
]

export const caseTeam = [
 {id:'sonia',name:'Sônia Prado',initials:'SP',role:'Delegada',specialty:'Coordenação do caso',detail:'Prioridades, decisões e direção investigativa.'},
 {id:'mauricio',name:'Maurício Farias',initials:'MF',role:'Perito criminal',specialty:'Cena e vestígios',detail:'Fotos, coleta, objetos, painel e laudos da residência.'},
 {id:'renata',name:'Renata Leal',initials:'RL',role:'Investigadora',specialty:'Inteligência e registros',detail:'Alarmes, veículos, cruzamentos e linha financeira.'},
 {id:'paulo',name:'Paulo Vieira',initials:'PV',role:'Investigador',specialty:'Diligências de campo',detail:'Testemunhas, estabelecimentos, endereços e verificações externas.'},
 {id:'denise',name:'Denise Rocha',initials:'DR',role:'Escrivã',specialty:'Cartório e depoimentos',detail:'Gravações, transcrições e organização documental.'}
] as const

export const teamMemberForSender=(from:string)=>{
 if(from==='Sônia')return 'sonia'
 if(from==='Perícia')return 'mauricio'
 if(from==='Inteligência'||from==='Financeiro')return 'renata'
 if(from==='Em Campo'||from==='Equipe Externa')return 'paulo'
 if(from==='Cartório')return 'denise'
 return 'sonia'
}

export const teamIntroMessages = [
 {time:'04:32',from:'Sônia',text:'Estou no canal. Me chama quando uma peça mudar a direção do caso.',memberId:'sonia' as TeamMemberId,outgoing:false},
 {time:'04:35',from:'Maurício',text:'Entrei na residência agora. Vou te avisando o que for objetivo antes de qualquer interpretação.',memberId:'mauricio' as TeamMemberId,outgoing:false},
 {time:'04:44',from:'Renata',text:'Assim que você fechar os primeiros nomes e horários, começo os cruzamentos.',memberId:'renata' as TeamMemberId,outgoing:false},
 {time:'04:39',from:'Paulo',text:'Estou rodando a rua e separando quem realmente viu alguma coisa de quem só ouviu barulho depois.',memberId:'paulo' as TeamMemberId,outgoing:false},
 {time:'04:58',from:'Denise',text:'Vou manter os depoimentos separados e registrar qualquer mudança de versão. Se quiser comparar trechos, me chama.',memberId:'denise' as TeamMemberId,outgoing:false}
]


// ---------- disponibilidade na Equipe ----------

export type Gated = {minTask?:number;minInterviews?:number;requiresClues?:string[];requiresInterviewed?:string[];requiresTopics?:string[]}
export const gateOk=(game:TeamGame,item:Gated)=>{
  if((item.minTask??0)>game.task)return false
  if((item.minInterviews??0)>game.interviewed.length)return false
  if(item.requiresClues?.some(id=>!game.clues.includes(id)))return false
  if(item.requiresInterviewed?.some(id=>!game.interviewed.includes(id)))return false
  return true
}
export const topicOk=(game:TeamGame,item:TeamDialogue)=>gateOk(game,item)&&!item.requiresTopics?.some(id=>!(game.teamTopics??[]).includes(id))
export const requestOk=(game:TeamGame,item:TeamMaterialRequest)=>gateOk(game,item)&&!item.requiresTopics?.some(id=>!(game.teamTopics??[]).includes(id))
/** Assuntos e diligências novos de um integrante (ainda não conversados nem pedidos). */
export const teamNews=(game:TeamGame,memberId:string)=>{
  const topics=teamDialogues.filter(t=>t.memberId===memberId&&topicOk(game,t)&&!(game.teamTopics??[]).includes(t.id))
  const requests=teamMaterialRequests.filter(r=>r.memberId===memberId&&requestOk(game,r)&&!(game.requestedMaterials??[]).includes(r.id))
  return {topics,requests,count:topics.length+requests.length}
}

export const DEFAULT_DISCOVERED=['livia','caio','rafael','cida']
/** Registra no save a conversa de um assunto: pistas e pessoas que ela revela entram junto. */
export function applyTopic<G extends TeamGame>(g:G,topic:TeamDialogue):G{
  if((g.teamTopics??[]).includes(topic.id)||!topicOk(g,topic))return g
  const discovered=[...(g.discoveredPeople??DEFAULT_DISCOVERED)]
  ;(topic.revealsPeople??[]).forEach(id=>{if(!discovered.includes(id))discovered.push(id)})
  const nextClues=[...g.clues]
  ;(topic.clueIds??[]).forEach(id=>{if(!nextClues.includes(id))nextClues.push(id)})
  return {...g,teamTopics:[...(g.teamTopics??[]),topic.id],teamLog:[...(g.teamLog??[]),topic.id],discoveredPeople:discovered,clues:nextClues}
}
/** Registra no save uma diligência pedida e recebida. */
export function applyRequest<G extends TeamGame>(g:G,item:TeamMaterialRequest):G{
  if((g.requestedMaterials??[]).includes(item.id)||!requestOk(g,item))return g
  const nextClues=[...g.clues]
  ;(item.clueIds??[]).forEach(id=>{if(!nextClues.includes(id))nextClues.push(id)})
  const discovered=[...(g.discoveredPeople??DEFAULT_DISCOVERED)]
  ;(item.revealsPeople??[]).forEach(id=>{if(!discovered.includes(id))discovered.push(id)})
  return {...g,requestedMaterials:[...(g.requestedMaterials??[]),item.id],teamLog:[...(g.teamLog??[]),item.id],clues:nextClues,discoveredPeople:discovered}
}
