/**
 * Ajustes dentro do jogo (botão de engrenagem no cabeçalho), gerados do registro de src/settings/gameSettings.ts.
 * Tudo vem do registro de src/settings/gameSettings.ts: a qualidade gráfica, a tela cheia, o som e cada efeito,
 * na sua categoria, com a opção de desligar. Cabe inteiro na tela do celular; só a lista de opções rola, dentro
 * do painel.
 */
import { EFFECTS, categoriesOf, fxOn, onFxChange, resetFx, setFx } from './gameSettings'
import { QUALITIES, QUALITY_LABEL, getQuality, onQualityChange, setQuality } from '../characters/quality'
import { sfxEnabled, setSfxEnabled } from '../sfx'
import { canFullscreen, enterFullscreen, exitFullscreen, isFullscreen, isStandalone } from '../fullscreen'
import { resetCaseStorage } from '../case/caseSave'
import './settingsPanel.css'

type Tab = 'graficos'|'som'|'tela'|'jogo'
const TABS:{id:Tab;label:string}[] = [{ id:'graficos', label:'Gráficos' },{ id:'som', label:'Som' },{ id:'tela', label:'Tela' },{ id:'jogo', label:'Jogo' }]
const QDESC:Record<string,string> = {
  low:'Menos efeitos e 30 quadros por segundo. Para aparelhos mais fracos ou economizar bateria.',
  medium:'Efeitos principais com bom desempenho.',
  high:'Todos os efeitos e todos os quadros que o aparelho entregar.'
}

let root:HTMLElement|null = null
let tab:Tab = 'graficos'
let confirmReset = false
let self = false   // mudança feita aqui mesmo: não redesenha a lista (o interruptor já mudou)

const h = (tag:string,cls?:string,text?:string)=>{ const e = document.createElement(tag); if(cls) e.className = cls; if(text!=null) e.textContent = text; return e }

function toggle(on:boolean,label:string,onChange:(v:boolean)=>void){
  const b = h('button','st-sw'+(on?' on':'')) as HTMLButtonElement
  b.setAttribute('role','switch'); b.setAttribute('aria-checked',String(on)); b.setAttribute('aria-label',label)
  b.innerHTML = '<i></i>'
  b.onclick = ()=>{ const v = b.getAttribute('aria-checked')!=='true'; b.setAttribute('aria-checked',String(v)); b.classList.toggle('on',v); onChange(v) }
  return b
}
function row(title:string,desc:string,ctrl:HTMLElement,tag?:string){
  const r = h('div','st-row'),t = h('div','st-txt')
  const b = h('b',undefined,title); t.appendChild(b)
  if(tag){ const s = h('small','st-tag',tag); b.appendChild(s) }
  t.appendChild(h('p',undefined,desc)); r.appendChild(t); r.appendChild(ctrl); return r
}

function renderList(list:HTMLElement){
  list.innerHTML = ''; list.scrollTop = 0
  // efeitos de uma seção, agrupados por categoria (subtítulos)
  const effects = (sec:'graficos'|'som')=>{ for(const c of categoriesOf(sec)){ if(sec==='graficos') list.appendChild(h('div','st-sub',c.label))
      for(const e of EFFECTS.filter(x=>x.cat===c.id)) list.appendChild(row(e.label,e.desc,toggle(fxOn(e.id),e.label,v=>{ self = true; setFx(e.id,v); self = false }),e.where)) } }
  if(tab==='graficos'){
    const q = getQuality(),seg = h('div','st-seg')
    for(const k of QUALITIES){ const b = h('button',k===q?'on':'',QUALITY_LABEL[k]) as HTMLButtonElement; b.onclick = ()=>{ setQuality(k); renderList(list) }; seg.appendChild(b) }
    list.appendChild(row('Qualidade gráfica',QDESC[q],seg))
    effects('graficos')
    if(q==='low') list.appendChild(h('p','st-note','Na qualidade baixa alguns destes efeitos ficam desligados de qualquer forma.'))
    return
  }
  if(tab==='som'){
    list.appendChild(row('Sons e vibração','Todos os sons do jogo (efeitos, ambiente) e a vibração.',toggle(sfxEnabled(),'Sons e vibração',v=>{ setSfxEnabled(v); window.dispatchEvent(new StorageEvent('storage',{ key:'invesphone.sfx' })) })))
    effects('som')
    return
  }
  if(tab==='tela'){
    if(isStandalone()) list.appendChild(row('Tela cheia','O jogo já está aberto como app, sem as barras do navegador.',h('span')))
    else if(canFullscreen()) list.appendChild(row('Tela cheia','Esconde as barras do navegador.',toggle(isFullscreen(),'Tela cheia',v=>{ void (v ? enterFullscreen() : exitFullscreen()) })))
    else list.appendChild(row('Tela cheia','No iPhone: Compartilhar → Adicionar à Tela de Início, e abra o ícone Arquivo Morto.',h('span')))
    return
  }
  if(tab==='jogo'){
    const r = h('button','st-act'+(confirmReset?' danger':''),confirmReset?'Toque de novo para apagar':'Recomeçar') as HTMLButtonElement
    r.onclick = ()=>{ if(!confirmReset){ confirmReset = true; renderList(list); return } resetCaseStorage(); location.href = '/' }
    list.appendChild(row('Recomeçar o caso','Apaga o progresso do Caso 01 e volta ao início. Não dá para desfazer.',r))
    const d = h('button','st-act','Restaurar') as HTMLButtonElement
    d.onclick = ()=>{ resetFx(); d.textContent = 'Pronto' }
    list.appendChild(row('Efeitos visuais e sonoros','Volta todos os efeitos ao padrão (ligados).',d))
    return
  }
}

function build(parent:HTMLElement){
  root = h('div','st-wrap'); root.setAttribute('role','dialog'); root.setAttribute('aria-modal','true'); root.setAttribute('aria-label','Ajustes')
  const card = h('div','st-card'),head = h('div','st-head')
  head.appendChild(h('b',undefined,'Ajustes'))
  const x = h('button','st-x','×') as HTMLButtonElement; x.setAttribute('aria-label','Fechar'); x.onclick = closeSettings; head.appendChild(x)
  const tabs = h('div','st-tabs'),list = h('div','st-list')
  for(const t of TABS){ const b = h('button',t.id===tab?'on':'',t.label) as HTMLButtonElement; b.onclick = ()=>{ tab = t.id; confirmReset = false; for(const c of Array.from(tabs.children)) c.classList.toggle('on',c===b); renderList(list) }; tabs.appendChild(b) }
  card.appendChild(head); card.appendChild(tabs); card.appendChild(list); root.appendChild(card)
  root.addEventListener('pointerdown',e=>{ if(e.target===root) closeSettings() })
  for(const ev of ['pointerdown','pointermove','pointerup','wheel','touchstart','touchmove'] as const) card.addEventListener(ev,e=>e.stopPropagation(),{ passive:true })
  parent.appendChild(root)
  if(parent!==document.body) root.classList.add('st-in')   // dentro do quadro do jogo (que gira no celular em pé)
  renderList(list)
  onQualityChange(()=>{ if(root&&!root.hidden&&tab==='graficos') renderList(list) })
  onFxChange(()=>{ if(!self&&root&&!root.hidden&&(tab==='graficos'||tab==='som')) renderList(list) })
}

/** parent: o quadro do jogo (o painel gira junto com ele quando o celular está em pé) */
export function openSettings(parent:HTMLElement = document.body){ if(!root) build(parent); else { confirmReset = false; renderList(root.querySelector('.st-list') as HTMLElement) } root!.hidden = false; document.body.classList.add('st-open') }
export function closeSettings(){ if(root) root.hidden = true; document.body.classList.remove('st-open') }
export const settingsOpen = ()=>!!root&&!root.hidden
