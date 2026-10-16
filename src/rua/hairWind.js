/* Cabelo ao vento (docs/DEPOIMENTO_NA_RUA.md, "Cabelo ao vento").
   As camadas do ChatGPT (public/characters/<id>/hair/): por expressão, uma base com o cabelo solto removido e as mechas,
   cada uma com um mapa de peso (vermelho: 0 na raiz, presa, até 1 na ponta, que mexe mais).
   Nada é redesenhado: a imagem oficial se recompõe exata em repouso (base + mechas = retrato).

   Como a mecha dobra sem girar o recorte inteiro (o que abriria emendas): cada mecha é decomposta, uma vez só, em K faixas
   de peso com funções "chapéu" que somam 1 (partição da unidade). A cada quadro, a faixa k anda d·cₖ (cₖ = peso no centro
   da faixa) e as faixas são somadas com 'lighter' num canvas da própria mecha, o que reconstitui a mecha sem perda de
   alfa; só então ela vai por cima da base. Em repouso as faixas coincidem e a soma é a mecha original; com vento, a raiz
   fica e a ponta vai, num deslocamento contínuo.

   Memória (iPhone): só a expressão em uso (e a anterior, durante a troca) fica decodificada, e cada mecha é guardada
   recortada na caixa que ocupa, na escala do retrato no jogo. */
const K=10;   // faixas de peso por mecha (mais faixas = dobra mais lisa, sem fantasma nas rajadas)
const loadImg=src=>new Promise(r=>{const i=new Image();i.decoding='async';i.onload=()=>r(i);i.onerror=()=>r(null);i.src=src});

/** o.url: manifest.json; o.PW,o.PH: tamanho em que o retrato é guardado (a escala do jogo); o.mask: máscara da figura (Image) */
export function createHair(o){
  let M=null,dead=false;const cache=new Map(),wait=new Map();
  const base=o.url.replace(/manifest\.json$/,'');
  const ready=fetch(o.url).then(r=>r.ok?r.json():null).then(j=>{M=j&&j.expressions?j:null;return !!M}).catch(()=>false);

  async function build(e){
    if(!M||!M.expressions[e])return null;const E=M.expressions[e],W0=(M.resolution&&M.resolution.width)||900,H0=(M.resolution&&M.resolution.height)||1200;
    const s=o.PW/W0;
    const [bimg,...rest]=await Promise.all([loadImg(base+E.base),...E.strands.flatMap(st=>[loadImg(base+st.file),loadImg(base+st.weight)])]);
    if(dead||!bimg)return null;
    // base sem as mechas, recortada pela máscara da figura (como o retrato oficial)
    const bc=document.createElement('canvas');bc.width=o.PW;bc.height=o.PH;const bx=bc.getContext('2d');bx.drawImage(bimg,0,0,o.PW,o.PH);
    if(o.mask){bx.globalCompositeOperation='destination-in';bx.drawImage(o.mask,0,0,o.PW,o.PH);bx.globalCompositeOperation='source-over';}
    const strands=[];const tc=document.createElement('canvas');tc.width=o.PW;tc.height=o.PH;const tx=tc.getContext('2d',{willReadFrequently:true});
    const order=E.strands.map((st,i)=>({st,img:rest[i*2],wt:rest[i*2+1]})).sort((a,b)=>(a.st.zIndex||0)-(b.st.zIndex||0));
    for(const {st,img,wt} of order){if(!img||!wt)continue;
      tx.clearRect(0,0,o.PW,o.PH);tx.drawImage(img,0,0,o.PW,o.PH);const A=tx.getImageData(0,0,o.PW,o.PH).data;
      let x0=o.PW,y0=o.PH,x1=-1,y1=-1;for(let y=0;y<o.PH;y++)for(let x=0;x<o.PW;x++){if(A[(y*o.PW+x)*4+3]>2){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}}
      if(x1<0)continue;const w=x1-x0+1,h=y1-y0+1;
      tx.clearRect(0,0,o.PW,o.PH);tx.drawImage(wt,0,0,o.PW,o.PH);const Wd=tx.getImageData(x0,y0,w,h).data;
      const bands=[];
      for(let k=0;k<K;k++){const c=document.createElement('canvas');c.width=w;c.height=h;const cx=c.getContext('2d'),im=cx.createImageData(w,h),d=im.data,ck=k/(K-1);let any=false;
        for(let y=0;y<h;y++)for(let x=0;x<w;x++){const si=((y0+y)*o.PW+x0+x)*4,di=(y*w+x)*4,a=A[si+3];if(!a)continue;
          const hk=Math.max(0,1-Math.abs(Wd[di]/255-ck)*(K-1));if(hk<=0)continue;
          d[di]=A[si];d[di+1]=A[si+1];d[di+2]=A[si+2];d[di+3]=Math.round(a*hk);any=true;}
        if(any){cx.putImageData(im,0,0);bands.push({c,ck});}else c.width=c.height=0;}
      const pad=Math.ceil(14*s)+2,sum=document.createElement('canvas');sum.width=w+pad*2;sum.height=h+pad*2;
      const dir=st.tip&&st.root?[st.tip[0]-st.root[0],st.tip[1]-st.root[1]]:[0,-1],dl=Math.hypot(dir[0],dir[1])||1;
      strands.push({x0,y0,w,h,pad,bands,sum,stiff:st.stiffness??.7,dir:[dir[0]/dl,dir[1]/dl],ph:(st.root?st.root[0]*.013+st.root[1]*.007:strands.length)});}
    tc.width=tc.height=0;
    return {base:bc,strands};
  }
  function want(e){if(cache.has(e)||wait.has(e))return;const p=ready.then(ok=>ok?build(e):null).then(v=>{wait.delete(e);if(v&&!dead)cache.set(e,v);return v;});wait.set(e,p);}
  /** mantém só as expressões pedidas decodificadas */
  function keep(list){for(const e of [...cache.keys()])if(!list.includes(e)){const v=cache.get(e);v.base.width=v.base.height=0;for(const s of v.strands){s.sum.width=s.sum.height=0;for(const b of s.bands)b.c.width=b.c.height=0;}cache.delete(e);}for(const e of list)want(e);}
  /** desenha a expressão e com as mechas deslocadas. c já está nas coordenadas do retrato original (900×1200).
      d: deslocamento do vento em px da imagem original ({x,y,flutter}); t em segundos. Devolve false se ainda não carregou. */
  function draw(c,e,t,d){const v=cache.get(e);if(!v)return false;const W0=(M.resolution&&M.resolution.width)||900,k=W0/o.PW;
    c.drawImage(v.base,0,0,o.PW*k,o.PH*k);
    for(const s of v.strands){const free=1-s.stiff*.65,fl=d.flutter*(1-s.stiff)*Math.sin(t*7.3+s.ph*3)+d.flutter*.5*(1-s.stiff)*Math.sin(t*12.1+s.ph*5);
      // empurra no sentido do vento; as mechas que apontam contra ele levantam um pouco (componente ao longo da mecha)
      const ax=(d.x*(.62+.38*Math.sin(t*1.31+s.ph))+fl)*free,ay=(d.y+Math.abs(d.x)*.12*Math.max(0,-s.dir[1]))*free;
      const g=s.sum.getContext('2d'),P=s.pad,ks=1/k;g.globalCompositeOperation='source-over';g.clearRect(0,0,s.sum.width,s.sum.height);g.globalCompositeOperation='lighter';
      for(const b of s.bands)g.drawImage(b.c,P+ax*b.ck*ks,P+ay*b.ck*ks);
      g.globalCompositeOperation='source-over';
      c.drawImage(s.sum,(s.x0-P)*k,(s.y0-P)*k,s.sum.width*k,s.sum.height*k);}
    return true;}
  return {ready,want,keep,draw,has:e=>cache.has(e),destroy(){dead=true;keep([]);}};
}
