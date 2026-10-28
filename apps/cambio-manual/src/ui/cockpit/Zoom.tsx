import React from 'react';
import { sim } from '../../core/sim';
import { Btn, Seg, say } from '../panel/Kit';
import { carSetup, type SlotFn } from '../panel/layout';
import { ClusterSvg } from './ClusterSvg';
import { STATIONS, SOURCES, VENT_MODES, type LightSwitch, type WiperMode } from '../../sim/vehicle';
import type { ZoomId } from './Scene';

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
    case 'door':
      return (
        <div className="z-grid3">
          {s.doorBtns.filter((f) => f !== 'none').map((fn, i) => <SlotBtn key={i} fn={fn} />)}
          <Btn testId="door" active={v.doorOpen} onPress={() => say(v.toggleDoor(c))}>{v.doorOpen ? 'FECHAR' : 'ABRIR'}</Btn>
          <Btn testId="belt" active={v.belt} led={v.belt} onPress={() => { v.belt = !v.belt; }}>CINTO</Btn>
        </div>
      );
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
  return (
    <div className="zoom-wrap" data-testid="zoom" onPointerDown={(e: React.PointerEvent) => { if (e.target === e.currentTarget) { e.preventDefault(); onClose(); } }}>
      <div className={`zoom-panel z-${z}`} data-testid={`zoom-panel-${z}`}>
        <Body z={z} />
      </div>
    </div>
  );
}
