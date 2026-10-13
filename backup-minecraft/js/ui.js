// HTML overlay widgets in Minecraft style: chat, toasts, boss bar, scoreboard, titles,
// hotbar, name tags, cursor, logo.
(function () {
  'use strict';
  const stage = document.getElementById('stage');
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  function h(tag, cls, html, parent) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined && html !== null) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  }
  const t = (text, color, cls) => `<span class="t${color ? ' c-' + color : ''}${cls ? ' ' + cls : ''}">${esc(text)}</span>`;

  const layer = {
    labels: h('div', 'labels', '', stage),
    hud: h('div', 'hud', '', stage),
    screen: h('div', 'screen', '', stage),
    top: h('div', 'top', '', stage),
  };

  // fit the 1920x1080 stage into the window
  let scale = 1, offX = 0, offY = 0;
  function fit() {
    const w = window.innerWidth, hh = window.innerHeight;
    scale = Math.min(w / 1920, hh / 1080);
    offX = (w - 1920 * scale) / 2; offY = (hh - 1080 * scale) / 2;
    stage.style.transform = `translate(${offX}px, ${offY}px) scale(${scale})`;
  }
  fit();
  window.addEventListener('resize', fit);
  // normalized screen position (0..1 of the window) -> stage coordinates
  function toStage(nx, ny) { return { x: (nx * window.innerWidth - offX) / scale, y: (ny * window.innerHeight - offY) / scale }; }

  // ---------- chat ----------
  class Chat {
    constructor() { this.el = h('div', 'chat', '', layer.hud); this.msgs = []; this.key = ''; }
    push(html, now) { this.msgs.push({ html, at: now, id: Chat.id++ }); if (this.msgs.length > 40) this.msgs.shift(); }
    clear() { this.msgs = []; this.key = ''; this.el.innerHTML = ''; }
    render(now) {
      const vis = this.msgs.filter(m => now - m.at < 10 && now >= m.at).slice(-7);
      const key = vis.map(m => m.id).join(',');
      if (key !== this.key) {
        this.key = key;
        this.el.innerHTML = vis.map(m => `<div class="line">${m.html}</div>`).join('');
      }
      const lines = this.el.children;
      vis.forEach((m, i) => { const age = now - m.at; lines[i].style.opacity = age > 8 ? Math.max(0, 1 - (age - 8) / 2) : 1; });
    }
  }
  Chat.id = 0;

  // ---------- advancement toasts ----------
  class Toasts {
    constructor() { this.el = h('div', 'toasts', '', layer.top); this.items = []; }
    show(icon, title, text, now, titleColor) {
      const e = h('div', 'toast', `<img src="${icon}" alt=""><div><div class="h">${t(title, titleColor || 'yellow')}</div><div class="m">${t(text)}</div></div>`, this.el);
      this.items.push({ e, at: now });
    }
    clear() { this.items.forEach(i => i.e.remove()); this.items = []; }
    render(now) {
      const D = 4.2;
      this.items = this.items.filter(i => { if (now - i.at > D || now < i.at - 0.01) { i.e.remove(); return false; } return true; });
      this.items.forEach((i, k) => {
        const a = now - i.at;
        const x = a < 0.35 ? (1 - a / 0.35) : a > D - 0.35 ? (a - (D - 0.35)) / 0.35 : 0;
        i.e.style.transform = `translate(${x * 680}px, ${16 + k * 140}px)`;
      });
    }
  }

  // ---------- boss bar ----------
  class Boss {
    constructor() {
      this.el = h('div', 'boss', '<div class="name t"></div><div class="bar"><div class="fill"></div></div>', layer.hud);
      const bar = this.el.querySelector('.bar');
      for (let i = 1; i < 10; i++) h('div', 'notch', '', bar).style.left = (i * 10) + '%';
      this.name = this.el.querySelector('.name'); this.fill = this.el.querySelector('.fill');
    }
    set(html, f) { if (this.name.innerHTML !== html) this.name.innerHTML = html; this.fill.style.width = (Math.max(0, Math.min(1, f)) * 100) + '%'; }
  }

  // ---------- sidebar scoreboard ----------
  class Score {
    constructor(title) { this.el = h('div', 'score', '', layer.hud); this.title = title; this.cells = null; }
    set(rows) {
      if (!this.cells) {
        this.el.innerHTML = `<div class="head">${t(this.title, 'yellow', 'b')}</div>` + rows.map(r => `<div class="row"><span class="t">${esc(r[0])}</span><span class="t v"></span></div>`).join('');
        this.cells = [...this.el.querySelectorAll('.v')];
      }
      rows.forEach((r, i) => { const s = typeof r[1] === 'number' ? fmt(r[1]) : r[1]; if (this.cells[i].textContent !== s) this.cells[i].textContent = s; });
    }
  }

  // ---------- big title (the /title command) ----------
  class Title {
    constructor(top) { this.el = h('div', 'mtitle', '', layer.hud); this.el.style.top = (top || 300) + 'px'; this.cur = null; }
    show(big, sub, now, dur, opts) { this.cur = { big, sub, at: now, dur: dur || 3, opts: opts || {} }; this.el.innerHTML = `<div class="big t ${this.cur.opts.bigCls || ''}">${big}</div>` + (sub ? `<div class="sub t ${this.cur.opts.subCls || ''}">${sub}</div>` : ''); }
    hide() { this.cur = null; this.el.style.opacity = 0; }
    render(now) {
      if (!this.cur) { this.el.style.opacity = 0; return; }
      const a = now - this.cur.at, d = this.cur.dur;
      this.el.style.opacity = a < 0 ? 0 : a < 0.4 ? a / 0.4 : a > d - 0.6 ? Math.max(0, (d - a) / 0.6) : 1;
    }
  }

  // ---------- hotbar ----------
  function hotbar(icons, sel) {
    const e = h('div', 'hotbar', icons.map((ic, i) => `<div class="s${i === sel ? ' sel' : ''}"><img src="${ic}" alt=""></div>`).join(''), layer.hud);
    e.select = (k) => [...e.children].forEach((c, i) => c.classList.toggle('sel', i === k));
    return e;
  }

  // ---------- name tags ----------
  class Labels {
    constructor() { this.items = []; }
    add(html, pos, cls, opts) {
      const e = h('div', 'tag t ' + (cls || ''), html, layer.labels);
      const it = Object.assign({ e, pos, opacity: 1, ref: 14, min: 0.35, max: 1.4 }, opts || {});
      this.items.push(it);
      return it;
    }
    clear() { this.items.forEach(i => i.e.remove()); this.items = []; }
    remove(it) { it.e.remove(); this.items = this.items.filter(x => x !== it); }
    render(world) {
      const cam = world.camera;
      for (const it of this.items) {
        const p = typeof it.pos === 'function' ? it.pos() : it.pos;
        const op = typeof it.opacity === 'function' ? it.opacity() : it.opacity;
        if (!p || op <= 0.01) { it.e.style.display = 'none'; continue; }
        const q = world.project(p);
        if (!q || q.x < -0.1 || q.x > 1.1 || q.y < -0.1 || q.y > 1.1) { it.e.style.display = 'none'; continue; }
        const d = cam.position.distanceTo(p);
        const s = Math.max(it.min, Math.min(it.max, it.ref / d));
        const st = toStage(q.x, q.y);
        it.e.style.display = 'block';
        it.e.style.opacity = op;
        it.e.style.zIndex = String(1000 - Math.round(d));
        it.e.style.transform = `translate(${st.x}px, ${st.y}px) translate(-50%, -100%) scale(${s})`;
      }
    }
  }

  // ---------- cursor (pixel arrow) ----------
  const cursorURL = (() => {
    const rows = ['X...........', 'XX..........', 'XwX.........', 'XwwX........', 'XwwwX.......', 'XwwwwX......', 'XwwwwwX.....', 'XwwwwwwX....',
      'XwwwwwwwX...', 'XwwwwwwwwX..', 'XwwwwwXXXXX.', 'XwwXwwX.....', 'XwX.XwwX....', 'XX..XwwX....', 'X....XwwX...', '.....XwwX...', '......XX....'];
    const c = document.createElement('canvas'); c.width = 12; c.height = 17;
    const g = c.getContext('2d');
    rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '.') return; g.fillStyle = ch === 'X' ? '#000' : '#fff'; g.fillRect(x, y, 1, 1); }));
    return c.toDataURL();
  })();
  function cursor(parent) { const e = h('img', 'cursor', null, parent || layer.top); e.src = cursorURL; e.move = (x, y) => { e.style.transform = `translate(${x}px, ${y}px)`; }; return e; }

  // ---------- logo: blocky stone letters ----------
  const GLYPH = {
    C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'], L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
    O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'], U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'], '-': ['....', '....', '....', '####', '....', '....', '....'],
    B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'], A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'], I: ['###', '.#.', '.#.', '.#.', '.#.', '.#.', '###'],
    S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'], T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  };
  function logo(text, cell) {
    cell = cell || 16;
    const sub = cell / 4;
    const cols = [];
    for (const ch of text) { const g = GLYPH[ch]; if (!g) continue; cols.push(g); }
    const width = cols.reduce((a, g) => a + g[0].length + 1, -1);
    const depth = 3; // sub-pixels of extrusion
    const c = document.createElement('canvas');
    c.width = width * cell + 2 * sub + depth * sub; c.height = 7 * cell + 2 * sub + depth * sub;
    const g = c.getContext('2d');
    const R = PX.rng(2019);
    const on = new Set();
    let ox = 0;
    for (const gl of cols) { gl.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '#') on.add((ox + x) + ',' + y); })); ox += gl[0].length + 1; }
    const has = (x, y) => on.has(x + ',' + y);
    // outline + extrusion
    for (const k of on) {
      const [x, y] = k.split(',').map(Number);
      for (let d = depth; d >= 1; d--) {
        g.fillStyle = d === depth ? '#1b1b1b' : '#3a3a3a';
        g.fillRect(sub + x * cell + d * sub * 0.6 - sub, sub + y * cell + d * sub - sub, cell + 2 * sub, cell + 2 * sub);
      }
    }
    for (const k of on) { const [x, y] = k.split(',').map(Number); g.fillStyle = '#111'; g.fillRect(x * cell, y * cell, cell + 2 * sub, cell + 2 * sub); }
    // stone faces with bevel
    const stone = ['#9a9a9a', '#8c8c8c', '#a6a6a6', '#7f7f7f', '#959595'];
    for (const k of on) {
      const [x, y] = k.split(',').map(Number);
      for (let sy = 0; sy < 4; sy++) for (let sx = 0; sx < 4; sx++) {
        let col = stone[Math.floor(R() * stone.length)];
        if (sy === 0 && !has(x, y - 1)) col = '#d0d0d0';
        else if (sx === 0 && !has(x - 1, y)) col = '#bdbdbd';
        else if (sy === 3 && !has(x, y + 1)) col = '#5e5e5e';
        else if (sx === 3 && !has(x + 1, y)) col = '#6c6c6c';
        g.fillStyle = col;
        g.fillRect(sub + x * cell + sx * sub, sub + y * cell + sy * sub, sub, sub);
      }
    }
    return c;
  }

  // ---------- misc ----------
  function dirt(e) { e.classList.add('dirt'); e.style.backgroundImage = `url(${PX.tileURL('dirt', 8)})`; return e; }
  const fadeEl = document.getElementById('fade');
  const dimEl = document.getElementById('dim');

  window.UI = {
    h, t, esc, fmt, layer, toStage, Chat, Toasts, Boss, Score, Title, Labels, hotbar, cursor, logo, dirt,
    fade(v) { fadeEl.style.opacity = v; },
    dim(v) { dimEl.style.opacity = v; },
    clear() { layer.hud.innerHTML = ''; layer.screen.innerHTML = ''; layer.top.innerHTML = ''; layer.labels.innerHTML = ''; },
  };
})();
