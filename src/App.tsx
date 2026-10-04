import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle, BatteryMedium, BookOpen, CalendarDays, Camera, Check,
  ChevronLeft, Clock, FileSearch, FileText, FolderSearch, Grid3X3,
  Home, Image as ImageIcon, Lock, MessageCircle, MicOff, Phone, PhoneOff,
  RotateCcw, Search, Send, Shield, Smartphone, Users, Volume2
} from 'lucide-react'
import { enableAudio, playConnect, playHangup, playTypingTick, startRingtone, stopRingtone } from './audio'
import HandsetHome from './HandsetHome'
import './team-messages.css'
import QualityPicker from './QualityPicker'
import FullscreenSetting from './FullscreenSetting'
import SoundSetting from './SoundSetting'
import ResetSetting from './ResetSetting'
import Diagnostics from './Diagnostics'
import IllustratedInterrogation from './interrogation/IllustratedInterrogation'
import { liviaInterrogation } from './interrogation/livia'
import { interrogations } from './interrogation/registry'
import { characters } from './characters/characters'
import CharacterFace from './characters/CharacterFace'
import { newProgress, pendingQuestions } from './interrogation/logic'
import type { InterrogationProgress } from './interrogation/types'
import './handset-pages.css'
import { acceptedProofs, chapters, clues, disclaimer, people, teamMessages, victimMessages } from './case01'
import { case01MaterialAssets } from './evidence/case01Materials'
import EvidenceViewer, { assetUrl } from './evidence/EvidenceViewer'

const SONIA_PHOTO = `${import.meta.env.BASE_URL}sonia.jpg`
const SAVE_VERSION = 3
const SAVE_KEY = 'invesphone-case01-v2'

type Screen = 'incoming'|'missed'|'active'|'launching'|'phone'|'task'|'ending'
type AppName = 'home'|'team'|'clues'|'interrogate'|'victim'|'chapters'|'livia'|'depo'|'settings'

type GameSave = {
  version:number
  screen:Screen
  app:AppName
  task:number
  clues:string[]
  interviewed:string[]
  orders:string[]
  /** Materiais solicitados à equipe (fotos, gravações, documentos e perícia). */
  requestedMaterials?:string[]
  /** Assuntos já conversados com os integrantes da equipe. */
  teamTopics?:string[]
  /** Ordem em que conversas e diligências aconteceram (as mensagens aparecem nessa ordem, não pelo horário do roteiro). */
  teamLog?:string[]
  /** Pessoas que já entraram formalmente no radar da investigação. */
  discoveredPeople?:string[]
  /** Pessoas que Lemos decidiu chamar para depoimento. */
  summonedPeople?:string[]
  score:number
  liviaInterrogation:InterrogationProgress
  /** Progresso dos depoimentos dos demais personagens, por id (Lívia tem campo próprio, de saves antigos). */
  depositions?:Record<string,InterrogationProgress>
  /** Depoimento aberto quando `app` é 'depo'. */
  depoId?:string
  interrogationOrigin?:'app'|'task'
  /** Conversa da equipe que o guia abre ao entrar em Equipe (some depois de usada). */
  teamFocus?:string
  /** Anotações do guia da Home: o que estava sugerido na última vez, e o que já foi feito (aparece riscado). */
  guideSeen?:{id:string;done:string}[]
  guideDone?:{id:string;text:string}[]
  ending?:'A'|'B'|'C'
}

const initialGame:GameSave = {
  version:SAVE_VERSION,screen:'incoming',app:'home',task:1,clues:[],interviewed:[],orders:[],discoveredPeople:['livia','caio','rafael','cida'],summonedPeople:['livia','caio'],score:1000,liviaInterrogation:newProgress(liviaInterrogation)
}

const progressOf = (g:GameSave, id:string):InterrogationProgress => id==='livia' ? g.liviaInterrogation : (g.depositions?.[id] ?? newProgress(interrogations[id]))
const withProgress = (g:GameSave, id:string, p:InterrogationProgress):GameSave => id==='livia' ? {...g,liviaInterrogation:p} : {...g,depositions:{...g.depositions,[id]:p}}
/** Abre o depoimento de uma pessoa; `origin` diz para onde o jogo volta ao sair. */
const openDeposition = (id:string, origin:'app'|'task') => (g:GameSave):GameSave => ({...g,screen:'phone',app:id==='livia'?'livia':'depo',depoId:id,interrogationOrigin:origin})

const callTurns = [
  {
    sonia:'Lemos? Desculpa a hora. Temos duas vítimas no Campo Belo.',
    replies:[
      'Estou acordado. O que temos no local?',
      'Quem encontrou as vítimas?'
    ]
  },
  {
    sonia:[
      'Casal. Ricardo e Helena Valença. A filha, Lívia, chegou de madrugada e encontrou os dois no quarto.',
      'A filha deles, Lívia. Chegou de madrugada e encontrou Ricardo e Helena no quarto.'
    ],
    replies:[
      'Ela viu alguém saindo da casa?',
      'A cena indica assalto?'
    ]
  },
  {
    sonia:[
      'Não. Ela diz que entrou, viu a casa revirada e foi direto ao quarto. Ninguém foi visto saindo.',
      'É o que ela está dizendo. A casa está revirada, mas a equipe ainda está fechando a primeira leitura.'
    ],
    replies:[
      'E a porta? Tem sinal de entrada forçada?',
      'Tem alguma coisa que já não fecha nessa versão?'
    ]
  },
  {
    sonia:[
      'A porta da frente está intacta. Sem arrombamento. E o cachorro estava preso no canil.',
      'Tem. Porta intacta, objetos de valor ainda na casa e o cachorro preso. Não parece um roubo simples.'
    ],
    replies:[
      'Preserva a entrada e puxa o log do alarme.',
      'Entendido. Abro o DHPP e acompanho daqui.'
    ],
    closing:[
      'Faz isso. Assim que tiver o log, me chama. Estou te colocando no caso desde o primeiro minuto.',
      'Ótimo. Assume o acompanhamento. Se alguma coisa sair do lugar, me chama na hora.'
    ]
  }
] as const

const operationalOrders = [
  [
    {id:'isolar_rua',label:'Enviar viatura para isolar a rua',spoken:'Sônia, manda uma viatura isolar a rua e segura qualquer movimentação em frente à casa.',confirm:'Pode deixar. Vou reforçar o perímetro agora.'},
    {id:'acionar_pericia',label:'Acionar perícia no quarto',spoken:'Aciona a perícia e coloca o quarto do casal como prioridade.',confirm:'Certo. Vou colocar o quarto como prioridade para a equipe técnica.'}
  ],
  [
    {id:'separar_depoimentos',label:'Separar Lívia e Caio',spoken:'Mantém a Lívia e o Caio separados. Não quero os dois alinhando versão.',confirm:'Entendido. Vou manter os dois separados até você falar com eles.'},
    {id:'preservar_casa',label:'Restringir acesso à casa',spoken:'Restringe o acesso à casa. Só entra quem estiver autorizado na ocorrência.',confirm:'Fechado. Vou limitar o acesso à equipe da ocorrência.'}
  ],
  [
    {id:'pedir_alarme',label:'Solicitar log do alarme',spoken:'Pede pra central puxar o log completo do alarme, principalmente as últimas ativações e desativações.',confirm:'Vou pedir agora. Assim que a central devolver o histórico, te encaminho.'},
    {id:'checar_cameras',label:'Checar câmeras da rua',spoken:'Manda alguém levantar câmeras da rua e das duas quadras próximas.',confirm:'Certo. Vou acionar a equipe externa para levantar as imagens.'}
  ],
  [
    {id:'preservar_painel',label:'Preservar painel do alarme',spoken:'Preserva o painel do alarme. Ninguém mexe nele antes da perícia.',confirm:'Entendido. Vou mandar isolar o painel agora.'},
    {id:'relatorio_preliminar',label:'Pedir relatório preliminar',spoken:'Me manda um relatório preliminar assim que a perícia fechar essa primeira leitura.',confirm:'Combinado. Assim que eles fecharem a primeira leitura, eu te envio.'}
  ]
] as const

const orderResultMessages:Record<string,{time:string;from:string;text:string}> = {
  isolar_rua:{time:'04:34',from:'Em Campo',text:'Viatura 27 no local. Rua isolada e circulação controlada.'},
  acionar_pericia:{time:'04:36',from:'Perícia',text:'Equipe acionada. Quarto do casal entrou como prioridade de processamento.'},
  separar_depoimentos:{time:'04:38',from:'Sônia',text:'Lívia e Caio foram mantidos separados para evitar alinhamento de versão.'},
  preservar_casa:{time:'04:39',from:'Em Campo',text:'Acesso à residência restrito. Só equipe técnica entra a partir de agora.'},
  pedir_alarme:{time:'04:43',from:'Inteligência',text:'Solicitação do log do alarme enviada à central. Aguardando retorno.'},
  checar_cameras:{time:'04:45',from:'Equipe Externa',text:'Levantando câmeras de portarias e comércios nas duas quadras próximas.'},
  preservar_painel:{time:'04:46',from:'Perícia',text:'Painel do alarme preservado e fotografado antes de qualquer manipulação.'},
  relatorio_preliminar:{time:'04:49',from:'Sônia',text:'Relatório preliminar solicitado. Te envio assim que a primeira leitura for fechada.'}
}


type TeamMemberId = 'sonia'|'mauricio'|'renata'|'paulo'|'denise'

type TeamMaterialRequest = {
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

type TeamDialogue = {
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

const teamDialogues:TeamDialogue[] = [
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

const teamMaterialRequests:TeamMaterialRequest[] = [
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

const tasks = [
  {chapter:0,title:'Chegada à Rua das Acácias',kind:'brief'},
  {chapter:0,title:'Varredura inicial da casa',kind:'scene'},
  {chapter:1,title:'Ouvir as primeiras versões',kind:'interviews'},
  {chapter:2,title:'Quebrar o álibi',kind:'alarm'},
  {chapter:2,title:'Reconstruir a madrugada',kind:'timeline'},
  {chapter:3,title:'Seguir o dinheiro',kind:'finance'},
  {chapter:3,title:'Cruzar a cinta bancária',kind:'bank'},
  {chapter:4,title:'Pressionar Téo',kind:'teo'},
  {chapter:4,title:'Relatório de acusação',kind:'accusation'},
] as const

function loadGame():GameSave{
  try{
    const raw=localStorage.getItem(SAVE_KEY)
    if(!raw)return initialGame
    const parsed=JSON.parse(raw) as GameSave
    if(parsed.version!==SAVE_VERSION)return initialGame
    const merged={...initialGame,...parsed}
    // a tela de tarefas só existe para o relatório final; saves antigos parados em outra tarefa voltam ao aparelho
    if(merged.screen==='task'&&merged.task<8)return {...merged,screen:'phone',app:'home',interrogationOrigin:'app'}
    return {...merged,interrogationOrigin:'app'}
  }catch{return initialGame}
}

export default function App(){
  const [game,setGame]=useState<GameSave>(loadGame)
  const [line,setLine]=useState(0)
  const [elapsed,setElapsed]=useState(0)
  const [audioOn,setAudioOn]=useState(false)
  const [muted,setMuted]=useState(false)
  const [speaker,setSpeaker]=useState(false)

  useEffect(()=>localStorage.setItem(SAVE_KEY,JSON.stringify(game)),[game])

  useEffect(()=>{
    if(game.screen!=='incoming'){stopRingtone();return}
    // Sem vibração física repetitiva: o pulso visual já comunica a chamada
    // e evita uma sensação artificial em navegadores/dispositivos diferentes.
    if(audioOn)startRingtone()
    return()=>stopRingtone()
  },[game.screen,audioOn])

  useEffect(()=>{
    if(game.screen!=='active')return
    const id=window.setInterval(()=>setElapsed(v=>v+1),1000)
    return()=>window.clearInterval(id)
  },[game.screen])

  useEffect(()=>{
    if(game.screen!=='launching')return
    const id=window.setTimeout(()=>setGame(g=>({...g,screen:'phone',app:'home',task:g.task===0?1:g.task})),1100)
    return()=>window.clearTimeout(id)
  },[game.screen])

  // A investigação avança quando os fatos chegam, não porque o jogador "concluiu uma tarefa".
  useEffect(()=>{
    setGame(g=>{
      let next=g.task
      const heardInitial=g.interviewed.filter(id=>['livia','rafael','cida','jorge','caio'].includes(id)).length
      if(next===1&&['porta_intacta','painel_alarme','cao_canil','valores_intactos'].every(id=>g.clues.includes(id)))next=2
      if(next===2&&heardInitial>=4)next=3
      if(next===3&&g.clues.includes('log_alarme'))next=4
      if(next===4&&g.clues.includes('nota_motel'))next=5
      if(next===5&&g.clues.includes('extrato_ricardo')&&g.clues.includes('carta_cobranca'))next=6
      if(next===6&&g.clues.includes('cinta_bancaria')&&(g.discoveredPeople??[]).includes('teo'))next=7
      if(next===7&&g.clues.includes('confissao_teo'))next=8
      return next===g.task?g:{...g,task:next}
    })
  },[game.clues,game.interviewed,game.discoveredPeople])

  // As anotações da Home: o que deixa de ser sugerido porque foi feito passa a aparecer riscado.
  useEffect(()=>{
    if(game.screen!=='phone')return
    const open=nextSteps(game).filter(x=>x.done)
    setGame(g=>{
      const ids=new Set(open.map(x=>x.id))
      const seen=g.guideSeen??[]
      const finished=seen.filter(x=>!ids.has(x.id))
      const same=seen.length===open.length&&seen.every((x,i)=>x.id===open[i].id&&x.done===open[i].done)
      const prevDone=g.guideDone??[]
      const keep=prevDone.filter(d=>!ids.has(d.id)&&!finished.some(f=>f.id===d.id))
      if(same&&!finished.length&&keep.length===prevDone.length)return g
      return {...g,guideSeen:open.map(x=>({id:x.id,done:x.done!})),guideDone:[...keep,...finished.map(f=>({id:f.id,text:f.done}))].slice(-8)}
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[game.screen,game.task,game.clues,game.interviewed,game.teamTopics,game.requestedMaterials,game.summonedPeople,game.discoveredPeople,game.liviaInterrogation,game.depositions])

  const setScreen=(screen:Screen)=>setGame(g=>({...g,screen}))
  const activateSound=async()=>{if(await enableAudio()){setAudioOn(true);if(game.screen==='incoming')startRingtone()}}
  const answer=()=>{stopRingtone();if(audioOn)playConnect();setElapsed(0);setLine(0);navigator.vibrate?.(18);setScreen('active')}
  const decline=()=>{stopRingtone();if(audioOn)playHangup();setScreen('missed')}
  const finishCall=()=>{if(audioOn)playHangup();setScreen('launching')}
  const skipCall=()=>{stopRingtone();setScreen('launching')}
  const time=`${String(Math.floor(elapsed/60)).padStart(2,'0')}:${String(elapsed%60).padStart(2,'0')}`

  return <AnimatePresence mode="wait">
    {game.screen==='incoming'&&<Incoming audioOn={audioOn} onSound={activateSound} onAnswer={answer} onDecline={decline} onSkip={skipCall}/>} 
    {game.screen==='missed'&&<Missed onAnswer={answer} onSkip={skipCall}/>}
    {game.screen==='active'&&<ActiveCall line={line} time={time} muted={muted} speaker={speaker} audioOn={audioOn} issuedOrders={game.orders} setMuted={setMuted} setSpeaker={setSpeaker} onOrder={(id)=>setGame(g=>({...g,orders:g.orders.includes(id)?g.orders:[...g.orders,id]}))} onNext={()=>setLine(v=>Math.min(callTurns.length-1,v+1))} onFinish={finishCall} onSkip={skipCall}/>} 
    {game.screen==='launching'&&<Launching/>}
    {game.screen==='phone'&&<PolicePhone game={game} setGame={setGame}/>}
    {game.screen==='task'&&<TaskView game={game} setGame={setGame}/>}
    {game.screen==='ending'&&<Ending game={game} restart={()=>{localStorage.removeItem(SAVE_KEY);setGame(initialGame)}}/>}
  </AnimatePresence>
}

function SkipCall({onSkip}:{onSkip:()=>void}){return <button className="skip-call" onClick={onSkip}>Pular ligação</button>}
function Incoming({audioOn,onSound,onAnswer,onDecline,onSkip}:{audioOn:boolean;onSound:()=>void;onAnswer:()=>void;onDecline:()=>void;onSkip:()=>void}){
 return <motion.main key="incoming" className="call-screen" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0,scale:.985}} transition={{duration:.35}}>
  <Ambient/><StatusBar/>
  <section className="caller">
   <div className="avatar-pulse"><motion.i animate={{scale:[1,1.48],opacity:[.3,0]}} transition={{duration:1.8,repeat:Infinity}}/><motion.i animate={{scale:[1,1.72],opacity:[.16,0]}} transition={{duration:1.8,repeat:Infinity,delay:.45}}/><motion.img className="avatar" src={SONIA_PHOTO} alt="Sônia Prado" animate={{scale:[1,1.035,1]}} transition={{duration:1.8,repeat:Infinity}}/></div>
   <small>CHAMADA RECEBIDA</small><h1>Sônia Prado</h1><p>DHPP · Supervisão</p>
   <motion.span className="ringing" animate={{opacity:[.45,1,.45]}} transition={{duration:1.4,repeat:Infinity}}>chamando…</motion.span>
   {!audioOn?<button className="sound-button" onClick={onSound}><Volume2/> Ativar toque da chamada</button>:<span className="sound-on"><Volume2/> Toque contínuo ativado</span>}
  </section>
  <motion.div className="call-actions" initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{delay:.35,type:'spring'}}>
   <button className="decline" onClick={onDecline}><PhoneOff/><span>Recusar</span></button>
   <motion.button className="answer" onClick={onAnswer} animate={{scale:[1,1.05,1]}} transition={{duration:1.35,repeat:Infinity}}><Phone/><span>Atender</span></motion.button>
  </motion.div><SkipCall onSkip={onSkip}/><div className="homebar"/>
 </motion.main>
}
function Missed({onAnswer,onSkip}:{onAnswer:()=>void;onSkip:()=>void}){return <motion.main className="call-screen" initial={{opacity:0,y:18}} animate={{opacity:1,y:0}}><StatusBar/><section className="caller"><img className="avatar" src={SONIA_PHOTO} alt="Sônia Prado"/><small>CHAMADA PERDIDA</small><h1>Sônia Prado</h1><p>DHPP · Supervisão</p><div className="missed-card">1 chamada perdida · agora</div></section><div className="single-action"><button className="answer" onClick={onAnswer}><Phone/><span>Retornar</span></button></div><SkipCall onSkip={onSkip}/><div className="homebar"/></motion.main>}
function TypewriterText({text,audioOn,onDone,quote=true}:{text:string;audioOn:boolean;onDone?:()=>void;quote?:boolean}){
  const [visible,setVisible]=useState('')
  const [done,setDone]=useState(false)

  useEffect(()=>{
    setVisible('')
    setDone(false)
    let index=0
    const id=window.setInterval(()=>{
      index++
      setVisible(text.slice(0,index))

      const char=text[index-1]
      if(audioOn&&char&&char!==' '&&index%2===0)playTypingTick()

      if(index>=text.length){
        window.clearInterval(id)
        setDone(true)
        onDone?.()
      }
    },34)

    return()=>window.clearInterval(id)
  },[text,audioOn])

  return <span>{quote?'“':''}{visible}{!done&&<motion.i className="typing-cursor" animate={{opacity:[1,.2,1]}} transition={{duration:.55,repeat:Infinity}}/>}{done&&quote?'”':''}</span>
}

function ActiveCall({line,time,muted,speaker,audioOn,issuedOrders,setMuted,setSpeaker,onOrder,onNext,onFinish,onSkip}:{line:number;time:string;muted:boolean;speaker:boolean;audioOn:boolean;issuedOrders:string[];setMuted:(v:boolean)=>void;setSpeaker:(v:boolean)=>void;onOrder:(id:string)=>void;onNext:()=>void;onFinish:()=>void;onSkip:()=>void}){
 const [phase,setPhase]=useState<'sonia'|'choice'|'player'|'orderPlayer'|'orderAck'|'orderChoice'|'closing'>('sonia')
 const [reply,setReply]=useState('')
 const [previousChoice,setPreviousChoice]=useState(0)
 const [selectedChoice,setSelectedChoice]=useState(0)
 const [orderOpen,setOrderOpen]=useState(false)
 const [orderIssued,setOrderIssued]=useState(false)
 const [currentOrder,setCurrentOrder]=useState<(typeof operationalOrders)[number][number]|null>(null)

 useEffect(()=>{setPhase('sonia');setReply('');setOrderOpen(false);setOrderIssued(false);setCurrentOrder(null)},[line])

 const turn=callTurns[line]
 const soniaText=typeof turn.sonia==='string'?turn.sonia:turn.sonia[previousChoice]
 const closingText='closing' in turn&&turn.closing?turn.closing[selectedChoice]:''

 const soniaDone=()=>setPhase('choice')
 const chooseReply=(text:string,index:number)=>{
   setReply(text)
   setSelectedChoice(index)
   setOrderOpen(false)
   setPhase('player')
 }
 const issueOrder=(order:(typeof operationalOrders)[number][number])=>{
   if(issuedOrders.includes(order.id)||orderIssued)return
   setCurrentOrder(order)
   setOrderOpen(false)
   setPhase('orderPlayer')
 }
 const orderPlayerDone=()=>window.setTimeout(()=>setPhase('orderAck'),500)
 const orderAckDone=()=>window.setTimeout(()=>{
   if(currentOrder){
     onOrder(currentOrder.id)
     setOrderIssued(true)
   }
   setPhase('orderChoice')
 },650)
 const playerDone=()=>{
   window.setTimeout(()=>{
     if(line===callTurns.length-1){
       setPhase('closing')
     }else{
       setPreviousChoice(selectedChoice)
       onNext()
     }
   },650)
 }
 const closingDone=()=>window.setTimeout(onFinish,1050)

 return <motion.main className="call-screen active" initial={{opacity:0,scale:1.015}} animate={{opacity:1,scale:1}} exit={{opacity:0,y:-20}}>
  <Ambient/><StatusBar/>
  <SkipCall onSkip={onSkip}/>
  <section className="active-caller"><motion.img className="avatar small" src={SONIA_PHOTO} alt="Sônia Prado" initial={{scale:.8}} animate={{scale:1}}/><h1>Sônia Prado</h1><span>{time}</span></section>
  <motion.section className="transcript call-dialogue" layout>
   <small>CHAMADA · DHPP</small>
   <AnimatePresence mode="wait">
    {phase==='sonia'||phase==='choice'
      ?<motion.div className="dialogue-line sonia-line" key={'s'+line+'-'+previousChoice} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}>
        <b>SÔNIA</b><p><TypewriterText text={soniaText} audioOn={audioOn} onDone={soniaDone}/></p>
       </motion.div>
      :phase==='player'
      ?<motion.div className="dialogue-line player-line" key={'p'+line+'-'+selectedChoice} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}>
        <b>LEMOS</b><p><TypewriterText text={reply} audioOn={audioOn} onDone={playerDone}/></p>
       </motion.div>
      :phase==='orderPlayer'&&currentOrder
      ?<motion.div className="dialogue-line player-line" key={'op'+currentOrder.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}>
        <b>LEMOS</b><p><TypewriterText text={currentOrder.spoken} audioOn={audioOn} onDone={orderPlayerDone}/></p>
       </motion.div>
      :phase==='orderAck'&&currentOrder
      ?<motion.div className="dialogue-line sonia-line" key={'oa'+currentOrder.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}>
        <b>SÔNIA</b><p><TypewriterText text={currentOrder.confirm} audioOn={audioOn} onDone={orderAckDone}/></p>
       </motion.div>
      :phase==='orderChoice'&&currentOrder
      ?<motion.div className="dialogue-line sonia-line" key={'oc'+currentOrder.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}>
        <b>SÔNIA</b><p>“{currentOrder.confirm}”</p>
       </motion.div>
      :<motion.div className="dialogue-line sonia-line" key={'c'+selectedChoice} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}>
        <b>SÔNIA</b><p><TypewriterText text={closingText} audioOn={audioOn} onDone={closingDone}/></p>
       </motion.div>
    }
   </AnimatePresence>

   {(phase==='choice'||phase==='orderChoice')&&<motion.div className="call-replies" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}>
    <small>RESPONDER</small>
    {turn.replies.map((text,i)=><button key={i} onClick={()=>chooseReply(text,i)}>{text}</button>)}
    {!orderIssued&&<button className="order-trigger" onClick={()=>setOrderOpen(v=>!v)}><Shield/> DAR ORDEM</button>}
    {orderOpen&&<motion.div className="order-panel" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
      <small>O QUE LEMOS VAI DIZER</small>
      {operationalOrders[line].map(order=><button key={order.id} onClick={()=>issueOrder(order)}><b>{order.label}</b><span>falar na ligação</span></button>)}
    </motion.div>}
   </motion.div>}

   <div className="wave">{[10,18,27,15,30,20,26,16,11,22,14].map((h,i)=><motion.i key={i} animate={{height:(phase==='choice'||phase==='orderChoice')?[8,9,8]:[8,h,11]}} transition={{duration:.55+(i%3)*.1,repeat:Infinity,repeatType:'mirror',delay:i*.045}}/>)}</div>
   <div className="speaking"><i/> {phase==='choice'||phase==='orderChoice'?'aguardando resposta':phase==='player'||phase==='orderPlayer'?'Lemos falando':phase==='closing'?'Sônia encerrando':'transcrição em tempo real'}</div>
  </motion.section>
  <section className="controls"><button className={muted?'on':''} onClick={()=>setMuted(!muted)}><span><MicOff/></span><small>{muted?'mudo ativo':'mudo'}</small></button><button><span><Grid3X3/></span><small>teclado</small></button><button className={speaker?'on':''} onClick={()=>setSpeaker(!speaker)}><span><Volume2/></span><small>{speaker?'alto-falante ativo':'alto-falante'}</small></button></section>
  <div className="homebar"/>
 </motion.main>
}
function Launching(){return <motion.main className="launching" initial={{opacity:0}} animate={{opacity:1}}><motion.div className="launch-icon" initial={{scale:.8,opacity:0}} animate={{scale:1,opacity:1}}><Shield/></motion.div><span>chamada encerrada</span><motion.div className="launch-line" initial={{width:0}} animate={{width:'72%'}} transition={{duration:.9}}/><small>Abrindo DHPP…</small></motion.main>}
function Face({p}:{p:{id?:string;name:string;initials:string;photo?:string}}){const ch=p.id?characters[p.id]:undefined;if(ch)return <CharacterFace character={ch}/>;return p.photo?<img className="face" src={`${import.meta.env.BASE_URL}${p.photo}`} alt={p.name}/>:<>{p.initials}</>}
function StatusBar(){return <header className="status"><b>04:27</b><span>VIVO&nbsp;&nbsp;▮▮▮ <BatteryMedium/></span></header>}
function Ambient(){return <div className="call-backdrop"/>}

function PolicePhone({game,setGame}:{game:GameSave;setGame:React.Dispatch<React.SetStateAction<GameSave>>}){
 const current=tasks[game.task]
 const chapter=chapters[current.chapter]
 const openApp=(app:AppName)=>setGame(g=>({...g,app}))
 const leaveLivia=()=>setGame(g=>({...g,app:'interrogate'}))
 if(game.app==='livia'||game.app==='depo'){
  const id=game.app==='livia'?'livia':(game.depoId??'livia')
  const cfg=interrogations[id]??liviaInterrogation
  return <IllustratedInterrogation key={id} config={cfg} progress={progressOf(game,cfg.id)} onProgress={p=>setGame(g=>withProgress(g,cfg.id,p))} onClue={cid=>setGame(g=>({...g,clues:g.clues.includes(cid)?g.clues:[...g.clues,cid]}))} onPersonDiscovered={pid=>setGame(g=>{const known=g.discoveredPeople??['livia','caio','rafael','cida'];return known.includes(pid)?g:{...g,discoveredPeople:[...known,pid]}})} clueTitle={cid=>clues.find(c=>c.id===cid)?.title} registeredClues={game.clues} registeredMaterials={game.requestedMaterials??[]} materialTitle={mid=>teamMaterialRequests.find(r=>r.id===mid)?.label} onComplete={()=>setGame(g=>({...g,interviewed:g.interviewed.includes(cfg.id)?g.interviewed:[...g.interviewed,cfg.id]}))} onBack={leaveLivia} onReturn={leaveLivia}/>
 }
 if(game.app==='team')return <PhonePage title="Equipe" back={()=>openApp('home')}><Team game={game} setGame={setGame}/></PhonePage>
 if(game.app==='clues')return <PhonePage title="Pistas" back={()=>openApp('home')}><ClueList ids={game.clues}/></PhonePage>
 if(game.app==='interrogate')return <PhonePage title="Interrogar" back={()=>openApp('home')}><People game={game} setGame={setGame}/></PhonePage>
 if(game.app==='victim')return <PhonePage title="Telefone de Helena" back={()=>openApp('home')}><VictimPhone addClue={cid=>setGame(g=>({...g,clues:g.clues.includes(cid)?g.clues:[...g.clues,cid]}))} hasAgenda={game.clues.includes('agenda_helena')}/></PhonePage>
 if(game.app==='settings')return <PhonePage title="Ajustes" back={()=>openApp('home')}><QualityPicker/><p className="settings-note">A qualidade vale para o jogo inteiro: telas, animações e retratos.</p><FullscreenSetting/><SoundSetting/><ResetSetting onReset={()=>{localStorage.removeItem(SAVE_KEY);setGame(initialGame)}}/><Diagnostics/></PhonePage>
 if(game.app==='chapters')return <PhonePage title="Arquivo do caso" back={()=>openApp('home')}><ChapterMap game={game}/></PhonePage>
 const status = ({
  0:'Ocorrência recebida',1:'Cena em processamento',2:'Versões sendo colhidas',3:'Aguardando retorno técnico',4:'Janela de horário em aberto',
  5:'Linha financeira aberta',6:'Dinheiro sob análise',7:'Téo precisa explicar o dinheiro',8:'Investigação pronta para relatório'
 } as Record<number,string>)[game.task] ?? current.title
 const go=(to:StepGo)=>{
  if(to.kind==='team')setGame(g=>({...g,app:'team',teamFocus:to.memberId}))
  else if(to.kind==='summon')setGame(g=>({...g,summonedPeople:(g.summonedPeople??['livia','caio']).includes(to.personId)?(g.summonedPeople??[]):[...(g.summonedPeople??['livia','caio']),to.personId]}))
  else if(to.kind==='depo')setGame(openDeposition(to.personId,'app'))
  else if(to.kind==='report')setGame(g=>({...g,screen:'task'}))
  else if(to.kind==='clues')setGame(g=>({...g,app:'clues'}))
 }
 const steps=nextSteps(game).map(st=>({id:st.id,tag:st.tag,title:st.title,text:st.text,cta:st.cta,locked:st.locked,run:()=>go(st.go)}))
 const unread=caseTeam.reduce((n,m)=>n+teamNews(game,m.id).count,0)
 return <HandsetHome chapterNumber={chapter.number} chapterTitle={chapter.title} caseStatus={status} steps={steps} doneNotes={(game.guideDone??[]).slice(-2)} peopleOpen={game.task>=2} helenaOpen={game.task>=3||(game.requestedMaterials??[]).includes('termo_apreensao_celular_helena')} archiveOpen={game.task>=3} teamBadge={unread} clueBadge={game.clues.length} onOpenApp={openApp}/>
}
function HandsetStatus(){return <header className="handset-status"><span>VIVO&nbsp;&nbsp;▮▮▮</span><b>DHPP</b><BatteryMedium/></header>}
function PhonePage({title,back,children}:{title:string;back:()=>void;children:React.ReactNode}){return <main className={`handset page${title==='Equipe'?' team-page':''}`}><HandsetStatus/><header className="page-head"><button onClick={back}><ChevronLeft/></button><b>{title}</b><span/></header><section className="page-body">{children}</section></main>}

const caseTeam = [
 {id:'sonia',name:'Sônia Prado',initials:'SP',role:'Delegada',specialty:'Coordenação do caso',detail:'Prioridades, decisões e direção investigativa.'},
 {id:'mauricio',name:'Maurício Farias',initials:'MF',role:'Perito criminal',specialty:'Cena e vestígios',detail:'Fotos, coleta, objetos, painel e laudos da residência.'},
 {id:'renata',name:'Renata Leal',initials:'RL',role:'Investigadora',specialty:'Inteligência e registros',detail:'Alarmes, veículos, cruzamentos e linha financeira.'},
 {id:'paulo',name:'Paulo Vieira',initials:'PV',role:'Investigador',specialty:'Diligências de campo',detail:'Testemunhas, estabelecimentos, endereços e verificações externas.'},
 {id:'denise',name:'Denise Rocha',initials:'DR',role:'Escrivã',specialty:'Cartório e depoimentos',detail:'Gravações, transcrições e organização documental.'}
] as const

const teamMemberForSender=(from:string)=>{
 if(from==='Sônia')return 'sonia'
 if(from==='Perícia')return 'mauricio'
 if(from==='Inteligência'||from==='Financeiro')return 'renata'
 if(from==='Em Campo'||from==='Equipe Externa')return 'paulo'
 if(from==='Cartório')return 'denise'
 return 'sonia'
}

const teamIntroMessages = [
 {time:'04:32',from:'Sônia',text:'Estou no canal. Me chama quando uma peça mudar a direção do caso.',memberId:'sonia' as TeamMemberId,outgoing:false},
 {time:'04:35',from:'Maurício',text:'Entrei na residência agora. Vou te avisando o que for objetivo antes de qualquer interpretação.',memberId:'mauricio' as TeamMemberId,outgoing:false},
 {time:'04:44',from:'Renata',text:'Assim que você fechar os primeiros nomes e horários, começo os cruzamentos.',memberId:'renata' as TeamMemberId,outgoing:false},
 {time:'04:39',from:'Paulo',text:'Estou rodando a rua e separando quem realmente viu alguma coisa de quem só ouviu barulho depois.',memberId:'paulo' as TeamMemberId,outgoing:false},
 {time:'04:58',from:'Denise',text:'Vou manter os depoimentos separados e registrar qualquer mudança de versão. Se quiser comparar trechos, me chama.',memberId:'denise' as TeamMemberId,outgoing:false}
]


// ---------- disponibilidade na Equipe e guia de próximos passos ----------

type Gated = {minTask?:number;minInterviews?:number;requiresClues?:string[];requiresInterviewed?:string[];requiresTopics?:string[]}
const gateOk=(game:GameSave,item:Gated)=>{
  if((item.minTask??0)>game.task)return false
  if((item.minInterviews??0)>game.interviewed.length)return false
  if(item.requiresClues?.some(id=>!game.clues.includes(id)))return false
  if(item.requiresInterviewed?.some(id=>!game.interviewed.includes(id)))return false
  return true
}
const topicOk=(game:GameSave,item:TeamDialogue)=>gateOk(game,item)&&!item.requiresTopics?.some(id=>!(game.teamTopics??[]).includes(id))
const requestOk=(game:GameSave,item:TeamMaterialRequest)=>gateOk(game,item)&&!item.requiresTopics?.some(id=>!(game.teamTopics??[]).includes(id))
/** Assuntos e diligências novos de um integrante (ainda não conversados nem pedidos). */
const teamNews=(game:GameSave,memberId:string)=>{
  const topics=teamDialogues.filter(t=>t.memberId===memberId&&topicOk(game,t)&&!(game.teamTopics??[]).includes(t.id))
  const requests=teamMaterialRequests.filter(r=>r.memberId===memberId&&requestOk(game,r)&&!(game.requestedMaterials??[]).includes(r.id))
  return {topics,requests,count:topics.length+requests.length}
}

type StepGo =
  |{kind:'team';memberId:string}
  |{kind:'summon';personId:string}
  |{kind:'depo';personId:string}
  |{kind:'report'}
  |{kind:'clues'}
  |{kind:'none'}
type GuideStepData = {id:string;tag:string;title:string;text:string;cta?:string;locked?:boolean;/** como a anotação fica depois de feita (riscada) */done?:string;go:StepGo}

/** Por que cada pessoa vale um depoimento, só com o que o jogador já sabe. */
const personWhy:Record<string,string> = {
  livia:'Filha do casal: chegou em casa e viu a cena.',
  caio:'Namorado de Lívia: diz que estava com ela a noite toda.',
  rafael:'Filho do casal: estava fora de casa naquela noite.',
  cida:'Funcionária da família: conhece a rotina da casa.',
  jorge:'Vigia da rua: costuma reparar em carros e movimento.',
  teo:'Irmão de Caio: o nome apareceu na investigação e ainda não foi ouvido.'
}

/** Passos que ajudam o jogador a seguir a história, do mais urgente ao mais livre. A Home mostra os primeiros. */
const nextSteps=(game:GameSave):GuideStepData[]=>{
  const out:GuideStepData[]=[]
  const discovered=game.discoveredPeople??['livia','caio','rafael','cida']
  const summoned=game.summonedPeople??['livia','caio']
  const requested=game.requestedMaterials??[]
  const nameOf=(pid:string)=>people.find(x=>x.id===pid)?.name.split(' ')[0]??pid
  const clueName=(id:string)=>clues.find(c=>c.id===id)?.title??id

  if(game.task>=8) out.push({id:'report',tag:'RELATÓRIO',done:'Relatório assinado',title:'O relatório está pronto',text:'Separe execução, facilitação e motivo, e escolha as provas que sustentam cada um.',cta:'Abrir relatório',go:{kind:'report'}})

  if(game.task>=2){
    const roster=people.filter(x=>x.id!=='sonia'&&interrogations[x.id]&&discovered.includes(x.id))
    // quem já foi chamado e espera no interrogatório
    for(const x of roster){
      if(game.interviewed.includes(x.id)||!summoned.includes(x.id))continue
      const started=progressOf(game,x.id).asked.length>0
      out.push({id:'depo-'+x.id,done:`Interrogatório de ${nameOf(x.id)} concluído`,tag:'INTERROGATÓRIO',title:`${nameOf(x.id)} aguarda para ser interrogado`,text:started?'Você já começou: continue de onde parou.':personWhy[x.id]??x.role,cta:`Interrogar ${nameOf(x.id)}`,go:{kind:'depo',personId:x.id}})
    }
    // quem apareceu na investigação e ainda não foi chamado
    for(const x of roster){
      if(game.interviewed.includes(x.id)||summoned.includes(x.id))continue
      const missing=(summonRequires[x.id]??[]).filter(c=>!game.clues.includes(c))
      if(missing.length) out.push({id:'wait-'+x.id,done:`Provas contra ${nameOf(x.id)} reunidas`,tag:'AINDA NÃO',title:`${nameOf(x.id)} só com provas contra ele`,text:`Falta registrar: ${missing.map(clueName).join(' e ')}. Chamá-lo antes só gasta o depoimento.`,locked:true,go:{kind:'none'}})
      else out.push({id:'call-'+x.id,done:`${nameOf(x.id)} chamado para depoimento`,tag:'NOVA PESSOA',title:`Chame ${nameOf(x.id)} para depoimento`,text:personWhy[x.id]??x.role,cta:`Chamar ${nameOf(x.id)}`,go:{kind:'summon',personId:x.id}})
    }
  }

  // conversas e diligências novas da equipe (no começo, o perito primeiro)
  const order=game.task<2?['mauricio','sonia','renata','paulo','denise']:caseTeam.map(m=>m.id as string)
  for(const id of order){
    const m=caseTeam.find(x=>x.id===id)!
    const news=teamNews(game,id)
    if(!news.count)continue
    const first=m.name.split(' ')[0]
    const lead=news.requests[0]?`${news.requests[0].kind[0]+news.requests[0].kind.slice(1).toLowerCase()}: ${news.requests[0].label}`:news.topics[0].label
    out.push(game.task<2&&id==='mauricio'
      ?{id:'team-'+id,done:'Falou com o Maurício, na casa',tag:'PRIMEIRO PASSO',title:'Fale com o Maurício, na casa',text:'Peça a leitura do perito sobre a cena antes de falar com qualquer pessoa.',cta:'Abrir conversa',go:{kind:'team',memberId:id}}
      :{id:'team-'+id,done:`Conversas com ${first} em dia`,tag:'EQUIPE',title:`${first} tem ${news.count} ${news.count>1?'assuntos novos':'assunto novo'}`,text:lead,cta:'Abrir conversa',go:{kind:'team',memberId:id}})
  }

  // depoimentos encerrados que ganharam perguntas novas
  for(const x of people){
    const cfg=interrogations[x.id]
    if(!cfg||!game.interviewed.includes(x.id))continue
    const n=pendingQuestions(cfg,progressOf(game,x.id),game.clues,requested).length
    if(n>0) out.push({id:'retake-'+x.id,done:`Depoimento de ${nameOf(x.id)} retomado`,tag:'RETOMAR',title:`Retome o depoimento de ${nameOf(x.id)}`,text:`${n} ${n>1?'perguntas novas':'pergunta nova'} com o que a equipe e as provas trouxeram.`,cta:`Retomar ${nameOf(x.id)}`,go:{kind:'depo',personId:x.id}})
  }

  if(!out.length){
    out.push({id:'sonia',tag:'EQUIPE',title:'Peça a leitura da Sônia',text:'Quando nada de novo chega, ela ajuda a separar fato de hipótese.',cta:'Falar com Sônia',go:{kind:'team',memberId:'sonia'}})
    out.push({id:'clues',tag:'PISTAS',title:'Revise o que você já tem',text:'Releia as pistas e as anotações dos depoimentos antes do próximo passo.',cta:'Abrir pistas',go:{kind:'clues'}})
  }
  return out.sort((a,b)=>Number(!!a.locked)-Number(!!b.locked))
}

function Team({game,setGame}:{game:GameSave;setGame:React.Dispatch<React.SetStateAction<GameSave>>}){
 const [selected,setSelected]=useState<string|null>(game.teamFocus??null)
 useEffect(()=>{if(game.teamFocus)setGame(g=>({...g,teamFocus:undefined}))},[]) // eslint-disable-line react-hooks/exhaustive-deps
 /** Envio em andamento: primeiro "enviando…", depois o integrante "digitando…"; só então a conversa é gravada no save. */
 const [sending,setSending]=useState<{id:string;text:string;time:string;phase:'sending'|'typing'}|null>(null)
 const timers=useRef<number[]>([])
 const [viewer,setViewer]=useState<{title:string;paths:readonly string[];start:number}|null>(null)
 useEffect(()=>()=>timers.current.forEach(window.clearTimeout),[])
 const requested=game.requestedMaterials??[]
 const discussed=game.teamTopics??[]

 const topicAvailable=(item:TeamDialogue)=>topicOk(game,item)
 const requestAvailable=(item:TeamMaterialRequest)=>requestOk(game,item)

 const discuss=(topic:TeamDialogue)=>{
  if(discussed.includes(topic.id)||!topicAvailable(topic))return
  setGame(g=>{
   const known=g.discoveredPeople??['livia','caio','rafael','cida']
   const discovered=[...known]
   ;(topic.revealsPeople??[]).forEach(id=>{if(!discovered.includes(id))discovered.push(id)})
   const nextClues=[...g.clues]
   ;(topic.clueIds??[]).forEach(id=>{if(!nextClues.includes(id))nextClues.push(id)})
   return {...g,teamTopics:[...(g.teamTopics??[]),topic.id],teamLog:[...(g.teamLog??[]),topic.id],discoveredPeople:discovered,clues:nextClues}
  })
 }
 const request=(item:TeamMaterialRequest)=>{
  if(requested.includes(item.id)||!requestAvailable(item))return
  setGame(g=>{
   const material=[...(g.requestedMaterials??[]),item.id]
   const nextClues=[...g.clues]
   ;(item.clueIds??[]).forEach(id=>{if(!nextClues.includes(id))nextClues.push(id)})
   const discovered=[...(g.discoveredPeople??['livia','caio','rafael','cida'])]
   ;(item.revealsPeople??[]).forEach(id=>{if(!discovered.includes(id))discovered.push(id)})
   return {...g,requestedMaterials:material,teamLog:[...(g.teamLog??[]),item.id],clues:nextClues,discoveredPeople:discovered}
  })
 }

 const send=(id:string,text:string,time:string,commit:()=>void)=>{
  if(sending)return
  setSending({id,text,time,phase:'sending'})
  const typingMs=900+Math.min(1400,text.length*8)
  timers.current.push(window.setTimeout(()=>setSending(v=>v&&{...v,phase:'typing'}),650))
  timers.current.push(window.setTimeout(()=>{commit();setSending(null)},650+typingMs))
 }
 const discoveredIds=game.discoveredPeople??['livia','caio','rafael','cida']
 const summonedIds=game.summonedPeople??['livia','caio']
 const summonPerson=(pid:string)=>setGame(g=>({...g,summonedPeople:(g.summonedPeople??['livia','caio']).includes(pid)?(g.summonedPeople??[]):[...(g.summonedPeople??['livia','caio']),pid]}))
 /** Quem tem pergunta de "apresentar" este material. */
 const exhibitPeople=(materialId:string)=>Object.entries(interrogations).filter(([,c])=>c.questions.some(q=>q.requiresMaterial===materialId)).map(([pid])=>pid)
 /** Para que serve o material: o texto da diligência ou, se ela registra pistas, o que foi registrado. */
 const useOf=(item:TeamMaterialRequest)=>{
  const registered=(item.clueIds??[]).map(id=>clues.find(c=>c.id===id)?.title).filter(Boolean)
  return item.use??(registered.length?`Registrou no caso: ${registered.join(', ')}.`:undefined)
 }
 /** Atalhos da conversa para as pessoas que ela cita: chamar, ouvir, levar o material ou retomar o depoimento. */
 const actionsFor=(ids:string[],materialId?:string)=>[...new Set(ids)].filter(pid=>discoveredIds.includes(pid)&&interrogations[pid]).flatMap(pid=>{
  const first=people.find(x=>x.id===pid)?.name.split(' ')[0]??pid
  const cfg=interrogations[pid]
  const prog=progressOf(game,pid)
  const done=game.interviewed.includes(pid)
  const open=()=>setGame(openDeposition(pid,'app'))
  if(!summonedIds.includes(pid)){
   const waiting=(summonRequires[pid]??[]).some(c=>!game.clues.includes(c))
   return [{key:pid,label:`Chamar ${first} para depoimento`,hint:waiting?'só com provas contra ele':undefined,disabled:waiting,run:()=>summonPerson(pid)}]
  }
  const pend=pendingQuestions(cfg,prog,game.clues,requested)
  const exhibitPending=!!materialId&&cfg.questions.some(q=>q.requiresMaterial===materialId&&!prog.asked.includes(q.id))
  if(done){
   if(materialId?!pend.some(q=>q.requiresMaterial===materialId):pend.length===0)return []
   return [{key:pid,label:`Retomar depoimento de ${first}`,hint:materialId?'apresentar este material':`${pend.length} ${pend.length>1?'perguntas novas':'pergunta nova'}`,run:open}]
  }
  return [{key:pid,label:exhibitPending?`Levar ao depoimento de ${first}`:`Ouvir ${first}`,hint:exhibitPending?'apresentar este material':undefined,run:open}]
 })
 const ordered=game.orders.map(id=>orderResultMessages[id]).filter(Boolean)
 const baseMessages=[...teamMessages,...ordered]
 /** Ordem da conversa: o que aconteceu antes aparece antes, qualquer que seja o horário do roteiro (saves antigos sem registro vêm primeiro, por horário). */
 const seqOf=(id:string,part:number)=>{const i=(game.teamLog??[]).indexOf(id);return i<0?-0.5:1000+i*2+part}
 const materialMessages=requested.flatMap(id=>{
  const item=teamMaterialRequests.find(r=>r.id===id)
  if(!item)return []
  return [
   {time:item.requestTime,from:'Lemos',text:`Consegue ${item.label.toLowerCase()} pra mim?`,memberId:item.memberId,outgoing:true,seq:seqOf(item.id,0)},
   {...item.response,memberId:item.memberId,outgoing:false,seq:seqOf(item.id,1),assets:item.assetPaths,assetsTitle:item.label,use:useOf(item),actions:actionsFor([...(item.revealsPeople??[]),...exhibitPeople(item.id)],item.id)}
  ]
 })
 const topicMessages=discussed.flatMap(id=>{
  const item=teamDialogues.find(t=>t.id===id)
  if(!item)return []
  const member=caseTeam.find(m=>m.id===item.memberId)
  return [
   {time:item.user.time,from:'Lemos',text:item.user.text,memberId:item.memberId,outgoing:true,seq:seqOf(item.id,0)},
   {time:item.agent.time,from:member?.name??'Equipe',text:item.agent.text,memberId:item.memberId,outgoing:false,seq:seqOf(item.id,1),actions:actionsFor(item.callPeople??item.revealsPeople??[])}
  ]
 })
 const normalized=baseMessages.map(m=>({...m,memberId:teamMemberForSender(m.from),outgoing:false}))
 const sortedMessages=[...teamIntroMessages,...normalized,...topicMessages,...materialMessages].sort((a,b)=>((a as {seq?:number}).seq??-1)-((b as {seq?:number}).seq??-1)||a.time.localeCompare(b.time))
 /** Cada atalho de pessoa aparece só na mensagem mais recente que a cita (o resto da conversa fica limpo). */
 const allMessages=(()=>{
  const seen=new Set<string>()
  const out=[...sortedMessages]
  // horários sempre crescentes dentro de cada conversa (a ordem real manda; o horário do roteiro só não pode voltar no tempo)
  const toMin=(t:string)=>Number(t.slice(0,2))*60+Number(t.slice(3,5))
  const last:Record<string,number>={}
  out.forEach((m,i)=>{const mm=m as {memberId:string;time:string};const t=Math.max(toMin(mm.time),(last[mm.memberId]??-1)+(last[mm.memberId]===undefined?0:1));last[mm.memberId]=t;if(t!==toMin(mm.time))out[i]={...m,time:`${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`} as typeof m})
  for(let i=out.length-1;i>=0;i--){
   const m=out[i] as {memberId:string;actions?:{key:string}[]}
   if(!m.actions)continue
   const keep=m.actions.filter(x=>{const k=m.memberId+x.key;if(seen.has(k))return false;seen.add(k);return true})
   out[i]={...out[i],actions:keep} as typeof out[number]
  }
  return out
 })()

 const unreadFor=(id:string)=>teamDialogues.filter(t=>t.memberId===id&&topicAvailable(t)&&!discussed.includes(t.id)).length+teamMaterialRequests.filter(r=>r.memberId===id&&requestAvailable(r)&&!requested.includes(r.id)).length

 if(!selected){
  return <div className="tm tm-list">
   <SecureStrip/>
   <header className="tm-title"><b>Equipe</b><span>5 contatos · Ocorrência 001</span></header>
   <div className="tm-grid">
    {caseTeam.map(member=>{
     const unread=unreadFor(member.id)
     return <button key={member.id} className="tm-card" onClick={()=>setSelected(member.id)}>
      {unread>0&&<em>{unread}</em>}
      <TeamFace id={member.id} initials={member.initials} name={member.name}/>
      <b>{member.name.split(' ')[0]}<Verified/></b>
      <span>{member.role}</span>
      <small>{member.specialty}</small>
      <u><MessageCircle/>Mensagem</u>
     </button>
    })}
    <p className="tm-soon">Novos contatos aparecem conforme o caso avança</p>
   </div>
   <footer className="tm-foot">Mensagens e pedidos ficam registrados no inquérito · acesso autenticado</footer>
   <Watermark/>
  </div>
 }

 const member=caseTeam.find(m=>m.id===selected)!
 const memberMessages=allMessages.filter(m=>m.memberId===selected)
 const availableTopics=teamDialogues.filter(t=>t.memberId===selected&&topicAvailable(t)&&!discussed.includes(t.id))
 const visibleRequests=teamMaterialRequests.filter(r=>r.memberId===selected&&(requested.includes(r.id)||requestAvailable(r)))

 return <div className="tm tm-chat">
  <SecureStrip/>
  <header className="tm-head">
   <button className="tm-back" onClick={()=>setSelected(null)} aria-label="Voltar para a equipe"><ChevronLeft/></button>
   <TeamFace id={member.id} initials={member.initials} name={member.name} small/>
   <div><b>{member.name}<Verified/></b><span>{member.role} · {member.specialty}</span></div>
  </header>
  <ChatThread messages={memberMessages} memberName={member.name} onOpenAsset={(title,paths,start)=>setViewer({title,paths,start})} sending={sending?.id&&(teamDialogues.some(t=>t.id===sending.id&&t.memberId===member.id)||teamMaterialRequests.some(r=>r.id===sending.id&&r.memberId===member.id))?sending:null}/>
  <section className="tm-replies" aria-label="Respostas e pedidos">
   <div className="tm-chips">
    {availableTopics.map(topic=><button key={topic.id} disabled={!!sending} onClick={()=>send(topic.id,topic.user.text,topic.user.time,()=>discuss(topic))}>{topic.label}</button>)}
    {visibleRequests.map(item=>{
     const done=requested.includes(item.id)
     return <button key={item.id} disabled={done||!!sending} className={done?'done':''} onClick={()=>send(item.id,`Consegue ${item.label.toLowerCase()} pra mim?`,item.requestTime,()=>request(item))} title={item.description}><b>{item.kind}</b>{item.label}{done&&<i>✓ recebido</i>}</button>
    })}
    {availableTopics.length===0&&visibleRequests.length===0&&!sending&&<p>Nada novo para conversar agora. Novos assuntos aparecem quando surgirem fatos novos.</p>}
   </div>
   <div className="tm-input"><span><Lock/>Mensagem segura</span><i><Send/></i></div>
  </section>
  <footer className="tm-foot">Sessão 0427 · Det. Lemos · registrada no inquérito</footer>
  <Watermark/>
  {viewer&&<EvidenceViewer title={viewer.title} paths={viewer.paths} start={viewer.start} onClose={()=>setViewer(null)}/>}
 </div>
}

/** Identidade do DHPP nas conversas: faixa de canal seguro, selo de contato verificado e marca d'água. */
function SecureStrip(){return <div className="tm-secure"><Lock/>CANAL SEGURO · DHPP<s/>USO RESTRITO<em><i/>CRIPTOGRAFADO</em></div>}
function Verified(){return <svg className="tm-ver" viewBox="0 0 24 24" aria-label="contato verificado"><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/><path d="M8.5 12.2l2.5 2.5 4.5-5"/></svg>}
function Watermark(){return <div className="tm-mark" aria-hidden="true"><b>DHPP</b><i/><span>{[...'HOMICÍDIOS'].map((l,i)=><em key={i}>{l}</em>)}</span></div>}
function TeamFace({id,initials,name,small}:{id:string;initials:string;name:string;small?:boolean}){
 return <span className={`tm-face${small?' sm':''}`}>{id==='sonia'?<img src={`${import.meta.env.BASE_URL}characters/sonia/portrait.jpg`} alt={name}/>:initials}</span>
}
function ChatThread({messages,memberName,sending,onOpenAsset}:{messages:{time:string;from:string;text:string;outgoing:boolean;assets?:readonly string[];assetsTitle?:string;use?:string;actions?:{key:string;label:string;hint?:string;disabled?:boolean;run:()=>void}[]}[];memberName:string;onOpenAsset?:(title:string,paths:readonly string[],start:number)=>void;sending:{text:string;time:string;phase:'sending'|'typing'}|null}){
 const ref=useRef<HTMLDivElement>(null)
 const key=`${messages.length}|${sending?sending.phase:''}|${messages.reduce((n,m)=>n+(m.actions?.length??0)+(m.use?1:0),0)}`
 useEffect(()=>{
  const down=()=>ref.current?.scrollTo({top:ref.current.scrollHeight,behavior:'smooth'})
  down()
  // anexos e atalhos aumentam a mensagem depois de entrar: rola de novo para a resposta ficar inteira à vista
  const t=[350,900].map(ms=>window.setTimeout(down,ms))
  return()=>t.forEach(window.clearTimeout)
 },[key])
 return <div className="tm-thread" ref={ref}>
  <p className="tm-notice"><Lock/>Canal oficial do DHPP. Mensagens criptografadas, registradas no inquérito e sem cópia. Contatos verificados.</p>
  {messages.map((m,i)=><div key={m.time+m.from+i} className={`tm-msg ${m.outgoing?'out':'in'}${i>=messages.length-2&&messages.length>2?' fresh':''}`}>
   {!m.outgoing&&m.from!==memberName&&m.from!==memberName.split(' ')[0]&&<small>{m.from}</small>}
   <p>{m.text}<span>{m.time}{m.outgoing?' ✓✓':''}</span></p>
   {m.assets&&m.assets.length>0&&<div className="tm-attach">{m.assets.map((a,k)=><button key={a} onClick={()=>onOpenAsset?.(m.assetsTitle??'Material',m.assets!,k)} aria-label={`Abrir ${m.assetsTitle??'material'} ${k+1}`}><img src={assetUrl(a)} alt="" loading="lazy"/>{m.assets!.length>1&&k===0&&<b>{m.assets!.length}</b>}</button>)}</div>}
   {m.use&&<div className="tm-use"><b>PARA QUE SERVE</b>{m.use}</div>}
   {m.actions&&m.actions.length>0&&<div className="tm-people">{m.actions.map(a=><button key={a.key} disabled={a.disabled} onClick={a.run}><b>{a.label}</b>{a.hint&&<span>{a.hint}</span>}</button>)}</div>}
  </div>)}
  {sending&&<div className="tm-msg out fresh pending"><p>{sending.text}<span>{sending.phase==='sending'?<><i className="tm-clock"/>enviando…</>:<>{sending.time} ✓✓</>}</span></p></div>}
  {sending?.phase==='typing'&&<div className="tm-msg in fresh"><p className="tm-typing" aria-label={`${memberName} está digitando`}><i/><i/><i/></p><small className="tm-typing-label">{memberName.split(' ')[0]} está digitando…</small></div>}
 </div>
}
function ClueList({ids}:{ids:string[]}){if(!ids.length)return <Empty icon={<FileSearch/>} title="Nenhuma pista registrada" text="As pistas aparecem aqui conforme a equipe, os depoimentos e os documentos trazem fatos."/>;return <div className="clue-list">{ids.map(id=>{const c=clues.find(x=>x.id===id)!;return <article key={id}><FileText/><div><small>{c.support?'PROVA DE APOIO · ':''}{c.category.toUpperCase()}</small><b>{c.title}</b><p>{c.description}</p></div></article>})}</div>}
/** Pessoa afastada da linha de suspeita pelas provas (recibo + fachada da LAN, ou álibi + termo da irmã). */
const isCleared=(game:GameSave,pid:string)=>
  (pid==='rafael'&&game.clues.includes('lan_paga')&&game.clues.includes('rafael_lan_confirmada'))||
  (pid==='cida'&&game.clues.includes('alibi_cida')&&game.clues.includes('cida_alibi_termo'))
const supportClues=clues.filter(c=>c.support)
const mainClues=clues.filter(c=>!c.support)

/** Pessoas que só podem ser chamadas depois de o jogador ter as provas para confrontá-las. */
const summonRequires:Record<string,string[]>={teo:['log_alarme','cinta_bancaria']}

function People({game,setGame,origin='app'}:{game:GameSave;setGame:React.Dispatch<React.SetStateAction<GameSave>>;origin?:'app'|'task'}){
 const discovered=game.discoveredPeople??['livia','caio','rafael','cida']
 const summoned=game.summonedPeople??['livia','caio']
 const visible=people.filter(p=>p.id!=='sonia'&&discovered.includes(p.id))
 const summon=(id:string)=>setGame(g=>({...g,summonedPeople:(g.summonedPeople??['livia','caio']).includes(id)?(g.summonedPeople??[]):[...(g.summonedPeople??['livia','caio']),id]}))
 return <div className="people-list">
  {visible.map(p=>{
   const has=!!interrogations[p.id]
   const called=summoned.includes(p.id)
   const done=game.interviewed.includes(p.id)
   const waiting=!called&&(summonRequires[p.id]??[]).some(c=>!game.clues.includes(c))
   return <button key={p.id} onClick={()=>called&&has?setGame(openDeposition(p.id,origin)):summon(p.id)} disabled={!has||waiting}>
    <i><Face p={p}/></i>
    <div><b>{p.name}</b><span>{done?(isCleared(game,p.id)?'Depoimento registrado · descartado pelas provas':'Depoimento registrado'):waiting?`${p.role} · só com provas contra ele`:called?p.role:`NOVO CONTATO · ${p.role}`}</span></div>
    {done?<Check/>:called?<ChevronLeft className="right"/>:waiting?<Lock/>:<strong>CHAMAR</strong>}
   </button>
  })}
  <p className="people-discovery-note">Novas pessoas aparecem aqui quando a equipe, documentos ou depoimentos revelam uma ligação com o caso.</p>
 </div>
}
const helenaAgenda=[
 {date:'02/10',text:'Ricardo e Lívia brigaram de novo por causa do Caio. Tentei mediar. Acho o namoro prejudicial, mas não sei como dizer isso sem piorar.'},
 {date:'09/10',text:'Ricardo falou em cortar parte do apoio da Lívia. Pedi calma. Preciso conversar com ela antes que ele faça isso.'},
 {date:'14/10',text:'A Lívia anda calada e sai com o Caio quase toda noite. Preciso sentar com ela. Sozinha, sem o pai.'},
 {date:'16/10',text:'Lívia pediu para conversar. Disse que amanhã. Hoje não, o Ricardo ainda está alterado.'}
]
function VictimPhone({addClue,hasAgenda}:{addClue:(id:string)=>void;hasAgenda:boolean}){const [tab,setTab]=useState<'home'|'messages'|'photos'|'calls'|'agenda'>('home');useEffect(()=>{if(tab==='agenda')addClue('agenda_helena')},[tab]);if(tab==='agenda')return <div><SubBack onClick={()=>setTab('home')} title="Agenda"/><div className="victim-messages">{helenaAgenda.map(a=><section key={a.date}><header><b>{a.date}</b><small>Agenda de Helena</small></header><p className="bubble in">{a.text}</p></section>)}</div>{hasAgenda&&<div className="result ok">Pista registrada: Agenda de Helena</div>}</div>;if(tab==='messages')return <div><SubBack onClick={()=>setTab('home')} title="Mensagens"/><div className="victim-messages">{victimMessages.map(m=><section key={m.contact}><header><b>{m.contact}</b><small>{m.time}</small></header><p className="bubble in">{m.incoming}</p><p className="bubble out">{m.outgoing}</p></section>)}</div></div>;if(tab==='photos')return <div><SubBack onClick={()=>setTab('home')} title="Fotos"/><div className="photo-grid"><figure><Camera/><figcaption>Família · 12 OUT</figcaption></figure><figure><ImageIcon/><figcaption>Consultório · 15 OUT</figcaption></figure><figure><ImageIcon/><figcaption>Thor · 16 OUT</figcaption></figure><figure><ImageIcon/><figcaption>Casa · 16 OUT</figcaption></figure></div></div>;if(tab==='calls')return <div><SubBack onClick={()=>setTab('home')} title="Chamadas"/><div className="call-log"><p><b>Lívia</b><span>18:39 · 00:43</span></p><p><b>Ricardo</b><span>17:12 · 01:05</span></p><p><b>Rafael</b><span>14:07 · perdida</span></p></div></div>;return <div className="victim-home"><small>DISPOSITIVO APREENDIDO · HELENA VALENÇA</small><h2>04:27</h2><div className="victim-grid"><button onClick={()=>setTab('messages')}><MessageCircle/><span>Mensagens</span></button><button onClick={()=>setTab('photos')}><ImageIcon/><span>Fotos</span></button><button onClick={()=>setTab('agenda')}><BookOpen/><span>Agenda</span></button><button onClick={()=>setTab('calls')}><Phone/><span>Chamadas</span></button></div><p className="legal-access"><Shield/> acesso remoto autorizado pelo DHPP</p></div>}
function SubBack({onClick,title}:{onClick:()=>void;title:string}){return <button className="subback" onClick={onClick}><ChevronLeft/> {title}</button>}
function ChapterMap({game}:{game:GameSave}){const currentChapter=tasks[game.task].chapter;return <div className="chapter-map">{chapters.map((c,i)=><article key={c.number} className={i<=currentChapter?'open':''}><i>{i<=currentChapter?String(c.number).padStart(2,'0'):<Lock/>}</i><div><small>{i<currentChapter?'CONCLUÍDO':i===currentChapter?'EM ANDAMENTO':'BLOQUEADO'}</small><b>{c.title}</b><p>{c.summary}</p></div>{i<currentChapter&&<Check/>}</article>)}</div>}

function TaskView({game,setGame}:{game:GameSave;setGame:React.Dispatch<React.SetStateAction<GameSave>>}){
 const task=tasks[game.task]
 const back=()=>setGame(g=>({...g,screen:'phone',app:'home'}))
 return <main className="task-screen"><header className="task-head"><button onClick={back}><ChevronLeft/></button><div><small>CAP. {chapters[task.chapter].number}</small><b>{chapters[task.chapter].title}</b></div><BookOpen/></header><section className="task-body"><TaskByKind game={game} setGame={setGame}/></section></main>
}
function TaskByKind({game,setGame}:{game:GameSave;setGame:React.Dispatch<React.SetStateAction<GameSave>>}){
 return <Accusation game={game} setGame={setGame}/>
}
function Accusation({game,setGame}:{game:GameSave;setGame:React.Dispatch<React.SetStateAction<GameSave>>}){const [executors,setExecutors]=useState<string[]>([]);const [mentor,setMentor]=useState('');const [motive,setMotive]=useState('');const [proofs,setProofs]=useState<string[]>([]);const toggle=(id:string,list:string[],set:(v:string[])=>void)=>set(list.includes(id)?list.filter(x=>x!==id):[...list,id]);const submit=()=>{const execOK=executors.includes('caio')&&executors.includes('teo')&&executors.length===2;const mentorOK=mentor==='livia';const motiveOK=motive==='heranca';const proofOK=proofs.filter(x=>acceptedProofs.includes(x)).length>=3;const ending:GameSave['ending']=execOK&&mentorOK&&motiveOK&&proofOK?'A':execOK?'B':'C';setGame(g=>({...g,ending,screen:'ending',score:g.score+(ending==='A'?100*g.clues.filter(id=>supportClues.some(c=>c.id===id)).length:0)}))};return <div className="accusation"><TaskTitle tag="RELATÓRIO FINAL" title="Quem fez o quê?" text="Separe execução, facilitação e motivo. Selecione ao menos três provas."/><h3>Executores</h3><div className="choices">{['caio','teo','rafael','jorge'].map(id=><button className={executors.includes(id)?'selected':''} onClick={()=>toggle(id,executors,setExecutors)} key={id}>{people.find(p=>p.id===id)?.name}{isCleared(game,id)&&<small className="cleared">descartado pelas provas</small>}</button>)}</div><h3>Mentor / facilitador</h3><div className="choices">{['livia','caio','teo'].map(id=><button className={mentor===id?'selected':''} onClick={()=>setMentor(id)} key={id}>{people.find(p=>p.id===id)?.name}</button>)}</div><h3>Motivo</h3><div className="choices"><button className={motive==='heranca'?'selected':''} onClick={()=>setMotive('heranca')}>Herança + proibição do namoro</button><button className={motive==='roubo'?'selected':''} onClick={()=>setMotive('roubo')}>Roubo oportunista</button></div><h3>Provas principais</h3><div className="proof-grid">{game.clues.filter(id=>acceptedProofs.includes(id)).map(id=><button key={id} className={proofs.includes(id)?'selected':''} onClick={()=>toggle(id,proofs,setProofs)}>{clues.find(c=>c.id===id)?.title}</button>)}</div><p className="support-note">Provas de apoio reunidas nos depoimentos: <b>{game.clues.filter(id=>supportClues.some(c=>c.id===id)).length}/{supportClues.length}</b>. Elas não substituem as provas principais, mas reforçam o relatório.</p><button className="primary" disabled={!mentor||!motive||executors.length===0||proofs.length<3} onClick={submit}>Assinar relatório</button></div>}
function Ending({game,restart}:{game:GameSave;restart:()=>void}){const data=game.ending==='A'?['CASO ENCERRADO','Caio e Téo são apontados como executores. Lívia é identificada como facilitadora e mentora do plano.','O relatório conecta acesso, cronologia, dinheiro e confissão.']:game.ending==='B'?['MEIA JUSTIÇA','Os executores foram identificados, mas o papel de Lívia não ficou estabelecido no relatório.','Parte da verdade chegou ao processo. Outra parte ficou sem nome.']:['ARQUIVADO','A acusação não sustentou a autoria dos executores.','Sem uma cadeia coerente de provas, o caso perde força.'];return <main className="ending"><small>ARQUIVO 001 · RESULTADO</small><h1>{data[0]}</h1><p>{data[1]}</p><blockquote>{data[2]}</blockquote><div className="score">Pontuação <b>{game.score}</b><span>{game.clues.filter(id=>mainClues.some(c=>c.id===id)).length}/{mainClues.length} pistas · {game.clues.filter(id=>supportClues.some(c=>c.id===id)).length}/{supportClues.length} provas de apoio</span></div><p className="disclaimer">{disclaimer}</p><button className="primary" onClick={restart}><RotateCcw/> Jogar novamente</button></main>}
function TaskTitle({tag,title,text}:{tag:string;title:string;text:string}){return <div className="task-title"><small>{tag}</small><h2>{title}</h2><p>{text}</p></div>}
function Empty({icon,title,text}:{icon:React.ReactNode;title:string;text:string}){return <div className="empty">{icon}<b>{title}</b><p>{text}</p></div>}
