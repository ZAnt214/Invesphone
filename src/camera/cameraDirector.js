/* Camera direction shared by the canvas scenes.
   It owns policy (priority, manual grace period, dead zones and frame-rate
   independent damping), while each scene keeps its own projection and bounds. */

export const CAMERA_PRIORITY={ambient:0,follow:1,manual:2,context:3,critical:4,narrative:5};

export const clamp=(v,a,b)=>a>b?(a+b)/2:v<a?a:v>b?b:v;
export const damp=(from,to,rate,dt)=>from+(to-from)*(1-Math.exp(-Math.max(0,rate)*Math.max(0,dt)));

export function deadZoneTarget(cam,subject,opt={}){
  const w=Math.max(1,opt.viewportW||1),h=Math.max(1,opt.viewportH||1);
  const zx=Math.max(0,opt.zoneX??w*.14),zy=Math.max(0,opt.zoneY??h*.12);
  const aheadX=(opt.dirX||0)*(opt.lookAheadX||0),aheadY=(opt.dirY||0)*(opt.lookAheadY||0);
  const desiredX=subject.x+aheadX+(opt.biasX||0),desiredY=subject.y+aheadY+(opt.biasY||0);
  let x=cam.x,y=cam.y;
  const dx=desiredX-x,dy=desiredY-y;
  if(dx>zx)x=desiredX-zx;else if(dx<-zx)x=desiredX+zx;
  if(dy>zy)y=desiredY-zy;else if(dy<-zy)y=desiredY+zy;
  return {x,y,desiredX,desiredY,zoneX:zx,zoneY:zy};
}

/** Espaço à frente do personagem: um deslocamento suavizado do alvo na direção em que ele anda.
 *  Cresce devagar ao começar a andar, atravessa o zero devagar ao inverter o sentido (nunca "chicoteia") e, ao parar,
 *  mantém uma fração (`rest`) em vez de voltar ao centro: a composição fica estável e a câmera não "procura" o centro.
 *  A zona morta fica pequena (só histerese): o espaço à frente vem daqui, não da zona morta. */
export function createLead({rate=2.1,restRate=1.3,rest=.34,maxSpeed=100}={}){
  let x=0,y=0;
  // além do amortecimento, o deslocamento anda no máximo `maxSpeed` px de mundo por segundo (~a caminhada de Lemos):
  // inverter o sentido leva alguns segundos calmos em vez de uma chicotada
  const step=(v,t,r,dt)=>{const n=damp(v,t,r,dt),m=maxSpeed*dt;return v+Math.max(-m,Math.min(m,n-v));};
  return {
    get x(){return x;},get y(){return y;},
    update(dirX,dirY,moving,dt,maxX,maxY,facing=dirX){
      const f=moving?1:rest,dx=moving?dirX:facing,dy=moving?dirY:0;
      const r=moving?rate:restRate;
      x=step(x,dx*maxX*f,r,dt);y=step(y,dy*maxY*f,r,dt);
      return {x,y};
    },
    reset(){x=0;y=0;}
  };
}

export function createCameraControl({manualHold=2400,reducedMotion=false}={}){
  let manualUntil=0,focus=null,mode='follow',lastPriority=CAMERA_PRIORITY.follow;
  const api={
    beginManual(now=performance.now(),hold=manualHold){
      if(focus&&focus.priority>CAMERA_PRIORITY.manual&&!focus.interruptible)return false;
      manualUntil=now+hold;focus=null;mode='manual';lastPriority=CAMERA_PRIORITY.manual;return true;
    },
    endManual(now=performance.now(),delay=manualHold){manualUntil=Math.max(manualUntil,now+delay);},
    clearManual(){manualUntil=0;if(mode==='manual')mode='follow';},
    isManual(now=performance.now()){return now<manualUntil;},
    focus(req,now=performance.now()){
      if(!req)return false;const priority=req.priority??CAMERA_PRIORITY.context;
      if(now<manualUntil&&priority<CAMERA_PRIORITY.manual)return false;
      if(focus&&focus.priority>priority&&!focus.interruptible)return false;
      focus={...req,priority,start:now,end:now+(reducedMotion?Math.min(160,req.duration||0):(req.duration||900)),holdUntil:now+(req.hold||0)};
      manualUntil=0;mode=req.mode||'context';lastPriority=priority;return true;
    },
    cancelFocus(id){if(!focus||(id&&focus.id!==id))return;focus=null;if(performance.now()<manualUntil){mode='manual';lastPriority=CAMERA_PRIORITY.manual;}else{mode='follow';lastPriority=CAMERA_PRIORITY.follow;}},
    resolve(now=performance.now()){
      if(focus){if(now<=Math.max(focus.end,focus.holdUntil))return {mode,priority:lastPriority,focus};focus=null;mode='follow';lastPriority=CAMERA_PRIORITY.follow;}
      if(now<manualUntil)return {mode:'manual',priority:CAMERA_PRIORITY.manual,focus:null};
      mode='follow';lastPriority=CAMERA_PRIORITY.follow;return {mode,priority:lastPriority,focus:null};
    },
    get debug(){return {mode,priority:lastPriority,manualMs:Math.max(0,manualUntil-performance.now()),focus};}
  };
  return api;
}

export function drawCameraDebug(ctx,info){
  if(!info)return;const dpr=info.dpr||1,w=info.width,h=info.height;
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;
  if(info.deadZone){const z=info.deadZone;ctx.strokeStyle='rgba(72,220,255,.9)';ctx.lineWidth=Math.max(1,dpr);ctx.setLineDash([5*dpr,4*dpr]);ctx.strokeRect(z.x*dpr,z.y*dpr,z.w*dpr,z.h*dpr);ctx.setLineDash([]);}
  if(info.target){ctx.fillStyle='#ffcf33';ctx.beginPath();ctx.arc(info.target.x*dpr,info.target.y*dpr,4*dpr,0,Math.PI*2);ctx.fill();}
  const lines=info.lines||[];if(lines.length){const fs=11*dpr,pad=7*dpr,bw=Math.min(w-12*dpr,270*dpr),bh=(lines.length*14+12)*dpr;ctx.fillStyle='rgba(5,9,13,.82)';ctx.fillRect(6*dpr,6*dpr,bw,bh);ctx.fillStyle='#dff7ff';ctx.font=`${fs}px ui-monospace,monospace`;for(let i=0;i<lines.length;i++)ctx.fillText(lines[i],6*dpr+pad,6*dpr+pad+fs+i*14*dpr);}
  ctx.restore();
}
