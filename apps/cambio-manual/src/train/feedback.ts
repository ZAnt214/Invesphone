// Transforma eventos da simulação em explicações: o que aconteceu e como corrigir.
import type { SimEvent, Gear } from '../sim/car';
import { speedAtRpm } from '../sim/car';

export type Severity = 'error' | 'warn' | 'ok' | 'info';

export interface Feedback {
  id: number;
  kind: string; // tipo para estatísticas (stall, grind, jerk...)
  severity: Severity;
  title: string;
  what?: string;
  fix?: string;
  t: number;
}

export const GEAR_PLACE: Record<Exclude<Gear, 'N'>, string> = {
  '1': 'em cima, à esquerda',
  '2': 'embaixo, à esquerda',
  '3': 'em cima, no centro',
  '4': 'embaixo, no centro',
  '5': 'em cima, à direita',
  R: 'embaixo, à direita, com trava',
};

export function gearName(g: Gear) {
  return g === 'R' ? 'ré' : g === 'N' ? 'neutro' : `${g}ª`;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;
const fmt = (n: number) => Math.round(n).toLocaleString('pt-BR');

let seq = 1;
type Out = Omit<Feedback, 'id' | 't'>;

export const ERROR_LABEL: Record<string, string> = {
  stall: 'Motor apagou',
  grind: 'Arranhou a marcha',
  jerk: 'Tranco',
  overrev: 'Sobregiro na redução',
  lugging: 'Giro baixo demais',
  redline: 'Giro no limite',
  rollback: 'Voltou na subida',
  startInGear: 'Partida engrenada',
  reverseLock: 'Ré travada',
  wrongGear: 'Marcha errada',
  skipGear: 'Pulou marcha',
  earlyShift: 'Troca cedo demais',
  lateShift: 'Troca tarde demais',
  speeding: 'Velocidade alta na manobra',
};

export function explain(ev: SimEvent): Out | null {
  const d = (ev.detail ?? {}) as Record<string, number & string>;
  switch (ev.type) {
    case 'stall': {
      const base = { kind: 'stall', severity: 'error' as const };
      switch (d.cause) {
        case 'fastRelease':
          return { ...base, title: 'O motor apagou: embreagem solta rápido demais',
            what: `O pedal subiu ${pct(d.drop)} em meio segundo. Ao atravessar o ponto de acoplamento depressa, as rodas exigem mais força do que o motor entrega e o giro despenca.`,
            fix: 'Suba o pedal até o ponto (o giro cai um pouco e o carro começa a puxar). Segure ali um instante com 1.300–1.800 rpm e só então solte o resto devagar.' };
        case 'noThrottle':
          return { ...base, title: 'O motor apagou: faltou acelerar',
            what: 'O giro estava na marcha lenta quando a embreagem acoplou. Sem acelerador, sobra pouca força para tirar o carro da inércia.',
            fix: 'Antes de chegar ao ponto, acelere até cerca de 1.500 rpm e mantenha o pé firme enquanto solta a embreagem.' };
        case 'noThrottleHill':
          return { ...base, title: 'O motor apagou na subida',
            what: 'Na rampa o carro pesa mais: além da inércia, a gravidade puxa para trás. Com pouco acelerador o motor não sustenta.',
            fix: 'Acelere até uns 2.000 rpm, leve a embreagem ao ponto até o carro "sentar", solte o freio de mão e só então termine de soltar a embreagem.' };
        case 'highGear':
          return { ...base, title: `O motor apagou: ${gearName(d.gear)} a ${Math.abs(d.kmh)} km/h`,
            what: `Essa marcha é longa demais para essa velocidade. Na ${gearName(d.gear)}, o motor só fica acima da marcha lenta a partir de ~${fmt(speedAtRpm(d.gear, 1100))} km/h.`,
            fix: 'Saia sempre em 1ª. Ao perder velocidade, reduza a marcha (ou pise a embreagem) antes que o giro caia abaixo de 1.000 rpm.' };
        case 'stoppedInGear':
          return { ...base, title: 'O motor apagou: parou engrenado',
            what: 'Você freou até quase parar com a embreagem solta. As rodas param e arrastam o motor junto.',
            fix: 'Ao frear para parar, pise a embreagem até o fundo quando o giro chegar perto de 1.000 rpm e coloque em neutro.' };
        case 'handbrake':
          return { ...base, title: 'O motor apagou: freio de mão puxado',
            what: 'O freio de mão segurou as rodas enquanto a embreagem acoplava.',
            fix: 'Solte o freio de mão quando a embreagem estiver no ponto e o carro começar a puxar.' };
        default:
          return { ...base, title: 'O motor apagou', fix: 'Pise a embreagem, coloque em neutro e dê partida novamente.' };
      }
    }
    case 'jerk': {
      const downshift = !!(ev.detail as { downshift?: boolean } | undefined)?.downshift;
      return { kind: 'jerk', severity: 'warn', title: 'Tranco',
        what: (d.clutchDrop as number) > 0.3
          ? `A embreagem subiu ${pct(d.clutchDrop)} de uma vez com o motor e as rodas em rotações diferentes.`
          : 'Motor e rodas estavam em rotações diferentes quando a embreagem acoplou.',
        fix: (d.clutchDrop as number) > 0.3
          ? 'Solte a embreagem com calma, principalmente na faixa do ponto. A troca suave leva menos de 1 segundo, mas não é instantânea.'
          : downshift
            ? 'Em reduções, dê um leve toque no acelerador com a embreagem pisada para o giro subir antes de soltar.'
            : 'Solte a embreagem mais devagar.' };
    }
    case 'overrev':
      return { kind: 'overrev', severity: 'error', title: `Sobregiro: ${fmt(d.rpm)} rpm`,
        what: `A ${gearName(d.gear)} a ${d.kmh} km/h obriga o motor a girar acima do limite. Isso pode danificar o motor.`,
        fix: `Reduza para a ${gearName(d.gear)} somente abaixo de ~${fmt(speedAtRpm(d.gear, 4800))} km/h. Freie antes de reduzir.` };
    case 'lugging':
      return { kind: 'lugging', severity: 'warn', title: 'Motor sem força (giro baixo)',
        what: `${gearName(d.gear)} a ${d.kmh} km/h deixa o motor a ${fmt(d.rpm)} rpm. Acelerar fundo nessa faixa só faz o carro vibrar.`,
        fix: 'Reduza uma marcha para o giro subir acima de 1.800 rpm antes de acelerar forte.' };
    case 'redline':
      return { kind: 'redline', severity: 'warn', title: 'Giro no limite',
        what: 'O motor está no corte de giro. Não ganha mais velocidade nessa marcha.',
        fix: 'Em condução normal, troque de marcha entre 2.500 e 3.500 rpm.' };
    case 'rollback':
      return { kind: 'rollback', severity: 'error', title: 'O carro voltou na subida',
        what: 'O carro andou para trás engatado. Numa rua de verdade isso pode bater no carro de trás.',
        fix: 'Mantenha o freio de mão puxado até a embreagem estar no ponto com o giro em ~2.000 rpm.' };
    case 'startInGear':
      return { kind: 'startInGear', severity: 'error', title: 'Partida com marcha engatada',
        what: 'O motor de partida empurrou o carro, que deu trancos para frente.',
        fix: 'Antes de girar a chave, coloque em neutro ou pise a embreagem até o fundo.' };
    case 'crankFail':
      return { kind: 'startInGear', severity: 'info', title: 'O motor não pegou',
        fix: 'Pise a embreagem até o fundo (ou coloque em neutro) e tente de novo.' };
    case 'start':
      return { kind: 'start', severity: 'ok', title: 'Motor ligado' };
    default:
      return null;
  }
}

export function blockedFeedback(reason: 'clutch' | 'moving' | 'reverseLock', g: Gear): Out {
  if (reason === 'reverseLock')
    return { kind: 'reverseLock', severity: 'info', title: 'A ré tem trava',
      what: 'A alavanca parou na entrada da ré. Isso evita engatar a ré sem querer no lugar da 5ª ou com o carro andando.',
      fix: 'Toque e segure a alavanca por meio segundo até o anel acender (equivale a empurrá-la para baixo) e então arraste para a direita e para baixo.' };
  if (reason === 'moving')
    return { kind: 'grind', severity: 'error', title: g === 'R' ? 'Ré com o carro andando para frente' : 'Marcha à frente com o carro de ré',
      what: 'A ré não tem sincronizador. Com as rodas girando no sentido oposto, as engrenagens se chocam.',
      fix: 'Pare o carro completamente, pise a embreagem e só então engate.' };
  return { kind: 'grind', severity: 'error', title: `Arranhou ao engatar a ${gearName(g)}`,
    what: 'A embreagem não estava pisada até o fundo. O motor continua girando o câmbio e o sincronizador não consegue igualar as rotações.',
    fix: 'Pise a embreagem até o fundo, faça a troca e só depois solte o pedal.' };
}

export function makeFeedback(o: Out, t: number): Feedback {
  return { ...o, id: seq++, t };
}
