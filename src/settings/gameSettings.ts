/**
 * Ajustes do jogo: o registro único de tudo que o jogador pode ligar e desligar.
 *
 * REGRA (CLAUDE.md): todo efeito visual ou sonoro novo entra aqui, na categoria certa, com um texto curto e
 * a opção de desligar (efeito visual = seção Gráficos; som = seção Som) — e o código do efeito consulta `fxOn(id)` antes de desenhar/tocar. As duas telas de
 * ajustes (o botão de engrenagem do jogo, em src/settings/settingsPanel.ts)
 * são montadas a partir desta lista; nenhuma das duas tem opção escrita à mão.
 *
 * A qualidade gráfica (src/characters/quality.ts) continua por cima: um efeito ligado aqui ainda respeita
 * o que a qualidade baixa desliga.
 */

export type CategoryId = 'luz'|'atmosfera'|'tela'|'vida'|'cenas'|'interface'|'depo'|'som'
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
  { id:'interface', label:'Interface', section:'graficos' },
  { id:'depo', label:'Depoimento na rua', section:'graficos' },
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
  { id:'night.lamps', cat:'luz', label:'Luzes da noite', desc:'Postes, faróis dos carros e janelas acesas no plantão da madrugada.', def:true, where:'Rua e DHPP' },
  { id:'base.ao', cat:'luz', label:'Sombra nos cantos', desc:'O chão escurece junto às paredes das salas, dando volume aos cômodos.', def:true, where:'DHPP' },
  { id:'base.doorlight', cat:'luz', label:'Luz pelas portas', desc:'A luz de cada sala vaza pelas portas e passagens.', def:true, where:'DHPP' },
  // atmosfera
  { id:'wind', cat:'atmosfera', label:'Vento', desc:'Árvores, bandeiras e varais balançando; folhas soltas no ar.', def:true, where:'Rua' },
  { id:'debris', cat:'atmosfera', label:'Folhas e papéis no chão', desc:'Levados pelo vento pela calçada e pela sarjeta.', def:true, where:'Rua' },
  { id:'clouds', cat:'atmosfera', label:'Sombra das nuvens', desc:'Nuvens passando devagar e sombreando a rua.', def:true, where:'Rua' },
  { id:'steam', cat:'atmosfera', label:'Vapor e fumaça', desc:'Vapor dos bueiros e fumaça dos escapamentos.', def:true, where:'Rua' },
  { id:'night.rain', cat:'atmosfera', label:'Chuva na madrugada', desc:'Garoa fina caindo na rua e no pátio durante o plantão da noite.', def:true, where:'Rua e DHPP' },
  { id:'flies', cat:'atmosfera', label:'Moscas', desc:'Rondando os sacos de lixo e a caçamba.', def:true, where:'Rua' },
  // tela e bordas
  { id:'edge.blur', cat:'tela', label:'Desfoque nas bordas', desc:'O cenário perde um pouco de foco perto das bordas.', def:true, where:'Rua' },
  { id:'edge.tint', cat:'tela', label:'Cantos escuros', desc:'Bordas um pouco mais escuras e quentes (vinheta).', def:true, where:'Rua e DHPP' },
  { id:'base.focus', cat:'tela', label:'Foco na sala do Lemos', desc:'Com a câmera afastada, a sala onde o Lemos está fica acesa e as outras escurecem.', def:true, where:'DHPP' },
  { id:'edge.glow', cat:'tela', label:'Luz e partículas nas bordas', desc:'A luz do sol vazando do canto e pontinhos de luz flutuando.', def:true, where:'Rua' },
  { id:'front', cat:'tela', label:'Prédios em primeiro plano', desc:'Os prédios do lado de cá, entre a câmera e a rua.', def:true, where:'Rua' },
  // vida
  { id:'base.life', cat:'vida', label:'Movimento no DHPP', desc:'Papéis no chão da sala da equipe e a copiadora soltando folhas.', def:true, where:'DHPP' },
  { id:'dwellers', cat:'vida', label:'Gente nas janelas e lojas', desc:'Moradores nas janelas e varandas, funcionários e clientes nas vitrines.', def:true, where:'Rua' },
  // cenas rápidas
  { id:'scene.board', cat:'cenas', label:'Entrada do quadro do caso', desc:'A câmera passa por trás do Lemos até o quadro. Desligada, só a aproximação.', def:true, where:'DHPP' },
  { id:'scene.badge', cat:'cenas', label:'Passar o crachá na porta', desc:'Passar o crachá na leitora para entrar na área restrita. Desligado, a porta abre sozinha.', def:true, where:'DHPP' },
  // interface (HUD do Lemos)
  { id:'hud.particles', cat:'interface', label:'Luz e partículas da interface', desc:'Reflexo de lente, poeira de luz e o rastro da evidência voando até a caderneta.', def:true, where:'Rua e DHPP' },
  { id:'hud.room', cat:'interface', label:'Nome do lugar ao entrar', desc:'Faixas de cinema com o nome do lugar, uma vez por sessão, nos lugares que importam.', def:true, where:'Rua e DHPP' },
  { id:'hud.fps', cat:'interface', label:'Medidor de FPS', desc:'Mostra no alto da tela quantos quadros por segundo o jogo está desenhando e o pior quadro do último segundo.', def:false, where:'Todo o jogo' },
  { id:'hud.portrait', cat:'interface', label:'Retrato animado', desc:'Um anel âmbar pulsa em volta do rosto do Lemos quando chega uma descoberta.', def:true, where:'Rua e DHPP' },
  // depoimento na rua (src/rua/streetDepo.js)
  { id:'depo.rain', cat:'depo', label:'Garoa na cena', desc:'Garoa leve, acesa pela luz do poste, com alguns pingos do poste e névoa no facho.', def:true, where:'Casa' },
  { id:'depo.lens', cat:'depo', label:'Gotas na lente', desc:'Gotas paradas na câmera que às vezes escorrem.', def:true, where:'Casa' },
  { id:'depo.flyby', cat:'depo', label:'Viatura e helicóptero passando', desc:'A luz de uma viatura e o holofote de um helicóptero passando pela cena, com vento e folhas.', def:true, where:'Casa' },
  { id:'depo.tape', cat:'depo', label:'Fita ao vento', desc:'A fita de isolamento cede no meio, ondula e torce com o vento e o helicóptero.', def:true, where:'Casa' },
  { id:'depo.shade', cat:'depo', label:'Sombra nos curiosos', desc:'Os curiosos atrás da fita ficam na penumbra, com a sombra da árvore e o giroflex passando por eles.', def:true, where:'Casa' },
  { id:'depo.film', cat:'depo', label:'Cor de cinema e granulação', desc:'Sombras azuladas, luzes âmbar e grão de filme.', def:true, where:'Casa' },
  { id:'depo.camera', cat:'depo', label:'Câmera na mão', desc:'O balanço leve da câmera, a aproximação na pista e a tremida do helicóptero.', def:true, where:'Casa' },
  // som
  { id:'ambient', cat:'som', label:'Som ambiente', desc:'O ar da cidade, o trânsito, o burburinho e o ar-condicionado do DHPP.', def:true, where:'Rua e DHPP' },
  { id:'sfx.rain', cat:'som', label:'Chuva', desc:'O chiado da garoa no plantão da madrugada, abafado dentro do DHPP.', def:true, where:'Rua e DHPP' },
  { id:'sfx.hud', cat:'som', label:'Sons da interface', desc:'Ao entrar numa sala, nas descobertas, nas pistas registradas e na caderneta.', def:true, where:'Rua e DHPP' },
  { id:'sfx.depoAmb', cat:'som', label:'Ambiente do depoimento na rua', desc:'Chuva, cidade, rádio da viatura, curiosos, carros e helicóptero passando.', def:true, where:'Casa' },
  { id:'sfx.depoFx', cat:'som', label:'Efeitos do depoimento na rua', desc:'Caneta, caderno, marca-texto, papel voando e o toque da pista.', def:true, where:'Casa' },
  { id:'sfx.badge', cat:'som', label:'Leitora de crachá', desc:'O atrito do crachá na fenda, o bipe da leitora e a trava da porta soltando.', def:true, where:'DHPP' }
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
