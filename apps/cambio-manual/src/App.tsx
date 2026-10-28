import React from 'react';
import { sim, type Mode } from './core/sim';
import { useSim } from './ui/hooks';
import { Dashboard } from './ui/Dashboard';
import { ShifterPad } from './ui/Shifter';
import { Pedal } from './ui/Pedal';
import { Coach } from './ui/Coach';
import { PickerSheet, SummarySheet, StartScreen } from './ui/Sheets';
import { ProgressView } from './ui/ProgressView';
import { TouchButton } from './ui/TouchButton';
import { Cockpit, RotatePrompt } from './ui/cockpit/Cockpit';

function useLandscape() {
  const get = () => typeof window !== 'undefined' && window.innerWidth > window.innerHeight;
  const [l, setL] = React.useState(get());
  React.useEffect(() => {
    const on = () => {
      setL(get());
      // girar o aparelho pode deixar a página deslocada; volta ao topo
      requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        for (const el of [document.documentElement, document.body, document.getElementById('root')]) if (el) { el.scrollTop = 0; el.scrollLeft = 0; }
      });
    };
    window.addEventListener('resize', on);
    window.addEventListener('orientationchange', on);
    return () => { window.removeEventListener('resize', on); window.removeEventListener('orientationchange', on); };
  }, []);
  return l;
}

const TABS: [Mode, string][] = [['free', 'Livre'], ['learn', 'Aprender'], ['drive', 'Dirigir'], ['panel', 'Painel'], ['progress', 'Progresso']];
const GRADES = [0, 0.06, 0.12, -0.06];

export function App() {
  useSim();
  const [picker, setPicker] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const landscape = useLandscape();

  if (!sim.started) return <StartScreen />;
  if (landscape) return <Cockpit />;

  const blind = !!sim.runner?.blind && !sim.runner.done;
  const c = sim.car;

  const pickMode = (m: Mode) => {
    sim.setMode(m);
    if ((m === 'learn' || m === 'drive') && !sim.runner) setPicker(true);
    if ((m === 'learn' || m === 'drive') && sim.runner && (sim.runner.kind === 'drill') !== (m === 'learn')) { sim.stopRunner(); setPicker(true); }
  };

  return (
    <div className="app">
      <nav className="tabs" aria-label="Modos">
        {TABS.map(([m, l]) => <button key={m} aria-pressed={sim.mode === m} data-testid={`tab-${m}`} onClick={() => pickMode(m)}>{l}</button>)}
      </nav>

      {sim.mode === 'progress' ? <ProgressView /> : sim.mode === 'panel' ? <RotatePrompt /> : (
        <>
          <Dashboard blind={blind} />
          <Coach onPick={() => setPicker(true)} />
          <div className="aux">
            <TouchButton className={`start ${c.engineOn ? 'on' : ''}`} testId="ignition" onPress={() => sim.ignition()}>
              {c.cranking > 0 ? 'Girando…' : c.engineOn ? 'Desligar' : 'Partida'}
            </TouchButton>
            <TouchButton className={`danger ${c.inputs.handbrake ? 'on' : ''}`} testId="handbrake" ariaPressed={c.inputs.handbrake} onPress={() => sim.toggleHandbrake()}>
              Freio de mão
            </TouchButton>
            {sim.mode === 'free' && (
              <TouchButton className={sim.grade ? 'on' : ''} testId="grade" onPress={() => sim.setGrade(GRADES[(GRADES.indexOf(sim.grade) + 1) % GRADES.length])}>
                {sim.grade === 0 ? 'Plano' : sim.grade > 0 ? `Subida ${Math.round(sim.grade * 100)}%` : `Descida ${Math.round(-sim.grade * 100)}%`}
              </TouchButton>
            )}
            <TouchButton className={muted ? '' : 'on'} ariaPressed={!muted} onPress={() => { const m = !muted; setMuted(m); sim.audio.setMuted(m); }}>
              {muted ? 'Som off' : 'Som'}
            </TouchButton>
          </div>
          <div className="cockpit">
            <Pedal kind="clutch" />
            <div className="right">
              <ShifterPad blind={blind} />
              <div className="feet">
                <Pedal kind="brake" />
                <Pedal kind="throttle" />
              </div>
            </div>
          </div>
        </>
      )}
      {picker && <PickerSheet onClose={() => setPicker(false)} />}
      <SummarySheet />
    </div>
  );
}
