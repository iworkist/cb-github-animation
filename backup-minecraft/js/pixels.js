// Procedural pixel art: 16x16 block textures (packed into a WebGL atlas) and item icons.
// Nothing is loaded from disk, so the show also runs from file://.
(function () {
  'use strict';

  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function hex(c) {
    if (Array.isArray(c)) return c;
    const n = parseInt(c.slice(1), 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255, 255];
  }
  function mul(c, f) { c = hex(c); return [c[0] * f, c[1] * f, c[2] * f, c[3] === undefined ? 255 : c[3]]; }

  // ---- a 16x16 painter ----
  function Tile(seed) {
    this.d = new Uint8ClampedArray(16 * 16 * 4);
    this.r = rng(seed);
  }
  Tile.prototype.set = function (x, y, c) {
    if (x < 0 || y < 0 || x > 15 || y > 15) return;
    c = hex(c);
    const i = (y * 16 + x) * 4;
    this.d[i] = c[0]; this.d[i + 1] = c[1]; this.d[i + 2] = c[2]; this.d[i + 3] = c[3] === undefined ? 255 : c[3];
  };
  Tile.prototype.get = function (x, y) {
    const i = (y * 16 + x) * 4;
    return [this.d[i], this.d[i + 1], this.d[i + 2], this.d[i + 3]];
  };
  Tile.prototype.noise = function (pal, j) {
    j = j || 0;
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const c = hex(pal[Math.floor(this.r() * pal.length)]);
      const f = 1 + (this.r() - 0.5) * j;
      this.set(x, y, [c[0] * f, c[1] * f, c[2] * f, c[3]]);
    }
    return this;
  };
  Tile.prototype.rect = function (x0, y0, w, h, c) {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) this.set(x, y, typeof c === 'function' ? c(x, y) : c);
    return this;
  };
  Tile.prototype.speck = function (pal, n) {
    for (let k = 0; k < n; k++) this.set(Math.floor(this.r() * 16), Math.floor(this.r() * 16), pal[Math.floor(this.r() * pal.length)]);
    return this;
  };
  Tile.prototype.bevel = function (light, dark) {
    for (let i = 0; i < 16; i++) {
      this.set(i, 0, light); this.set(0, i, light);
      this.set(i, 15, dark); this.set(15, i, dark);
    }
    return this;
  };
  Tile.prototype.canvas = function (scale) {
    scale = scale || 1;
    const c = document.createElement('canvas');
    c.width = c.height = 16 * scale;
    const g = c.getContext('2d');
    const img = new ImageData(new Uint8ClampedArray(this.d), 16, 16);
    if (scale === 1) { g.putImageData(img, 0, 0); return c; }
    const s = document.createElement('canvas'); s.width = s.height = 16;
    s.getContext('2d').putImageData(img, 0, 0);
    g.imageSmoothingEnabled = false;
    g.drawImage(s, 0, 0, 16 * scale, 16 * scale);
    return c;
  };

  // ---- block textures ----
  const T = {};
  function def(name, fn, seed) { const t = new Tile(seed || hash(name)); fn(t); T[name] = t; return t; }

  const DIRT = ['#8b5e3c', '#7a5233', '#966c4a', '#6b4a2f', '#a07552', '#8b5e3c'];
  const GRASS = ['#6aa84f', '#5f9a45', '#76b358', '#58913f', '#6fae52'];
  const STONE = ['#7d7d7d', '#858585', '#747474', '#8f8f8f', '#7a7a7a'];

  def('dirt', t => t.noise(DIRT, 0.08));
  def('grass_top', t => t.noise(GRASS, 0.1).speck(['#4f8a38', '#80bd60'], 18));
  def('grass_side', t => {
    t.noise(DIRT, 0.08);
    for (let x = 0; x < 16; x++) {
      const h = 2 + Math.floor(t.r() * 3);
      for (let y = 0; y < h; y++) t.set(x, y, GRASS[Math.floor(t.r() * GRASS.length)]);
    }
  });
  def('path_top', t => t.noise(['#9a7f48', '#8f7442', '#a68b52', '#86703f'], 0.06));
  def('path_side', t => { t.noise(DIRT, 0.08); t.rect(0, 0, 16, 1, '#9a7f48'); });
  def('stone', t => {
    t.noise(STONE, 0.05);
    for (let k = 0; k < 7; k++) { const x = Math.floor(t.r() * 13), y = Math.floor(t.r() * 16); t.rect(x, y, 2 + Math.floor(t.r() * 3), 1, '#6a6a6a'); }
  });
  function cobble(t, moss) {
    t.noise(['#5a5a5a', '#525252'], 0.05);
    const stones = [[0, 0, 6, 5], [6, 0, 5, 4], [11, 0, 5, 6], [0, 5, 4, 6], [4, 4, 7, 5], [11, 6, 5, 5], [0, 11, 6, 5], [6, 9, 5, 7], [11, 11, 5, 5]];
    for (const [x, y, w, h] of stones) {
      const base = ['#9a9a9a', '#8a8a8a', '#7e7e7e', '#a4a4a4'][Math.floor(t.r() * 4)];
      t.rect(x + 1, y + 1, w - 1, h - 1, () => mul(base, 0.92 + t.r() * 0.16));
      t.rect(x + 1, y + 1, w - 1, 1, mul(base, 1.12));
    }
    if (moss) for (let k = 0; k < 7; k++) {
      const x = Math.floor(t.r() * 14), y = Math.floor(t.r() * 14);
      t.rect(x, y, 2 + Math.floor(t.r() * 3), 2 + Math.floor(t.r() * 2), () => ['#5c7d36', '#4c6b2c', '#6a8c40'][Math.floor(t.r() * 3)]);
    }
  }
  def('cobble', t => cobble(t, false));
  def('mossy_cobble', t => cobble(t, true));
  def('stone_bricks', t => {
    t.noise(['#7b7b7b', '#777777', '#808080'], 0.06);
    t.rect(0, 7, 16, 1, '#5e5e5e'); t.rect(0, 15, 16, 1, '#5e5e5e');
    t.rect(11, 0, 1, 7, '#5e5e5e'); t.rect(3, 8, 1, 7, '#5e5e5e');
    t.rect(0, 0, 11, 1, '#8c8c8c'); t.rect(12, 0, 4, 1, '#8c8c8c'); t.rect(0, 8, 3, 1, '#8c8c8c'); t.rect(4, 8, 12, 1, '#8c8c8c');
  });
  def('dark_bricks', t => {
    t.noise(['#45454c', '#4b4b52', '#404046'], 0.06);
    for (const y of [3, 7, 11, 15]) t.rect(0, y, 16, 1, '#2c2c31');
    for (let r = 0; r < 4; r++) { const o = r % 2 ? 4 : 0; t.rect(o, r * 4, 1, 3, '#2c2c31'); t.rect(o + 8, r * 4, 1, 3, '#2c2c31'); }
  });
  def('bricks', t => {
    t.noise(['#9a5b48', '#8f5242', '#a3634f'], 0.08);
    for (const y of [3, 7, 11, 15]) t.rect(0, y, 16, 1, '#b3aaa2');
    for (let r = 0; r < 4; r++) { const o = r % 2 ? 4 : 0; t.rect(o, r * 4, 1, 3, '#b3aaa2'); t.rect(o + 8, r * 4, 1, 3, '#b3aaa2'); }
  });
  function planks(t, pal, line) {
    t.noise(pal, 0.05);
    for (let r = 0; r < 4; r++) {
      t.rect(0, r * 4 + 3, 16, 1, line);
      const j = Math.floor(t.r() * 12) + 2;
      t.rect(j, r * 4, 1, 3, line);
      for (let k = 0; k < 3; k++) t.rect(Math.floor(t.r() * 14), r * 4 + Math.floor(t.r() * 3), 3, 1, mul(pal[0], 0.9));
    }
  }
  def('oak_planks', t => planks(t, ['#a2824e', '#9c7c49', '#a98955'], '#7a5f36'));
  def('spruce_planks', t => planks(t, ['#735532', '#6c4f2e', '#7a5a36'], '#523b22'));
  def('birch_planks', t => planks(t, ['#c8b67b', '#c2b075', '#cfbd83'], '#9f8f5c'));
  def('dark_oak_planks', t => planks(t, ['#4c331b', '#472f19', '#52381e'], '#33220f'));
  function log(t, pal) {
    for (let x = 0; x < 16; x++) { const c = pal[Math.floor(t.r() * pal.length)]; for (let y = 0; y < 16; y++) t.set(x, y, t.r() < 0.18 ? pal[Math.floor(t.r() * pal.length)] : c); }
  }
  function logTop(t, bark, rings) {
    t.rect(0, 0, 16, 16, bark);
    for (let y = 1; y < 15; y++) for (let x = 1; x < 15; x++) {
      const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
      t.set(x, y, rings[Math.floor(d) % 2 ? 0 : 1]);
    }
  }
  def('oak_log', t => log(t, ['#6b5434', '#5a4428', '#76603b', '#4e3b22']));
  def('oak_log_top', t => logTop(t, '#5a4428', ['#b5915f', '#9c7a4d']));
  def('birch_log', t => {
    t.noise(['#dad8d0', '#d2d0c6', '#e2e0d8'], 0.04);
    for (let k = 0; k < 7; k++) t.rect(Math.floor(t.r() * 13), Math.floor(t.r() * 16), 2 + Math.floor(t.r() * 3), 1, '#3b3a36');
  });
  def('dark_oak_log', t => log(t, ['#3d2b17', '#33240f', '#45311b']));
  def('leaves', t => {
    t.noise(['#3e7a2b', '#4a8c33', '#356b24', '#2f5f1f', '#447f2e'], 0.08);
    for (let k = 0; k < 26; k++) t.set(Math.floor(t.r() * 16), Math.floor(t.r() * 16), [0, 0, 0, 0]);
  });
  def('sand', t => t.noise(['#dbd3a0', '#d6cc94', '#e2daaa', '#cfc48b'], 0.04));
  def('sandstone', t => {
    t.noise(['#d8cb94', '#d2c48c'], 0.04);
    t.rect(0, 0, 16, 2, '#e3d7a3'); t.rect(0, 12, 16, 1, '#c3b47d'); t.rect(0, 13, 16, 3, '#cdbf88');
  });
  def('water', t => {
    t.noise([[63, 118, 228, 200], [56, 108, 216, 200], [72, 128, 236, 200]], 0.04);
    for (let k = 0; k < 6; k++) t.rect(Math.floor(t.r() * 12), Math.floor(t.r() * 16), 4, 1, [110, 160, 245, 210]);
  });
  def('glass', t => {
    t.rect(0, 0, 16, 16, [0, 0, 0, 0]);
    const f = [222, 240, 250, 255];
    for (let i = 0; i < 16; i++) { t.set(i, 0, f); t.set(0, i, f); t.set(i, 15, [170, 200, 215, 255]); t.set(15, i, [170, 200, 215, 255]); }
    t.set(3, 4, f); t.set(4, 3, f); t.set(5, 2, f); t.set(10, 11, f); t.set(11, 10, f);
  });
  def('blue_glass', t => {
    t.rect(0, 0, 16, 16, [0, 0, 0, 0]);
    const f = [120, 170, 230, 255];
    for (let i = 0; i < 16; i++) { t.set(i, 0, f); t.set(0, i, f); t.set(i, 15, f); t.set(15, i, f); }
    for (let y = 1; y < 15; y++) for (let x = 1; x < 15; x++) if ((x + y) % 7 === 0) t.set(x, y, [170, 210, 250, 255]);
  });
  def('cobweb', t => {
    t.rect(0, 0, 16, 16, [0, 0, 0, 0]);
    const w = [235, 235, 235, 255];
    for (let i = 0; i < 16; i++) { t.set(i, i, w); t.set(15 - i, i, w); t.set(7, i, w); t.set(i, 8, w); }
    for (const r of [3, 6]) for (let a = 0; a < 32; a++) { const an = a / 32 * Math.PI * 2; t.set(Math.round(7.5 + Math.cos(an) * r), Math.round(7.5 + Math.sin(an) * r), w); }
  });
  def('quartz', t => t.noise(['#ebe5de', '#e7e0d8', '#efe9e3'], 0.02));
  def('quartz_pillar', t => { t.noise(['#ebe5de', '#e7e0d8'], 0.02); t.rect(1, 0, 1, 16, '#d6cfc6'); t.rect(14, 0, 1, 16, '#d6cfc6'); });
  function metal(t, base) {
    t.noise([base], 0.05);
    t.bevel(mul(base, 1.15), mul(base, 0.78));
    t.rect(1, 1, 14, 1, mul(base, 1.08));
    for (const [x, y] of [[2, 2], [13, 2], [2, 13], [13, 13]]) t.set(x, y, mul(base, 0.85));
  }
  def('gold_block', t => metal(t, '#f5d23c'));
  def('iron_block', t => metal(t, '#d8d8d8'));
  def('diamond_block', t => metal(t, '#62ddd6'));
  def('emerald_block', t => metal(t, '#2fcd62'));
  def('lapis_block', t => metal(t, '#2a52b0'));
  def('redstone_block', t => metal(t, '#b0200f'));
  def('copper_block', t => metal(t, '#c07150'));
  def('oxidized_copper', t => { t.noise(['#4fab90', '#5bb89e', '#3e8e78', '#62bca4'], 0.06); });
  def('bookshelf', t => {
    planks(t, ['#a2824e', '#9c7c49'], '#7a5f36');
    const books = ['#a33b2c', '#2f5aa0', '#3f7d2b', '#c79a2c', '#6b3f8f', '#8b5a2b', '#d0d0c0'];
    for (const y0 of [1, 9]) {
      let x = 1;
      while (x < 15) {
        const w = 1 + Math.floor(t.r() * 2), c = books[Math.floor(t.r() * books.length)], h = 5 + Math.floor(t.r() * 2);
        t.rect(x, y0 + 6 - h, w, h, c); t.rect(x, y0 + 6 - h, w, 1, mul(c, 1.25));
        x += w;
      }
      t.rect(0, y0 + 6, 16, 1, '#5e4628');
    }
  });
  def('glowstone', t => {
    t.noise(['#8a6a35', '#7a5a2a'], 0.1);
    for (let k = 0; k < 18; k++) { const x = Math.floor(t.r() * 14), y = Math.floor(t.r() * 14); t.rect(x, y, 2 + Math.floor(t.r() * 2), 2, ['#ffdc6e', '#f7c948', '#fff2a8'][Math.floor(t.r() * 3)]); }
  });
  def('sea_lantern', t => {
    t.noise(['#c8e6e0', '#b6dcd4'], 0.05);
    for (let k = 0; k < 4; k++) t.rect([2, 9, 2, 9][k], [2, 2, 9, 9][k], 5, 5, () => ['#f4fffc', '#e2f6f1'][Math.floor(t.r() * 2)]);
    t.bevel('#a9cfc8', '#a9cfc8');
  });
  def('lamp_on', t => {
    t.noise(['#d98d37', '#e7a447', '#c47a2b'], 0.08);
    t.rect(3, 3, 10, 10, () => ['#ffe08a', '#ffd062', '#fff0b8'][Math.floor(t.r() * 3)]);
    t.bevel('#6b3c18', '#6b3c18');
  });
  def('prismarine', t => t.noise(['#63a097', '#4e8c82', '#76b5aa', '#5b9a8a'], 0.06));
  def('dark_prismarine', t => {
    t.noise(['#335b4c', '#2c5243'], 0.05);
    t.rect(0, 0, 16, 1, '#1e3d31'); t.rect(0, 7, 16, 1, '#1e3d31'); t.rect(4, 0, 1, 8, '#1e3d31'); t.rect(11, 8, 1, 8, '#1e3d31');
  });
  def('purpur', t => {
    t.noise(['#a97ca9', '#a274a2', '#b086b0'], 0.04);
    t.rect(0, 7, 16, 1, '#8b5c8b'); t.rect(0, 15, 16, 1, '#8b5c8b'); t.rect(7, 0, 1, 7, '#8b5c8b'); t.rect(15, 8, 1, 8, '#8b5c8b');
  });
  def('amethyst', t => {
    t.noise(['#8d6acc', '#7a58b8', '#9e7ed6'], 0.06);
    for (let k = 0; k < 9; k++) { const x = Math.floor(t.r() * 15), y = Math.floor(t.r() * 14); t.rect(x, y, 1, 2, '#cfb4ff'); }
  });
  def('terracotta', t => t.noise(['#985e43', '#93593f', '#9c6247'], 0.04));
  def('coffee', t => {
    t.noise(['#4b2a14', '#55301a', '#43250f'], 0.05);
    for (let a = 0; a < 40; a++) { const an = a / 40 * Math.PI * 2; const r = 3 + Math.sin(an * 3) * 1.5; t.set(Math.round(7.5 + Math.cos(an) * r), Math.round(7.5 + Math.sin(an) * r), '#c08a52'); }
    t.rect(7, 7, 2, 2, '#d9a96e');
  });
  def('server_front', t => {
    t.noise(['#2d3036', '#33363d'], 0.05);
    for (let r = 0; r < 4; r++) {
      t.rect(1, r * 4 + 1, 14, 3, '#1c1e22');
      t.rect(2, r * 4 + 2, 8, 1, '#4a4f58');
      t.set(12, r * 4 + 2, r % 2 ? '#41ff7a' : '#3ad1ff'); t.set(13, r * 4 + 2, '#ffd23a');
    }
  });
  def('server_side', t => { t.noise(['#3a3e45', '#34383f'], 0.04); for (let y = 2; y < 15; y += 2) t.rect(2, y, 12, 1, '#25282d'); });
  def('crafting_top', t => {
    planks(t, ['#a2824e', '#9c7c49'], '#7a5f36');
    t.bevel('#6b5434', '#6b5434');
    for (let i = 2; i < 14; i++) { t.set(i, 5, '#5a4428'); t.set(i, 10, '#5a4428'); t.set(5, i, '#5a4428'); t.set(10, i, '#5a4428'); }
  });
  def('crafting_side', t => {
    planks(t, ['#a2824e', '#9c7c49'], '#7a5f36');
    t.rect(0, 0, 16, 3, '#6b5434');
    t.rect(3, 6, 2, 6, '#8a8a8a'); t.rect(3, 5, 4, 2, '#9a9a9a'); // saw
    t.rect(10, 5, 1, 8, '#7a5f36'); t.rect(9, 5, 3, 2, '#5a5a5a'); // hammer
  });
  def('chest_front', t => {
    t.noise(['#a7742e', '#9c6c2a'], 0.06); t.bevel('#5b3a12', '#3d2708');
    t.rect(1, 5, 14, 1, '#3d2708'); t.rect(7, 4, 2, 4, '#c8c8c8'); t.rect(7, 4, 2, 1, '#e8e8e8');
  });
  def('chest_side', t => { t.noise(['#a7742e', '#9c6c2a'], 0.06); t.bevel('#5b3a12', '#3d2708'); t.rect(1, 5, 14, 1, '#3d2708'); });
  def('chest_top', t => { t.noise(['#a7742e', '#9c6c2a'], 0.06); t.bevel('#5b3a12', '#3d2708'); });
  def('command_front', t => {
    t.noise(['#c08a5c', '#b47e52'], 0.06);
    for (let i = 0; i < 16; i += 4) { t.rect(i, 0, 1, 16, '#8a5a35'); t.rect(0, i, 16, 1, '#8a5a35'); }
    t.rect(4, 4, 8, 8, '#d9d9d9'); t.rect(5, 5, 6, 6, '#3a3a3a'); t.rect(6, 7, 2, 1, '#e8e8e8'); t.rect(8, 8, 2, 1, '#e8e8e8');
  });
  def('command_side', t => {
    t.noise(['#c08a5c', '#b47e52'], 0.06);
    for (let i = 0; i < 16; i += 4) { t.rect(i, 0, 1, 16, '#8a5a35'); t.rect(0, i, 16, 1, '#8a5a35'); }
  });
  def('hay', t => { t.noise(['#c9a227', '#b8921f', '#d6b23a'], 0.06); t.rect(0, 3, 16, 1, '#7a4f12'); t.rect(0, 12, 16, 1, '#7a4f12'); });
  def('snow', t => t.noise(['#f5fbfb', '#eaf3f4'], 0.03));

  // wool + concrete in the 16 dye colours
  const DYE = {
    white: ['#e9ecec', '#cfd5d6'], orange: ['#f07613', '#e06100'], magenta: ['#bd44b3', '#a9309f'],
    light_blue: ['#3aafd9', '#2389c6'], yellow: ['#f8c627', '#f0af15'], lime: ['#70b919', '#5ea818'],
    pink: ['#ed8dac', '#d5658e'], gray: ['#3e4447', '#36393d'], light_gray: ['#8e8e86', '#7d7d73'],
    cyan: ['#158991', '#157788'], purple: ['#792aac', '#64209c'], blue: ['#35399d', '#2c2e8f'],
    brown: ['#724728', '#603b1f'], green: ['#546d1b', '#495b24'], red: ['#a12722', '#8e2020'], black: ['#141519', '#080a0f'],
  };
  for (const k in DYE) {
    def('wool_' + k, t => {
      const b = DYE[k][0];
      t.noise([b], 0.1);
      for (let y = 0; y < 16; y++) for (let x = (y % 4 === 0 ? 0 : 2); x < 16; x += 4) t.set(x, y, mul(b, 0.88));
    });
    def('concrete_' + k, t => t.noise([DYE[k][1]], 0.035));
  }

  // ---- blocks: id -> faces ----
  const BLOCKS = {
    grass: { top: 'grass_top', side: 'grass_side', bottom: 'dirt' },
    dirt: { all: 'dirt' }, path: { top: 'path_top', side: 'path_side', bottom: 'dirt' },
    stone: { all: 'stone' }, cobble: { all: 'cobble' }, mossy_cobble: { all: 'mossy_cobble' },
    stone_bricks: { all: 'stone_bricks' }, dark_bricks: { all: 'dark_bricks' }, bricks: { all: 'bricks' },
    oak_planks: { all: 'oak_planks' }, spruce_planks: { all: 'spruce_planks' }, birch_planks: { all: 'birch_planks' },
    dark_oak_planks: { all: 'dark_oak_planks' },
    oak_log: { top: 'oak_log_top', side: 'oak_log' }, birch_log: { top: 'oak_log_top', side: 'birch_log' },
    dark_oak_log: { top: 'oak_log_top', side: 'dark_oak_log' },
    leaves: { all: 'leaves', see: true }, sand: { all: 'sand' }, sandstone: { all: 'sandstone' },
    glass: { all: 'glass', see: true }, blue_glass: { all: 'blue_glass', see: true }, cobweb: { all: 'cobweb', see: true },
    quartz: { all: 'quartz' }, quartz_pillar: { top: 'quartz', side: 'quartz_pillar' },
    gold_block: { all: 'gold_block' }, iron_block: { all: 'iron_block' }, diamond_block: { all: 'diamond_block' },
    emerald_block: { all: 'emerald_block' }, lapis_block: { all: 'lapis_block' }, redstone_block: { all: 'redstone_block' },
    copper_block: { all: 'copper_block' }, oxidized_copper: { all: 'oxidized_copper' },
    bookshelf: { top: 'oak_planks', side: 'bookshelf' }, glowstone: { all: 'glowstone', glow: true },
    sea_lantern: { all: 'sea_lantern', glow: true }, lamp_on: { all: 'lamp_on', glow: true },
    prismarine: { all: 'prismarine' }, dark_prismarine: { all: 'dark_prismarine' }, purpur: { all: 'purpur' },
    amethyst: { all: 'amethyst' }, terracotta: { all: 'terracotta' }, coffee: { all: 'coffee' },
    server: { top: 'iron_block', side: 'server_side', front: 'server_front' }, hay: { all: 'hay' }, snow: { all: 'snow' },
    crafting_table: { top: 'crafting_top', side: 'crafting_side', bottom: 'oak_planks' },
    chest: { top: 'chest_top', side: 'chest_side', front: 'chest_front' },
    command_block: { all: 'command_side', front: 'command_front' },
    water: { all: 'water', water: true },
  };
  for (const k in DYE) { BLOCKS['wool_' + k] = { all: 'wool_' + k }; BLOCKS['concrete_' + k] = { all: 'concrete_' + k }; }

  // ---- atlas: 16px tiles in 32px cells, edges extruded so mipmaps don't bleed ----
  const CELL = 32, COLS = 16;
  const atlas = document.createElement('canvas');
  atlas.width = atlas.height = CELL * COLS;
  const ag = atlas.getContext('2d');
  const UV = {};
  let n = 0;
  for (const name in T) {
    const cx = (n % COLS) * CELL, cy = Math.floor(n / COLS) * CELL;
    const src = T[name].canvas();
    ag.imageSmoothingEnabled = false;
    // extrude: draw the tile stretched behind, then the tile itself
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      ag.drawImage(src, dx === 0 ? 0 : dx < 0 ? 0 : 15, dy === 0 ? 0 : dy < 0 ? 0 : 15, dx === 0 ? 16 : 1, dy === 0 ? 16 : 1,
        dx < 0 ? cx : dx > 0 ? cx + 24 : cx + 8, dy < 0 ? cy : dy > 0 ? cy + 24 : cy + 8, dx === 0 ? 16 : 8, dy === 0 ? 16 : 8);
    }
    ag.drawImage(src, cx + 8, cy + 8);
    const S = atlas.width;
    UV[name] = [(cx + 8) / S, 1 - (cy + 24) / S, (cx + 24) / S, 1 - (cy + 8) / S]; // u0, v0, u1, v1 (flipY)
    n++;
  }

  function faceTex(id, face) { // face: 'top' | 'bottom' | 'side' | 'front'
    const b = BLOCKS[id];
    if (!b) return 'stone';
    if (face === 'front' && b.front) return b.front;
    if (face === 'front') face = 'side';
    return b[face] || b.all || b.side;
  }

  // ---- item icons (64px canvases) ----
  // Small 16x16 pixel maps; '.' is transparent, letters index the palette.
  function sprite(rows, pal) {
    const t = new Tile(1);
    t.rect(0, 0, 16, 16, [0, 0, 0, 0]);
    rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) { const ch = row[x]; if (ch !== '.' && pal[ch]) t.set(x, y, pal[ch]); } });
    return t;
  }
  // outline every opaque pixel with a dark edge (Minecraft item look)
  function outline(t, col) {
    const o = new Uint8ClampedArray(t.d);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      if (t.get(x, y)[3]) continue;
      let near = false;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const X = x + dx, Y = y + dy;
        if (X >= 0 && Y >= 0 && X < 16 && Y < 16 && t.d[(Y * 16 + X) * 4 + 3] > 200) near = true;
      }
      if (near) { const i = (y * 16 + x) * 4; const c = hex(col); o[i] = c[0]; o[i + 1] = c[1]; o[i + 2] = c[2]; o[i + 3] = 255; }
    }
    t.d = o; return t;
  }

  // bugs are drawn from ellipses and legs, then outlined
  function bug(spec) {
    const t = new Tile(hash(JSON.stringify(spec)));
    t.rect(0, 0, 16, 16, [0, 0, 0, 0]);
    const ell = (cx, cy, rx, ry, c, alpha) => {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const d = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2;
        if (d <= 1) {
          const base = hex(c), f = 1.15 - 0.3 * ((y + 0.5 - (cy - ry)) / (2 * ry));
          t.set(x, y, [base[0] * f, base[1] * f, base[2] * f, alpha || 255]);
        }
      }
    };
    const line = (x0, y0, x1, y1, c) => {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 + 1;
      for (let i = 0; i <= n; i++) t.set(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), c);
    };
    for (const w of spec.wings || []) ell(w[0], w[1], w[2], w[3], w[4], w[5] || 170);
    for (const l of spec.legs || []) line(l[0], l[1], l[2], l[3], spec.legc || '#2a2a2a');
    for (const s of spec.body) ell(s[0], s[1], s[2], s[3], s[4]);
    for (const p of spec.dots || []) t.set(p[0], p[1], p[2]);
    for (const l of spec.lines || []) line(l[0], l[1], l[2], l[3], l[4]);
    return outline(t, spec.outline || '#1b1410');
  }
  const legs6 = (y0, y1, spread) => [[8, y0, 8 - spread, y0 - 2], [8, y0, 8 + spread, y0 - 2], [8, (y0 + y1) / 2, 8 - spread - 1, (y0 + y1) / 2], [8, (y0 + y1) / 2, 8 + spread + 1, (y0 + y1) / 2], [8, y1, 8 - spread, y1 + 2], [8, y1, 8 + spread, y1 + 2]];

  const ICON_SPECS = {
    spider: () => bug({
      legs: [[8, 7, 2, 3], [8, 7, 14, 3], [8, 8, 1, 7], [8, 8, 15, 7], [8, 9, 1, 11], [8, 9, 15, 11], [8, 10, 3, 14], [8, 10, 13, 14]],
      body: [[8, 10.5, 4, 4, '#3b302a'], [8, 5.5, 3, 2.6, '#4a3d35']],
      dots: [[6, 5, '#ff2a2a'], [9, 5, '#ff2a2a'], [7, 4, '#ff6a5a'], [8, 4, '#ff6a5a']],
    }),
    tumblebug: () => bug({
      legs: legs6(6, 11, 4.5),
      body: [[11.5, 4.5, 3.2, 3.2, '#8a5a2b'], [7, 9.5, 4, 4.5, '#2b2620'], [7, 4.8, 2.2, 1.6, '#1f1b17']],
      lines: [[7, 6, 7, 13, '#4a4238']], dots: [[11, 3, '#b07a3f'], [12, 5, '#6b431d']],
    }),
    beetle: () => bug({
      legs: legs6(6, 11, 4.5),
      body: [[8, 9.5, 4.5, 5, '#2f8a5b'], [8, 4, 2.5, 1.8, '#1d5a3b']],
      lines: [[8, 5, 8, 14, '#174a30'], [6, 2, 5, 0, '#174a30'], [10, 2, 11, 0, '#174a30']], dots: [[6, 7, '#7de0a6'], [10, 7, '#7de0a6']],
    }),
    ladybug: () => bug({
      legs: legs6(7, 11, 4.5),
      body: [[8, 9.5, 5, 5, '#d42a1e'], [8, 4, 2.6, 1.8, '#1a1a1a']],
      lines: [[8, 5, 8, 14, '#1a1a1a']], dots: [[5, 8, '#1a1a1a'], [10, 8, '#1a1a1a'], [6, 11, '#1a1a1a'], [11, 12, '#1a1a1a'], [5, 12, '#1a1a1a'], [10, 11, '#1a1a1a'], [6, 7, '#ff8a7a']],
    }),
    dragonfly: () => bug({
      wings: [[4, 5, 4, 1.6, '#cfefff'], [12, 5, 4, 1.6, '#cfefff'], [4, 8, 3.6, 1.4, '#cfefff'], [12, 8, 3.6, 1.4, '#cfefff']],
      body: [[8, 12, 1, 4, '#1f8fa8'], [8, 6.5, 1.6, 2.6, '#2bb3a0'], [8, 3, 2, 1.6, '#167a70']],
      dots: [[7, 3, '#7af2ff'], [9, 3, '#7af2ff']],
    }),
    damselfly: () => bug({
      wings: [[4.5, 6, 3.5, 1.2, '#d8e4ff'], [11.5, 6, 3.5, 1.2, '#d8e4ff'], [4.5, 8, 3.2, 1.1, '#d8e4ff'], [11.5, 8, 3.2, 1.1, '#d8e4ff']],
      body: [[8, 12, 0.8, 4.2, '#3a6cf0'], [8, 7, 1.2, 2.2, '#4b7dff'], [8, 3.5, 1.6, 1.3, '#2a4cb0']],
    }),
    mayfly: () => bug({
      wings: [[5, 5, 3, 3.5, '#f2ecd2'], [11, 5, 3, 3.5, '#f2ecd2']],
      body: [[8, 10, 1.2, 4, '#c8a95a'], [8, 4, 1.5, 1.5, '#9a7b3a']],
      lines: [[8, 13, 6, 15, '#9a7b3a'], [8, 13, 10, 15, '#9a7b3a']],
    }),
    honeybee: () => bug({
      wings: [[4.5, 5, 3, 2.4, '#e8f6ff'], [11.5, 5, 3, 2.4, '#e8f6ff']],
      legs: [[8, 9, 4, 12], [8, 9, 12, 12]],
      body: [[8, 9.5, 4, 4.5, '#f4c21b'], [8, 4, 2.4, 2, '#3a2a12']],
      lines: [[4, 8, 12, 8, '#3a2a12'], [4, 11, 12, 11, '#3a2a12']],
    }),
    ant: () => bug({
      legs: legs6(8, 10, 4.5),
      body: [[8, 12.5, 2.6, 2.8, '#7a2a16'], [8, 8.5, 1.5, 1.8, '#8a3a1e'], [8, 4.5, 2.2, 2, '#6a2412']],
      lines: [[7, 2, 5, 0, '#4a1a0e'], [9, 2, 11, 0, '#4a1a0e']],
    }),
    cicada: () => bug({
      wings: [[5, 9, 3, 5.5, '#cfe8d8'], [11, 9, 3, 5.5, '#cfe8d8']],
      body: [[8, 9, 2.6, 4.5, '#4b5a2e'], [8, 4, 3, 1.8, '#3a4524']],
      dots: [[5, 4, '#b8e05a'], [11, 4, '#b8e05a']],
    }),
    grasshopper: () => bug({
      legs: [[7, 9, 3, 4], [3, 4, 2, 13], [9, 9, 13, 4], [13, 4, 14, 13], [7, 7, 5, 11], [9, 7, 11, 11]], legc: '#4f8a2a',
      body: [[8, 9, 2, 5.5, '#6fb33a'], [8, 3.5, 2, 2, '#5a9a2e']],
      dots: [[7, 3, '#2a2a2a'], [9, 3, '#2a2a2a']],
    }),
    butterfly: () => bug({
      wings: [[4.5, 5, 3.6, 3.6, '#ff8a1e', 255], [11.5, 5, 3.6, 3.6, '#ff8a1e', 255], [5, 11, 2.8, 2.8, '#ffb35a', 255], [11, 11, 2.8, 2.8, '#ffb35a', 255]],
      body: [[8, 8.5, 0.9, 5.5, '#2a1d14']],
      dots: [[4, 4, '#1d1d1d'], [12, 4, '#1d1d1d'], [3, 6, '#fff3d0'], [13, 6, '#fff3d0'], [5, 11, '#1d1d1d'], [11, 11, '#1d1d1d']],
      lines: [[8, 3, 6, 0, '#2a1d14'], [8, 3, 10, 0, '#2a1d14']],
    }),
    centipede: () => bug({
      legs: [3, 5, 7, 9, 11, 13].flatMap(y => [[8, y, 4, y + 1], [8, y, 12, y + 1]]), legc: '#7a3a14',
      body: [2, 4, 6, 8, 10, 12, 14].map((y, i) => [8, y + 0.5, 2.1, 1.3, i === 0 ? '#5a2a10' : '#b0561e']),
    }),
    larva: () => bug({
      body: [[4, 12, 2.4, 2.4, '#d9e6a8'], [6.5, 10, 2.6, 2.6, '#cfe09a'], [9, 8, 2.8, 2.8, '#c5d98c'], [11.2, 5.6, 2.6, 2.6, '#bcd27e']],
      dots: [[12, 4, '#2a2a2a'], [11, 5, '#2a2a2a']],
    }),
  };
  const PAL = {
    o: '#2a1d14', w: '#ffffff', W: '#e8e6e0', g: '#b8b8b8', G: '#7a7a7a', k: '#1b1b1b',
    b: '#7a4a24', B: '#5a3416', c: '#4a2a12', C: '#c08a52', y: '#f8d64a', Y: '#c9a227', r: '#d43a2a', R: '#8a1a10',
    p: '#efe6c8', P: '#d8c99a', l: '#6fb3e8', L: '#3a7ac8', e: '#2fcd62', E: '#1d8a3f', v: '#a77be6', V: '#6a3fb0',
    s: '#d6d6d6', S: '#9a9a9a', n: '#3aaa5a', N: '#22783a', t: '#f2c88a', T: '#a8702a', z: '#4ad8d0', Z: '#1f8f8a',
    m: '#e0b030', M: '#b07a18', q: '#62ddd6',
  };
  const ART = {
    cup: ['.....s...s......', '......s...s.....', '.....s...s......', '......s...s.....', '................', '..oooooooooooo..',
      '..oCccccccccCo..', '..occcccccccco..', '..oWwwwwwwwWWooo', '..oWwwwwwwwWWo.o', '..oWwwwwwwwWWo.o', '..oWwwwwwwwWWooo',
      '..oWwwwwwwwWWo..', '...oWwwwwwWWo...', '....oooooooo....', '................'],
    potion: ['................', '......ooo.......', '......obo.......', '......oBo.......', '.....oggGo......', '.....ow.Go......',
      '....ow...Go.....', '...ow.....Go....', '...oLLLLLLLo....', '...oLlLLLLLo....', '...oLLLLLLLo....', '...oLLLLLLLo....',
      '....oLLLLLo.....', '.....ooooo......', '................', '................'],
    book: ['................', '..ooooooooooo...', '..oRrrrrrrrrpo..', '..oRrrrrrrrrpo..', '..oRrryyyrrrpo..', '..oRrrrrrrrrpo..',
      '..oRrrrrrrrrpo..', '..oRrrrrrrrrpo..', '..oRrrrrrrrrpo..', '..oRrrrrrrrrpo..', '..oRrrrrrrrrpo..', '..oRrrrrrrrrPo..',
      '..oRRRRRRRRRRo..', '..ooooooooooo...', '................', '................'],
    ebook: ['................', '..ooooooooooo...', '..oVvvvvvvvvpo..', '..oVvvvvvvvvpo..', '..oVvvyyyvvvpo..', '..oVvvvvvvvvpo..',
      '..oVvvvvvvvvpo..', '..oVvvvvvvvvpo..', '..oVvvvvvvvvpo..', '..oVvvvvvvvvpo..', '..oVvvvvvvvvpo..', '..oVvvvvvvvvPo..',
      '..oVVVVVVVVVVo..', '..ooooooooooo...', '................', '................'],
    paper: ['................', '...ooooooooo....', '...opppppppPo...', '...opGGGGGppo...', '...opppppppPo...', '...opGGGGGGpo...',
      '...opppppppPo...', '...opGGGGppPo...', '...opppppppPo...', '...opGGGGGGpo...', '...opppppppPo...', '...opGGGppppo...',
      '...oPPPPPPPPo...', '...oooooooooo...', '................', '................'],
    map: ['................', '..oooooooooooo..', '..oPppppppppPo..', '..opnnnppplllo..', '..opnNnpplllpo..', '..oppnnpllLlpo..',
      '..oppppplllppo..', '..opbbppprppPo..', '..opbBpppppppo..', '..oppppnnnpppo..', '..opllppnNnppo..', '..oplLlppnnppo..',
      '..oPppppppppPo..', '..oooooooooooo..', '................', '................'],
    compass: ['................', '.....oooooo.....', '....oSssssSo....', '...oSgggggrSo...', '..oSgggggrrgSo..', '..osggggrrgggo..',
      '..osgggrrggggo..', '..osggggggggso..', '..osgggwwggggo..', '..osggwwgggggo..', '..oSgwwggggggo..', '...oSggggggSo...',
      '....oSssssSo....', '.....oooooo.....', '................', '................'],
    sapling: ['................', '......nn........', '.....nNNn..nn...', '....nNnnNnnNn...', '....nnNNnNNnn...', '...nNnnnnnnNnn..',
      '....nnNNnNnnn...', '.....nnnbnnn....', '.......b..n.....', '.......b........', '......bB........', '......bB........',
      '......bB........', '.....bbBB.......', '................', '................'],
    pickaxe: ['................', '...qqqqqqq......', '..qzzzzzzzq.....', '..qzqqqqqzzq....', '...q....bqzq....', '.......b..qzq...',
      '......b....qzq..', '.....b......qq..', '....b...........', '...b............', '..b.............', '.b..............',
      'b...............', '................', '................', '................'],
    pearl: ['................', '................', '................', '.....oooooo.....', '....oZZzzZZo....', '...oZzzqqzzZo...',
      '...oZzqZZqzZo...', '...oZzZkkZzZo...', '...oZzZkkZzZo...', '...oZzqZZqzZo...', '...oZZzzzzZZo...', '....oZZZZZZo....',
      '.....oooooo.....', '................', '................', '................'],
    clock: ['................', '.....oooooo.....', '....oMmmmmMo....', '...oMyyyyyymMo..', '..oMyllllllymo..', '..omylllllllymo.',
      '..omyLlllllLymo.', '..omynnnynnnymo.', '..omyNnnnnnNymo.', '..omynnnnnnnymo.', '..oMyyNnnnNyyMo.', '...oMyyyyyyyMo..',
      '....oMmmmmmMo...', '.....oooooo.....', '................', '................'],
    spyglass: ['................', '............ooo.', '...........oMMmo', '..........oMmmMo', '.........oMmmMo.', '........oSssSo..',
      '.......oSssSo...', '......oSssSo....', '.....oMmmMo.....', '....oMmmMo......', '...oSssSo.......', '..oSssSo........',
      '..oSsSo.........', '..oooo..........', '................', '................'],
    totem: ['................', '.....oooooo.....', '....oyyyyyyo....', '....oyokkoyo....', '....oyyyyyyo....', '..ooonyyyynooo..',
      '.oyyynnyynnyyyo.', '.oyoonyyyynooyo.', '..o.oyMMMMyo.o..', '....oyMyyMyo....', '....oyMMMMyo....', '.....oyyyyo.....',
      '.....oyooyo.....', '.....ooo.oo.....', '................', '................'],
    nametag: ['................', '................', '...........oo...', '..........ogGo..', '.........ogkgo..', '........oggggo..',
      '.......opppppo..', '......oppPPpo...', '.....opppppo....', '....oppPPpo.....', '...opppppo......', '..oppppPo.......',
      '..oPPPPo........', '..ooooo.........', '................', '................'],
    slime: ['................', '................', '................', '.....oooooo.....', '....onnnnnno....', '...onnwwnnnNo...',
      '...onnwnnnnNo...', '...onnnnnnnNo...', '...onnnnnnNNo...', '...oNnnnnNNNo...', '....oNNNNNNo....', '.....oooooo.....',
      '................', '................', '................', '................'],
    star: ['................', '.......o........', '......owo.......', '......owo.......', '..ooo.owo.ooo...', '..owwoowoowwo...',
      '...owwwwwwwo....', '..oowwwqwwwoo...', '.owwwwqqqwwwwo..', '..oowwwqwwwoo...', '...owwwwwwwo....', '..owwoowoowwo...',
      '..ooo.owo.ooo...', '......owo.......', '.......o........', '................'],
    painting: ['................', '..bbbbbbbbbbbb..', '..bllllllllllb..', '..bllllyyllllb..', '..blllllyylllb..', '..bllnnllllllb..',
      '..blnnnnllllnb..', '..bnnNnnnlnnnb..', '..bnNNnnnnnNnb..', '..bNNNNnnNNNNb..', '..bbbbbbbbbbbb..', '................',
      '................', '................', '................', '................'],
    bundle: ['................', '......oooo......', '.....obBBbo.....', '......oBBo......', '....oobbbboo....', '...obbbbbbbbo...',
      '..obbTbbbbbbbo..', '..obTbbbbbbbbo..', '..obbbbbbbbbBo..', '..obbbbbbbbbBo..', '..obbbbbbbbBBo..', '...oBbbbbbBBo...',
      '....ooooooooo...', '................', '................', '................'],
    redstone: ['................', '................', '......r.........', '.....rRr..r.....', '....rRRRrrRr....', '.....rRrRRRr....',
      '...r..rRRRr.....', '..rRr.rRRr..r...', '...rRrRRrr.rRr..', '....rRRRRrrRr...', '.....rrRRRRr....', '......rRrr......',
      '.......r........', '................', '................', '................'],
    flowerpot: ['................', '.......r........', '......rRr.......', '.......r........', '.......n........', '......nNn.......',
      '.......n........', '....oooooooo....', '....obTTTTTo....', '....obbbbbBo....', '.....obbbbo.....', '.....obbbBo.....',
      '.....oooooo.....', '................', '................', '................'],
    bean: ['................', '................', '.....oooooo.....', '....obbbbbBo....', '...obbbBbbbBo...', '...obbBbbbbBo...',
      '...obbBbbbBBo...', '...obbbBbbBBo...', '...obbbBbBBBo...', '....oBbbBBBo....', '.....oooooo.....', '................',
      '................', '................', '................', '................'],
    leaf: ['................', '................', '..........nn....', '........nnNNo...', '......nnNnnNo...', '.....nNnnnNno...',
      '....nNnnnNnno...', '....nNnnNnnno...', '...nNnnNnnno....', '...nnnNnnnno....', '...nnNnnnno.....', '..nNNnnnoo......',
      '..b.ooooo.......', '.b..............', '................', '................'],
  };
  function art(name, recolor) {
    const pal = Object.assign({}, PAL, recolor || {});
    return sprite(ART[name], pal);
  }

  // isometric block item from atlas textures
  function isoBlock(id, size) {
    size = size || 64;
    const c = document.createElement('canvas'); c.width = c.height = size;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    const top = T[faceTex(id, 'top')].canvas(), left = T[faceTex(id, 'front')].canvas(), right = T[faceTex(id, 'side')].canvas();
    const s = size / 64;
    const draw = (img, a, b, cc, d, e, f, shade) => {
      g.save(); g.setTransform(a * s, b * s, cc * s, d * s, e * s, f * s); g.drawImage(img, 0, 0);
      g.fillStyle = `rgba(0,0,0,${shade})`; g.fillRect(0, 0, 16, 16); g.restore();
    };
    // cube spanning ~ 4..60; top rhombus, left face, right face
    draw(top, 1.75, 0.875, -1.75, 0.875, 32, 4, 0);
    draw(left, 1.75, 0.875, 0, 1.9, 4, 18, 0.22);
    draw(right, 1.75, -0.875, 0, 1.9, 32, 32, 0.38);
    return c;
  }

  const iconCache = {};
  function icon(kind, opts) {
    const key = kind + JSON.stringify(opts || {});
    if (iconCache[key]) return iconCache[key];
    let c;
    if (kind.startsWith('block:')) c = isoBlock(kind.slice(6));
    else if (ICON_SPECS[kind]) c = ICON_SPECS[kind]().canvas(4);
    else if (ART[kind]) c = art(kind, opts).canvas(4);
    else c = isoBlock('stone');
    const url = c.toDataURL();
    iconCache[key] = url;
    return url;
  }

  // Pick an inventory icon for a repository.
  const REPO_ICONS = {
    'cb-spider': 'spider', 'cb-tumblebug': 'tumblebug', 'cb-dragonfly': 'dragonfly', 'cb-ladybug': 'ladybug',
    'cb-larva': 'larva', 'cm-beetle': 'beetle', 'cm-honeybee': 'honeybee', 'cm-ant': 'ant', 'cm-cicada': 'cicada',
    'cm-grasshopper': 'grasshopper', 'cm-butterfly': 'butterfly', 'cm-damselfly': 'damselfly', 'cm-mayfly': 'mayfly',
    'cm-centipede': 'centipede', 'cm-data-mold': 'slime', 'cb-milkyway': 'star', 'cb-store': 'block:chest',
    'cb-log': 'block:oak_log', 'cb-webtool': 'block:crafting_table', 'cb-fw-template': 'block:crafting_table',
    'cb-mapui': 'compass', 'cloud-barista.github.io': 'map', 'cloud-barista.github.com': 'map', docs: 'book',
    'cloud-barista': 'cup', archive: 'block:bookshelf', 'cb-operator': 'block:command_block', 'cb-client': 'block:command_block',
    'cb-coffeehouse': 'cup', 'cb-tumblebug-api-web': 'paper', 'cb-ladybug-api-web': 'paper', api: 'paper',
    'cb-tumblebug-dashboard': 'painting', 'ktcloud-sdk-go': 'pickaxe', 'nhncloud-sdk-go': 'pickaxe', 'ktcloudvpc-sdk-go': 'pickaxe',
    'cloud-migrator': 'pearl', 'mc-terrarium': 'flowerpot', 'mc-data-manager': 'block:chest', 'cm-model': 'nametag',
    '.github': 'nametag', 'mc-meta-365': 'clock', 'ai-mcmp': 'ebook', 'ai-o11y': 'spyglass', 'ai-ha': 'totem',
    'ai-ops': 'redstone', 'ai-adm': 'block:command_block', 'ai-app': 'bundle', 'ai-ui': 'painting',
  };
  const REPO_RECOLOR = {
    'cb-coffeehouse': { W: '#c08a52', w: '#d9a96e' },
    'cloud-barista': { W: '#e0b030', w: '#f8d64a' },
    'nhncloud-sdk-go': { q: '#d8d8d8', z: '#a8a8a8' }, 'ktcloudvpc-sdk-go': { q: '#f8d64a', z: '#c9a227' },
    'cb-tumblebug-dashboard': {}, 'cloud-barista.github.com': { n: '#8a8a6a', N: '#6a6a4a' },
  };
  function repoIcon(name) {
    let k = REPO_ICONS[name];
    if (!k) k = name.startsWith('poc-') ? 'sapling' : name.startsWith('ai-') ? 'ebook' : 'paper';
    return icon(k, REPO_RECOLOR[name]);
  }

  // Release icons: coffee in cups, tea as potions.
  const BREWS = {
    americano: { kind: 'cup', c: '#3a1f0e' }, cappuccino: { kind: 'cup', c: '#d9b48a' }, espresso: { kind: 'cup', c: '#24120a', W: '#f0f0f0' },
    mocha: { kind: 'cup', c: '#5a2e1a', W: '#8a5a3a', w: '#a87048' }, affogato: { kind: 'cup', c: '#f5efe0', W: '#c8e0f0', w: '#e0f0ff' },
    latte: { kind: 'cup', c: '#c9a079' }, cortado: { kind: 'cup', c: '#8a5a32', W: '#cfd8dc' },
    chamomile: { kind: 'potion', L: '#f2d64b', l: '#fff3a0' }, cinnamon: { kind: 'potion', L: '#b5562a', l: '#e08850' },
    darjeeling: { kind: 'potion', L: '#c8862a', l: '#f0b860' }, 'earl grey': { kind: 'potion', L: '#7a3f1c', l: '#b06a3a' },
    ginger: { kind: 'potion', L: '#e0b040', l: '#ffe08a' }, hibiscus: { kind: 'potion', L: '#c2183f', l: '#ff5a7a' },
  };
  function brewKey(name) {
    const n = (name || '').toLowerCase().replace(/é/g, 'e');
    for (const k in BREWS) if (n.includes(k)) return k;
    if (n.includes('cafe latte')) return 'latte';
    return null;
  }
  function brewIcon(name) {
    const k = brewKey(name);
    const b = BREWS[k] || { kind: 'cup', c: '#4a2a12' };
    const re = {};
    for (const key in b) if (key !== 'kind') re[key] = b[key];
    return icon(b.kind, re);
  }

  function tileURL(name, scale) { return T[name].canvas(scale || 4).toDataURL(); }

  window.PX = { rng, hash, hex, T, BLOCKS, UV, atlas, faceTex, icon, repoIcon, brewIcon, brewKey, tileURL, isoBlock, DYE };
})();
