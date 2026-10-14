/* Orientação do Caso 01 no jogo (docs/CASE01_JORNADA_DO_JOGADOR.md): a situação conhecida, o que Lemos sabe de fato
   (registro ou depoimento, sem antecipar culpas), o que falta entender e o próximo passo. Mostrada na caderneta do
   Lemos (aba "Caso") na base e na casa. Não há aparelho nem chamada: o caso começa no plantão do DHPP. */
import type { CaseSave } from './caseSave'
import { nextSteps, type GuideStepData } from './nextSteps'

export type GuideNext = {title:string;text:string;cta:string;go:GuideStepData['go']|{kind:'casa'}|{kind:'sonia'}|{kind:'base'}|{kind:'achados'}}
/** Na casa (varredura em andamento): marcadores registrados, total e se a cena já foi encerrada. */
export type SweepState = {found:number;total:number;done:boolean;cena?:string;fita?:number}
export type CaseGuide = {status:string;known:string;question:string;next:GuideNext|null}

const STATUS:Record<number,string>={0:'Ocorrência recebida',1:'Cena em processamento',2:'Versões sendo colhidas',3:'Aguardando retorno técnico',4:'Janela de horário em aberto',
  5:'Linha financeira aberta',6:'Dinheiro sob análise',7:'Separando quem fez o quê',8:'Investigação pronta para relatório'}
const QUESTION:Record<number,string>={0:'O que aconteceu na casa?',1:'Foi mesmo um roubo?',2:'Quem conhecia a casa e o que as pessoas dizem?',
  3:'O que o registro do alarme pode confirmar?',4:'O álibi cobre o intervalo antes do motel?',5:'O que motivaria alguém próximo da família?',
  6:'De onde veio o dinheiro encontrado com Téo?',7:'Quem entrou, quem facilitou e por quê?',8:'Que conclusão as provas permitem sustentar?'}
const KNOWN:Record<number,string>={0:'Plantão de madrugada: um casal foi encontrado morto na Rua das Acácias.',
  1:'Ricardo e Helena foram mortos em casa. Lívia diz ter encontrado tudo revirado.',2:'Não houve arrombamento, e objetos de valor ficaram na casa.',
  3:'Lívia e Caio dizem que passaram a noite juntos. A versão precisa de um registro independente.',4:'O alarme foi desligado às 23:52 com o código mestre.',
  5:'23:52, alarme desligado. 00:56, entrada no motel. Há 1h04 sem registro.',6:'O pai ameaçou cortar a herança de Lívia, e um extrato de Ricardo chamou atenção.',
  7:'A cinta dos dólares ligados a Téo bate com o saque de Ricardo: US$ 5.000.',8:'Téo confirmou a participação, e as versões foram confrontadas.'}

/** casa: a varredura já terminou (o material da casa chegou à base). briefed: Sônia já passou o caso no plantão.
    sweep: Lemos está na casa agora (a caderneta da varredura). */
export function caseGuide(g:CaseSave,{casa,briefed,sweep}:{casa:boolean;briefed:boolean;sweep?:SweepState}):CaseGuide{
  if(sweep){
    const {found,total,done}=sweep
    const extra=(sweep.cena?` · cena ${sweep.cena.toLowerCase()}`:'')+(sweep.fita!=null?` · ${sweep.fita} m de fita`:'')
    return {status:(done?'Cena registrada':'Varredura · Rua das Acácias')+extra,
      known:found?`Ricardo e Helena foram mortos em casa. ${found} de ${total} pontos da cena já registrados pela perícia.`:'Ricardo e Helena foram mortos em casa. Lívia diz ter encontrado tudo revirado.',
      question:QUESTION[1],
      next:done?{title:'Volte à base',text:'A cena está registrada. O material segue para o DHPP, e as versões começam de manhã.',cta:'Voltar à base',go:{kind:'base'}}
        :{title:'Registre a cena',text:`${found} de ${total} marcadores. Toque num cômodo e mande o Lemos periciar; outros pedidos entram na fila dele. Peça à PM que isole a frente antes que os curiosos entrem no terreno.`,cta:'Ver os achados',go:{kind:'achados'}}}
  }
  if(!casa){
    // plantão de madrugada: primeiro a Sônia, depois a casa
    return {status:'Plantão · madrugada',known:KNOWN[0],question:QUESTION[0],
      next:briefed?{title:'Vá à Rua das Acácias',text:'A PM segura a frente da casa e a perícia é sua. Revise a cena antes de ouvir qualquer versão.',cta:'Ir para a casa',go:{kind:'casa'}}
        :{title:'Fale com a Sônia',text:'A delegada está na sala dela com o caso da noite.',cta:'Ir até a Sônia',go:{kind:'sonia'}}}
  }
  const st=nextSteps(g).filter(s=>!s.locked)[0]
  return {status:STATUS[g.task]??'',known:KNOWN[g.task]??'',question:QUESTION[g.task]??'Qual é a próxima pergunta do caso?',
    next:st?{title:st.title,text:st.text,cta:st.cta??'Ir',go:st.go}:null}
}
