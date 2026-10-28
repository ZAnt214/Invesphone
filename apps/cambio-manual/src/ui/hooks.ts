import React from 'react';
import { sim } from '../core/sim';
import { progress } from '../train/progress';

export function useSim() {
  const [, set] = React.useState(0);
  React.useEffect(() => sim.subscribe(() => set((v: number) => v + 1)), []);
  return sim;
}

export function useProgress() {
  const [, set] = React.useState(0);
  React.useEffect(() => progress.subscribe(() => set((v: number) => v + 1)), []);
  return progress.get();
}

/** Registra um callback por quadro (atualizações diretas no DOM, sem re-render). */
export function useFrame(fn: () => void) {
  const ref = React.useRef(fn);
  ref.current = fn;
  React.useEffect(() => sim.onFrame(() => ref.current()), []);
}
