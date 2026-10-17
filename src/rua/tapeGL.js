/* Fita de isolamento do depoimento na rua desenhada pela placa de vídeo (WebGL).
   No iPhone, o canvas 2D é desenhado pela CPU, e a fita era a parte mais cara de cada quadro: cada trecho é feito de dezenas
   de fatias da textura impressa, cada uma inclinada e recortada pelo contorno da fita. Aqui a fita inteira (os dois trechos,
   as voltas dos nós e as pontas soltas) vira uma malha de triângulos desenhada de uma vez, com a mesma textura, a mesma
   sombra contínua ao longo do comprimento, a mesma luz da cena (giroflex, viatura passando, holofote) e o mesmo recorte.
   O canvas fica logo abaixo do canvas 2D da fita (onde a garoa do meio continua), na mesma camada e na mesma resolução.
   Sem WebGL, ou se o contexto cair, ok() fica falso e a fita volta a ser desenhada no 2D, como antes. */

const VS=`attribute vec2 aPos;attribute vec2 aUV;attribute vec4 aCol;attribute float aMode;
uniform vec2 uView;varying vec2 vUV;varying vec4 vCol;varying float vMode;varying vec2 vP;
void main(){vUV=aUV;vCol=aCol;vMode=aMode;vP=aPos;vec2 p=aPos/uView*2.0-1.0;gl_Position=vec4(p.x,-p.y,0.0,1.0);}`;
const FS=`#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uTex;uniform vec2 uViewF;uniform vec4 uGrad;uniform vec4 uPs;uniform vec4 uHs;
varying vec2 vUV;varying vec4 vCol;varying float vMode;varying vec2 vP;
void main(){
  if(vMode>.5){gl_FragColor=vec4(vCol.rgb*vCol.a,vCol.a);return;}            /* voltas do nó: cor lisa */
  vec3 c=texture2D(uTex,vUV).rgb;
  c=mix(c,vec3(6.,5.,2.)/255.,vCol.a);                                         /* sombra contínua (onde a fita fica de lado) */
  c+=uGrad.rgb*uGrad.a*clamp(1.0-vP.x/(uViewF.x*.5),0.0,1.0);                 /* giroflex, vindo da esquerda */
  if(uPs.w>0.0)c+=vec3(255.,240.,215.)/255.*uPs.w*clamp(1.0-distance(vP,uPs.xy)/uPs.z,0.0,1.0);   /* viatura passando */
  if(uHs.w>0.0)c+=vec3(235.,243.,255.)/255.*uHs.w*clamp(1.0-distance(vP,uHs.xy)/uHs.z,0.0,1.0);   /* holofote */
  gl_FragColor=vec4(min(c,1.0),1.0);}`;

/** o: {canvas, front, back, TW, TH, TS, W, H} — front/back: as texturas impressas (canvas TW*TS × TH*TS) */
export function createTapeGL(o){
  const cv=o.canvas;let gl=null,prog=null,L=null,tex=null,vb=null,lost=false,ATH=1;
  const F=9;let buf=new Float32Array(F*1200),n=0;      // x,y,u,v,r,g,b,a,mode por vértice
  function init(){
    if(gl||lost)return !!gl;
    cv.addEventListener('webglcontextlost',ev=>{ev.preventDefault();lost=true;gl=null;},false);
    try{gl=cv.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:true,depth:false,stencil:false,preserveDrawingBuffer:false,powerPreference:'low-power'});}catch(_){gl=null;}
    if(!gl){lost=true;return false;}
    const sh=(t,s)=>{const x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);return x;};
    prog=gl.createProgram();gl.attachShader(prog,sh(gl.VERTEX_SHADER,VS));gl.attachShader(prog,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(prog);
    if(!gl.getProgramParameter(prog,gl.LINK_STATUS)){try{console.warn('fita: sombreador',gl.getProgramInfoLog(prog));}catch(_){/* sem log */}gl=null;lost=true;return false;}
    gl.useProgram(prog);L={};
    for(const k of ['aPos','aUV','aCol','aMode'])L[k]=gl.getAttribLocation(prog,k);
    for(const k of ['uView','uViewF','uTex','uGrad','uPs','uHs'])L[k]=gl.getUniformLocation(prog,k);
    /* frente em cima, verso embaixo, numa textura só (a escolha é por fatia, como no 2D) */
    const at=document.createElement('canvas');at.width=o.front.width;at.height=o.front.height*2;ATH=at.height;
    const ax=at.getContext('2d');ax.drawImage(o.front,0,0);ax.drawImage(o.back,0,o.front.height);
    tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,at);
    vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);
    const st=F*4;
    gl.enableVertexAttribArray(L.aPos);gl.vertexAttribPointer(L.aPos,2,gl.FLOAT,false,st,0);
    gl.enableVertexAttribArray(L.aUV);gl.vertexAttribPointer(L.aUV,2,gl.FLOAT,false,st,8);
    gl.enableVertexAttribArray(L.aCol);gl.vertexAttribPointer(L.aCol,4,gl.FLOAT,false,st,16);
    gl.enableVertexAttribArray(L.aMode);gl.vertexAttribPointer(L.aMode,1,gl.FLOAT,false,st,32);
    gl.uniform1i(L.uTex,0);gl.uniform2f(L.uView,o.W,o.H);gl.uniform2f(L.uViewF,o.W,o.H);
    gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    return true;
  }
  function v(x,y,u,w,r,g,b,a,m){if(n*F+F>buf.length){const nb=new Float32Array(buf.length*2);nb.set(buf);buf=nb;}const i=n*F;buf[i]=x;buf[i+1]=y;buf[i+2]=u;buf[i+3]=w;buf[i+4]=r;buf[i+5]=g;buf[i+6]=b;buf[i+7]=a;buf[i+8]=m;n++;}
  /* v da textura: meia linha para dentro em cada metade (a frente não vaza no verso ao filtrar) */
  const vRow=(back,t)=>{const h=ATH/2;return (back*h+.5+t*(h-1))/ATH;};
  return {
    ok:()=>!lost&&init(),
    /** novo quadro */
    begin(){n=0;},
    /** um trecho: P = [[x,y,torção],…] (a mesma conta do 2D), s0 = onde começa a impressão */
    strip(P,s0){
      const N=P.length;if(N<2)return;const E=new Array(N),TH=o.TH,TWu=o.TW;
      for(let i=0;i<N;i++){const a=P[Math.max(0,i-1)],b=P[Math.min(N-1,i+1)];let tx=b[0]-a[0],ty=b[1]-a[1];const l=Math.hypot(tx,ty)||1;tx/=l;ty/=l;
        const cs=Math.cos(P[i][2]),hw=TH/2*Math.max(.12,Math.abs(cs))*(cs<0?-1:1);E[i]=[-ty*hw,tx*hw,cs,.62-.5*Math.abs(cs)];}
      let s=s0||0;
      for(let i=0;i<N-1;i++){const p=P[i],q=P[i+1],L2=Math.hypot(q[0]-p[0],q[1]-p[1]);if(L2<.01)continue;
        const e=E[i],f=E[i+1],back=(e[2]+f[2])/2<0?1:0,u0=(s%(TWu-60))/TWu,u1=u0+L2/TWu,v0=vRow(back,0),v1=vRow(back,1);
        /* borda "−normal" = linha de cima da textura, como as fatias do 2D */
        const ax=p[0]-e[0],ay=p[1]-e[1],bx=p[0]+e[0],by=p[1]+e[1],cx=q[0]-f[0],cy=q[1]-f[1],dx=q[0]+f[0],dy=q[1]+f[1];
        v(ax,ay,u0,v0,0,0,0,e[3],0);v(cx,cy,u1,v0,0,0,0,f[3],0);v(bx,by,u0,v1,0,0,0,e[3],0);
        v(bx,by,u0,v1,0,0,0,e[3],0);v(cx,cy,u1,v0,0,0,0,f[3],0);v(dx,dy,u1,v1,0,0,0,f[3],0);
        s+=L2;}
    },
    /** retângulo de cor lisa (as voltas do nó); rot: giro em volta de (cx,cy) */
    rect(x,y,w,h,rgba,rot,cx,cy){const [r,g,b,a]=rgba;let P=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
      if(rot){const c=Math.cos(rot),s=Math.sin(rot);P=P.map(([px,py])=>[cx+px*c-py*s,cy+px*s+py*c]);}
      const q=k=>v(P[k][0],P[k][1],0,0,r,g,b,a,1);q(0);q(1);q(2);q(0);q(2);q(3);},
    /** desenha o quadro. light: {grad:[r,g,b,a] (0..1), ps:[x,y,raio,força]|null, hs:[x,y,raio,força]|null} */
    end(light){
      if(!init())return false;
      gl.viewport(0,0,cv.width,cv.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
      const G=light.grad||[0,0,0,0],P=light.ps||[0,0,1,0],H=light.hs||[0,0,1,0];
      gl.uniform4f(L.uGrad,G[0],G[1],G[2],G[3]);gl.uniform4f(L.uPs,P[0],P[1],P[2],P[3]);gl.uniform4f(L.uHs,H[0],H[1],H[2],H[3]);
      gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,buf.subarray(0,n*F),gl.DYNAMIC_DRAW);
      gl.drawArrays(gl.TRIANGLES,0,n);
      return true;
    },
    resize(w,h){if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;}},
    destroy(){if(gl){const x=gl.getExtension('WEBGL_lose_context');if(x)x.loseContext();}gl=null;lost=true;}
  };
}
