import React from 'react';
import { sim } from '../../core/sim';
import { Btn, Seg, say, quizAnswer } from '../panel/Kit';
import { carSetup, quiz, type SlotFn } from '../panel/layout';
import { ClusterSvg } from './ClusterSvg';
import { STATIONS, SOURCES, VENT_MODES, type LightSwitch, type WiperMode } from '../../sim/vehicle';
import type { ZoomId } from './Scene';
import { MirrorCanvas } from './Mirrors';
import type { MirrorId } from '../../sim/mirrors';

/** Comando elétrico dos retrovisores (porta): seletor E/D e as quatro setas. */
function MirrorSwitch() {
  const m = sim.mirrors, v = sim.veh;
  const dir = (x: number, y: number) => () => {
    if (!v.accOn) { say('O ajuste é elétrico: gire a chave para ACC ou ON.'); return; }
    if (!m.select) { say('Gire o seletor para E (esquerdo) ou D (direito) antes de usar as setas.', 'Escolha o retrovisor'); return; }
    m.drive.x = x; m.drive.y = y;
  };
  const stop = () => { m.drive.x = 0; m.drive.y = 0; };
  const arrow = (x: number, y: number, label: string, id: string, cls: string) => (
    <Btn qid="mirrorSwitch" testId={`mirror-${id}`} className={`m-arrow ${cls}`} label={label} onPress={dir(x, y)} onRelease={stop}>
      <svg viewBox="0 0 20 20" width="18" height="18"><path d="M10 4 L16 13 H4 Z" fill="currentColor" /></svg>
    </Btn>
  );
  return (
    <div className="m-switch">
      <Seg<string> qid="mirrorSwitch" testId="mirror-sel" value={m.select ?? 'N'} onChange={(k) => { m.select = k === 'N' ? null : (k as 'L' | 'R'); stop(); sim.audio.switchClick(); }} options={[['L', 'E'], ['N', '•'], ['R', 'D']]} />
      <div className={`m-pad ${m.select ? 'live' : ''}`}>
        {arrow(0, 1, 'Retrovisor para cima', 'up', 'm-up')}
        {arrow(-1, 0, 'Retrovisor para a esquerda', 'left', 'm-lf')}
        <i className="m-hub" />
        {arrow(1, 0, 'Retrovisor para a direita', 'right', 'm-rt')}
        {arrow(0, -1, 'Retrovisor para baixo', 'down', 'm-dn')}
      </div>
    </div>
  );
}

function MirrorPreview({ id, name }: { id: MirrorId; name: string }) {
  const st = sim.mirrors.status(id);
  return (
    <div className={`m-prev ${sim.mirrors.select === id ? 'sel' : ''} ${st.ok ? 'ok' : ''}`} data-testid={`mirror-prev-${id}`}>
      <MirrorCanvas id={id} big className="m-cv" />
      <span>{name}{st.ok ? ' ✓' : ''}</span>
    </div>
  );
}

/** Interno em tamanho grande: arraste para ajustar, alavanca dia/noite. */
function RearMirrorZoom() {
  const m = sim.mirrors;
  const d = React.useRef<null | { id: number; x: number; y: number; w: number; h: number }>(null);
  const st = m.status('I');
  return (
    <div className="z-stack">
      <div className="m-big" data-testid="mirror-big" style={{ touchAction: 'none' }}
        onPointerDown={(e: React.PointerEvent) => { e.preventDefault(); if (quizAnswerIf('mirrorI')) return; (e.currentTarget as Element).setPointerCapture(e.pointerId); const r = (e.currentTarget as Element).getBoundingClientRect(); d.current = { id: e.pointerId, x: e.clientX, y: e.clientY, w: r.width, h: r.height }; }}
        onPointerMove={(e: React.PointerEvent) => { const s = d.current; if (!s || s.id !== e.pointerId) return; m.nudge('I', -(e.clientX - s.x) / s.w * 0.5, (e.clientY - s.y) / s.h * 0.16); s.x = e.clientX; s.y = e.clientY; }}
        onPointerUp={() => { d.current = null; sim.notify(); }} onPointerCancel={() => { d.current = null; }}>
        <MirrorCanvas id="I" big className="m-cv" />
      </div>
      <div className={`z-read m-hint ${st.ok ? 'ok' : ''}`} data-testid="mirror-hint">{st.ok ? `✓ ${st.hint}` : st.hint}</div>
      <div className="z-grid2">
        <Btn testId="mirror-night" active={m.nightTab} onPress={() => { m.nightTab = !m.nightTab; m.persist(); }}>{m.nightTab ? 'NOITE (antiofuscante)' : 'DIA'}</Btn>
        <div className="z-read">Arraste o espelho com o dedo, como se fosse a mão.</div>
      </div>
    </div>
  );
}
const quizAnswerIf = (id: string) => { if (quiz.active && !quiz.done) { quizAnswer(id); return true; } return false; };

/** Um botão de posição ajustável (botões à esquerda, fileira do ar, porta). */
function SlotBtn({ fn }: { fn: SlotFn }) {
  const v = sim.veh, c = sim.car;
  const qid = `fn:${fn}`;
  switch (fn) {
    case 'level':
      return (
        <div className="z-level">
          <Btn qid={qid} testId="level-minus" onPress={() => { v.level = Math.max(0, v.level - 1); }}>▲</Btn>
          <b data-testid="level">{v.level}</b>
          <Btn qid={qid} testId="level-plus" onPress={() => { v.level = Math.min(3, v.level + 1); }}>▼</Btn>
        </div>
      );
    case 'espOff': return <Btn qid={qid} testId="esp-off" led={!v.esp} onPress={() => { v.esp = !v.esp; }}>ESP OFF</Btn>;
    case 'isgOff': return <Btn qid={qid} testId="isg-off" led={!v.isg} onPress={() => { v.isg = !v.isg; }}>ISG OFF</Btn>;
    case 'ac': return <Btn qid={qid} testId="ac" led={v.ac && v.fan > 0} onPress={() => say(v.toggleAC())}>A/C</Btn>;
    case 'recirc': return <Btn qid={qid} testId="recirc" led={v.recirc} onPress={() => { v.recirc = !v.recirc; }}>RECIRC</Btn>;
    case 'rearDefrost': return <Btn qid={qid} testId="rear-defrost" led={v.rearDefrost} onPress={() => say(v.toggleRearDefrost(c))}>DESEMB.</Btn>;
    case 'lock': return <Btn qid={qid} testId="lock" led={v.locked} onPress={() => v.toggleLock()}>TRAVA</Btn>;
    default: return null;
  }
}

function Body({ z }: { z: ZoomId }) {
  const v = sim.veh, c = sim.car;
  const s = carSetup.get();
  switch (z) {
    case 'spokeL':
      return (
        <div className="z-grid2">
          <Btn qid="volume" testId="w-volup" onPress={() => v.vol(1)}>VOL +</Btn>
          <Btn qid="volume" testId="w-mode" onPress={() => v.nextSource()}>MODE</Btn>
          <Btn qid="volume" testId="w-voldn" onPress={() => v.vol(-1)}>VOL −</Btn>
          <Btn qid="volume" testId="w-mute" active={v.mute} onPress={() => v.toggleMute()}>MUTE</Btn>
        </div>
      );
    case 'spokeR':
      return s.cruise ? (
        <div className="z-grid3">
          <Btn qid="cruise" testId="w-res" onPress={() => say(v.resPlus(c))}>RES +</Btn>
          <Btn qid="cruise" testId="w-cruise" active={v.cruiseMain && !v.limiterMode} onPress={() => v.toggleCruiseMain()}>CRUISE</Btn>
          <Btn qid="cruise" testId="w-lim" active={v.cruiseMain && v.limiterMode} onPress={() => v.toggleLimiterMode()}>LIM</Btn>
          <Btn qid="cruise" testId="w-set" onPress={() => say(v.setMinus(c))}>SET −</Btn>
          <Btn qid="cruise" testId="w-cancel" onPress={() => v.cancelCruise()}>CANCEL</Btn>
          <Btn qid="trip" testId="w-trip" onPress={() => v.nextTrip()} onHold={() => v.resetTrip()}>TRIP</Btn>
        </div>
      ) : (
        <div className="z-grid2">
          <Btn qid="trip" testId="w-trip" onPress={() => v.nextTrip()} onHold={() => v.resetTrip()}>▲ TRIP</Btn>
          <Btn qid="trip" testId="w-trip-ok" onPress={() => v.nextTrip()} onHold={() => v.resetTrip()}>▼ OK</Btn>
        </div>
      );
    case 'stalkL': {
      const opts: [LightSwitch, string][] = s.autoLights ? [['OFF', 'DESL.'], ['AUTO', 'AUTO'], ['POS', 'LANTERNA'], ['LOW', 'FAROL']] : [['OFF', 'DESL.'], ['POS', 'LANTERNA'], ['LOW', 'FAROL']];
      return (
        <div className="z-stack">
          <Seg<LightSwitch> qid="lights" testId="lights" value={v.lights} onChange={(l) => v.setLights(l)} options={opts} />
          <div className="z-grid3">
            <Btn qid="flash" testId="flash" active={v.flash} onPress={() => v.setFlash(true)} onRelease={() => v.setFlash(false)}>↙ PUXAR</Btn>
            <Btn qid="high" testId="high" active={v.highBeam && v.lowBeam} onPress={() => say(v.toggleHigh())}>↗ EMPURRAR</Btn>
            <Btn qid="fog" testId="fog" active={v.fogOn} onPress={() => say(v.toggleFog())}>NEBLINA</Btn>
          </div>
        </div>
      );
    }
    case 'stalkR':
      return (
        <div className="z-stack">
          <Seg<WiperMode> qid="wiper" testId="wiper" value={v.wiper} onChange={(m) => v.setWiper(m)} options={[['MIST', 'MIST'], ['OFF', 'OFF'], ['INT', 'INT'], ['LO', 'LO'], ['HI', 'HI']]} />
          <div className="z-grid3">
            <Seg<string> qid="wiper" testId="int" value={String(v.wiperInt)} onChange={(x) => { v.wiperInt = Number(x); }} options={[['1', '1'], ['2', '2'], ['3', '3'], ['4', '4']]} />
            <Btn qid="washer" testId="washer" active={v.washer} onPress={() => { v.washer = true; }} onRelease={() => { v.washer = false; }}>↙ PUXAR</Btn>
            <Btn qid="rearWiper" testId="rear-wiper" led={v.rearWiper} onPress={() => { v.rearWiper = !v.rearWiper; }}>TRASEIRO</Btn>
          </div>
        </div>
      );
    case 'leftBank':
      return <div className="z-col">{s.leftBank.filter((f) => f !== 'none').map((fn, i) => <SlotBtn key={i} fn={fn} />)}</div>;
    case 'door': {
      const sel = sim.mirrors.select;
      const st = sel ? sim.mirrors.status(sel) : null;
      return (
        <div className="z-stack">
          <div className="m-row">
            <MirrorPreview id="L" name="Esquerdo" />
            <MirrorSwitch />
            <MirrorPreview id="R" name="Direito" />
          </div>
          <div className={`z-read m-hint ${st?.ok ? 'ok' : ''}`} data-testid="mirror-hint">
            {!v.accOn ? 'Retrovisores elétricos: gire a chave para ACC ou ON.' : st ? (st.ok ? `✓ ${st.hint}` : st.hint) : 'Seletor no meio: escolha E ou D para ajustar.'}
          </div>
          <div className="z-grid3">
            {s.doorBtns.filter((f) => f !== 'none').map((fn, i) => <SlotBtn key={i} fn={fn} />)}
            <Btn testId="door" active={v.doorOpen} onPress={() => say(v.toggleDoor(c))}>{v.doorOpen ? 'FECHAR' : 'ABRIR'}</Btn>
            <Btn testId="belt" active={v.belt} led={v.belt} onPress={() => { v.belt = !v.belt; }}>CINTO</Btn>
          </div>
        </div>
      );
    }
    case 'mirrorI':
      return <RearMirrorZoom />;
    case 'climate':
      return (
        <div className="z-stack">
          <div className="z-grid4">{s.climateBtns.filter((f) => f !== 'none').map((fn, i) => <SlotBtn key={i} fn={fn} />)}</div>
          <div className="z-read">{v.fan ? `Ventilação ${v.fan}` : 'Ventilação desligada'} · {v.temp < 0.4 ? 'fria' : v.temp > 0.6 ? 'quente' : 'média'} · {VENT_MODES[v.vent]}</div>
        </div>
      );
    case 'media': {
      const st = STATIONS[v.station];
      return (
        <div className="z-stack">
          <div className="z-screen" data-testid="media">
            {v.radioOn && v.accOn ? <><span>{SOURCES[v.source]}</span><b>{v.source === 0 ? `FM ${st.f}` : v.source === 1 ? 'Celular conectado' : 'USB · faixa 3'}</b><span>{v.source === 0 ? st.name : 'Reproduzindo'} · {v.mute ? 'MUDO' : `VOL ${v.volume}`}</span></> : <span>{v.accOn ? 'Desligado' : 'Sem energia: chave em LOCK'}</span>}
          </div>
          <div className="z-grid4">
            <Btn qid="media" testId="radio-power" led={v.radioOn && v.accOn} onPress={() => v.radioPower()}>⏻</Btn>
            <Btn qid="media" testId="seek-down" onPress={() => v.seek(-1)}>◀◀</Btn>
            <Btn qid="media" testId="seek-up" onPress={() => v.seek(1)}>▶▶</Btn>
            <Btn qid="media" testId="m-src" onPress={() => v.nextSource()}>FONTE</Btn>
          </div>
        </div>
      );
    }
    case 'cluster':
      return <svg viewBox="0 0 240 120" className="z-cluster"><ClusterSvg id="zoom" /></svg>;
  }
}

export function Zoom({ z, onClose }: { z: ZoomId; onClose: () => void }) {
  // ao fechar, o motor do retrovisor para (dedo pode ter saído segurando a seta)
  React.useEffect(() => () => { sim.mirrors.drive.x = 0; sim.mirrors.drive.y = 0; }, []);
  return (
    <div className="zoom-wrap" data-testid="zoom" onPointerDown={(e: React.PointerEvent) => { if (e.target === e.currentTarget) { e.preventDefault(); onClose(); } }}>
      <div className={`zoom-panel z-${z}`} data-testid={`zoom-panel-${z}`}>
        <Body z={z} />
      </div>
    </div>
  );
}
