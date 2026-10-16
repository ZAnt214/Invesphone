/* Cabelo ao vento (docs/DEPOIMENTO_NA_RUA.md, "Cabelo ao vento").
   As camadas do ChatGPT (public/characters/<id>/hair/): por expressão, uma base com o cabelo solto removido e as mechas,
   cada uma com um mapa de peso (vermelho: 0 na raiz, presa, até 1 na ponta, que mexe mais).
   Nada é redesenhado: a imagem oficial se recompõe em repouso (base + mechas = retrato).

   Como a mecha dobra: cada mecha vira uma malha fina (grade de ~6 px da imagem original) presa pelo mapa de peso.
   A deformação roda na placa de vídeo (WebGL), num canvas pequeno só do retrato: a cada quadro cada vértice anda
   conforme o peso dele (raiz parada, ponta solta, curva mais forte perto da ponta), com ondas lentas que correm da raiz
   para a ponta e, na rajada do helicóptero, um tremor por cima. É uma deformação contínua de verdade: sem fantasma,
   sem emenda, e custa quase nada mesmo com a malha fina. O resultado entra no canvas do retrato com um drawImage.
   Sem WebGL, ou se o contexto cair, draw() devolve false e o jogo mostra o retrato oficial parado.

   Memória (iPhone): só a expressão em uso (e a anterior, durante a troca) fica carregada; cada mecha é guardada
   recortada na caixa que ocupa, na escala do retrato no jogo. */
const GRID=6;   // célula da malha, em px da imagem original
const loadImg=src=>new Promise(r=>{const i=new Image();i.decoding='async';i.onload=()=>r(i);i.onerror=()=>r(null);i.src=src});

const VS=`attribute vec2 aPos;attribute vec2 aUV;attribute float aW;attribute float aR;
uniform vec2 uRes;uniform float uLean,uFlut,uGust,uT,uPh;varying vec2 vUV;
void main(){
  float wave=sin(uT*2.2-aR*2.4+uPh)*.68+sin(uT*3.9-aR*3.3+uPh*1.7)*.32+uGust*.55*sin(uT*8.2-aR*4.5+uPh*2.3);
  float dx=(uLean+uFlut*wave)*aW;
  float dy=-dx*.12+uFlut*.18*aW*sin(uT*2.9-aR*2.0+uPh);
  vec2 p=(aPos+vec2(dx,dy))/uRes*2.0-1.0;
  gl_Position=vec4(p.x,-p.y,0.0,1.0);vUV=aUV;}`;
const FS=`precision mediump float;uniform sampler2D uTex;varying vec2 vUV;void main(){gl_FragColor=texture2D(uTex,vUV);}`;

/** o.url: manifest.json; o.PW,o.PH: tamanho em que o retrato é guardado (a escala do jogo); o.mask: máscara da figura (Image) */
export function createHair(o){
  let M=null,dead=false;const cache=new Map(),wait=new Map();
  const base=o.url.replace(/manifest\.json$/,'');
  const ready=fetch(o.url).then(r=>r.ok?r.json():null).then(j=>{M=j&&j.expressions?j:null;return !!M}).catch(()=>false);
  const W0=()=>(M&&M.resolution&&M.resolution.width)||900;

  /* ---------- WebGL: um canvas do tamanho do retrato guardado ---------- */
  let cv=null,gl=null,prog=null,L=null,lost=false;
  function glInit(){
    if(gl||lost)return !!gl;
    cv=document.createElement('canvas');cv.width=o.PW;cv.height=o.PH;
    cv.addEventListener('webglcontextlost',ev=>{ev.preventDefault();lost=true;gl=null;},false);
    try{gl=cv.getContext('webgl',{premultipliedAlpha:true,alpha:true,antialias:true,preserveDrawingBuffer:false});}catch(_){gl=null;}
    if(!gl){lost=true;return false;}
    const sh=(t,s)=>{const x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);return x;};
    prog=gl.createProgram();gl.attachShader(prog,sh(gl.VERTEX_SHADER,VS));gl.attachShader(prog,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(prog);
    if(!gl.getProgramParameter(prog,gl.LINK_STATUS)){gl=null;lost=true;return false;}
    gl.useProgram(prog);
    L={aPos:gl.getAttribLocation(prog,'aPos'),aUV:gl.getAttribLocation(prog,'aUV'),aW:gl.getAttribLocation(prog,'aW'),aR:gl.getAttribLocation(prog,'aR'),
      uRes:gl.getUniformLocation(prog,'uRes'),uLean:gl.getUniformLocation(prog,'uLean'),uFlut:gl.getUniformLocation(prog,'uFlut'),
      uGust:gl.getUniformLocation(prog,'uGust'),uT:gl.getUniformLocation(prog,'uT'),uPh:gl.getUniformLocation(prog,'uPh'),uTex:gl.getUniformLocation(prog,'uTex')};
    gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
    gl.viewport(0,0,o.PW,o.PH);gl.uniform2f(L.uRes,o.PW,o.PH);gl.uniform1i(L.uTex,0);
    return true;
  }
  function tex(img){const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);return t;}
  function buf(data,isIdx){const b=gl.createBuffer();const T=isIdx?gl.ELEMENT_ARRAY_BUFFER:gl.ARRAY_BUFFER;gl.bindBuffer(T,b);gl.bufferData(T,data,gl.STATIC_DRAW);return b;}
  /* sobe para a placa de vídeo o que a expressão precisa (uma vez) */
  function upload(v){if(v.gpu)return true;if(!glInit())return false;
    const quad=(x,y,w,h)=>({vb:buf(new Float32Array([x,y,0,0,0,0, x+w,y,1,0,0,0, x,y+h,0,1,0,0, x+w,y+h,1,1,0,0])),ib:buf(new Uint16Array([0,1,2,2,1,3]),true),n:6});
    v.gpu={base:{t:tex(v.base),...quad(0,0,o.PW,o.PH)},strands:v.strands.map(s=>({t:tex(s.src),vb:buf(s.verts),ib:buf(s.idx,true),n:s.idx.length,stiff:s.stiff,ph:s.ph}))};
    return true;}
  function unload(v){if(!v.gpu||!gl){v.gpu=null;return;}for(const m of [v.gpu.base,...v.gpu.strands]){gl.deleteTexture(m.t);gl.deleteBuffer(m.vb);gl.deleteBuffer(m.ib);}v.gpu=null;}
  function mesh(m,u){gl.bindTexture(gl.TEXTURE_2D,m.t);gl.bindBuffer(gl.ARRAY_BUFFER,m.vb);
    gl.enableVertexAttribArray(L.aPos);gl.vertexAttribPointer(L.aPos,2,gl.FLOAT,false,24,0);
    gl.enableVertexAttribArray(L.aUV);gl.vertexAttribPointer(L.aUV,2,gl.FLOAT,false,24,8);
    gl.enableVertexAttribArray(L.aW);gl.vertexAttribPointer(L.aW,1,gl.FLOAT,false,24,16);
    gl.enableVertexAttribArray(L.aR);gl.vertexAttribPointer(L.aR,1,gl.FLOAT,false,24,20);
    gl.uniform1f(L.uLean,u.lean);gl.uniform1f(L.uFlut,u.flut);gl.uniform1f(L.uPh,u.ph);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,m.ib);gl.drawElements(gl.TRIANGLES,m.n,gl.UNSIGNED_SHORT,0);}

  async function build(e){
    if(!M||!M.expressions[e])return null;const E=M.expressions[e],s=o.PW/W0();
    const [bimg,...rest]=await Promise.all([loadImg(base+E.base),...E.strands.flatMap(st=>[loadImg(base+st.file),loadImg(base+st.weight)])]);
    if(dead||!bimg)return null;
    // base sem as mechas, recortada pela máscara da figura (como o retrato oficial)
    const bc=document.createElement('canvas');bc.width=o.PW;bc.height=o.PH;const bx=bc.getContext('2d');bx.drawImage(bimg,0,0,o.PW,o.PH);
    if(o.mask){bx.globalCompositeOperation='destination-in';bx.drawImage(o.mask,0,0,o.PW,o.PH);bx.globalCompositeOperation='source-over';}
    const strands=[];const tc=document.createElement('canvas');tc.width=o.PW;tc.height=o.PH;const tx=tc.getContext('2d',{willReadFrequently:true});
    const order=E.strands.map((st,i)=>({st,img:rest[i*2],wt:rest[i*2+1]})).sort((a,b)=>(a.st.zIndex||0)-(b.st.zIndex||0));
    const G=Math.max(2.5,GRID*s);
    for(const {st,img,wt} of order){if(!img||!wt)continue;
      tx.clearRect(0,0,o.PW,o.PH);tx.drawImage(img,0,0,o.PW,o.PH);const A=tx.getImageData(0,0,o.PW,o.PH).data;
      let x0=o.PW,y0=o.PH,x1=-1,y1=-1;for(let y=0;y<o.PH;y++)for(let x=0;x<o.PW;x++){if(A[(y*o.PW+x)*4+3]>2){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}}
      if(x1<0)continue;x0=Math.max(0,x0-2);y0=Math.max(0,y0-2);x1=Math.min(o.PW-1,x1+2);y1=Math.min(o.PH-1,y1+2);const w=x1-x0+1,h=y1-y0+1;
      const src=document.createElement('canvas');src.width=w;src.height=h;src.getContext('2d').drawImage(tc,x0,y0,w,h,0,0,w,h);
      tx.clearRect(0,0,o.PW,o.PH);tx.drawImage(wt,0,0,o.PW,o.PH);const Wd=tx.getImageData(x0,y0,w,h).data;
      const alpha=(x,y)=>A[((y0+y)*o.PW+x0+x)*4+3];
      // malha: vértices a cada G px; o peso de cada vértice é a média do peso da mecha em volta dele
      const cols=Math.max(1,Math.ceil(w/G)),rows=Math.max(1,Math.ceil(h/G)),C=cols+1,nv=C*(rows+1);
      const Wv=new Float32Array(nv);
      for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const ux=Math.min(w,i*G),vy=Math.min(h,j*G);
        let sum=0,n=0;const r=Math.ceil(G);for(let y=Math.max(0,Math.floor(vy-r));y<Math.min(h,vy+r);y++)for(let x=Math.max(0,Math.floor(ux-r));x<Math.min(w,ux+r);x++){if(alpha(x,y)>8){sum+=Wd[(y*w+x)*4]/255;n++;}}
        Wv[j*C+i]=n?sum/n:-1;}
      // vértice sem mecha por perto: herda dos vizinhos (algumas passadas)
      for(let pass=0;pass<6;pass++)for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const k=j*C+i;if(Wv[k]>=0)continue;let s2=0,n=0;
        for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const ii=i+di,jj=j+dj;if(ii<0||jj<0||ii>cols||jj>rows)continue;const q=Wv[jj*C+ii];if(q>=0){s2+=q;n++;}}if(n)Wv[k]=s2/n;}
      for(let k=0;k<nv;k++)if(Wv[k]<0)Wv[k]=0;
      const free=(1-(st.stiffness??.7)*.55);
      const verts=new Float32Array(nv*6);
      for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const k=j*C+i,ux=Math.min(w,i*G),vy=Math.min(h,j*G);
        // a ponta dobra mais que o meio; a rigidez da mecha entra no peso
        verts.set([x0+ux,y0+vy,ux/w,vy/h,Math.pow(Wv[k],1.35)*free,Wv[k]],k*6);}
      const idx=[];for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){let any=false;
        for(let y=Math.max(0,Math.floor(j*G)-1);y<Math.min(h,Math.ceil((j+1)*G)+1)&&!any;y++)for(let x=Math.max(0,Math.floor(i*G)-1);x<Math.min(w,Math.ceil((i+1)*G)+1);x++)if(alpha(x,y)>1){any=true;break;}
        if(any){const a=j*C+i;idx.push(a,a+1,a+C+1,a,a+C+1,a+C);}}
      if(nv>65000||!idx.length)continue;
      strands.push({src,verts,idx:new Uint16Array(idx),stiff:st.stiffness??.7,ph:(st.root?st.root[0]*.013+st.root[1]*.007:strands.length)});}
    tc.width=tc.height=0;
    return {base:bc,strands,s,gpu:null};
  }
  function want(e){if(cache.has(e)||wait.has(e))return;const p=ready.then(ok=>ok?build(e):null).then(v=>{wait.delete(e);if(v&&!dead)cache.set(e,v);return v;});wait.set(e,p);}
  /** mantém só as expressões pedidas carregadas */
  function keep(list){for(const e of [...cache.keys()])if(!list.includes(e)){const v=cache.get(e);unload(v);v.base.width=v.base.height=0;for(const s of v.strands)s.src.width=s.src.height=0;cache.delete(e);}for(const e of list)want(e);}
  /** desenha a expressão e com as mechas ao vento. c já está nas coordenadas do retrato original (900×1200).
      d (px da imagem original): lean = quanto o vento empurra; flutter = amplitude do balanço; gust = 0..1 da rajada.
      Devolve false se a expressão ainda não carregou ou não há WebGL (aí vale o retrato oficial). */
  function draw(c,e,t,d){const v=cache.get(e);if(!v||lost)return false;if(!upload(v))return false;
    const s=v.s,k=W0()/o.PW;
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(L.uT,t%1000);gl.uniform1f(L.uGust,d.gust||0);
    mesh(v.gpu.base,{lean:0,flut:0,ph:0});
    for(const m of v.gpu.strands)mesh(m,{lean:d.lean*s,flut:d.flutter*s*(1.25-m.stiff*.5),ph:m.ph});
    c.drawImage(cv,0,0,o.PW*k,o.PH*k);
    return true;}
  return {ready,want,keep,draw,has:e=>cache.has(e),destroy(){dead=true;keep([]);if(gl){const x=gl.getExtension('WEBGL_lose_context');if(x)x.loseContext();}gl=null;}};
}
