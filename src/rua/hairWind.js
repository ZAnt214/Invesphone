/* Cabelo ao vento (docs/DEPOIMENTO_NA_RUA.md, "Cabelo ao vento").
   As camadas do ChatGPT (public/characters/<id>/hair/): por expressão, uma base com o cabelo solto removido e as mechas,
   cada uma com um mapa de peso (vermelho: 0 na raiz, presa, até 1 na ponta, que mexe mais).
   Nada é redesenhado: a imagem oficial se recompõe em repouso (base + mechas = retrato).

   - Malha: cada mecha vira uma malha fina (grade de ~6 px da imagem original). Cada ponto gira em volta da raiz da
     mecha, tanto mais quanto mais perto da ponta: a mecha DOBRA na direção do vento, sem esticar.
   - Física: cada mecha é um pêndulo com mola e amortecimento em volta da raiz, empurrado pelo torque do vento (produto
     vetorial direção da mecha × vento, contínuo em qualquer direção: nada salta). O estado vale para todas as
     expressões, então trocar de rosto não reinicia o movimento.
   - Emendas: as mechas foram recortadas com bordas retas onde encostavam em outro cabelo. Essas bordas de corte são
     achadas uma vez (borda da mecha cujo vizinho, na base, é cabelo e não fundo nem pele) e ganham um esfumado que só
     aparece quando a mecha se mexe: em repouso a imagem é a oficial; com vento o corte reto não aparece.
   - Desempenho: a figura inteira (base + mechas) é desenhada pela placa de vídeo num canvas próprio, que fica na tela
     por baixo do canvas do retrato (boca, piscar). Nada volta da placa de vídeo para o canvas 2D (isso custava metade do
     quadro). A luz da cena sobre o Jorge (escuro geral, âmbar do poste, giroflex, farol da viatura) é calculada no
     próprio sombreador, então até a ponta que saiu da silhueta recebe a mesma luz.
   Sem WebGL, ou se o contexto cair, ok() fica falso e o jogo volta ao retrato oficial parado. */
const GRID=6;      // célula da malha, em px da imagem original
const FEATHER=13;  // largura do esfumado nas bordas de corte, em px da imagem original
const loadImg=src=>new Promise(r=>{const i=new Image();i.decoding='async';i.onload=()=>r(i);i.onerror=()=>r(null);i.src=src});

const VS=`attribute vec2 aPos;attribute vec2 aUV;attribute float aW;attribute float aR;
uniform vec2 uView,uRoot;uniform vec4 uXf;uniform float uK,uBend,uWob,uGust,uT,uPh;varying vec2 vUV;varying vec2 vA;
void main(){
  float wave=sin(uT*2.2-aR*2.6+uPh)*.6+sin(uT*3.9-aR*3.4+uPh*1.7)*.4
    +uGust*(sin(uT*9.1-aR*5.0+uPh*2.3)*.55+sin(uT*13.7-aR*6.2+uPh*3.1)*.3+sin(uT*5.3-aR*3.0+uPh*.7)*.4);
  float phi=(uBend+uWob*wave)*aW;
  vec2 r=aPos-uRoot;float c=cos(phi),s=sin(phi);
  vec2 q=(uRoot+vec2(r.x*c-r.y*s,r.x*s+r.y*c))*uK;      /* px da imagem original */
  vec2 a=q*uXf.zw+uXf.xy;                                 /* px do retrato na tela (400×430) */
  vA=a;vec2 p=a/uView*2.0-1.0;
  gl_Position=vec4(p.x,-p.y,0.0,1.0);vUV=aUV;}`;
/* luz: as mesmas camadas que o canvas 2D aplicava por cima do retrato (source-atop), na mesma ordem */
const FS=`#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uTex,uFea;uniform float uFeaK,uAlpha,uGr,uGb,uPI,uPx,uPr,uPb;uniform vec2 uViewF;
varying vec2 vUV;varying vec2 vA;
vec3 over(vec3 p,float pa,vec3 c,float a){return p*(1.0-a)+c*a*pa;}
void main(){
  vec4 t=texture2D(uTex,vUV);
  float f=mix(1.0,texture2D(uFea,vUV).a,uFeaK);t*=f;
  if(t.a<.002)discard;
  float w=uViewF.x,h=uViewF.y,y=vA.y/h,x=vA.x/w;vec3 p=t.rgb;
  p=over(p,t.a,vec3(6.,10.,24.)/255.,.34);
  p=over(p,t.a,vec3(255.,178.,96.)/255.,.3*clamp(1.0-y/.5,0.0,1.0));
  p=over(p,t.a,vec3(4.,6.,14.)/255.,.5*clamp((y-.5)/.5,0.0,1.0));
  p=over(p,t.a,vec3(255.,48.,48.)/255.,.32*uGr*clamp(1.0-x/.24,0.0,1.0));
  p=over(p,t.a,vec3(70.,120.,255.)/255.,.32*uGb*clamp((x-.76)/.24,0.0,1.0));
  if(uPI>.001){
    float d1=distance(vA,vec2(uPx,h*.4));float g1=d1<20.0?.5:(d1<192.0?mix(.5,.22,(d1-20.0)/172.0):mix(.22,0.0,clamp((d1-192.0)/128.0,0.0,1.0)));
    p=over(p,t.a,vec3(255.,246.,228.)/255.,g1*uPI);
    if(uPr>.5)p=over(p,t.a,vec3(255.,48.,48.)/255.,.38*uPI*clamp(1.0-distance(vA,vec2(uPx-40.0,h*.39))/300.0,0.0,1.0));
    if(uPb>.5)p=over(p,t.a,vec3(70.,120.,255.)/255.,.36*uPI*clamp(1.0-distance(vA,vec2(uPx+40.0,h*.39))/300.0,0.0,1.0));}
  gl_FragColor=vec4(p,t.a)*uAlpha;}`;

/** o.url: manifest.json; o.PW,o.PH: tamanho em que o retrato é guardado (a escala do jogo); o.mask: máscara da figura (Image);
    o.canvas: o canvas visível onde a figura é desenhada (fica por baixo do canvas 2D do retrato) */
export function createHair(o){
  let M=null,dead=false;const cache=new Map(),wait=new Map();
  const base=o.url.replace(/manifest\.json$/,'');
  const ready=fetch(o.url).then(r=>r.ok?r.json():null).then(j=>{M=j&&j.expressions?j:null;return !!M}).catch(()=>false);
  const W0=()=>(M&&M.resolution&&M.resolution.width)||900;

  /* ---------- WebGL no canvas visível ---------- */
  const cv=o.canvas;let gl=null,prog=null,L=null,lost=false,VW=400,VH=430;
  function glInit(){
    if(gl||lost)return !!gl;
    cv.addEventListener('webglcontextlost',ev=>{ev.preventDefault();lost=true;gl=null;},false);
    try{gl=cv.getContext('webgl',{premultipliedAlpha:true,alpha:true,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:false,powerPreference:'low-power'});}catch(_){gl=null;}
    if(!gl){lost=true;return false;}
    const sh=(t,s)=>{const x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);return x;};
    prog=gl.createProgram();gl.attachShader(prog,sh(gl.VERTEX_SHADER,VS));gl.attachShader(prog,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(prog);
    if(!gl.getProgramParameter(prog,gl.LINK_STATUS)){try{console.warn('cabelo: sombreador',gl.getProgramInfoLog(prog),gl.getShaderInfoLog(gl.getAttachedShaders(prog)[1]));}catch(_){/* sem log */}gl=null;lost=true;return false;}
    gl.useProgram(prog);L={};
    for(const n of ['aPos','aUV','aW','aR'])L[n]=gl.getAttribLocation(prog,n);
    for(const n of ['uView','uViewF','uRoot','uXf','uK','uBend','uWob','uGust','uT','uPh','uTex','uFea','uFeaK','uAlpha','uGr','uGb','uPI','uPx','uPr','uPb'])L[n]=gl.getUniformLocation(prog,n);
    gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
    gl.uniform1i(L.uTex,0);gl.uniform1i(L.uFea,1);
    // textura "sem esfumado" para a base
    const one=document.createElement('canvas');one.width=one.height=1;const ox=one.getContext('2d');ox.fillStyle='#fff';ox.fillRect(0,0,1,1);ONE=tex(one);
    return true;
  }
  let ONE=null;
  function tex(img){const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);return t;}
  function buf(data,isIdx){const b=gl.createBuffer();const T=isIdx?gl.ELEMENT_ARRAY_BUFFER:gl.ARRAY_BUFFER;gl.bindBuffer(T,b);gl.bufferData(T,data,gl.STATIC_DRAW);return b;}
  function upload(v){if(v.gpu)return true;if(!glInit())return false;
    const quad=(x,y,w,h)=>({vb:buf(new Float32Array([x,y,0,0,0,0, x+w,y,1,0,0,0, x,y+h,0,1,0,0, x+w,y+h,1,1,0,0])),ib:buf(new Uint16Array([0,1,2,2,1,3]),true),n:6});
    v.gpu={base:{t:tex(v.base),f:null,...quad(0,0,o.PW,o.PH)},strands:v.strands.map(s=>({t:tex(s.src),f:tex(s.fea),vb:buf(s.verts),ib:buf(s.idx,true),n:s.idx.length,root:s.root}))};
    return true;}
  function unload(v){if(!v.gpu||!gl){v.gpu=null;return;}for(const m of [v.gpu.base,...v.gpu.strands]){gl.deleteTexture(m.t);if(m.f)gl.deleteTexture(m.f);gl.deleteBuffer(m.vb);gl.deleteBuffer(m.ib);}v.gpu=null;}
  function mesh(m,u){gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,m.f||ONE);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,m.t);
    gl.bindBuffer(gl.ARRAY_BUFFER,m.vb);
    gl.enableVertexAttribArray(L.aPos);gl.vertexAttribPointer(L.aPos,2,gl.FLOAT,false,24,0);
    gl.enableVertexAttribArray(L.aUV);gl.vertexAttribPointer(L.aUV,2,gl.FLOAT,false,24,8);
    gl.enableVertexAttribArray(L.aW);gl.vertexAttribPointer(L.aW,1,gl.FLOAT,false,24,16);
    gl.enableVertexAttribArray(L.aR);gl.vertexAttribPointer(L.aR,1,gl.FLOAT,false,24,20);
    gl.uniform2f(L.uRoot,u.root[0],u.root[1]);gl.uniform1f(L.uBend,u.bend);gl.uniform1f(L.uWob,u.wob);gl.uniform1f(L.uPh,u.ph);gl.uniform1f(L.uFeaK,u.fea);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,m.ib);gl.drawElements(gl.TRIANGLES,m.n,gl.UNSIGNED_SHORT,0);}

  async function build(e){
    if(!M||!M.expressions[e])return null;const E=M.expressions[e],s=o.PW/W0();
    const [bimg,...rest]=await Promise.all([loadImg(base+E.base),...E.strands.flatMap(st=>[loadImg(base+st.file),loadImg(base+st.weight)])]);
    if(dead||!bimg)return null;
    // base sem as mechas, recortada pela máscara da figura (como o retrato oficial)
    const bc=document.createElement('canvas');bc.width=o.PW;bc.height=o.PH;const bx=bc.getContext('2d',{willReadFrequently:true});bx.drawImage(bimg,0,0,o.PW,o.PH);
    if(o.mask){bx.globalCompositeOperation='destination-in';bx.drawImage(o.mask,0,0,o.PW,o.PH);bx.globalCompositeOperation='source-over';}
    const B=bx.getImageData(0,0,o.PW,o.PH).data;
    const strands=[];const tc=document.createElement('canvas');tc.width=o.PW;tc.height=o.PH;const tx=tc.getContext('2d',{willReadFrequently:true});
    const order=E.strands.map((st,i)=>({st,img:rest[i*2],wt:rest[i*2+1]})).sort((a,b)=>(a.st.zIndex||0)-(b.st.zIndex||0));
    const G=Math.max(2.5,GRID*s),FW=Math.max(3,FEATHER*s);
    for(const {st,img,wt} of order){if(!img||!wt)continue;
      tx.clearRect(0,0,o.PW,o.PH);tx.drawImage(img,0,0,o.PW,o.PH);const A=tx.getImageData(0,0,o.PW,o.PH).data;
      let x0=o.PW,y0=o.PH,x1=-1,y1=-1;for(let y=0;y<o.PH;y++)for(let x=0;x<o.PW;x++){if(A[(y*o.PW+x)*4+3]>2){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}}
      if(x1<0)continue;x0=Math.max(0,x0-2);y0=Math.max(0,y0-2);x1=Math.min(o.PW-1,x1+2);y1=Math.min(o.PH-1,y1+2);const w=x1-x0+1,h=y1-y0+1;
      const src=document.createElement('canvas');src.width=w;src.height=h;src.getContext('2d').drawImage(tc,x0,y0,w,h,0,0,w,h);
      tx.clearRect(0,0,o.PW,o.PH);tx.drawImage(wt,0,0,o.PW,o.PH);const Wd=tx.getImageData(x0,y0,w,h).data;
      const alpha=(x,y)=>A[((y0+y)*o.PW+x0+x)*4+3];
      /* bordas de corte: pixel da mecha com vizinho fora dela que, na base, é cabelo (cinza, dentro da figura) */
      const dist=new Float32Array(w*h).fill(1e9),q=[];
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(alpha(x,y)<=40)continue;
        for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const X=x0+x+dx,Y=y0+y+dy;if(X<0||Y<0||X>=o.PW||Y>=o.PH)continue;
          const ai=(Y*o.PW+X)*4;if(A[ai+3]>40)continue;   // ainda é a mecha
          if(B[ai+3]<160)continue;                          // fundo: borda natural do cabelo
          const r=B[ai],g=B[ai+1],b=B[ai+2];if(r-b>48)continue;   // pele: borda natural (testa, orelha)
          dist[y*w+x]=0;q.push(y*w+x);break;}}
      for(let qi=0;qi<q.length;qi++){const i=q[qi],x=i%w,y=(i/w)|0,d=dist[i]+1;if(d>FW)continue;
        for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=w||Y>=h)continue;const j=Y*w+X;if(dist[j]>d){dist[j]=d;q.push(j);}}}
      const fea=document.createElement('canvas');fea.width=w;fea.height=h;{const fx=fea.getContext('2d'),im=fx.createImageData(w,h),fd=im.data;
        for(let i=0;i<w*h;i++){const t=Math.min(1,dist[i]/FW),sm=t*t*(3-2*t);fd[i*4]=fd[i*4+1]=fd[i*4+2]=255;fd[i*4+3]=Math.round(sm*255);}fx.putImageData(im,0,0);}
      // malha: vértices a cada G px; o peso de cada vértice é a média do peso da mecha em volta dele
      const cols=Math.max(1,Math.ceil(w/G)),rows=Math.max(1,Math.ceil(h/G)),C=cols+1,nv=C*(rows+1);
      const Wv=new Float32Array(nv);
      for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const ux=Math.min(w,i*G),vy=Math.min(h,j*G);
        let sum=0,n=0;const r=Math.ceil(G);for(let y=Math.max(0,Math.floor(vy-r));y<Math.min(h,vy+r);y++)for(let x=Math.max(0,Math.floor(ux-r));x<Math.min(w,ux+r);x++){if(alpha(x,y)>8){sum+=Wd[(y*w+x)*4]/255;n++;}}
        Wv[j*C+i]=n?sum/n:-1;}
      for(let pass=0;pass<6;pass++)for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const k=j*C+i;if(Wv[k]>=0)continue;let s2=0,n=0;
        for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const ii=i+di,jj=j+dj;if(ii<0||jj<0||ii>cols||jj>rows)continue;const qq=Wv[jj*C+ii];if(qq>=0){s2+=qq;n++;}}if(n)Wv[k]=s2/n;}
      for(let k=0;k<nv;k++)if(Wv[k]<0)Wv[k]=0;
      const free=(1-(st.stiffness??.7)*.4);
      const verts=new Float32Array(nv*6);
      for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const k=j*C+i,ux=Math.min(w,i*G),vy=Math.min(h,j*G);
        verts.set([x0+ux,y0+vy,ux/w,vy/h,Math.pow(Wv[k],1.15)*free,Wv[k]],k*6);}
      const idx=[];for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){let any=false;
        for(let y=Math.max(0,Math.floor(j*G)-1);y<Math.min(h,Math.ceil((j+1)*G)+1)&&!any;y++)for(let x=Math.max(0,Math.floor(i*G)-1);x<Math.min(w,Math.ceil((i+1)*G)+1);x++)if(alpha(x,y)>1){any=true;break;}
        if(any){const a=j*C+i;idx.push(a,a+1,a+C+1,a,a+C+1,a+C);}}
      if(nv>65000||!idx.length)continue;
      const rt=st.root?[st.root[0]*s,st.root[1]*s]:[x0+w/2,y0+h],tp=st.tip?[st.tip[0]*s,st.tip[1]*s]:[rt[0],rt[1]-10];
      strands.push({src,fea,verts,idx:new Uint16Array(idx),stiff:st.stiffness??.7,ph:(st.root?st.root[0]*.013+st.root[1]*.007:strands.length),
        root:rt,dir:Math.atan2(tp[1]-rt[1],tp[0]-rt[0])});}
    tc.width=tc.height=0;
    return {base:bc,strands,s,gpu:null};
  }
  function want(e){if(cache.has(e)||wait.has(e))return;const p=ready.then(ok=>ok?build(e):null).then(v=>{wait.delete(e);if(v&&!dead){cache.set(e,v);upload(v);}return v;});wait.set(e,p);}
  /** mantém só as expressões pedidas carregadas (e já na placa de vídeo) */
  function keep(list){for(const e of [...cache.keys()])if(!list.includes(e)){const v=cache.get(e);unload(v);v.base.width=v.base.height=0;for(const s of v.strands){s.src.width=s.src.height=0;s.fea.width=s.fea.height=0;}cache.delete(e);}for(const e of list)want(e);}

  /* ---------- física: um pêndulo com mola por mecha ---------- */
  const PHY=[];let lastT=-1,D={wob:0,gust:0};
  /** uma vez por quadro. d: wx,wy = vetor do vento (tela, y para baixo; tamanho = força, até ~1); wob = balanço (rad); gust = 0..1 */
  function step(t,d){
    const dt=lastT<0?0:Math.min(.05,Math.max(0,t-lastT));lastT=t;D=d;
    const v=[...cache.values()][0];if(!v)return;
    v.strands.forEach((st,i)=>{const ph=PHY[i]||(PHY[i]={a:0,w:0});
      const dx=Math.cos(st.dir),dy=Math.sin(st.dir),soft=1-st.stiff*.35;
      const cr=dx*d.wy-dy*d.wx,dot=dx*d.wx+dy*d.wy,over=Math.max(0,-dot)*.6*Math.max(0,-dy)*Math.max(-1,Math.min(1,d.wx*6));
      const turb=(d.gust||0)*(.35*Math.sin(t*3.1+st.ph*2.1)+.22*Math.sin(t*5.7+st.ph*3.3)+.13*Math.sin(t*8.9+st.ph));
      const target=(cr+over)*1.35*soft+turb*soft;
      const K=26-st.stiff*8,C=2*Math.sqrt(K)*.6;
      if(dt>0){ph.w+=(K*(target-ph.a)-C*ph.w)*dt;ph.a+=ph.w*dt;}
      ph.a=Math.max(-1.8,Math.min(1.8,ph.a));});}
  /** a figura pronta para desenhar? (expressões carregadas e WebGL vivo) */
  const ok=(...es)=>!lost&&es.every(e=>!e||(cache.get(e)&&cache.get(e).gpu));
  /** tamanho do canvas visível: css (VW×VH, o espaço do retrato) × resolução r */
  function resize(vw,vh,r){VW=vw;VH=vh;const W=Math.max(1,Math.round(vw*r)),H=Math.max(1,Math.round(vh*r));if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}}
  /** desenha a figura no canvas visível. layers: [{e,alpha}] na ordem (a anterior inteira, a nova por cima no cruzamento);
      xf: {tx,ty,sx,sy} = como a imagem original (900×1200) vai para o espaço do retrato; light: {gr,gb,pI,px,pr,pb}. */
  function render(t,layers,xf,light){if(!glInit())return false;
    gl.viewport(0,0,cv.width,cv.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(L.uView,VW,VH);gl.uniform2f(L.uViewF,VW,VH);gl.uniform4f(L.uXf,xf.tx,xf.ty,xf.sx,xf.sy);gl.uniform1f(L.uT,t%1000);gl.uniform1f(L.uGust,D.gust||0);
    gl.uniform1f(L.uGr,light.gr||0);gl.uniform1f(L.uGb,light.gb||0);gl.uniform1f(L.uPI,light.pI||0);gl.uniform1f(L.uPx,light.px||200);gl.uniform1f(L.uPr,light.pr||0);gl.uniform1f(L.uPb,light.pb||0);
    for(const ly of layers){const v=cache.get(ly.e);if(!v||!v.gpu)continue;const k=W0()/o.PW;
      gl.uniform1f(L.uK,k);gl.uniform1f(L.uAlpha,ly.alpha);
      mesh(v.gpu.base,{root:[0,0],bend:0,wob:0,ph:0,fea:0});
      v.gpu.strands.forEach((m,i)=>{const st=v.strands[i],ph=PHY[i]||{a:0};
        // o esfumado do corte entra conforme a mecha sai do lugar (parada, a imagem é a oficial)
        const fea=Math.min(1,Math.abs(ph.a)*6+(D.wob||0)*(D.gust||0)*4+(D.wob||0)*1.5);
        mesh(m,{root:m.root,bend:ph.a,wob:(D.wob||0)*(1.2-st.stiff*.5),ph:st.ph,fea});});}
    return true;}
  return {ready,want,keep,step,render,resize,ok,_phy:()=>PHY.map(p=>p.a),has:e=>cache.has(e),
    destroy(){dead=true;keep([]);if(gl){const x=gl.getExtension('WEBGL_lose_context');if(x)x.loseContext();}gl=null;}};
}
