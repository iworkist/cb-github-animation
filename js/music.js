// Background music: plays the embedded MIDI file (assets/bgm.mid -> data/bgm.js) with a small chiptune synth.
// Channel 10 is drums (36 kick, 38 snare, 42 hat); other channels are picked by program:
// 80 = square lead, 81 = 25% pulse, 32-39 = triangle bass.
(function () {
  const LOOKAHEAD = 1.0, PUMP_MS = 200;
  const LEVEL = { lead: 0.16, arp: 0.09, bass: 0.3 };

  function parseMidi(bytes) {
    let p = 0;
    const u8 = () => bytes[p++];
    const u16 = () => (u8() << 8) | u8();
    const u32 = () => ((u8() << 24) | (u8() << 16) | (u8() << 8) | u8()) >>> 0;
    const vlq = () => { let v = 0, b; do { b = u8(); v = (v << 7) | (b & 0x7f); } while (b & 0x80); return v; };

    p += 4; u32(); u16(); // "MThd", header length, format
    const ntrks = u16(), division = u16();
    const raw = [], tempos = [];
    let endTick = 0;
    for (let i = 0; i < ntrks; i++) {
      p += 4; // "MTrk"
      const end = u32() + p;
      const prog = [], open = new Map();
      let tick = 0, status = 0;
      while (p < end) {
        tick += vlq();
        const b = bytes[p];
        if (b === 0xff) {
          p++;
          const type = u8(), len = vlq();
          if (type === 0x51) tempos.push({ tick, mpq: (bytes[p] << 16) | (bytes[p + 1] << 8) | bytes[p + 2] });
          p += len;
          continue;
        }
        if (b === 0xf0 || b === 0xf7) { p++; const len = vlq(); p += len; continue; }
        if (b & 0x80) { status = b; p++; }
        const type = status & 0xf0, ch = status & 0x0f;
        const a = u8(), v = type === 0xc0 || type === 0xd0 ? 0 : u8();
        if (type === 0xc0) prog[ch] = a;
        else if (type === 0x90 && v > 0) open.set(ch * 128 + a, { tick, vel: v });
        else if (type === 0x80 || type === 0x90) {
          const on = open.get(ch * 128 + a);
          if (on) { open.delete(ch * 128 + a); raw.push({ from: on.tick, to: tick, ch, note: a, vel: on.vel, prog: prog[ch] ?? 0 }); }
        }
      }
      endTick = Math.max(endTick, tick);
      p = end;
    }

    tempos.sort((x, y) => x.tick - y.tick);
    if (!tempos.length || tempos[0].tick > 0) tempos.unshift({ tick: 0, mpq: 500000 });
    let acc = 0;
    const segs = tempos.map((t, i) => {
      if (i) acc += ((t.tick - tempos[i - 1].tick) * tempos[i - 1].mpq) / 1e6 / division;
      return { tick: t.tick, sec: acc, mpq: t.mpq };
    });
    const toSec = (t) => {
      let s = segs[0];
      for (const g of segs) if (g.tick <= t) s = g;
      return s.sec + ((t - s.tick) * s.mpq) / 1e6 / division;
    };
    const kind = (n) => (n.ch === 9 ? 'drum' : n.prog === 81 ? 'arp' : n.prog >= 32 && n.prog <= 39 ? 'bass' : 'lead');
    const notes = raw
      .map((n) => ({ t: toSec(n.from), dur: toSec(n.to) - toSec(n.from), note: n.note, vel: n.vel, kind: kind(n) }))
      .sort((x, y) => x.t - y.t);
    return { notes, length: toSec(endTick) };
  }

  let ac, master, tone, noise, pulse, song, vol = 0;
  let next = 0, origin = 0, paused = false, muted = false;

  function pulseWave(duty) {
    const N = 32, real = new Float32Array(N), imag = new Float32Array(N);
    for (let n = 1; n < N; n++) {
      real[n] = (2 * Math.sin(2 * Math.PI * n * duty)) / (n * Math.PI);
      imag[n] = (2 * (1 - Math.cos(2 * Math.PI * n * duty))) / (n * Math.PI);
    }
    return ac.createPeriodicWave(real, imag);
  }

  function drum(note, v, at) {
    if (note === 35 || note === 36) {
      const osc = ac.createOscillator(), g = ac.createGain();
      osc.frequency.setValueAtTime(150, at);
      osc.frequency.exponentialRampToValueAtTime(45, at + 0.12);
      g.gain.setValueAtTime(0.55 * v, at);
      g.gain.exponentialRampToValueAtTime(0.001, at + 0.28);
      osc.connect(g).connect(master);
      osc.start(at); osc.stop(at + 0.3);
      return;
    }
    const snare = note === 38 || note === 40, hat = note === 42 || note === 44 || note === 46;
    if (!snare && !hat) return;
    const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    const len = snare ? 0.14 : 0.04;
    src.buffer = noise;
    f.type = 'highpass';
    f.frequency.value = snare ? 1500 : 7000;
    g.gain.setValueAtTime((snare ? 0.2 : 0.07) * v, at);
    g.gain.exponentialRampToValueAtTime(0.001, at + len);
    src.connect(f).connect(g).connect(master);
    src.start(at, Math.random()); src.stop(at + len);
  }

  function play(n, at) {
    const v = n.vel / 127;
    if (n.kind === 'drum') { drum(n.note, v, at); return; }
    const osc = ac.createOscillator(), g = ac.createGain();
    if (n.kind === 'arp') osc.setPeriodicWave(pulse);
    else osc.type = n.kind === 'bass' ? 'triangle' : 'square';
    osc.frequency.value = 440 * Math.pow(2, (n.note - 69) / 12);
    const peak = LEVEL[n.kind] * v, end = at + n.dur;
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(peak, at + 0.005);
    g.gain.setTargetAtTime(peak * 0.7, at + 0.01, 0.1);
    g.gain.setTargetAtTime(0, end, 0.03);
    osc.connect(g).connect(tone);
    osc.start(at); osc.stop(end + 0.25);
  }

  function pump() {
    const now = ac.currentTime, horizon = now + LOOKAHEAD;
    for (;;) {
      const n = song.notes[next], at = origin + n.t;
      if (at >= horizon) break;
      if (at >= now - 0.05) play(n, at);
      if (++next === song.notes.length) { next = 0; origin += song.length; }
    }
  }

  function sync() {
    if (!ac) return;
    if (paused) ac.suspend(); else ac.resume();
  }

  function level() {
    if (ac) master.gain.setTargetAtTime(muted ? 0 : vol, ac.currentTime, 0.05);
  }

  function start() {
    vol = window.CB_CONFIG.music;
    if (!vol || ac) return;
    song = parseMidi(Uint8Array.from(atob(window.CB_BGM), (c) => c.charCodeAt(0)));
    ac = new AudioContext();
    master = ac.createGain();
    master.gain.value = muted ? 0 : vol;
    master.connect(ac.destination);
    tone = ac.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 6500;
    tone.connect(master);
    pulse = pulseWave(0.25);
    noise = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    origin = ac.currentTime + 0.15;
    pump();
    setInterval(pump, PUMP_MS);
    // browsers keep the context suspended until the first key press or click unless autoplay is allowed
    window.addEventListener('keydown', sync, { once: true });
    window.addEventListener('pointerdown', sync, { once: true });
  }

  window.ShowMusic = {
    start,
    setPaused(p) { paused = p; sync(); },
    toggleMute() { muted = !muted; level(); },
  };
})();
