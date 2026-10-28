import React from 'react';
import { carSetup, VERSIONS, SLOT_LABEL, type CarSetup, type SlotFn } from './layout';

const BANK_FNS: SlotFn[] = ['none', 'level', 'espOff', 'isgOff', 'lock', 'rearDefrost'];
const KNOB_FNS: SlotFn[] = ['fan', 'temp', 'vent'];
const CLIMATE_FNS: SlotFn[] = ['none', 'ac', 'recirc', 'rearDefrost', 'isgOff', 'espOff'];

function Pick({ id, value, fns, onChange }: { id: string; value: SlotFn; fns: SlotFn[]; onChange: (f: SlotFn) => void }) {
  return (
    <select id={id} data-testid={id} className="psel" value={value} onChange={(e: { target: { value: string } }) => onChange(e.target.value as SlotFn)}>
      {fns.map((f) => <option key={f} value={f}>{SLOT_LABEL[f]}</option>)}
    </select>
  );
}

/** "Ajustar ao meu carro": versão e posição de cada botão, conferidas no carro da autoescola. */
export function SetupSheet({ onClose }: { onClose: () => void }) {
  const [, force] = React.useState(0);
  React.useEffect(() => carSetup.subscribe(() => force((x: number) => x + 1)), []);
  const s = carSetup.get();
  const setArr = (key: 'leftBank' | 'knobs' | 'climateBtns' | 'doorBtns', i: number, f: SlotFn) => {
    const arr = [...s[key]];
    // giratórios: troca de lugar em vez de duplicar
    if (key === 'knobs') { const j = arr.indexOf(f); if (j >= 0) arr[j] = arr[i]; }
    arr[i] = f;
    carSetup.set({ [key]: arr } as Partial<CarSetup>);
  };
  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label="Ajustar ao meu carro" data-testid="setup" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <h2>Ajustar ao meu carro</h2>
        <p className="sub">Sente no carro da autoescola e confira cada posição. O que estiver diferente, troque aqui: o treino fica igual ao seu carro. Fica salvo neste aparelho.</p>

        <h4 className="sh">Versão</h4>
        <div className="vgrid">
          {(Object.keys(VERSIONS) as CarSetup['version'][]).map((k) => (
            <button key={k} type="button" className={`item ${s.version === k ? 'sel' : ''}`} data-testid={`ver-${k}`} onClick={() => carSetup.setVersion(k)}>
              <b>{VERSIONS[k].name}</b>
            </button>
          ))}
        </div>
        <div className="toggles">
          <label><input type="checkbox" data-testid="opt-push" checked={s.pushStart} onChange={() => carSetup.set({ pushStart: !s.pushStart })} /> Partida por botão (sem chave)</label>
          <label><input type="checkbox" data-testid="opt-cruise" checked={s.cruise} onChange={() => carSetup.set({ cruise: !s.cruise })} /> Piloto automático no volante</label>
          <label><input type="checkbox" data-testid="opt-auto" checked={s.autoLights} onChange={() => carSetup.set({ autoLights: !s.autoLights })} /> Farol automático (posição AUTO)</label>
        </div>

        <h4 className="sh">Cor da moldura das saídas de ar</h4>
        <div className="trims">
          {[['#d4513a', 'Vermelha'], ['#3b6fd1', 'Azul'], ['#9aa3ab', 'Prata'], ['#1a1d20', 'Preta']].map(([c, n]) => (
            <button key={c} type="button" className={`trim ${s.trim === c ? 'sel' : ''}`} style={{ background: c }} aria-label={n} data-testid={`trim-${n}`} onClick={() => carSetup.set({ trim: c })} />
          ))}
        </div>

        <h4 className="sh">Botões à esquerda do volante (de cima para baixo)</h4>
        <div className="picks">{s.leftBank.map((f, i) => <Pick key={i} id={`bank-${i}`} value={f} fns={BANK_FNS} onChange={(x) => setArr('leftBank', i, x)} />)}</div>

        <h4 className="sh">Botões giratórios do ar (da esquerda para a direita)</h4>
        <div className="picks">{s.knobs.map((f, i) => <Pick key={i} id={`knob-${i}`} value={f} fns={KNOB_FNS} onChange={(x) => setArr('knobs', i, x)} />)}</div>

        <h4 className="sh">Fileira de botões do ar (da esquerda para a direita)</h4>
        <div className="picks">{s.climateBtns.map((f, i) => <Pick key={i} id={`cbtn-${i}`} value={f} fns={CLIMATE_FNS} onChange={(x) => setArr('climateBtns', i, x)} />)}</div>

        <h4 className="sh">Porta do motorista</h4>
        <div className="picks">{s.doorBtns.map((f, i) => <Pick key={i} id={`door-${i}`} value={f} fns={['none', 'lock']} onChange={(x) => setArr('doorBtns', i, x)} />)}</div>

        <div className="row-btns">
          <button className="btn danger" onClick={() => carSetup.reset()}>Restaurar padrão</button>
          <button className="btn primary" data-testid="setup-close" onClick={onClose}>Pronto</button>
        </div>
      </div>
    </div>
  );
}
