// Playback engine: 1920x1080 stage, a pausable show clock, scene contexts, pixel-block wipes,
// the top bar, the THANK YOU ticker and the drifting-bean background.
(function () {
  const W = 1920, H = 1080;

  class Aborted extends Error { constructor() { super('aborted'); this.name = 'Aborted'; } }

  // ---------- show clock (pausable, speed-scaled, in ms) ----------
  const clock = { t: 0, last: performance.now(), paused: false, speed: 1, timers: new Set(), tweens: new Set() };
  function frame(now) {
    const dt = Math.min(now - clock.last, 100);
    clock.last = now;
    if (!clock.paused) {
      clock.t += dt * clock.speed;
      for (const tm of [...clock.timers]) if (clock.t >= tm.at) { clock.timers.delete(tm); tm.resolve(); }
      for (const tw of [...clock.tweens]) {
        const p = Math.min(1, (clock.t - tw.start) / tw.dur);
        tw.fn(tw.ease(p), p);
        if (p >= 1) { clock.tweens.delete(tw); tw.resolve(); }
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  const ease = {
    linear: (t) => t,
    out: (t) => 1 - Math.pow(1 - t, 3),
    outExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  };
  const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
  const BOUNCE = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

  // plain clock helpers for engine-level animation (not tied to a scene)
  function sleep(ms) { return new Promise((r) => clock.timers.add({ at: clock.t + ms, resolve: r })); }
  function tweenRaw(ms, fn, e = ease.linear) {
    return new Promise((r) => { fn(0, 0); clock.tweens.add({ start: clock.t, dur: Math.max(1, ms), fn, ease: e, resolve: r }); });
  }

  // ---------- scene context ----------
  function makeCtx(root) {
    const pending = new Set();
    const ctx = {
      root,
      aborted: false,
      wait(ms) {
        if (ctx.aborted) return Promise.reject(new Aborted());
        return new Promise((resolve, reject) => {
          const tm = { at: clock.t + ms, reject };
          tm.resolve = () => { pending.delete(tm); resolve(); };
          clock.timers.add(tm);
          pending.add(tm);
        });
      },
      tween(ms, fn, easing = ease.out) {
        if (ctx.aborted) return Promise.reject(new Aborted());
        return new Promise((resolve, reject) => {
          const tw = { start: clock.t, dur: Math.max(1, ms), fn, ease: easing, reject };
          tw.resolve = () => { pending.delete(tw); resolve(); };
          fn(easing(0), 0);
          clock.tweens.add(tw);
          pending.add(tw);
        });
      },
      // Web Animation scaled to show speed; `delay` is show time.
      anim(el, keyframes, o = {}) {
        if (!el) return null;
        const a = el.animate(keyframes, {
          duration: o.duration ?? 700, delay: o.delay ?? 0, easing: o.easing ?? EASE_OUT,
          fill: o.fill ?? 'both', iterations: o.iterations ?? 1, direction: o.direction ?? 'normal',
        });
        a.playbackRate = clock.speed;
        if (clock.paused) { a.pause(); a._showPaused = true; }
        return a;
      },
      // Bring in a list of elements one after another. Returns when the last one lands (ms).
      stagger(els, o = {}) {
        const each = o.each ?? 80, dur = o.duration ?? 700, delay = o.delay ?? 0;
        const from = o.from ?? { opacity: 0, transform: 'translateY(28px)' };
        const to = o.to ?? { opacity: 1, transform: 'none' };
        // fill "backwards": once done, the element falls back to its own CSS, so later class changes still apply
        [...els].forEach((el, i) => ctx.anim(el, [from, to], { duration: dur, delay: delay + i * each, easing: o.easing, fill: o.fill ?? 'backwards' }));
        return Math.max(0, els.length - 1) * each + dur + delay;
      },
      // bounce an element in; elements created hidden (style.opacity = 0) are revealed here
      pop(el, delay = 0, dur = 650) {
        el.style.opacity = '';
        return ctx.anim(el, [{ opacity: 0, transform: 'scale(.3) rotate(-8deg)' }, { opacity: 1, transform: 'none' }], { duration: dur, delay, easing: BOUNCE, fill: 'backwards' });
      },
      countUp(el, to, ms = 1600, fmt = (v) => Math.round(v).toLocaleString('en-US')) {
        return ctx.tween(ms, (p) => { el.textContent = fmt(to * p); }, ease.outExpo);
      },
      // run `fn` every `ms` until the scene ends (fire and forget)
      every(ms, fn) {
        (async () => { for (let i = 0; ; i++) { fn(i); await ctx.wait(ms); } })().catch(() => {});
      },
      // fire and forget a sequence that should stop quietly when the scene ends
      spawn(fn) { Promise.resolve().then(fn).catch((e) => { if (!(e instanceof Aborted)) console.error(e); }); },
      abort() {
        ctx.aborted = true;
        for (const p of pending) { clock.timers.delete(p); clock.tweens.delete(p); p.reject(new Aborted()); }
        pending.clear();
      },
    };
    return ctx;
  }

  // ---------- DOM helpers ----------
  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    if (typeof attrs === 'string') el.className = attrs;
    else if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k === 'html') el.innerHTML = v;
        else if (k.startsWith('--')) el.style.setProperty(k, v);
        else el.setAttribute(k, v);
      }
    }
    for (const c of children.flat(Infinity)) {
      if (c == null || c === false) continue;
      el.append(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return el;
  }

  const AV = window.CB_AVATARS || {};
  const AV_COLORS = ['#f2a33a', '#57e0b0', '#79c7ff', '#ff7a9a', '#c9a8ff', '#ffd966'];
  function initials(p) {
    const s = (p.name || p.login || '?').trim();
    const parts = s.split(/[\s\-_]+/).filter(Boolean);
    return ((parts[0] || '?')[0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
  }
  // Photos stay smooth and sharp (160px sources, 480px for the Head Baristas).
  function avatar(p, size, cls) {
    const el = h('div', { class: 'av' + (cls ? ' ' + cls : ''), style: { width: size + 'px', height: size + 'px' } });
    const src = AV[p.login];
    if (src) el.append(h('img', { src, alt: '', draggable: 'false' }));
    else {
      let n = 0;
      for (const ch of p.login || '') n = (n * 31 + ch.charCodeAt(0)) >>> 0;
      el.style.background = AV_COLORS[n % AV_COLORS.length];
      el.append(h('span', { class: 'ini', style: { fontSize: Math.round(size * 0.38) + 'px' } }, initials(p)));
    }
    return el;
  }

  // ---------- stage scaling ----------
  function fitStage() {
    const s = Math.min(window.innerWidth / W, window.innerHeight / H);
    const st = document.getElementById('stage');
    st.style.transform = `translate(${(window.innerWidth - W * s) / 2}px, ${(window.innerHeight - H * s) / 2}px) scale(${s})`;
  }

  // ---------- background: slow drifting pixel beans ----------
  function startBackground() {
    const cv = document.getElementById('bg');
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    const beanC = PX.canvas('bean').canvas, sparkC = PX.canvas('spark', { color: '#f2a33a' }).canvas;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const items = [];
    function spawn(initial) {
      const isBean = Math.random() < 0.72;
      return {
        img: isBean ? beanC : sparkC, s: isBean ? [32, 48, 64][Math.floor(Math.random() * 3)] : 32,
        x: rnd(0, W), y: initial ? rnd(0, H) : H + 80, vy: rnd(6, 16), vx: rnd(-3, 3),
        rot: Math.floor(Math.random() * 4), spin: rnd(2.5, 6), age: rnd(0, 6), a: isBean ? rnd(0.07, 0.16) : rnd(0.12, 0.25),
      };
    }
    for (let i = 0; i < 26; i++) items.push(spawn(true));
    let last = 0;
    function draw(now) {
      requestAnimationFrame(draw);
      if (now - last < 40) return; // ~25fps is plenty for ambience
      const dt = clock.paused ? 0 : (Math.min(now - last, 100) / 1000) * clock.speed;
      last = now;
      g.clearRect(0, 0, W, H);
      for (let i = 0; i < items.length; i++) {
        const b = items[i];
        b.y -= b.vy * dt; b.x += b.vx * dt; b.age += dt;
        if (b.y < -80) { items[i] = spawn(false); continue; }
        // quarter-turn steps, like a sprite: no smooth rotation
        const r = (b.rot + Math.floor(b.age / b.spin)) % 4;
        g.save();
        g.globalAlpha = b.a;
        g.translate(Math.round(b.x), Math.round(b.y));
        g.rotate((r * Math.PI) / 2);
        g.drawImage(b.img, -b.s / 2, -b.s / 2, b.s, b.s);
        g.restore();
      }
    }
    requestAnimationFrame(draw);
  }

  // ---------- pixel-block wipe between slides ----------
  const WIPE_COLS = 16, WIPE_ROWS = 9, CELL = 120;
  const WIPE_COLORS = ['#22150d', '#22150d', '#22150d', '#22150d', '#2e1d12', '#2e1d12', '#3a2416', '#f2a33a', '#ffd966', '#57e0b0', '#ff7a9a'];
  const wipe = {
    cv: null, g: null, cells: [],
    init() {
      this.cv = document.getElementById('wipe');
      this.g = this.cv.getContext('2d');
    },
    plan() {
      const dir = Math.random() < 0.5;
      this.cells = [];
      for (let r = 0; r < WIPE_ROWS; r++) for (let c = 0; c < WIPE_COLS; c++) {
        const k = ((dir ? c : WIPE_COLS - 1 - c) + r * 0.9) / (WIPE_COLS + WIPE_ROWS * 0.9);
        this.cells.push({ x: c * CELL, y: r * CELL, at: k * 0.62 + Math.random() * 0.14, col: WIPE_COLORS[Math.floor(Math.random() * WIPE_COLORS.length)] });
      }
    },
    draw(p, covering) {
      const g = this.g;
      g.clearRect(0, 0, W, H);
      for (const c of this.cells) {
        let f = Math.min(1, Math.max(0, (p - c.at) / 0.24));
        if (!covering) f = 1 - f;
        if (f <= 0) continue;
        const s = Math.ceil(CELL * f);
        g.fillStyle = c.col;
        g.fillRect(c.x + (CELL - s) / 2, c.y + (CELL - s) / 2, s, s);
      }
    },
    async cover() { this.plan(); this.cv.style.display = 'block'; await tweenRaw(520, (p) => this.draw(p, true)); },
    async reveal() { await tweenRaw(520, (p) => this.draw(p, false)); this.cv.style.display = 'none'; },
  };

  // ---------- top bar ----------
  function makeTop(cfg, chapters) {
    const top = document.getElementById('top');
    const chEls = chapters.map((c) => h('span', { 'data-id': c.id }, c.label));
    top.append(
      h('div', 'brand', h('img', { src: 'assets/org.png', alt: '' }), h('b', null, 'CLOUD-BARISTA'), h('i', null, '/'), h('span', null, cfg.event.title || 'Open Conference')),
      h('nav', 'chapters', chEls),
      h('span', 'paused', 'PAUSED'),
    );
    return {
      set(chapter, chrome) {
        chEls.forEach((e) => e.classList.toggle('on', e.dataset.id === chapter));
        top.classList.toggle('hidden', chrome === false);
      },
    };
  }

  // ---------- bottom ticker: every contributor's name, all the time ----------
  function makeTicker(cfg, names) {
    const el = document.getElementById('ticker');
    if (!cfg.ticker) { el.remove(); return { tick() {} }; }
    const item = (n) => h('span', 'tk', n.name ? h('b', null, n.name) : null, n.login ? h('em', null, '@' + n.login) : null, h('img', { class: 'px', src: PX.canvas('bean').url, alt: '' }));
    const run = h('div', 'run', names.map(item), names.map(item));
    const clockEl = h('div', 'clock');
    el.append(h('div', 'label', h('img', { class: 'px', src: PX.canvas('heart').url, alt: '' }), 'THANK YOU'), h('div', 'track', run), clockEl);
    requestAnimationFrame(() => {
      const half = run.scrollWidth / 2;
      const a = run.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${-half}px)` }], { duration: (half / 70) * 1000, iterations: Infinity });
      a.playbackRate = clock.speed;
    });
    const start = cfg.event.startTime ? new Date(cfg.event.startTime) : null;
    function tick() {
      const now = new Date();
      if (start && !isNaN(start)) {
        const ms = start - now;
        if (ms > 0) {
          const s = Math.floor(ms / 1000), hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
          clockEl.innerHTML = `<small>오프닝까지</small><b>${(hh ? hh + ':' : '') + String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0')}</b>`;
          return;
        }
        if (ms > -3 * 3600e3) { clockEl.innerHTML = '<b>곧 시작합니다</b>'; return; }
      }
      clockEl.innerHTML = `<b>${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}</b>`;
    }
    tick();
    setInterval(tick, 1000);
    return { tick };
  }

  // ---------- runner ----------
  async function run({ cfg, playlist, chapters, names }) {
    fitStage();
    window.addEventListener('resize', fitStage);
    startBackground();
    wipe.init();

    const params = new URLSearchParams(location.search);
    clock.speed = Number(params.get('speed')) || 1;
    const once = params.has('once');
    const only = params.get('only');
    const freezeAt = params.has('freeze') ? Number(params.get('freeze')) * 1000 : null;
    if (freezeAt != null) document.body.classList.add('rehearsal');

    const top = makeTop(cfg, chapters);
    makeTicker(cfg, names);
    await Promise.race([document.fonts.ready, sleep(4000)]);
    await Promise.all(['700 40px Pretendard', '400 20px Galmuri11'].map((f) => document.fonts.load(f).catch(() => {})));
    const loading = document.getElementById('loading');
    loading.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600, fill: 'forwards' }).finished.then(() => loading.remove());

    // ?scene=<id> starts there; ?only=<id> repeats just that slide (or that group of slides, e.g. only=years)
    const matches = (p, id) => p.id === id || p.group === id;
    const onlyIdx = only ? playlist.map((p, i) => (matches(p, only) ? i : -1)).filter((i) => i >= 0) : [];
    let index = 0;
    const startId = only || params.get('scene');
    if (startId) index = Math.max(0, playlist.findIndex((p) => matches(p, startId)));
    let current = null, jumpTo = null;

    function setPaused(p) {
      if (p === clock.paused) return;
      clock.paused = p;
      document.body.classList.toggle('is-paused', p);
      for (const a of document.getAnimations()) {
        if (p && a.playState === 'running') { a.pause(); a._showPaused = true; }
        else if (!p && a._showPaused) { a._showPaused = false; a.play(); }
      }
    }
    function go(delta) {
      if (!current) return;
      jumpTo = (current.index + delta + playlist.length) % playlist.length;
      setPaused(false);
      current.ctx.abort();
    }
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') go(1);
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(-1);
      else if (e.key === ' ') { e.preventDefault(); setPaused(!clock.paused); }
      else if (e.key === 'f' || e.key === 'F') {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen().catch(() => {});
      } else if (e.key === 'h' || e.key === 'H') document.body.classList.toggle('no-hud');
    });
    let idle;
    window.addEventListener('mousemove', () => {
      document.body.classList.remove('idle');
      clearTimeout(idle);
      idle = setTimeout(() => document.body.classList.add('idle'), 2000);
    });
    document.body.classList.add('idle');

    const scenesEl = document.getElementById('scenes');
    let first = true;
    for (;;) {
      const item = playlist[index];
      if (!first) await wipe.cover();
      scenesEl.replaceChildren();
      const root = h('section', `scene ${item.cls || ''}`);
      document.getElementById('stage').style.setProperty('--accent', item.accent || '#f2a33a');
      scenesEl.append(root);
      top.set(item.chapter, item.chrome);
      const ctx = makeCtx(root);
      current = { ctx, index };
      const t0 = clock.t;
      window.SHOW = { get scene() { return item.id; }, get t() { return (clock.t - t0) / 1000; }, clock };
      if (freezeAt != null) ctx.wait(freezeAt).then(() => setPaused(true), () => {});
      const done = item.run(ctx).catch((err) => { if (!(err instanceof Aborted)) console.error(`[show] scene ${item.id} failed`, err); });
      if (!first) await wipe.reveal();
      first = false;
      await done;
      ctx.abort();

      if (jumpTo != null) { index = jumpTo; jumpTo = null; continue; }
      if (onlyIdx.length) { index = onlyIdx[(onlyIdx.indexOf(index) + 1) % onlyIdx.length]; continue; }
      index = (index + 1) % playlist.length;
      if (once && index === 0) break;
    }
  }

  window.Show = { run, h, avatar, ease, clock, Aborted, BOUNCE, EASE_OUT, W, H };
})();
