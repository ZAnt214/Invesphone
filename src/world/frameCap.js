/* Limite de 60 quadros por segundo para o jogo inteiro (base, casa, depoimento na rua, HUD, quadro, jornal).
   Em tela de 120 Hz (iPad Pro, Mac, Android) o navegador chama requestAnimationFrame 120 vezes por segundo, e cada cena
   desenharia o dobro sem ganho visível, esquentando o aparelho e gastando bateria. No iPhone o Safari já fica em 60.

   Como: requestAnimationFrame é embrulhado uma vez, antes de qualquer cena. Cada pedido entra numa fila; a cada batida
   da tela, se ainda não deu o tempo de um quadro de 60 Hz, a fila espera a próxima batida; quando dá, todos os pedidos
   rodam juntos, na mesma batida, com o horário dela. A grade de tempo anda em passos fixos de 1/60 s (sem deriva), então
   em 120 Hz o jogo roda uma batida sim, outra não, regular; em 144 Hz alterna de 2 e 3 batidas, perto de 60.
   As animações já usam o tempo real entre quadros, então nada fica mais lento: só não desenha à toa. */
const FRAME=1000/60;
let installed=false;
export function installFrameCap(){
  if(installed||typeof window==='undefined'||!window.requestAnimationFrame)return;installed=true;
  const raf=window.requestAnimationFrame.bind(window),caf=window.cancelAnimationFrame.bind(window);
  let queue=new Map(),nid=0,pending=0,next=0;
  function tick(t){
    pending=0;
    if(!next)next=t;
    if(t<next-1.5){pending=raf(tick);return;}            // cedo demais para um quadro de 60 Hz: espera a próxima batida
    next+=FRAME;if(t-next>FRAME*2)next=t+FRAME;           // atrasou muito (aba em segundo plano, engasgo): realinha
    const run=queue;queue=new Map();
    for(const f of run.values()){try{f(t);}catch(e){setTimeout(()=>{throw e;},0);}}
    if(queue.size&&!pending)pending=raf(tick);
  }
  window.requestAnimationFrame=function(f){const id=++nid;queue.set(id,f);if(!pending)pending=raf(tick);return id;};
  window.cancelAnimationFrame=function(id){queue.delete(id);if(!queue.size&&pending){caf(pending);pending=0;}};
}
installFrameCap();
