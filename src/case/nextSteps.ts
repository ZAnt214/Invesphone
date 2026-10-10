/* Próximos passos do Caso 01: o que o jogador pode fazer agora, do mais urgente ao mais livre.
   Usado pela tela inicial do aparelho e pelo quadro do caso na base. */
import { clues, people } from '../case01'
import { interrogations } from '../interrogation/registry'
import { pendingQuestions } from '../interrogation/logic'
import { caseTeam, teamNews } from '../team/teamData'
import { progressOf, summonRequires } from './depositions'
import type { CaseSave } from './caseSave'

export type StepGo =
  |{kind:'team';memberId:string}
  |{kind:'summon';personId:string}
  |{kind:'depo';personId:string}
  |{kind:'report'}
  |{kind:'clues'}
  |{kind:'none'}
export type GuideStepData = {id:string;tag:string;title:string;text:string;cta?:string;locked?:boolean;/** como a anotação fica depois de feita (riscada) */done?:string;go:StepGo}

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
export const nextSteps=(game:CaseSave):GuideStepData[]=>{
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
