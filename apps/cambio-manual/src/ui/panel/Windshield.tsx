import React from 'react';
import { sim } from '../../core/sim';
import { useFrame } from '../hooks';

interface Drop { x: number; y: number; r: number }

/**
 * Vista do para-brisa: estrada, faróis, chuva, limpadores e embaçamento.
 * vx: posição horizontal (fração da largura) do ponto de fuga — à frente do motorista.
 * O volante curva a estrada (efeito visual proporcional à velocidade).
 */
export function Windshield({ vx = 0.5 }: { vx?: number }) {
  const cv = React.useRef<HTMLCanvasElement | null>(null);
  const st = React.useRef({ drops: [] as Drop[], road: 0, posts: 0, lastWiper: 0, w: 0, h: 0, bend: 0, pan: 0 });
  const vxRef = React.useRef(vx);
  vxRef.current = vx;

  useFrame(() => {
    const canvas = cv.current;
    if (!canvas) return;
    const s = st.current;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    if (w !== s.w || h !== s.h) { s.w = w; s.h = h; canvas.width = w * dpr; canvas.height = h * dpr; }
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const v = sim.veh, c = sim.car;
    const night = v.night;
    const dt = 1 / 60;
    // volante → curva aparente da estrada e giro do horizonte
    const spd = Math.min(1, Math.abs(c.kmh) / 25);
    const target = Math.max(-1.6, Math.min(1.6, (sim.steer / 360) * spd));
    s.bend += (target - s.bend) * (1 - Math.exp(-dt * 2.5));
    s.pan = (s.pan + s.bend * Math.abs(c.v) * dt * 4) % 10000;
    const X0 = vxRef.current * w;
    const hy = h * 0.42;
    const cx = (z: number) => X0 - s.bend * w * 0.42 * (1 - z) * (1 - z);
    const hw = (z: number) => w * (0.012 + 0.36 * z);
    const yz = (z: number) => hy + (h - hy) * z;

    // céu
    const sky = ctx.createLinearGradient(0, 0, 0, hy);
    if (night) { sky.addColorStop(0, '#04060a'); sky.addColorStop(1, '#0b1118'); }
    else { sky.addColorStop(0, v.rain ? '#6f7c87' : '#7aa0c4'); sky.addColorStop(1, v.rain ? '#9aa5ad' : '#cfdbe3'); }
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    // relevo (desliza com a curva)
    ctx.fillStyle = night ? '#06080a' : v.rain ? '#59646b' : '#6d8466';
    ctx.beginPath(); ctx.moveTo(0, hy);
    for (let x = 0; x <= w; x += 20) { const xx = x + s.pan * 6; ctx.lineTo(x, hy - 6 - 6 * Math.sin(xx / 70) - 3 * Math.sin(xx / 23)); }
    ctx.lineTo(w, hy); ctx.closePath(); ctx.fill();
    // campo
    const field = ctx.createLinearGradient(0, hy, 0, h);
    field.addColorStop(0, night ? '#07090b' : v.rain ? '#4d5459' : '#66765c');
    field.addColorStop(1, night ? '#030405' : v.rain ? '#3c4246' : '#4f5d47');
    ctx.fillStyle = field; ctx.fillRect(0, hy, w, h - hy);
    // estrada
    ctx.fillStyle = night ? '#0e1114' : v.rain ? '#30353a' : '#3a3f44';
    ctx.beginPath();
    for (let i = 0; i <= 20; i++) { const z = i / 20; ctx.lineTo(cx(z) - hw(z), yz(z)); }
    for (let i = 20; i >= 0; i--) { const z = i / 20; ctx.lineTo(cx(z) + hw(z), yz(z)); }
    ctx.closePath(); ctx.fill();
    // faixas de borda
    ctx.strokeStyle = night ? '#3a3d40' : '#d9d4c3'; ctx.lineWidth = 1.2;
    for (const side of [-1, 1]) { ctx.beginPath(); for (let i = 0; i <= 20; i++) { const z = i / 20; ctx.lineTo(cx(z) + side * hw(z) * 0.94, yz(z)); } ctx.stroke(); }
    // faixa central tracejada (movimento)
    s.road = (s.road + (c.v * dt) * 0.08) % 1;
    ctx.fillStyle = night ? '#4a4d50' : '#e7e2d1';
    for (let i = 0; i < 8; i++) {
      const za = (i + s.road) / 8, zb = Math.min(1, za + 0.045);
      const a = za * za, b = zb * zb;
      const wa = 0.6 + 4 * a, wb = 0.6 + 4 * b;
      ctx.beginPath(); ctx.moveTo(cx(a) - wa / 2, yz(a)); ctx.lineTo(cx(a) + wa / 2, yz(a)); ctx.lineTo(cx(b) + wb / 2, yz(b)); ctx.lineTo(cx(b) - wb / 2, yz(b)); ctx.fill();
    }
    // postes na beira da estrada
    s.posts = (s.posts + (c.v * dt) * 0.03) % 1;
    for (let i = 0; i < 8; i++) {
      const zl = (i + s.posts) / 8, z = zl * zl;
      const y = yz(z);
      const ph = 3 + 50 * z;
      const pw = 1 + z * 4;
      for (const side of [-1, 1]) {
        const x = cx(z) + side * (hw(z) * 1.25 + 4);
        ctx.fillStyle = night ? (v.lowBeam ? `rgba(200,190,160,${0.12 + z * 0.5})` : '#0b0d10') : '#e6e2d6';
        ctx.fillRect(x - pw / 2, y - ph, pw, ph);
        if (!night) { ctx.fillStyle = '#1b1d1f'; ctx.fillRect(x - pw / 2, y - ph, pw, ph * 0.18); }
      }
    }
    // faróis
    if (v.lowBeam || (v.flash && v.powerOn) || v.position) {
      const high = v.highBeamOn || (v.flash && v.powerOn);
      const reach = v.lowBeam || high ? (high ? 0.03 : 0.25 + v.level * 0.08) : 0.85;
      const top = yz(reach);
      const alpha = !v.lowBeam && !high ? 0.06 : night ? (high ? 0.5 : 0.36) : 0.1;
      const g = ctx.createLinearGradient(0, h, 0, top);
      g.addColorStop(0, `rgba(255,236,190,${alpha})`); g.addColorStop(1, 'rgba(255,236,190,0)');
      ctx.fillStyle = g;
      const spread = high ? 0.16 : 0.1;
      ctx.beginPath(); ctx.moveTo(X0 - w * 0.4, h); ctx.lineTo(cx(reach) - w * spread, top); ctx.lineTo(cx(reach) + w * spread, top); ctx.lineTo(X0 + w * 0.4, h); ctx.closePath(); ctx.fill();
      if (v.fogOn) { ctx.fillStyle = `rgba(255,240,200,${night ? 0.18 : 0.05})`; ctx.fillRect(0, h * 0.85, w, h * 0.15); }
    }
    // chuva acumulando no vidro
    if (v.rain > 0) {
      const n = (v.rain * 18 * (1 + Math.abs(c.kmh) / 60)) / 60 + Math.random();
      for (let i = 0; i < Math.floor(n); i++) if (s.drops.length < 320) s.drops.push({ x: Math.random() * w, y: Math.random() * h, r: 0.8 + Math.random() * 2.2 });
    }
    // limpadores (pivôs embaixo, à frente do motorista e no centro)
    const ang = (pos: number) => (-6 - pos * 104) * (Math.PI / 180);
    const pivots = [[X0 - w * 0.18, h + 4], [X0 + w * 0.22, h + 4]];
    const len = Math.min(w * 0.44, 380);
    const a1 = ang(v.wiperPos), a0 = ang(s.lastWiper);
    if (a1 !== a0) {
      const lo = Math.min(a0, a1), hi = Math.max(a0, a1);
      s.drops = s.drops.filter((d) => !pivots.some(([px, py]) => { const da = Math.atan2(d.y - py, d.x - px); const dist = Math.hypot(d.x - px, d.y - py); return dist <= len && da >= lo - 0.05 && da <= hi + 0.05; }));
    }
    s.lastWiper = v.wiperPos;
    for (const d of s.drops) {
      ctx.fillStyle = 'rgba(225,235,242,0.5)'; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.arc(d.x - d.r * 0.3, d.y - d.r * 0.3, d.r * 0.35, 0, Math.PI * 2); ctx.fill();
    }
    if (v.fogGlass > 0.01) { ctx.fillStyle = `rgba(205,214,222,${v.fogGlass * 0.65})`; ctx.fillRect(0, 0, w, h); }
    ctx.strokeStyle = '#0b0d0f'; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
    for (const [px, py] of pivots) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a1) * len, py + Math.sin(a1) * len); ctx.stroke(); }
    // reflexo do painel no vidro (dá profundidade)
    const refl = ctx.createLinearGradient(0, h * 0.7, 0, h);
    refl.addColorStop(0, 'rgba(255,255,255,0)'); refl.addColorStop(1, night ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)');
    ctx.fillStyle = refl; ctx.fillRect(0, h * 0.7, w, h * 0.3);
  });

  return <canvas ref={cv} className="windshield" aria-label="Vista do para-brisa" />;
}
