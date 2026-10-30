import React from 'react';
import { sim } from '../../core/sim';
import { useFrame } from '../hooks';
import { Scene, useArtReady, type ZoomId, type Lay } from './Scene';
import { loadArt, art } from './art';
import { Zoom } from './Zoom';
import { MirrorsLayer, mirrorBoxes } from './Mirrors';
import { TurnMenu, TurnReport, GlanceOverlay } from './TurnsUI';
import { TurnTrainer } from '../../train/turns';
import { Windshield } from '../panel/Windshield';
import { Pedal } from '../Pedal';
import { SetupSheet } from '../panel/SetupSheet';
import { quiz, carSetup, zoneOf, quizActive } from '../panel/layout';
import { quizStart, quizStop, quizAnswer } from '../panel/Kit';
import { SummarySheet } from '../Sheets';

/**
 * Preenche a tela inteira: a altura da cena é sempre 420 unidades e a largura se estica
 * conforme a proporção do aparelho. Os comandos ficam dentro das áreas seguras (entalhe, cantos).
 */
interface Fit { s: number; y: number; lay: Lay; insetB: number }
function useFit(ref: React.MutableRefObject<HTMLDivElement | null>, probe: React.MutableRefObject<HTMLDivElement | null>) {
  const [fit, setFit] = React.useState<Fit>({ s: 1, y: 0, lay: { SW: 900, L: 0, C: 0, Rt: 0 }, insetB: 0 });
  React.useEffect(() => {
    const el = ref.current!;
    const calc = () => {
      const r = el.getBoundingClientRect();
      const ps = probe.current ? getComputedStyle(probe.current) : null;
      const iLpx = ps ? parseFloat(ps.paddingLeft) || 0 : 0, iRpx = ps ? parseFloat(ps.paddingRight) || 0 : 0, iBpx = ps ? parseFloat(ps.paddingBottom) || 0 : 0;
      let s = r.height / 420;
      let SW = r.width / s;
      let y = 0;
      if (SW < 900) { s = r.width / 900; SW = 900; y = (r.height - 420 * s) / 2; }
      let iL = iLpx / s, iR = iRpx / s;
      let extra = SW - 900 - iL - iR;
      if (extra < 0) { const k = (SW - 900) / Math.max(1, iL + iR); iL *= Math.max(0, k); iR *= Math.max(0, k); extra = SW - 900 - iL - iR; }
      const L = iL;
      setFit({ s, y, insetB: iBpx / s, lay: { SW, L, C: L + extra * 0.42, Rt: L + extra } });
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    window.addEventListener('orientationchange', calc);
    return () => { ro.disconnect(); window.removeEventListener('orientationchange', calc); };
  }, []);
  return fit;
}

function Menu({ onClose, onSetup, onTurns }: { onClose: () => void; onSetup: () => void; onTurns: () => void }) {
  const v = sim.veh;
  const [muted, setMuted] = React.useState(sim.audio.muted);
  const item = (label: string, fn: () => void, id: string, on?: boolean) => (
    <button type="button" className={`m-item ${on ? 'on' : ''}`} data-testid={`menu-${id}`} onClick={() => { fn(); sim.notify(); }}>{label}</button>
  );
  return (
    <div className="zoom-wrap" onPointerDown={(e: React.PointerEvent) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="menu-panel" data-testid="menu">
        {item(quiz.active ? 'Parar "Onde fica?"' : 'Onde fica? (exercício)', () => { if (quiz.active) quizStop(); else quizStart(); onClose(); }, 'quiz', quiz.active)}
        {item(sim.runner?.kind === 'turn' && !sim.runner.done ? 'Parar treino de conversões' : 'Treino de conversões', () => { if (sim.runner?.kind === 'turn' && !sim.runner.done) { sim.stopRunner(); onClose(); } else onTurns(); }, 'turns', sim.runner?.kind === 'turn' || sim.cityFree)}
        {item(sim.mirrors.drill.active ? 'Parar treino dos retrovisores' : 'Treinar ajuste dos retrovisores', () => { const m = sim.mirrors; if (m.drill.active) m.stopDrill(); else { if (quiz.active) quizStop(); m.startDrill(sim.now()); sim.feedback = []; } onClose(); }, 'mirrors', sim.mirrors.drill.active)}
        {item('Meu carro', onSetup, 'setup')}
        {item(v.night ? 'Noite' : 'Dia', () => { v.night = !v.night; }, 'night', v.night)}
        {item(['Sem chuva', 'Chuva', 'Chuva forte'][v.rain], () => { v.rain = (v.rain + 1) % 3; }, 'rain', v.rain > 0)}
        {item(sim.grade ? 'Subida 10%' : 'Plano', () => sim.setGrade(sim.grade ? 0 : 0.1), 'grade', sim.grade !== 0)}
        {item('Abastecer', () => { v.fuel = 50; }, 'refuel')}
        {item(muted ? 'Som desligado' : 'Som ligado', () => { const m = !muted; setMuted(m); sim.audio.setMuted(m); }, 'sound', !muted)}
        {item('Fechar', onClose, 'close')}
      </div>
    </div>
  );
}

/** Visão do motorista em tela cheia, na horizontal. */
export function Cockpit() {
  const outer = React.useRef<HTMLDivElement | null>(null);
  const probe = React.useRef<HTMLDivElement | null>(null);
  const shake = React.useRef<HTMLDivElement | null>(null);
  const ws = React.useRef<HTMLDivElement | null>(null);
  const fit = useFit(outer, probe);
  React.useEffect(() => { loadArt(); }, []);
  const photo = useArtReady();
  // no modo foto o painel é uma imagem só: o console fica preso ao lado do motorista
  const lay: Lay = photo ? { ...fit.lay, C: fit.lay.L } : fit.lay;
  const { SW, L, C, Rt } = lay;
  const pedalStyle = (id: 'pedalClutch' | 'pedalBrake' | 'pedalGas') => (photo && art.has(id) ? { ['--pedal-img' as string]: `url("${art.url(id)}")` } : {});
  const pedalCls = (id: 'pedalClutch' | 'pedalBrake' | 'pedalGas') => (photo && art.has(id) ? ' photo' : '');
  const [zoom, setZoom] = React.useState<ZoomId | null>(null);
  const [menu, setMenu] = React.useState(false);
  const [setup, setSetup] = React.useState(false);
  const [turns, setTurns] = React.useState(false);
  const [, force] = React.useState(0);
  React.useEffect(() => carSetup.subscribe(() => force((x: number) => x + 1)), []);

  // vibração do motor e trancos
  useFrame(() => {
    const c = sim.car;
    if (!shake.current) return;
    const idle = c.engineOn ? (c.rpm < 1100 ? 0.35 : 0.12) * Math.sin(performance.now() / 18) : 0;
    const jerk = Math.max(-5, Math.min(5, c.shake * 1.4));
    const stall = c.stallSpin > 0 ? (Math.random() - 0.5) * 3 : 0;
    const y = idle + jerk + stall;
    shake.current.style.transform = Math.abs(y) > 0.01 ? `translate(${(stall * 0.6).toFixed(2)}px, ${y.toFixed(2)}px)` : '';
    // paralaxe: a estrada se move mais que o painel ao frear/acelerar (o carro "mergulha")
    if (ws.current) ws.current.style.transform = `translateY(${Math.max(-7, Math.min(7, c.aSlow * 1.1)).toFixed(2)}px)`;
  });

  const latest = sim.feedback[0];
  const fresh = latest && sim.now() - latest.t < (latest.severity === 'ok' ? 2500 : 5000) ? latest : null;
  const r = sim.runner;
  const qa = quiz.active && !quiz.done ? quiz.list[quiz.idx] : null;
  const reveal = qa && quiz.wrongHere >= 2 ? zoneOf(qa.id, carSetup.get()) : null;
  const md = sim.mirrors.drill.active ? sim.mirrors : null;
  const mk = (id: 'L' | 'I' | 'R', n: string) => `${n} ${md!.status(id).ok ? '✓' : '·'}`;
  const msg = md
    ? `Ajuste os retrovisores: ${mk('L', 'esquerdo')}  ${mk('I', 'interno')}  ${mk('R', 'direito')}`
    : qa
    ? `Onde fica ${qa.ask}?`
    : quiz.active && quiz.done
      ? `Resultado: ${quiz.firstTry} de ${quiz.list.length} de primeira · ${(quiz.times.reduce((a, b) => a + b, 0) / Math.max(1, quiz.times.length) / 1000).toFixed(1).replace('.', ',')} s por comando`
      : r && !r.done ? r.instruction : null;

  return (
    <div className={`ck-root${photo ? ' photo' : ''}`} ref={outer} data-testid="cockpit" style={{ ['--trim' as string]: carSetup.get().trim }}>
      <div className="ck-probe" ref={probe} />
      <div className="scene" style={{ width: SW, transform: `translate(0px, ${fit.y}px) scale(${fit.s})` }}>
        <div className="scene-shake" ref={shake}>
          <div className="ws-layer" ref={ws} style={{ width: SW }}><Windshield vx={(L + 300) / SW} /></div>
          <Scene onZoom={(z) => setZoom(z)} reveal={reveal} lay={lay} />
          <MirrorsLayer boxes={mirrorBoxes(L, C, Rt)} onOpen={(z) => setZoom(z)} onQuiz={(id) => { if (!quizActive()) return false; quizAnswer(id); return true; }}
            onGlance={(id) => { if (!(sim.runner instanceof TurnTrainer) && !sim.cityFree) return false; sim.glance(id); if (sim.runner instanceof TurnTrainer && !sim.runner.done) sim.runner.onGlance(id); return true; }} />
          <div className={`ck-pedal clutch${pedalCls('pedalClutch')}`} style={{ left: L + 6, ...pedalStyle('pedalClutch') }}><Pedal kind="clutch" compact /></div>
          <div className={`ck-pedal brake${pedalCls('pedalBrake')}`} style={{ left: Rt + 726, ...pedalStyle('pedalBrake') }}><Pedal kind="brake" compact /></div>
          <div className={`ck-pedal gas${pedalCls('pedalGas')}`} style={{ left: Rt + 814, ...pedalStyle('pedalGas') }}><Pedal kind="throttle" compact /></div>
        </div>
        {(msg || fresh) && (
          <div className="hud" data-testid="hud" style={{ left: SW / 2 }}>
            {msg && <div className="hud-msg">{msg}{quiz.active && quiz.done && <button type="button" className="hud-x" onClick={() => quizStop()}>OK</button>}</div>}
            {fresh && <div className={`hud-fb ${fresh.severity}`} data-testid="hud-fb">{fresh.title}{fresh.severity !== 'ok' && fresh.fix ? ` · ${fresh.fix}` : ''}</div>}
          </div>
        )}
        <button type="button" className="ck-menu" data-testid="menu-open" aria-label="Menu" style={{ left: Rt + 856 }} onClick={() => setMenu(true)}>
          <svg viewBox="0 0 24 24" width="18" height="18"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
        {zoom && <Zoom z={zoom} onClose={() => setZoom(null)} />}
        {menu && <Menu onClose={() => setMenu(false)} onSetup={() => { setMenu(false); setSetup(true); }} onTurns={() => { setMenu(false); setTurns(true); }} />}
        {turns && <TurnMenu onClose={() => setTurns(false)} />}
        <GlanceOverlay SW={SW} />
        <TurnReport />
      </div>
      {setup && <SetupSheet onClose={() => setSetup(false)} />}
      <SummarySheet />
    </div>
  );
}

/** Tela vertical: pede para girar o iPhone. */
export function RotatePrompt() {
  return (
    <div className="rotate" data-testid="rotate">
      <svg viewBox="0 0 120 120" width="120" height="120" aria-hidden="true">
        <rect x="40" y="20" width="40" height="72" rx="7" fill="none" stroke="currentColor" strokeWidth="3" className="rot-phone" />
        <path d="M24 92 a40 40 0 0 0 30 18" fill="none" stroke="var(--amber)" strokeWidth="3" strokeLinecap="round" />
        <path d="M50 104 l5 6 -7 3" fill="none" stroke="var(--amber)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <b>Gire o iPhone para a horizontal</b>
      <span>Se a tela não girar, desative o bloqueio de rotação na Central de Controle.</span>
    </div>
  );
}
