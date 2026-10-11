/* Diagnóstico de desempenho das cenas em canvas (casa, base, rua). Só liga com ?perf=1 na URL.
   Mostra o tempo de CPU gasto por quadro (média e p95 dos últimos 2 s), os quadros por segundo de verdade, a resolução
   do canvas e o que a cena informar em `extra()` (sprites desenhados, sombras, partículas, qualidade).
   Mede embrulhando requestAnimationFrame: não muda nada no jogo quando está desligado. */
export function perfHud(extra){
  if(!/[?&]perf=1/.test(location.search))return;
  const raf=window.requestAnimationFrame.bind(window);
  const cpu=[],gaps=[];let last=0;
  window.requestAnimationFrame=f=>raf(t=>{if(last)gaps.push(t-last);last=t;const a=performance.now();f(t);cpu.push(performance.now()-a);if(cpu.length>240)cpu.shift();if(gaps.length>240)gaps.shift();});
  const el=document.createElement('div');
  el.style.cssText='position:fixed;left:6px;bottom:6px;z-index:99999;font:600 10px/1.35 ui-monospace,Menlo,monospace;color:#d8ffe0;background:rgba(0,0,0,.72);padding:5px 7px;border-radius:4px;pointer-events:none;white-space:pre';
  document.body.appendChild(el);
  const pct=(a,p)=>{if(!a.length)return 0;const s=[...a].sort((x,y)=>x-y);return s[Math.min(s.length-1,Math.floor(s.length*p))];};
  setInterval(()=>{const avg=cpu.reduce((a,b)=>a+b,0)/(cpu.length||1),gap=gaps.reduce((a,b)=>a+b,0)/(gaps.length||1);
    const c=document.querySelector('canvas#cv');
    el.textContent=`cpu ${avg.toFixed(1)} ms · p95 ${pct(cpu,.95).toFixed(1)} ms\nfps ${(1000/(gap||16.7)).toFixed(0)} · canvas ${c?c.width+'×'+c.height:'-'} · dpr ${devicePixelRatio}`+(extra?'\n'+extra():'');},500);
}
