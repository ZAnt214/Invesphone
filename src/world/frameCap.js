/* Limite de 60 quadros por segundo para o jogo inteiro (base, casa, depoimento na rua, HUD, quadro, jornal).
   Em tela de 120 Hz (iPad Pro, Mac, Android) o navegador chama requestAnimationFrame 120 vezes por segundo, e cada cena
   desenharia o dobro sem ganho visível, esquentando o aparelho e gastando bateria. No iPhone o Safari já fica em 60.

   Como: requestAnimationFrame é embrulhado uma vez, antes de qualquer cena. Cada pedido entra numa fila e, a cada batida
   da tela, todos os pedidos rodam juntos, na mesma batida, com o horário dela.
   - Tela de até ~80 Hz (o iPhone no Safari, a maioria dos monitores): a fila roda em toda batida. O limite não tem o que
     cortar ali, e pular uma batida por causa de um horário que chegou um pouco adiantado seria um tranco à toa.
   - Tela mais rápida: a fila espera até dar o tempo de um quadro de 60 Hz, numa grade de passos fixos de 1/60 s (sem
     deriva), com folga de meia batida para o horário que chega adiantado. Em 120 Hz o jogo roda uma batida sim, outra
     não, regular; em 144 Hz alterna de 2 e 3 batidas, perto de 60.
   A frequência da tela é medida o tempo todo (média das batidas): se o aparelho mudar de taxa, o limite acompanha.
   As animações já usam o tempo real entre quadros, então nada fica mais lento: só não desenha à toa. */
const FRAME=1000/60;
let installed=false;
export function installFrameCap(){
  if(installed||typeof window==='undefined'||!window.requestAnimationFrame)return;installed=true;
  const raf=window.requestAnimationFrame.bind(window),caf=window.cancelAnimationFrame.bind(window);
  let queue=new Map(),nid=0,pending=0,next=0,prevT=0,beat=FRAME;
  function tick(t){
    pending=0;
    // batida da tela: só conta o intervalo entre duas batidas seguidas (pausas e quadros perdidos ficam de fora)
    if(prevT){const iv=t-prevT;if(iv>2&&iv<FRAME*1.25)beat+=(iv-beat)*0.05;}prevT=t;
    if(beat<12.5){
      if(!next||t-next>FRAME*2||next-t>FRAME*2)next=t;            // começo, ou aba que voltou de segundo plano: realinha
      if(t<next-Math.min(4,beat*0.5)){pending=raf(tick);return;}   // cedo demais para um quadro de 60 Hz: espera a próxima batida
      next+=FRAME;
    }else next=0;
    const run=queue;queue=new Map();
    for(const f of run.values()){try{f(t);}catch(e){setTimeout(()=>{throw e;},0);}}
    if(queue.size&&!pending)pending=raf(tick);
    else if(!queue.size)prevT=0;                                    // fila vazia: a próxima batida não é seguida desta
  }
  window.requestAnimationFrame=function(f){const id=++nid;queue.set(id,f);if(!pending)pending=raf(tick);return id;};
  window.cancelAnimationFrame=function(id){queue.delete(id);if(!queue.size&&pending){caf(pending);pending=0;prevT=0;}};
}
installFrameCap();
