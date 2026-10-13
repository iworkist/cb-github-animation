// Pixel art in the Minecraft item style: 16x16 sprites with a dark outline and flat shading.
// Everything is drawn in code (no image files), so the show also runs from file://.
(function () {
  function hex(c) {
    if (Array.isArray(c)) return c;
    const n = parseInt(c.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
  }
  const mix = (a, b, t) => { a = hex(a); b = hex(b); return [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t)).concat(255); };
  const shade = (c, f) => { c = hex(c); return [Math.round(c[0] * f), Math.round(c[1] * f), Math.round(c[2] * f), 255]; };

  // ---- a 16x16 RGBA painter ----
  function Tile() { this.d = new Uint8ClampedArray(16 * 16 * 4); }
  Tile.prototype.set = function (x, y, c) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x > 15 || y > 15) return;
    c = hex(c);
    const i = (y * 16 + x) * 4;
    this.d[i] = c[0]; this.d[i + 1] = c[1]; this.d[i + 2] = c[2]; this.d[i + 3] = c[3] === undefined ? 255 : c[3];
  };
  Tile.prototype.alpha = function (x, y) { return x < 0 || y < 0 || x > 15 || y > 15 ? 0 : this.d[(y * 16 + x) * 4 + 3]; };
  Tile.prototype.canvas = function () {
    const c = document.createElement('canvas');
    c.width = c.height = 16;
    c.getContext('2d').putImageData(new ImageData(this.d, 16, 16), 0, 0);
    return c;
  };

  // outline every empty pixel next to an opaque one (the Minecraft item look)
  function outline(t, col) {
    const o = new Uint8ClampedArray(t.d), c = hex(col);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      if (t.alpha(x, y)) continue;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => t.alpha(x + dx, y + dy) > 200)) {
        const i = (y * 16 + x) * 4;
        o[i] = c[0]; o[i + 1] = c[1]; o[i + 2] = c[2]; o[i + 3] = 255;
      }
    }
    t.d = o;
    return t;
  }

  // ---- hand-drawn maps ('.' is transparent, letters index the palette) ----
  const PAL = {
    o: '#24150d', k: '#120a06', w: '#ffffff', W: '#f4efe6', g: '#d4ccbf', G: '#a59b8d',
    y: '#ffd966', b: '#7f6000', c: '#6b3a19', C: '#c8894a', q: '#cfe6f2',
    t: '#c08a4a', T: '#94622c', u: '#5e3a16', s: '#d2ad73', S: '#a8854f', x: '#6e5228',
    r: '#f0443c', R: '#a8241f', n: '#3fb950', v: '#a371f7',
    m: '#e0b030', M: '#b07a18', l: '#6fb3e8', L: '#3a7ac8', N: '#2a8a3f', e: '#5ad66f',
  };
  const MAPS = {
    // ceramic mug of coffee with the Cloud-Barista dots on it
    mug: ['................', '................', '................', '..ooooooooo.....', '.oCCcCCCcCCo....', '.owWWWWWWWgoooo.',
      '.owyyWWyyWgoWWWo', '.owyybbyyWgoo.Wo', '.owWbbbbWWgoo.Wo', '.owWbbbbWWgoWWWo', '.owyybbyyWgoooo.', '.owyyWWyyWgo....',
      '.oWWWWWWWggo....', '..oGgggggGo.....', '...ooooooo......', '................'],
    // a glass of any drink: D drink, E highlight, Q shade, F/f foam (recolored per release)
    cup: ['................', '................', '................', '..ooooooooo.....', '.oFFfFFFfFFo....', '.oEFFFFFFFQoooo.',
      '.oEDDDDDDDQoqqqo', '.oEDDDDDDDQoo.qo', '.oEDDDDDDDQoo.qo', '.oEDDDDDDDQoqqqo', '.oEDDDDDDDQoooo.', '.oEDDDDDDDQo....',
      '.oDDDDDDDQQo....', '..oQQQQQQQo.....', '...ooooooo......', '................'],
    // tea is brewed: a Minecraft potion bottle
    potion: ['................', '......oooo......', '......otto......', '......oTTo......', '.....oqwqqo.....', '......oqqo......',
      '.....oqDDqo.....', '....oEDDDDQo....', '...oEwDDDDDQo...', '...oEDDDDDDQo...', '...oDDDDDDDQo...', '...oQDDDDDQQo...',
      '....oQQDQQQo....', '.....oooooo.....', '................', '................'],
    // a sack of beans; L/l = label
    sack: ['................', '......o..o......', '.....osooSo.....', '......oxxo......', '.....osssSo.....', '....osssssSo....',
      '...osssssssSo...', '..osLLLLLLLsSo..', '..osLlllllLsSo..', '..osLlllllLsSo..', '..osLLLLLLLsSo..', '.ossssssssssSSo.',
      '.osssssssssSSSo.', '..oSSSSSSSSSSo..', '...oooooooooo...', '................'],
    cloud: ['................', '................', '................', '................', '.....oooo.......', '....owwwwo.ooo..',
      '..oowwwwwwowwwo.', '.owwwwwwwwwwwwo.', 'owwwwwwwwwwwwwwo', 'owwwwwwwwwwwwwgo', 'ogwwwwwwwwwwwggo', '.oggggggggggggo.',
      '..oooooooooooo..', '................', '................', '................'],
    heart: ['................', '................', '..ooo.....ooo...', '.orrro...orrro..', 'orrwrro.orrrrro.', 'orwrrrrorrrrrro.',
      'orrrrrrrrrrrrro.', 'orrrrrrrrrrrRro.', '.orrrrrrrrrRro..', '..orrrrrrrRro...', '...orrrrrRro....', '....orrrRro.....',
      '.....orRro......', '......oro.......', '.......o........', '................'],
    chest: ['................', '................', '..oooooooooooo..', '..otttttttttto..', '..otTTTTTTTTto..', '..otttttttttto..',
      '..ouuuuuuuuuuo..', '..oTTTTggTTTTo..', '..ottttGGtttto..', '..otttttttttto..', '..oTTTTTTTTTTo..', '..otttttttttto..',
      '..otttttttttto..', '..oTTTTTTTTTTo..', '..oooooooooooo..', '................'],
    clock: ['................', '.....oooooo.....', '....oMmmmmMo....', '...oMyyyyyymMo..', '..oMyllllllymo..', '..omylllllllymo.',
      '..omyLlllllLymo.', '..omynnnynnnymo.', '..omyNnnnnnNymo.', '..omynnnnnnnymo.', '..oMyyNnnnNyyMo.', '...oMyyyyyyyMo..',
      '....oMmmmmmMo...', '.....oooooo.....', '................', '................'],
  };
  function fromMap(name, recolor) {
    const pal = Object.assign({}, PAL, recolor || {});
    const t = new Tile();
    MAPS[name].forEach((row, y) => {
      for (let x = 0; x < 16; x++) if (row[x] !== '.' && pal[row[x]]) t.set(x, y, pal[row[x]]);
    });
    return t;
  }

  // ---- procedural sprites ----
  function ell(t, cx, cy, rx, ry, col, ang, light) {
    const ca = Math.cos(ang || 0), sa = Math.sin(ang || 0);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      const u = dx * ca + dy * sa, v = -dx * sa + dy * ca;
      if ((u / rx) ** 2 + (v / ry) ** 2 <= 1) {
        const f = light ? 1.18 - 0.36 * ((dx + dy) / (rx + ry) + 0.5) : 1;
        t.set(x, y, shade(col, Math.max(0.55, Math.min(1.25, f))));
      }
    }
  }
  function line(t, x0, y0, x1, y1, c) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 + 1;
    for (let i = 0; i <= n; i++) t.set(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c);
  }

  // a roasted coffee bean, tilted, with its center crease
  function bean(o) {
    const t = new Tile();
    const base = (o && o.color) || '#8a5226', ang = -0.75;
    ell(t, 8, 8, 6.4, 4.3, base, ang, true);
    const ca = Math.cos(ang), sa = Math.sin(ang);
    for (let s = -5.2; s <= 5.2; s += 0.25) {
      const v = 0.9 * Math.sin(s * 0.55);
      t.set(8 + s * ca - v * sa - 0.5, 8 + s * sa + v * ca - 0.5, shade(base, 0.38));
    }
    t.set(5, 6, mix(base, '#ffffff', 0.45)); t.set(6, 5, mix(base, '#ffffff', 0.3));
    return outline(t, PAL.o);
  }
  function spark(o) {
    const t = new Tile(), c = (o && o.color) || '#ffd966';
    for (let i = 1; i <= 6; i++) { t.set(7 + i, 7, c); t.set(7 - i, 7, c); t.set(7, 7 + i, c); t.set(7, 7 - i, c); }
    for (const [x, y] of [[6, 6], [8, 6], [6, 8], [8, 8]]) t.set(x, y, c);
    t.set(7, 7, '#ffffff'); t.set(6, 7, '#fff6c8'); t.set(8, 7, '#fff6c8'); t.set(7, 6, '#fff6c8'); t.set(7, 8, '#fff6c8');
    return t;
  }
  // git merge: two commits joined into one
  function merge() {
    const t = new Tile(), c = '#b392ff';
    line(t, 4, 3, 4, 13, c); line(t, 5, 3, 5, 13, c);
    for (let a = 0; a <= 1; a += 0.05) { const x = 4.5 + a * 7, y = 4 + Math.sin(a * Math.PI / 2) * 4.5; t.set(x, y, c); t.set(x, y + 1, c); }
    ell(t, 5, 3.5, 2.6, 2.6, '#d2bfff'); ell(t, 5, 13, 2.6, 2.6, '#d2bfff'); ell(t, 12, 9, 2.6, 2.6, c);
    return outline(t, PAL.o);
  }
  // GitHub-style issue: a ring with a dot
  function issue() {
    const t = new Tile(), c = '#3fd06a';
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const d = Math.hypot(x + 0.5 - 8, y + 0.5 - 8);
      if (d <= 6.6 && d >= 4.6) t.set(x, y, c);
      if (d <= 1.8) t.set(x, y, c);
    }
    return outline(t, PAL.o);
  }
  function star() {
    const t = new Tile(), c = '#ffd23f';
    const pts = [];
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 3.1 : 7.4, a = -Math.PI / 2 + i * Math.PI / 5; pts.push([8 + r * Math.cos(a), 8.6 + r * Math.sin(a)]); }
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      let inside = false;
      const px = x + 0.5, py = y + 0.5;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
      }
      if (inside) t.set(x, y, y < 8 ? mix(c, '#ffffff', 0.25) : c);
    }
    return outline(t, PAL.o);
  }

  // ---- insects (the repositories named after bugs) ----
  function bug(spec) {
    const t = new Tile();
    for (const w of spec.wings || []) {
      const c = hex(w[4]);
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        if (((x + 0.5 - w[0]) / w[2]) ** 2 + ((y + 0.5 - w[1]) / w[3]) ** 2 <= 1) t.set(x, y, [c[0], c[1], c[2], w[5] || 210]);
      }
    }
    for (const l of spec.legs || []) line(t, l[0], l[1], l[2], l[3], spec.legc || '#2a2a2a');
    for (const s of spec.body) ell(t, s[0], s[1], s[2], s[3], s[4], 0, true);
    for (const p of spec.dots || []) t.set(p[0], p[1], p[2]);
    for (const l of spec.lines || []) line(t, l[0], l[1], l[2], l[3], l[4]);
    return outline(t, spec.outline || '#1b1410');
  }
  const legs6 = (y0, y1, s) => [[8, y0, 8 - s, y0 - 2], [8, y0, 8 + s, y0 - 2], [8, (y0 + y1) / 2, 8 - s - 1, (y0 + y1) / 2],
    [8, (y0 + y1) / 2, 8 + s + 1, (y0 + y1) / 2], [8, y1, 8 - s, y1 + 2], [8, y1, 8 + s, y1 + 2]];
  const BUGS = {
    spider: { legs: [[8, 7, 2, 3], [8, 7, 14, 3], [8, 8, 1, 7], [8, 8, 15, 7], [8, 9, 1, 11], [8, 9, 15, 11], [8, 10, 3, 14], [8, 10, 13, 14]],
      body: [[8, 10.5, 4, 4, '#4a3d35'], [8, 5.5, 3, 2.6, '#5a4a40']], dots: [[6, 5, '#ff2a2a'], [9, 5, '#ff2a2a'], [7, 4, '#ff6a5a'], [8, 4, '#ff6a5a']] },
    tumblebug: { legs: legs6(6, 11, 4.5), body: [[11.5, 4.5, 3.2, 3.2, '#a8702f'], [7, 9.5, 4, 4.5, '#3b342c'], [7, 4.8, 2.2, 1.6, '#2a241f']],
      lines: [[7, 6, 7, 13, '#5a5046']], dots: [[11, 3, '#d09a55'], [12, 5, '#7b4f22']] },
    beetle: { legs: legs6(6, 11, 4.5), body: [[8, 9.5, 4.5, 5, '#2f9a63'], [8, 4, 2.5, 1.8, '#1d5a3b']],
      lines: [[8, 5, 8, 14, '#174a30'], [6, 2, 5, 0, '#174a30'], [10, 2, 11, 0, '#174a30']], dots: [[6, 7, '#8df0b6'], [10, 7, '#8df0b6']] },
    ladybug: { legs: legs6(7, 11, 4.5), body: [[8, 9.5, 5, 5, '#e0301f'], [8, 4, 2.6, 1.8, '#1a1a1a']],
      lines: [[8, 5, 8, 14, '#1a1a1a']], dots: [[5, 8, '#1a1a1a'], [10, 8, '#1a1a1a'], [6, 11, '#1a1a1a'], [11, 12, '#1a1a1a'], [5, 12, '#1a1a1a'], [10, 11, '#1a1a1a'], [6, 7, '#ff9a8a']] },
    dragonfly: { wings: [[4, 5, 4, 1.6, '#cfefff'], [12, 5, 4, 1.6, '#cfefff'], [4, 8, 3.6, 1.4, '#cfefff'], [12, 8, 3.6, 1.4, '#cfefff']],
      body: [[8, 12, 1, 4, '#1f8fa8'], [8, 6.5, 1.6, 2.6, '#2bb3a0'], [8, 3, 2, 1.6, '#167a70']], dots: [[7, 3, '#7af2ff'], [9, 3, '#7af2ff']] },
    damselfly: { wings: [[4.5, 6, 3.5, 1.2, '#d8e4ff'], [11.5, 6, 3.5, 1.2, '#d8e4ff'], [4.5, 8, 3.2, 1.1, '#d8e4ff'], [11.5, 8, 3.2, 1.1, '#d8e4ff']],
      body: [[8, 12, 0.8, 4.2, '#3a6cf0'], [8, 7, 1.2, 2.2, '#4b7dff'], [8, 3.5, 1.6, 1.3, '#2a4cb0']] },
    mayfly: { wings: [[5, 5, 3, 3.5, '#f2ecd2'], [11, 5, 3, 3.5, '#f2ecd2']], body: [[8, 10, 1.2, 4, '#c8a95a'], [8, 4, 1.5, 1.5, '#9a7b3a']],
      lines: [[8, 13, 6, 15, '#9a7b3a'], [8, 13, 10, 15, '#9a7b3a']] },
    honeybee: { wings: [[4.5, 5, 3, 2.4, '#e8f6ff'], [11.5, 5, 3, 2.4, '#e8f6ff']], legs: [[8, 9, 4, 12], [8, 9, 12, 12]],
      body: [[8, 9.5, 4, 4.5, '#f4c21b'], [8, 4, 2.4, 2, '#3a2a12']], lines: [[4, 8, 12, 8, '#3a2a12'], [4, 11, 12, 11, '#3a2a12']] },
    ant: { legs: legs6(8, 10, 4.5), body: [[8, 12.5, 2.6, 2.8, '#8a3a1e'], [8, 8.5, 1.5, 1.8, '#9a4a2a'], [8, 4.5, 2.2, 2, '#7a2a16']],
      lines: [[7, 2, 5, 0, '#4a1a0e'], [9, 2, 11, 0, '#4a1a0e']] },
    cicada: { wings: [[5, 9, 3, 5.5, '#cfe8d8'], [11, 9, 3, 5.5, '#cfe8d8']], body: [[8, 9, 2.6, 4.5, '#5b6a3a'], [8, 4, 3, 1.8, '#4a5530']],
      dots: [[5, 4, '#b8e05a'], [11, 4, '#b8e05a']] },
    grasshopper: { legs: [[7, 9, 3, 4], [3, 4, 2, 13], [9, 9, 13, 4], [13, 4, 14, 13], [7, 7, 5, 11], [9, 7, 11, 11]], legc: '#4f8a2a',
      body: [[8, 9, 2, 5.5, '#7fc34a'], [8, 3.5, 2, 2, '#6aaa3e']], dots: [[7, 3, '#2a2a2a'], [9, 3, '#2a2a2a']] },
    butterfly: { wings: [[4.5, 5, 3.6, 3.6, '#ff8a1e', 255], [11.5, 5, 3.6, 3.6, '#ff8a1e', 255], [5, 11, 2.8, 2.8, '#ffb35a', 255], [11, 11, 2.8, 2.8, '#ffb35a', 255]],
      body: [[8, 8.5, 0.9, 5.5, '#2a1d14']], dots: [[4, 4, '#1d1d1d'], [12, 4, '#1d1d1d'], [3, 6, '#fff3d0'], [13, 6, '#fff3d0'], [5, 11, '#1d1d1d'], [11, 11, '#1d1d1d']],
      lines: [[8, 3, 6, 0, '#2a1d14'], [8, 3, 10, 0, '#2a1d14']] },
    centipede: { legs: [3, 5, 7, 9, 11, 13].flatMap((y) => [[8, y, 4, y + 1], [8, y, 12, y + 1]]), legc: '#8a4a1e',
      body: [2, 4, 6, 8, 10, 12, 14].map((y, i) => [8, y + 0.5, 2.1, 1.3, i === 0 ? '#6a3a18' : '#c0662a']) },
    larva: { body: [[4, 12, 2.4, 2.4, '#d9e6a8'], [6.5, 10, 2.6, 2.6, '#cfe09a'], [9, 8, 2.8, 2.8, '#c5d98c'], [11.2, 5.6, 2.6, 2.6, '#bcd27e']],
      dots: [[12, 4, '#2a2a2a'], [11, 5, '#2a2a2a']] },
  };

  // ---- public API ----
  const cache = {};
  function tile(name, o) {
    o = o || {};
    if (name === 'cup' || name === 'potion') {
      const d = o.drink || '#4a2a12', f = o.foam || mix(d, '#ffffff', 0.55);
      return fromMap(name, { D: d, E: mix(d, '#ffffff', 0.32), Q: shade(d, 0.7), F: f, f: shade(f, 0.86) });
    }
    if (name === 'sack') return fromMap('sack', { L: o.label || '#ffd966', l: mix(o.label || '#ffd966', '#ffffff', 0.35) });
    if (MAPS[name]) return fromMap(name, o.recolor);
    if (name === 'bean') return bean(o);
    if (name === 'spark') return spark(o);
    if (name === 'merge') return merge();
    if (name === 'issue') return issue();
    if (name === 'star') return star();
    if (BUGS[name]) return bug(BUGS[name]);
    return fromMap('mug');
  }
  function canvas(name, o) {
    const key = name + JSON.stringify(o || {});
    if (!cache[key]) {
      const c = tile(name, o).canvas();
      cache[key] = { canvas: c, url: c.toDataURL() };
    }
    return cache[key];
  }
  // <img> scaled up with crisp pixels
  function img(name, o, size, cls) {
    const el = document.createElement('img');
    el.className = 'px' + (cls ? ' ' + cls : '');
    el.src = canvas(name, o).url;
    el.alt = '';
    el.draggable = false;
    if (size) { el.width = size; el.height = size; }
    return el;
  }
  // The pixel item for a release: coffee in a cup, tea in a potion bottle.
  function drink(rel, size, cls) {
    return img(rel.kind === 'tea' ? 'potion' : 'cup', { drink: rel.drink, foam: rel.foam }, size, cls);
  }
  const INSECT = {
    'cb-spider': 'spider', 'cb-tumblebug': 'tumblebug', 'cb-dragonfly': 'dragonfly', 'cb-ladybug': 'ladybug', 'cb-larva': 'larva',
    'cm-beetle': 'beetle', 'cm-honeybee': 'honeybee', 'cm-ant': 'ant', 'cm-cicada': 'cicada', 'cm-grasshopper': 'grasshopper',
    'cm-butterfly': 'butterfly', 'cm-damselfly': 'damselfly', 'cm-mayfly': 'mayfly', 'cm-centipede': 'centipede',
  };

  window.PX = { canvas, img, drink, INSECT, mix, hex };
})();
