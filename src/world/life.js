/* Mundo vivo — peças comuns às rotinas da rua, da base e da casa (docs/LIVING_WORLD_SYSTEM.md).
   Nada de IA pesada: cada personagem tem um estado simples (andar, trabalhar, conversar, esperar…) com começo, duração
   e fim, e escolhe o próximo por peso conforme o contexto. Estas funções cuidam do que faz a diferença entre "vivo" e
   "animação em loop": intervalos irregulares, memória do que acabou de acontecer (para não repetir), falas que não voltam
   logo, e um registro de acontecimentos para o painel de diagnóstico (?debug=1). */

/** gerador determinístico (mesma semente, mesma sequência) */
export function rng(seed){let a=(seed|0)||1;return ()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

/** duração irregular: base ± espalhamento, com cauda longa ocasional (pessoas às vezes demoram mais) */
export function jitter(R,base,spread=.45){const k=1+(R()*2-1)*spread;return base*k*(R()<.12?1.6+R():1);}

/** Escolha ponderada com memória. options: [{id, w:number|(ctx)=>number, cool?:segundos}].
 *  O peso de uma opção usada há pouco cai e volta aos poucos (cool), e a última escolhida não sai duas vezes seguidas
 *  quando há alternativa. mem: objeto do agente {last:{id:t}, prev:id}. */
export function choose(R,options,ctx,mem,now){
  let tot=0;const ws=[];
  for(const o of options){let w=typeof o.w==='function'?o.w(ctx):o.w;if(!(w>0)){ws.push(0);continue;}
    const t=mem.last&&mem.last[o.id];if(t!=null&&o.cool){w*=Math.min(1,Math.max(.05,(now-t)/o.cool));}
    if(mem.prev===o.id&&options.length>1)w*=.15;ws.push(w);tot+=w;}
  if(tot<=0)return null;let r=R()*tot;
  for(let i=0;i<options.length;i++){r-=ws[i];if(r<=0){const o=options[i];(mem.last||(mem.last={}))[o.id]=now;mem.prev=o.id;return o;}}
  return null;
}

/** Banco de falas: escolhe uma fala válida no contexto que não foi dita recentemente (por ninguém), e espaça as falas
 *  da cena inteira para nunca virar enxurrada. pool: [{t:'texto', who?:id|[ids], when?:(ctx)=>bool}] */
export function lineBank({gap=14,recent=10}={}){
  const said=[];let nextAt=0;
  return {
    ready(now){return now>=nextAt;},
    pick(R,pool,ctx,who,now){
      if(now<nextAt)return null;
      const ok=pool.filter(l=>(!l.who||(Array.isArray(l.who)?l.who.includes(who):l.who===who))&&(!l.when||l.when(ctx))&&!said.includes(l.t));
      if(!ok.length)return null;const l=ok[Math.floor(R()*ok.length)];
      said.push(l.t);if(said.length>recent)said.shift();nextAt=now+jitter(R,gap,.5);return l.t;},
    hold(now,s){nextAt=Math.max(nextAt,now+s);}
  };
}

/** registro curto do que aconteceu (para o painel e para reações: "alguém atendeu o telefone há pouco") */
export function eventLog(max=14){
  const list=[];
  return {list,emit(now,type,txt){list.push({t:now,type,txt});if(list.length>max)list.shift();},
    since(now,type,s){for(let i=list.length-1;i>=0;i--){const e=list[i];if(now-e.t>s)break;if(e.type===type)return e;}return null;}};
}

/** Painel de diagnóstico do mundo vivo: só com ?debug=1. rows() devolve linhas de texto (estado de cada NPC, eventos). */
export function lifeDebug(rows){
  if(typeof location==='undefined'||!/[?&]debug=1/.test(location.search))return;
  const el=document.createElement('div');
  el.style.cssText='position:fixed;right:6px;top:6px;z-index:99999;max-width:46vw;max-height:70vh;overflow:hidden;font:600 9px/1.3 ui-monospace,Menlo,monospace;color:#e8f4ff;background:rgba(0,0,0,.74);padding:5px 7px;border-radius:4px;pointer-events:none;white-space:pre';
  document.body.appendChild(el);
  setInterval(()=>{try{el.textContent=rows().join('\n');}catch(e){el.textContent=String(e);}},400);
}
