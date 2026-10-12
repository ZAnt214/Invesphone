/**
 * Ajustes do jogo: o registro único de tudo que o jogador pode ligar e desligar.
 *
 * REGRA (CLAUDE.md): todo efeito visual ou sonoro novo entra aqui, na categoria certa, com um texto curto e
 * a opção de desligar (efeito visual = seção Gráficos; som = seção Som) — e o código do efeito consulta `fxOn(id)` antes de desenhar/tocar. As duas telas de
 * ajustes (o botão de engrenagem do jogo, em src/settings/settingsPanel.ts, e o app Ajustes do aparelho)
 * são montadas a partir desta lista; nenhuma das duas tem opção escrita à mão.
 *
 * A qualidade gráfica (src/characters/quality.ts) continua por cima: um efeito ligado aqui ainda respeita
 * o que a qualidade baixa desliga.
 */

export type CategoryId = 'luz'|'atmosfera'|'tela'|'vida'|'cenas'|'som'
export type SectionId = 'graficos'|'som'
/** cada categoria pertence a uma seção dos Ajustes: tudo o que é visual fica em Gráficos, junto da qualidade */
export type Category = { id:CategoryId; label:string; section:SectionId }
export type Effect = { id:string; cat:CategoryId; label:string; desc:string; def:boolean; where:string }

export const CATEGORIES:Category[] = [
  { id:'luz', label:'Luz e sol', section:'graficos' },
  { id:'atmosfera', label:'Atmosfera', section:'graficos' },
  { id:'tela', label:'Bordas da tela', section:'graficos' },
  { id:'vida', label:'Vida no cenário', section:'graficos' },
  { id:'cenas', label:'Cenas rápidas', section:'graficos' },
  { id:'som', label:'Som', section:'som' }
]
export const SECTIONS:{ id:SectionId; label:string }[] = [{ id:'graficos', label:'Gráficos' },{ id:'som', label:'Som' }]
export const categoriesOf = (sec:SectionId)=>CATEGORIES.filter(c=>c.section===sec)

export const EFFECTS:Effect[] = [
  // luz e sol
  { id:'sun.beams', cat:'luz', label:'Fachos de luz', desc:'Faixas de sol entre os prédios, com poeira brilhando dentro.', def:true, where:'Rua' },
  { id:'sun.flare', cat:'luz', label:'Reflexos do sol', desc:'Raios saindo do sol e bolhas de luz no ar.', def:true, where:'Rua' },
  { id:'sun.glints', cat:'luz', label:'Brilhos', desc:'O sol batendo nas janelas, nas poças e no cromado dos carros.', def:true, where:'Rua' },
  { id:'sun.color', cat:'luz', label:'Cor da manhã', desc:'Tom dourado do lado do sol e frio do outro.', def:true, where:'Rua' },
  { id:'shadows', cat:'luz', label:'Sombras projetadas', desc:'Sombras de pessoas, carros, postes e árvores no chão.', def:true, where:'Rua' },
  // atmosfera
  { id:'wind', cat:'atmosfera', label:'Vento', desc:'Árvores, bandeiras e varais balançando; folhas soltas no ar.', def:true, where:'Rua' },
  { id:'debris', cat:'atmosfera', label:'Folhas e papéis no chão', desc:'Levados pelo vento pela calçada e pela sarjeta.', def:true, where:'Rua' },
  { id:'clouds', cat:'atmosfera', label:'Sombra das nuvens', desc:'Nuvens passando devagar e sombreando a rua.', def:true, where:'Rua' },
  { id:'steam', cat:'atmosfera', label:'Vapor e fumaça', desc:'Vapor dos bueiros e fumaça dos escapamentos.', def:true, where:'Rua' },
  { id:'flies', cat:'atmosfera', label:'Moscas', desc:'Rondando os sacos de lixo e a caçamba.', def:true, where:'Rua' },
  // tela e bordas
  { id:'edge.blur', cat:'tela', label:'Desfoque nas bordas', desc:'O cenário perde um pouco de foco perto das bordas.', def:true, where:'Rua' },
  { id:'edge.tint', cat:'tela', label:'Cantos escuros', desc:'Bordas um pouco mais escuras e quentes (vinheta).', def:true, where:'Rua e DHPP' },
  { id:'edge.glow', cat:'tela', label:'Luz e partículas nas bordas', desc:'A luz do sol vazando do canto e pontinhos de luz flutuando.', def:true, where:'Rua' },
  { id:'front', cat:'tela', label:'Prédios em primeiro plano', desc:'Os prédios do lado de cá, entre a câmera e a rua.', def:true, where:'Rua' },
  // vida
  { id:'dwellers', cat:'vida', label:'Gente nas janelas e lojas', desc:'Moradores nas janelas e varandas, funcionários e clientes nas vitrines.', def:true, where:'Rua' },
  // cenas rápidas
  { id:'scene.badge', cat:'cenas', label:'Passar o crachá na porta', desc:'Close na leitora para passar o crachá ao entrar na área restrita. Desligado, a porta abre sozinha.', def:true, where:'DHPP' },
  // som
  { id:'ambient', cat:'som', label:'Som ambiente', desc:'O ar da cidade, o trânsito, o burburinho e o ar-condicionado do DHPP.', def:true, where:'Rua e DHPP' },
  { id:'sfx.badge', cat:'som', label:'Leitora de crachá', desc:'O bipe da leitora e o estalo da trava ao passar o crachá.', def:true, where:'DHPP' }
]

const KEY = 'invesphone.fx'
const EVENT = 'invesphone-fx'
let cache:Record<string,boolean>|null = null

function load():Record<string,boolean>{
  if(cache) return cache
  let saved:Record<string,boolean> = {}
  try{ saved = JSON.parse(localStorage.getItem(KEY)||'{}')||{} }catch{ /* armazenamento indisponível */ }
  cache = {}
  for(const e of EFFECTS) cache[e.id] = typeof saved[e.id]==='boolean' ? saved[e.id] : e.def
  return cache
}

/** o efeito está ligado? (ids desconhecidos contam como ligados, para nada sumir por engano) */
export function fxOn(id:string):boolean{ const c = load(); return c[id] ?? true }

export function setFx(id:string,on:boolean){
  const c = load(); c[id] = on
  try{ localStorage.setItem(KEY,JSON.stringify(c)) }catch{ /* ignora */ }
  window.dispatchEvent(new CustomEvent(EVENT,{ detail:{ id,on } }))
}

/** volta todos os efeitos ao padrão */
export function resetFx(){
  cache = null
  try{ localStorage.removeItem(KEY) }catch{ /* ignora */ }
  window.dispatchEvent(new CustomEvent(EVENT,{ detail:null }))
}

/** avisa quando algum efeito muda (nesta ou em outra aba). Devolve a função que cancela. */
export function onFxChange(fn:()=>void){
  const local = ()=>fn()
  const other = (e:StorageEvent)=>{ if(e.key===KEY){ cache = null; fn() } }
  window.addEventListener(EVENT,local)
  window.addEventListener('storage',other)
  return ()=>{ window.removeEventListener(EVENT,local); window.removeEventListener('storage',other) }
}
