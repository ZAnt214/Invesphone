// Síntese sonora do carro com Web Audio API (sem gravações).
// Motor 4 cilindros 4 tempos: frequência de combustão = rpm/60 × 2.

export interface AudioState {
  rpm: number;
  load: number; // 0..1 combustão efetiva
  throttle: number; // pedal
  engineOn: boolean;
  cranking: boolean;
  kmh: number;
  gear: string;
  coupled: boolean; // trem de força ligado às rodas
  driveRpm: number; // rotação do eixo de entrada (para o zumbido do câmbio)
  clutchSlip: number; // rad/s de patinação sob carga
}

type Ctx = AudioContext;

function makeNoise(ctx: Ctx, seconds = 2): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let b = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    b = 0.97 * b + 0.03 * w; // um pouco de "rosa" para soar menos chiado
    d[i] = w * 0.6 + b * 3;
  }
  return buf;
}

function firingWave(ctx: Ctx): PeriodicWave {
  // Pulsos de combustão: harmônicos decrescentes com fases "irregulares" fixas.
  const n = 40;
  const real = new Float32Array(n);
  const imag = new Float32Array(n);
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let k = 1; k < n; k++) {
    const amp = (k <= 3 ? 1.1 : 1) / Math.pow(k, 1.05) * (k % 2 === 0 ? 0.85 : 1);
    const ph = rnd() * Math.PI * 2;
    real[k] = amp * Math.cos(ph);
    imag[k] = amp * Math.sin(ph);
  }
  return ctx.createPeriodicWave(real, imag);
}

function rumbleWave(ctx: Ctx): PeriodicWave {
  // Ordem de meia rotação: dá o "ronco" irregular da marcha lenta.
  const n = 16;
  const real = new Float32Array(n);
  const imag = new Float32Array(n);
  const prof = [0, 1, 0.55, 0.7, 0.25, 0.4, 0.15, 0.22, 0.08, 0.1, 0.05, 0.06, 0.03, 0.03, 0.02, 0.02];
  for (let k = 1; k < n; k++) imag[k] = prof[k];
  return ctx.createPeriodicWave(real, imag);
}

function tanhCurve(k: number): Float32Array {
  const n = 1024;
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; c[i] = Math.tanh(k * x) / Math.tanh(k); }
  return c;
}

export class CarAudio {
  ctx: Ctx | null = null;
  private master!: GainNode;
  private fire!: OscillatorNode;
  private rumble!: OscillatorNode;
  private rumbleGain!: GainNode;
  private am!: OscillatorNode;
  private amDepth!: GainNode;
  private pulseGain!: GainNode;
  private drive!: GainNode;
  private lp!: BiquadFilterNode;
  private body!: BiquadFilterNode;
  private engGain!: GainNode;
  private intakeBp!: BiquadFilterNode;
  private intakeGain!: GainNode;
  private mechGain!: GainNode;
  private whine!: OscillatorNode;
  private whineGain!: GainNode;
  private roadLp!: BiquadFilterNode;
  private roadGain!: GainNode;
  private starter!: OscillatorNode;
  private starterAm!: OscillatorNode;
  private starterGain!: GainNode;
  private slipBp!: BiquadFilterNode;
  private slipGain!: GainNode;
  private noise!: AudioBuffer;
  private shudder = 0;
  // cabine
  private fanGain!: GainNode;
  private wiperGain!: GainNode;
  private rainGain!: GainNode;
  private radioGain!: GainNode;
  private radioLp!: BiquadFilterNode;
  private radioVoices: OscillatorNode[] = [];
  private radioBass!: OscillatorNode;
  private radioStation = -1;
  private radioNext = 0;
  private radioStep = 0;
  volume = 0.9;
  muted = false;

  get ready() { return !!this.ctx && this.ctx.state === 'running'; }

  /** Precisa ser chamado dentro de um gesto do usuário (toque) por causa do iOS. */
  async unlock() {
    try {
      // iOS 16.4+: tocar mesmo com a chave de silencioso ligada.
      const nav = navigator as Navigator & { audioSession?: { type: string } };
      if (nav.audioSession) nav.audioSession.type = 'playback';
    } catch { /* ignore */ }
    if (!this.ctx) {
      const AC: typeof AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC({ latencyHint: 'interactive' });
      this.build();
      // buffer silencioso destrava o áudio em versões antigas do Safari
      const b = this.ctx.createBuffer(1, 1, 22050);
      const s = this.ctx.createBufferSource();
      s.buffer = b; s.connect(this.ctx.destination); s.start(0);
    }
    if (this.ctx.state !== 'running') { try { await this.ctx.resume(); } catch { /* ignore */ } }
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : this.volume, this.ctx.currentTime, 0.05);
  }

  private loopNoise(): AudioBufferSourceNode {
    const ctx = this.ctx!;
    const s = ctx.createBufferSource();
    s.buffer = this.noise;
    s.loop = true;
    s.loopStart = Math.random();
    s.start(0, Math.random() * 1.5);
    return s;
  }

  private build() {
    const ctx = this.ctx!;
    this.noise = makeNoise(ctx);

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.005; comp.release.value = 0.15;
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : this.volume;
    comp.connect(this.master).connect(ctx.destination);

    // --- Motor ---
    this.fire = ctx.createOscillator();
    this.fire.setPeriodicWave(firingWave(ctx));
    this.rumble = ctx.createOscillator();
    this.rumble.setPeriodicWave(rumbleWave(ctx));
    this.rumbleGain = ctx.createGain();
    this.rumbleGain.gain.value = 0.6;

    this.pulseGain = ctx.createGain();
    this.pulseGain.gain.value = 0.7;
    this.am = ctx.createOscillator();
    this.am.type = 'triangle';
    this.amDepth = ctx.createGain();
    this.amDepth.gain.value = 0.3;
    this.am.connect(this.amDepth).connect(this.pulseGain.gain);

    this.fire.connect(this.pulseGain);
    this.rumble.connect(this.rumbleGain).connect(this.pulseGain);

    // admissão (ruído filtrado que cresce com o acelerador)
    this.intakeBp = ctx.createBiquadFilter();
    this.intakeBp.type = 'bandpass'; this.intakeBp.Q.value = 1.4;
    this.intakeGain = ctx.createGain(); this.intakeGain.gain.value = 0;
    this.loopNoise().connect(this.intakeBp).connect(this.intakeGain);

    this.drive = ctx.createGain(); this.drive.gain.value = 0.8;
    const shaper = ctx.createWaveShaper();
    shaper.curve = tanhCurve(2.6) as Float32Array<ArrayBuffer>;
    shaper.oversample = '2x';
    this.pulseGain.connect(this.drive);
    this.intakeGain.connect(this.drive);
    this.drive.connect(shaper);

    this.body = ctx.createBiquadFilter();
    this.body.type = 'peaking'; this.body.frequency.value = 110; this.body.Q.value = 1.1; this.body.gain.value = 7;
    this.lp = ctx.createBiquadFilter();
    this.lp.type = 'lowpass'; this.lp.Q.value = 0.9; this.lp.frequency.value = 600;
    this.engGain = ctx.createGain(); this.engGain.gain.value = 0;
    shaper.connect(this.body).connect(this.lp).connect(this.engGain).connect(comp);

    // ruído mecânico (comando de válvulas)
    const mhp = ctx.createBiquadFilter(); mhp.type = 'highpass'; mhp.frequency.value = 2600;
    this.mechGain = ctx.createGain(); this.mechGain.gain.value = 0;
    this.loopNoise().connect(mhp).connect(this.mechGain).connect(comp);

    // zumbido do câmbio (forte na ré, de dentes retos)
    this.whine = ctx.createOscillator(); this.whine.type = 'sine';
    this.whineGain = ctx.createGain(); this.whineGain.gain.value = 0;
    this.whine.connect(this.whineGain).connect(comp);

    // rodagem e vento
    this.roadLp = ctx.createBiquadFilter(); this.roadLp.type = 'lowpass'; this.roadLp.frequency.value = 400;
    this.roadGain = ctx.createGain(); this.roadGain.gain.value = 0;
    this.loopNoise().connect(this.roadLp).connect(this.roadGain).connect(comp);

    // patinação da embreagem (chiado grave sob carga)
    this.slipBp = ctx.createBiquadFilter(); this.slipBp.type = 'bandpass'; this.slipBp.frequency.value = 900; this.slipBp.Q.value = 3;
    this.slipGain = ctx.createGain(); this.slipGain.gain.value = 0;
    this.loopNoise().connect(this.slipBp).connect(this.slipGain).connect(comp);

    // motor de partida
    this.starter = ctx.createOscillator(); this.starter.type = 'sawtooth'; this.starter.frequency.value = 210;
    const stLp = ctx.createBiquadFilter(); stLp.type = 'lowpass'; stLp.frequency.value = 1400;
    this.starterGain = ctx.createGain(); this.starterGain.gain.value = 0;
    const stAmG = ctx.createGain(); stAmG.gain.value = 0.5;
    this.starterAm = ctx.createOscillator(); this.starterAm.type = 'square'; this.starterAm.frequency.value = 7;
    const amDepth = ctx.createGain(); amDepth.gain.value = 0.45;
    this.starterAm.connect(amDepth).connect(stAmG.gain);
    this.starter.connect(stLp).connect(stAmG).connect(this.starterGain).connect(comp);

    const now = ctx.currentTime;
    for (const o of [this.fire, this.rumble, this.am, this.whine, this.starter, this.starterAm]) o.start(now);
    this.buildCabin(comp);
  }

  private buildCabin(out: AudioNode) {
    const ctx = this.ctx!;
    // ventilador: ruído de ar
    const fbp = ctx.createBiquadFilter(); fbp.type = 'bandpass'; fbp.frequency.value = 700; fbp.Q.value = 0.5;
    this.fanGain = ctx.createGain(); this.fanGain.gain.value = 0;
    this.loopNoise().connect(fbp).connect(this.fanGain).connect(out);
    // motor do limpador
    const wo = ctx.createOscillator(); wo.type = 'sawtooth'; wo.frequency.value = 92;
    const wlp = ctx.createBiquadFilter(); wlp.type = 'lowpass'; wlp.frequency.value = 380;
    this.wiperGain = ctx.createGain(); this.wiperGain.gain.value = 0;
    wo.connect(wlp).connect(this.wiperGain).connect(out); wo.start();
    // chuva no teto e no vidro
    const rhp = ctx.createBiquadFilter(); rhp.type = 'highpass'; rhp.frequency.value = 1400;
    this.rainGain = ctx.createGain(); this.rainGain.gain.value = 0;
    this.loopNoise().connect(rhp).connect(this.rainGain).connect(out);
    // rádio: pequeno sintetizador de acordes (som próprio, não gravado)
    this.radioLp = ctx.createBiquadFilter(); this.radioLp.type = 'lowpass'; this.radioLp.frequency.value = 2600;
    this.radioGain = ctx.createGain(); this.radioGain.gain.value = 0;
    this.radioLp.connect(this.radioGain).connect(this.master);
    for (let i = 0; i < 3; i++) {
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 220;
      const g = ctx.createGain(); g.gain.value = 0.18;
      o.connect(g).connect(this.radioLp); o.start();
      this.radioVoices.push(o);
    }
    this.radioBass = ctx.createOscillator(); this.radioBass.type = 'sine';
    const bg = ctx.createGain(); bg.gain.value = 0.35;
    this.radioBass.connect(bg).connect(this.radioLp); this.radioBass.start();
  }

  /** Sons da cabine, chamados a cada quadro. */
  updateCabin(s: { fan: number; wiper: boolean; rain: number; kmh: number; radio: number; station: number }) {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || !this.fanGain) return;
    const t = ctx.currentTime;
    this.fanGain.gain.setTargetAtTime(s.fan * s.fan * 0.006, t, 0.3);
    this.wiperGain.gain.setTargetAtTime(s.wiper ? 0.03 : 0, t, 0.05);
    this.rainGain.gain.setTargetAtTime(s.rain ? s.rain * 0.025 * (1 + s.kmh / 90) : 0, t, 0.4);
    this.radioGain.gain.setTargetAtTime(s.radio * 0.16, t, 0.08);
    if (s.radio <= 0) return;
    // progressões por estação: [tônica em semitons a partir de A2, tempo em s por acorde, forma de onda]
    const SETS: Record<number, { prog: number[][]; dur: number; wave: OscillatorType }> = {
      0: { prog: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [5, 9, 12]], dur: 1.6, wave: 'triangle' },
      1: { prog: [[2, 5, 9], [7, 10, 14], [0, 4, 11], [9, 12, 16]], dur: 2.4, wave: 'sine' },
      2: { prog: [[0, 3, 7], [8, 12, 15], [3, 7, 10], [7, 11, 14]], dur: 2.8, wave: 'sine' },
      3: { prog: [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]], dur: 1.2, wave: 'square' },
      4: { prog: [[0, 7, 12], [0, 7, 12], [5, 12, 17], [5, 12, 17]], dur: 3.2, wave: 'sine' },
      11: { prog: [[4, 7, 11], [2, 5, 9], [0, 4, 7], [2, 5, 9]], dur: 2, wave: 'triangle' },
      12: { prog: [[0, 5, 9], [2, 7, 11], [4, 7, 12], [2, 5, 9]], dur: 1.8, wave: 'sawtooth' },
    };
    const set = SETS[s.station] ?? SETS[0];
    if (s.station !== this.radioStation) {
      this.radioStation = s.station; this.radioNext = t; this.radioStep = 0;
      for (const o of this.radioVoices) o.type = set.wave;
      this.radioLp.frequency.value = set.wave === 'square' || set.wave === 'sawtooth' ? 1400 : 2600;
    }
    if (t >= this.radioNext - 0.05) {
      const ch = set.prog[this.radioStep % set.prog.length];
      const base = 110 * Math.pow(2, (s.station % 5) * 2 / 12);
      this.radioVoices.forEach((o, i) => o.frequency.setTargetAtTime(base * 2 * Math.pow(2, ch[i] / 12), Math.max(t, this.radioNext), 0.03));
      this.radioBass.frequency.setTargetAtTime(base * Math.pow(2, ch[0] / 12) / 2, Math.max(t, this.radioNext), 0.02);
      this.radioStep++;
      this.radioNext = Math.max(t, this.radioNext) + set.dur;
    }
  }

  private hornNodes: { stop: () => void } | null = null;
  /** Buzina de dois tons (soa enquanto o dedo segura). */
  horn(on: boolean) {
    if (!this.ready) return;
    if (!on) { this.hornNodes?.stop(); this.hornNodes = null; return; }
    if (this.hornNodes) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.22, t + 0.02);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.7;
    const sh = ctx.createWaveShaper(); sh.curve = tanhCurve(3) as Float32Array<ArrayBuffer>;
    const oscs = [410, 512].map((f) => { const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = f; o.connect(sh); o.start(t); return o; });
    sh.connect(bp).connect(g).connect(this.master);
    this.hornNodes = { stop: () => { const n = ctx.currentTime; g.gain.setTargetAtTime(0, n, 0.02); oscs.forEach((o) => o.stop(n + 0.15)); } };
  }

  /** Relé da seta: tique ao acender, taque ao apagar. */
  relay(on: boolean) {
    if (!this.ready) return;
    this.burst({ dur: 0.018, freq: on ? 3800 : 2400, type: 'bandpass', q: 5, gain: 0.16 });
    this.tone({ f0: on ? 1900 : 1300, f1: on ? 1700 : 1100, dur: 0.02, gain: 0.05 });
  }

  /** Aviso sonoro (cinto, porta). */
  chime() {
    if (!this.ready) return;
    this.tone({ f0: 1046, f1: 1040, dur: 0.5, gain: 0.12 });
    this.tone({ f0: 2093, f1: 2080, dur: 0.3, gain: 0.04 });
  }

  /** Clique de botão/comando do painel. */
  switchClick() {
    if (!this.ready) return;
    this.burst({ dur: 0.02, freq: 2800, type: 'bandpass', q: 3, gain: 0.08 });
  }

  /** Atuador da trava elétrica. */
  lockActuator() {
    if (!this.ready) return;
    this.burst({ dur: 0.07, freq: 900, type: 'bandpass', q: 1.5, gain: 0.25 });
    this.tone({ f0: 180, f1: 90, dur: 0.08, gain: 0.15 });
  }

  /** Chamado a cada quadro com o estado da simulação. */
  update(s: AudioState, dt: number) {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime;
    const tc = 0.025;
    const rpm = Math.max(0, s.rpm);
    const f = Math.max(1, (rpm / 60) * 2); // combustão
    const jitter = s.engineOn ? (Math.random() - 0.5) * (rpm < 1200 ? 9 : 3) : 0;

    this.fire.frequency.setTargetAtTime(f, t, tc);
    this.fire.detune.setTargetAtTime(jitter, t, 0.01);
    this.rumble.frequency.setTargetAtTime(f / 2, t, tc);
    this.am.frequency.setTargetAtTime(f / 2, t, tc);

    const running = s.engineOn;
    const rpmN = Math.min(1, rpm / 6500);
    const load = running ? s.load : 0;
    const overrun = running && s.throttle < 0.05 && rpm > 1500 ? 1 : 0;

    // marcha lenta "ronca" mais; em giro alto fica liso
    this.amDepth.gain.setTargetAtTime(running ? 0.42 * (1 - rpmN) + 0.06 : 0.2, t, 0.08);
    this.rumbleGain.gain.setTargetAtTime(0.75 - rpmN * 0.45, t, 0.1);
    this.drive.gain.setTargetAtTime(0.55 + load * 1.6, t, 0.04);

    const cutoff = running
      ? 260 + rpm * 0.32 + load * 2400 - overrun * 150
      : 120 + rpm * 0.6;
    this.lp.frequency.setTargetAtTime(Math.max(90, cutoff), t, 0.04);

    if (this.shudder > 0) this.shudder -= dt;
    let g: number;
    if (running) g = 0.16 + load * 0.3 + rpmN * 0.22 - overrun * 0.05;
    else g = Math.min(0.32, rpm / 1400) * 0.5 + (s.cranking ? 0.06 : 0); // desacelerando/apagando
    if (this.shudder > 0) g *= 0.6 + Math.random() * 0.8;
    this.engGain.gain.setTargetAtTime(g, t, running ? 0.03 : 0.06);

    this.intakeBp.frequency.setTargetAtTime(400 + f * 4, t, tc);
    this.intakeGain.gain.setTargetAtTime(running ? load * load * 0.55 * (0.4 + rpmN) : 0, t, 0.05);
    this.mechGain.gain.setTargetAtTime(running ? 0.004 + rpmN * 0.018 : 0, t, 0.1);

    // câmbio
    const shaftHz = Math.abs(s.driveRpm) / 60;
    const whineHz = Math.max(20, shaftHz * (s.gear === 'R' ? 19 : 29));
    this.whine.frequency.setTargetAtTime(whineHz, t, tc);
    const whineAmt = s.gear === 'N' || !s.coupled ? 0 : s.gear === 'R' ? 0.06 : 0.008 + (s.throttle > 0.05 ? 0 : 0.008);
    this.whineGain.gain.setTargetAtTime(Math.min(0.08, whineAmt * Math.min(1, shaftHz / 8)), t, 0.06);

    const v = Math.abs(s.kmh);
    this.roadLp.frequency.setTargetAtTime(250 + v * 9, t, 0.2);
    this.roadGain.gain.setTargetAtTime(Math.min(0.2, (v / 120) * (v / 120) * 0.16 + v * 0.0004), t, 0.2);

    const slip = Math.min(1, Math.abs(s.clutchSlip) / 120);
    this.slipBp.frequency.setTargetAtTime(500 + slip * 900, t, 0.05);
    this.slipGain.gain.setTargetAtTime(s.coupled && running ? slip * 0.06 * (0.3 + load) : 0, t, 0.05);

    // partida
    this.starterGain.gain.setTargetAtTime(s.cranking ? 0.13 : 0, t, 0.02);
    this.starterAm.frequency.setTargetAtTime(Math.max(3, f), t, 0.05);
  }

  // ---------- Efeitos pontuais ----------
  private burst(opts: { dur: number; freq: number; q?: number; type?: BiquadFilterType; gain: number; when?: number }) {
    const ctx = this.ctx!;
    const t = ctx.currentTime + (opts.when ?? 0);
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = opts.type ?? 'lowpass'; f.frequency.value = opts.freq; f.Q.value = opts.q ?? 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(opts.gain, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0008, t + opts.dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t, Math.random() * 1.5);
    src.stop(t + opts.dur + 0.05);
  }

  private tone(opts: { f0: number; f1: number; dur: number; gain: number; type?: OscillatorType; when?: number }) {
    const ctx = this.ctx!;
    const t = ctx.currentTime + (opts.when ?? 0);
    const o = ctx.createOscillator();
    o.type = opts.type ?? 'sine';
    o.frequency.setValueAtTime(opts.f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, opts.f1), t + opts.dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(opts.gain, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0008, t + opts.dur);
    o.connect(g).connect(this.master);
    o.start(t); o.stop(t + opts.dur + 0.05);
  }

  /** Engate: "clec" metálico + baque da alavanca. */
  clunk(strength = 1) {
    if (!this.ready) return;
    this.burst({ dur: 0.05, freq: 3200, type: 'bandpass', q: 2.5, gain: 0.22 * strength });
    this.burst({ dur: 0.09, freq: 700, gain: 0.3 * strength, when: 0.006 });
    this.tone({ f0: 160, f1: 70, dur: 0.1, gain: 0.25 * strength, when: 0.004 });
  }

  /** Neutro: atrito leve da alavanca no trilho. */
  tick() {
    if (!this.ready) return;
    this.burst({ dur: 0.035, freq: 2200, type: 'bandpass', q: 3, gain: 0.07 });
  }

  /** Arranhar marcha: dentes batendo no sincronizador. */
  grind() {
    if (!this.ready) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const dur = 0.42;
    const src = ctx.createBufferSource(); src.buffer = this.noise;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 5;
    const lfo = ctx.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 41;
    const lfoG = ctx.createGain(); lfoG.gain.value = 900;
    lfo.connect(lfoG).connect(bp.frequency);
    const saw = ctx.createOscillator(); saw.type = 'sawtooth'; saw.frequency.value = 1150;
    const sawG = ctx.createGain(); sawG.gain.value = 0.05;
    const am = ctx.createOscillator(); am.type = 'square'; am.frequency.value = 63;
    const amG = ctx.createGain(); amG.gain.value = 0.05;
    am.connect(amG).connect(sawG.gain);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.42, t + 0.015);
    g.gain.setValueAtTime(0.38, t + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(bp).connect(g);
    saw.connect(sawG).connect(g);
    g.connect(this.master);
    for (const n of [lfo, saw, am]) { n.start(t); n.stop(t + dur + 0.05); }
    src.start(t, Math.random()); src.stop(t + dur + 0.05);
  }

  /** Tranco da carroceria. */
  thump(mag = 1) {
    if (!this.ready) return;
    const m = Math.min(1.4, mag / 3);
    this.tone({ f0: 70, f1: 38, dur: 0.25, gain: 0.5 * m });
    this.burst({ dur: 0.14, freq: 260, gain: 0.35 * m });
    this.burst({ dur: 0.05, freq: 1800, type: 'bandpass', q: 2, gain: 0.08 * m, when: 0.03 });
  }

  /** Motor apagando: engasgos + estremecimento. */
  stall() {
    if (!this.ready) return;
    this.shudder = 0.55;
    this.thump(2.2);
    this.burst({ dur: 0.09, freq: 420, gain: 0.25, when: 0.12 });
    this.burst({ dur: 0.08, freq: 350, gain: 0.18, when: 0.27 });
    this.tone({ f0: 52, f1: 30, dur: 0.4, gain: 0.25, when: 0.35 });
  }

  /** Ignição, clique da chave / freio de mão. */
  click(kind: 'key' | 'handbrake' = 'key') {
    if (!this.ready) return;
    if (kind === 'key') {
      this.burst({ dur: 0.03, freq: 4200, type: 'bandpass', q: 4, gain: 0.12 });
      this.burst({ dur: 0.03, freq: 3000, type: 'bandpass', q: 4, gain: 0.1, when: 0.07 });
    } else {
      for (let i = 0; i < 5; i++) this.burst({ dur: 0.02, freq: 3600, type: 'bandpass', q: 6, gain: 0.08, when: i * 0.035 });
    }
  }

  /** Corte de giro. */
  limiter() {
    if (!this.ready) return;
    this.burst({ dur: 0.05, freq: 900, gain: 0.12 });
  }
}
