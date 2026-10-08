// Pós-processamento da base em WebGL, por cima do pixel art (estilo HD-2D):
// brilho das luzes (bloom), profundidade de campo tilt-shift focada em Lemos,
// tratamento de cor cinematográfico, vinheta, aberração leve nas bordas e dither.
// Sem WebGL, devolve null e o canvas 2D continua aparecendo como antes.

const VS = `attribute vec2 p;varying vec2 uv;void main(){uv=p*0.5+0.5;gl_Position=vec4(p,0.0,1.0);}`;

const FS = {
  // reduz pela metade com média de 4 amostras
  down: `precision highp float;varying vec2 uv;uniform sampler2D t;uniform vec2 px;
void main(){vec4 c=texture2D(t,uv+px*vec2(-.5,-.5))+texture2D(t,uv+px*vec2(.5,-.5))+texture2D(t,uv+px*vec2(-.5,.5))+texture2D(t,uv+px*vec2(.5,.5));gl_FragColor=c*.25;}`,
  // separa o que brilha (luzes, telas, sol forte) com joelho suave
  bright: `precision highp float;varying vec2 uv;uniform sampler2D t;uniform vec2 px;uniform float th;
vec3 s(vec2 o){return texture2D(t,uv+px*o).rgb;}
void main(){vec3 c=(s(vec2(-1.,-1.))+s(vec2(1.,-1.))+s(vec2(-1.,1.))+s(vec2(1.,1.)))*.25;
float m=max(c.r,max(c.g,c.b)),k=.18,x=clamp(m-th+k,0.,2.*k);x=x*x/(4.*k+1e-4);float w=max(x,m-th)/max(m,1e-4);
float sat=m-min(c.r,min(c.g,c.b));gl_FragColor=vec4(c*w*(1.+sat*1.2),1.);}`,
  // desfoque gaussiano separável (9 amostras em 5 leituras lineares)
  blur: `precision highp float;varying vec2 uv;uniform sampler2D t;uniform vec2 dir;
void main(){vec4 c=texture2D(t,uv)*.2270270270;
c+=(texture2D(t,uv+dir*1.3846153846)+texture2D(t,uv-dir*1.3846153846))*.3162162162;
c+=(texture2D(t,uv+dir*3.2307692308)+texture2D(t,uv-dir*3.2307692308))*.0702702703;gl_FragColor=c;}`,
  final: `precision highp float;varying vec2 uv;
uniform sampler2D sc,dof,b1,b2;uniform vec2 px,res,sres,sub;uniform float k;uniform vec3 tint;uniform float fy,band,dofk,bloom,t,warm,ca,vig;
float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
// ampliação nítida para pixel art: cada texel vira um bloco liso com só 1 px de transição
vec3 S(vec2 p){vec2 t=p*sres+vec2(-sub.x,sub.y);return texture2D(sc,(floor(t)+.5+clamp((fract(t)-.5)*k,-.5,.5))/sres).rgb;}
void main(){
  vec2 d=uv-.5;float r2=dot(d*vec2(res.x/res.y,1.),d*vec2(res.x/res.y,1.));
  vec3 c;
  c=S(uv);if(ca>0.&&r2>.12){vec2 o=d*ca*r2*px*60.;c.r=S(uv+o).r;c.b=S(uv-o).b;}
  // tilt-shift: foco numa faixa em volta de Lemos, desfoca em cima e embaixo
  float dz=abs(uv.y-fy),w=smoothstep(band,band+.32,dz)*dofk;
  c=mix(c,texture2D(dof,uv).rgb,w);
  // bloom em duas larguras
  vec3 bl=texture2D(b1,uv).rgb*.65+texture2D(b2,uv).rgb*.9;
  c+=bl*bloom;
  // névoa luminosa leve nas áreas desfocadas
  c=mix(c,c+vec3(.025,.03,.04),w*.6);
  c*=tint;
  // tom: curva suave em S e tons divididos (sombras frias, luzes quentes)
  float l=dot(c,vec3(.2126,.7152,.0722));
  c=mix(c,c*c*(3.-2.*c),.22);
  c+=(1.-l)*(1.-l)*vec3(-.012,.004,.03);
  c+=l*l*vec3(.035,.016,-.012)*warm;
  c=mix(vec3(l),c,1.12);
  // vinheta
  c*=1.-smoothstep(.18,1.05,r2)*vig;
  c+=(h(uv*res+t)-.5)/255.;
  gl_FragColor=vec4(clamp(c,0.,1.),1.);
}`,
};

export function createPost(src) {
  const cv = document.createElement('canvas');
  cv.id = 'glv';
  cv.setAttribute('aria-hidden', 'true');
  const opts = { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' };
  const gl = cv.getContext('webgl', opts) || cv.getContext('experimental-webgl', opts);
  if (!gl) return null;

  const sh = (type, s) => { const o = gl.createShader(type); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
  const vs = sh(gl.VERTEX_SHADER, VS);
  const prog = {};
  try {
    for (const k in FS) {
      const p = gl.createProgram(); gl.attachShader(p, vs); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS[k])); gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) { const a = gl.getActiveUniform(p, i); u[a.name] = gl.getUniformLocation(p, a.name); }
      prog[k] = { p, u };
    }
  } catch (e) { console.warn('post: sem shaders', e); return null; }

  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  const tex = (w, h) => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (w) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); return t; };
  const fbo = (w, h) => { const t = tex(w, h), f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); return { t, f, w, h }; };

  const scene = tex();
  let W = 0, H = 0, OW = 0, OH = 0, T = {};
  const alloc = () => {
    for (const k in T) { gl.deleteTexture(T[k].t); gl.deleteFramebuffer(T[k].f); }
    const d = (n) => [Math.max(1, Math.round(W / n)), Math.max(1, Math.round(H / n))];
    // a resolução das camadas de efeito não passa de ~640 px de largura: barato no celular
    const base = Math.max(2, Math.ceil(W / 640));
    T = { h1: fbo(...d(base)), h2: fbo(...d(base)), q1: fbo(...d(base * 2)), q2: fbo(...d(base * 2)), e1: fbo(...d(base * 4)), e2: fbo(...d(base * 4)) };
  };

  const run = (k, out, setup) => { const P = prog[k]; gl.useProgram(P.p);
    if (out) { gl.bindFramebuffer(gl.FRAMEBUFFER, out.f); gl.viewport(0, 0, out.w, out.h); } else { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, OW, OH); }
    setup(P.u); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); };
  const bind = (unit, t, loc) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(loc, unit); };
  const blur2 = (a, b, spread) => {
    run('blur', b, (u) => { bind(0, a.t, u.t); gl.uniform2f(u.dir, spread / a.w, 0); });
    run('blur', a, (u) => { bind(0, b.t, u.t); gl.uniform2f(u.dir, 0, spread / b.h); });
  };

  let lost = false;
  cv.addEventListener('webglcontextlost', (e) => { e.preventDefault(); lost = true; post.onlost && post.onlost(); });

  const post = {
    canvas: cv,
    get ok() { return !lost; },
    // fy: altura do foco (0 = topo da tela, 1 = base); o resto são intensidades
    render(o) {
      if (lost) return;
      if (o.outW !== OW || o.outH !== OH) { OW = cv.width = o.outW; OH = cv.height = o.outH; }
      const fresh = src.width !== W || src.height !== H;
      if (fresh) { W = src.width; H = src.height; alloc(); }
      // a cena é ligada depois de alocar as camadas (alloc mexe na textura ativa)
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, scene);
      if (fresh) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      else gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, src);
      // camada desfocada para a profundidade de campo
      run('down', T.h1, (u) => { bind(0, scene, u.t); gl.uniform2f(u.px, 1 / W, 1 / H); });
      blur2(T.h1, T.h2, 1.6);
      // camadas de brilho
      run('bright', T.q1, (u) => { bind(0, scene, u.t); gl.uniform2f(u.px, 1 / W, 1 / H); gl.uniform1f(u.th, o.th); });
      blur2(T.q1, T.q2, 1.2);
      run('down', T.e1, (u) => { bind(0, T.q1.t, u.t); gl.uniform2f(u.px, 1 / T.q1.w, 1 / T.q1.h); });
      blur2(T.e1, T.e2, 1.5); blur2(T.e1, T.e2, 2.5);
      run('final', null, (u) => {
        bind(0, scene, u.sc); bind(1, T.h1.t, u.dof); bind(2, T.q1.t, u.b1); bind(3, T.e1.t, u.b2);
        gl.uniform2f(u.px, 1 / OW, 1 / OH); gl.uniform2f(u.res, OW, OH); gl.uniform2f(u.sres, W, H); gl.uniform2f(u.sub, o.sub ? o.sub[0] : 0, o.sub ? o.sub[1] : 0); gl.uniform1f(u.k, OW / W);
        gl.uniform1f(u.fy, 1 - o.fy); gl.uniform1f(u.band, o.band); gl.uniform1f(u.dofk, o.dof);
        gl.uniform1f(u.bloom, o.bloom); gl.uniform1f(u.t, o.t % 97); gl.uniform1f(u.warm, o.warm); gl.uniform1f(u.ca, o.ca); gl.uniform1f(u.vig, o.vig); gl.uniform3f(u.tint, o.tint[0], o.tint[1], o.tint[2]);
      });
    },
  };
  return post;
}
