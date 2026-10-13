// The Cloud-Barista village: terrain, one building per repository (laid out by creation
// date around the logo plaza), sky islands for CB-Spider's clouds, and every contributor.
(function () {
  'use strict';
  const { rng, hash, BLOCKS } = PX;
  const D = window.CB_DATA;
  const L = 12;          // lot size (incl. street)
  const RINGS = 3;       // lot rings around the 2x2-lot plaza
  const VILLAGE = (RINGS + 1) * L; // half size of the village (48)
  const WORLD = 120;     // terrain half size

  // ---------- time ----------
  const [Y0, M0] = D.months[0].split('-').map(Number);
  function monthOf(date) { // 'YYYY-MM-DD' -> fractional month index
    const [y, m, d] = date.split('-').map(Number);
    return (y - Y0) * 12 + (m - M0) + ((d || 1) - 1) / 31;
  }
  function dateOf(mi) {
    const total = Math.floor(mi);
    const y = Y0 + Math.floor((M0 - 1 + total) / 12), m = ((M0 - 1 + total) % 12 + 12) % 12 + 1;
    return { y, m };
  }

  // ---------- noise ----------
  function valueNoise(seed) {
    const R = rng(seed), N = 64, g = new Float32Array(N * N);
    for (let i = 0; i < g.length; i++) g[i] = R();
    const at = (x, z) => g[((x % N + N) % N) * N + ((z % N + N) % N)];
    return (x, z) => {
      const X = Math.floor(x), Z = Math.floor(z), fx = x - X, fz = z - Z;
      const sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);
      const a = at(X, Z), b = at(X + 1, Z), c = at(X, Z + 1), d = at(X + 1, Z + 1);
      return a + (b - a) * sx + (c - a) * sz + (a - b - c + d) * sx * sz;
    };
  }
  const n1 = valueNoise(11), n2 = valueNoise(23), n3 = valueNoise(37);
  const fbm = (x, z) => n1(x / 28, z / 28) * 0.6 + n2(x / 11, z / 11) * 0.3 + n3(x / 5, z / 5) * 0.1;
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  // ---------- building styles ----------
  const STYLE = {
    core: { wall: 'stone_bricks', pillar: 'oak_log', trim: 'oak_planks', roof: 'dark_oak_planks', win: 'glass', top: 'glowstone' },
    spider: { wall: 'dark_bricks', pillar: 'stone_bricks', trim: 'redstone_block', roof: 'dark_bricks', win: 'glass', top: 'lamp_on', web: true },
    tumble: { wall: 'terracotta', pillar: 'dark_oak_log', trim: 'gold_block', roof: 'dark_oak_planks', win: 'glass', top: 'glowstone' },
    main: { wall: 'quartz', pillar: 'quartz_pillar', trim: 'concrete_yellow', roof: 'concrete_brown', win: 'glass', top: 'gold_block' },
    cafe: { wall: 'spruce_planks', pillar: 'dark_oak_log', trim: 'concrete_brown', roof: 'concrete_brown', win: 'glass', top: 'coffee' },
    poc: { wall: 'cobble', pillar: 'oak_log', trim: 'oak_planks', roof: 'oak_planks', win: 'glass' },
    lib: { wall: 'oak_planks', pillar: 'oak_log', trim: 'bookshelf', roof: 'bricks', win: 'glass', top: 'glowstone' },
    sdk: { wall: 'bricks', pillar: 'stone_bricks', trim: 'stone', roof: 'stone_bricks', win: 'glass' },
    cm: { wall: 'birch_planks', pillar: 'birch_log', trim: 'concrete_white', roof: 'concrete_light_blue', win: 'blue_glass', top: 'sea_lantern' },
    mc: { wall: 'prismarine', pillar: 'dark_prismarine', trim: 'sea_lantern', roof: 'dark_prismarine', win: 'glass', top: 'sea_lantern' },
    ai: { wall: 'concrete_white', pillar: 'amethyst', trim: 'purpur', roof: 'concrete_purple', win: 'blue_glass', top: 'sea_lantern' },
  };
  const LIB = new Set(['docs', 'cloud-barista.github.io', 'cloud-barista.github.com', 'archive', 'api', 'cb-tumblebug-api-web', 'cb-ladybug-api-web', '.github']);
  function styleOf(r) {
    const n = r.name;
    if (n === 'cb-spider') return 'spider';
    if (n === 'cb-tumblebug') return 'tumble';
    if (n === 'cloud-barista') return 'main';
    if (n === 'cb-coffeehouse') return 'cafe';
    if (n.startsWith('poc-') || r.fork) return 'poc';
    if (LIB.has(n)) return 'lib';
    if (n.endsWith('-sdk-go')) return 'sdk';
    if (n.startsWith('cm-') || n === 'cloud-migrator') return 'cm';
    if (n.startsWith('mc-')) return 'mc';
    if (n.startsWith('ai-')) return 'ai';
    return 'core';
  }
  const widthOf = (c) => c >= 2000 ? 10 : c >= 300 ? 8 : c >= 60 ? 7 : c >= 10 ? 6 : 5;
  const heightOf = (c) => Math.min(26, 3 + Math.round(1.7 * Math.log2(1 + c)));

  // Build order is bottom-up so a draw range can "grow" the building.
  function building(x0, z0, w, d, H, st, facing, R, archived) {
    const out = [];
    const put = (x, y, z, id) => {
      if (archived && (id === st.wall) && R() < 0.22) id = 'mossy_cobble';
      out.push([x0 + x, y, z0 + z, id]);
    };
    const doorX = Math.floor(w / 2), doorZ = Math.floor(d / 2);
    const isDoor = (x, z) => (facing === 'n' && z === 0 && x === doorX) || (facing === 's' && z === d - 1 && x === doorX) ||
      (facing === 'w' && x === 0 && z === doorZ) || (facing === 'e' && x === w - 1 && z === doorZ);
    const ring = [];
    for (let x = 0; x < w; x++) ring.push([x, 0]);
    for (let z = 1; z < d; z++) ring.push([w - 1, z]);
    for (let x = w - 2; x >= 0; x--) ring.push([x, d - 1]);
    for (let z = d - 2; z > 0; z--) ring.push([0, z]);
    for (let y = 1; y <= H; y++) {
      const band = y > 1 && (y - 1) % 4 === 0;
      const winRow = (y - 1) % 4 === 1 || (y - 1) % 4 === 2;
      for (const [x, z] of ring) {
        const corner = (x === 0 || x === w - 1) && (z === 0 || z === d - 1);
        if (isDoor(x, z) && y <= 2) continue;
        const along = (z === 0 || z === d - 1) ? x : z;
        const len = (z === 0 || z === d - 1) ? w : d;
        let id = st.wall;
        if (corner) id = st.pillar;
        else if (band || y === H) id = st.trim;
        else if (winRow && along > 1 && along < len - 2 && along % 2 === 1 && y > 1) id = st.win;
        else if (winRow && len <= 6 && along === Math.floor(len / 2) && y > 1 && !isDoor(x, z)) id = st.win;
        put(x, y, z, id);
      }
    }
    const pitched = w <= 7 && H <= 11;
    if (pitched) {
      // gable roof, ridge along x
      for (let k = 0; ; k++) {
        const za = k - 1, zb = d - k;
        if (za > zb) break;
        for (let z = za; z <= zb; z++) for (let x = -1; x <= w; x++) {
          if (z !== za && z !== zb && k > 0) continue;
          put(x, H + 1 + k, z, za === zb || (z !== za && z !== zb) ? st.trim : st.roof);
        }
        // fill gable ends
        if (k > 0) for (let z = za + 1; z < zb; z++) { put(0, H + k, z, st.wall); put(w - 1, H + k, z, st.wall); }
        if (za >= zb - 1) { for (let x = -1; x <= w; x++) if (za !== zb) put(x, H + 2 + k, za, st.roof); break; }
      }
    } else {
      for (let z = 0; z < d; z++) for (let x = 0; x < w; x++) put(x, H + 1, z, st.roof);
      for (const [x, z] of ring) if ((x + z) % 2 === 0 || ((x === 0 || x === w - 1) && (z === 0 || z === d - 1))) put(x, H + 2, z, st.trim);
      if (H >= 12) {
        const cx = Math.floor(w / 2) - 1, cz = Math.floor(d / 2) - 1;
        for (let y = H + 2; y <= H + 3; y++) for (let z = 0; z < 3; z++) for (let x = 0; x < 3; x++) {
          if (y === H + 3 && (x !== 1 || z !== 1)) put(cx + x, y, cz + z, (x + z) % 2 ? st.wall : st.pillar);
          else if (y === H + 2) put(cx + x, y, cz + z, st.pillar);
        }
        put(cx + 1, H + 3, cz + 1, st.top || 'glowstone');
        put(cx + 1, H + 4, cz + 1, st.top || 'glowstone');
        if (st.web) for (const [x, z] of [[0, 0], [w - 1, 0], [0, d - 1], [w - 1, d - 1]]) put(x, H + 3, z, 'cobweb');
      } else if (st.top) put(Math.floor(w / 2), H + 2, Math.floor(d / 2), st.top);
    }
    return out;
  }

  // ---------- islands ----------
  const CLOUD_STYLE = {
    aws: ['concrete_orange', 'concrete_black'], azure: ['concrete_light_blue', 'concrete_white'],
    gcp: ['concrete_blue', 'concrete_red', 'concrete_yellow', 'concrete_green'], alibaba: ['concrete_orange', 'concrete_white'],
    tencent: ['concrete_light_blue', 'concrete_blue'], ibm: ['concrete_blue', 'concrete_black'], openstack: ['concrete_red', 'concrete_white'],
    ncp: ['concrete_lime', 'concrete_green'], nhn: ['concrete_blue', 'concrete_white'], kt: ['concrete_red', 'concrete_black'],
    ktclassic: ['concrete_red', 'concrete_light_gray'], oracle: ['concrete_red', 'concrete_light_gray'],
  };
  function island(R, rad, seed, top) {
    const out = [];
    const r = rng(seed);
    const depth = Math.ceil(rad * 1.3);
    for (let y = -depth; y <= 0; y++) {
      const k = -y;
      const rr = y === 0 ? rad : rad * (1 - k / (depth + 1)) + (r() - 0.5) * 1.2;
      for (let x = -Math.ceil(rad); x <= Math.ceil(rad); x++) for (let z = -Math.ceil(rad); z <= Math.ceil(rad); z++) {
        const d = Math.hypot(x + 0.5, z + 0.5);
        if (d > rr) continue;
        out.push([x, y, z, y === 0 ? (top || 'grass') : k <= 2 ? 'dirt' : 'stone']);
      }
    }
    return out;
  }
  function dataCenter(cols) {
    const out = [];
    for (let y = 1; y <= 4; y++) for (let x = -2; x <= 2; x++) for (let z = -2; z <= 2; z++) {
      const edge = Math.abs(x) === 2 || Math.abs(z) === 2;
      if (!edge) continue;
      const corner = Math.abs(x) === 2 && Math.abs(z) === 2;
      let id = cols[(Math.abs(x + z) + y) % cols.length] || cols[0];
      if (cols.length === 2) id = y === 3 && !corner ? 'glass' : corner ? cols[1] : cols[0];
      if (cols.length > 2) id = corner ? 'concrete_white' : y === 3 ? 'glass' : cols[(x + 2 + z + 2 + y) % 4];
      if (z === 2 && x === 0 && y <= 2) continue; // door
      out.push([x, y, z, id]);
    }
    for (let x = -2; x <= 2; x++) for (let z = -2; z <= 2; z++) out.push([x, 5, z, Math.abs(x) === 2 || Math.abs(z) === 2 ? cols[cols.length > 2 ? 0 : 1] : 'iron_block']);
    return out;
  }

  // ---------- Town ----------
  class Town {
    constructor(world) {
      this.world = world;
      this.vox = world.voxels;
      this.colBottom = new Map();
      this.layout();
      this.terrain();
      this.buildings();
      this.makeIslands();
      this.makePeople();
      this.makePedestals();
    }

    // lots in rings around the plaza, oldest repositories nearest the centre
    layout() {
      const lots = [];
      for (let i = -RINGS - 1; i <= RINGS; i++) for (let j = -RINGS - 1; j <= RINGS; j++) {
        if ((i === -1 || i === 0) && (j === -1 || j === 0)) continue;
        const cx = i * L + L / 2, cz = j * L + L / 2;
        const ring = Math.max(Math.abs(cx), Math.abs(cz));
        let ang = Math.atan2(cx, -cz); if (ang < 0) ang += Math.PI * 2;
        lots.push({ i, j, cx, cz, ring, ang });
      }
      lots.sort((a, b) => a.ring - b.ring || a.ang - b.ang);
      const repos = D.repos.slice().sort((a, b) => a.created < b.created ? -1 : a.created > b.created ? 1 : 0);
      this.lots = lots;
      this.repoLots = new Map();
      repos.forEach((r, k) => { if (lots[k]) { lots[k].repo = r; this.repoLots.set(r.name, lots[k]); } });
    }

    isStreet(x, z) {
      const sx = ((x % L) + L) % L, sz = ((z % L) + L) % L;
      return sx === 0 || sx === L - 1 || sz === 0 || sz === L - 1;
    }

    terrain() {
      const V = this.vox, R = rng(5);
      const H = new Map();
      const hAt = (x, z) => {
        const k = x * 4096 + z;
        if (H.has(k)) return H.get(k);
        const d = Math.max(Math.abs(x + 0.5), Math.abs(z + 0.5));
        const b = smooth(VILLAGE + 3, VILLAGE + 22, d);
        let h = Math.round(b * (fbm(x, z) * 26 - 7));
        if (d < VILLAGE + 3) h = 0;
        H.set(k, h);
        return h;
      };
      const P = 13; // plaza half size incl. boundary streets
      for (let x = -WORLD; x < WORLD; x++) for (let z = -WORLD; z < WORLD; z++) {
        const h = hAt(x, z);
        const mn = Math.min(hAt(x - 1, z), hAt(x + 1, z), hAt(x, z - 1), hAt(x, z + 1));
        const bottom = Math.min(h - 1, mn - 1, -1);
        this.colBottom.set(x * 4096 + z, bottom);
        const inVillage = Math.max(Math.abs(x + 0.5), Math.abs(z + 0.5)) <= VILLAGE + 1;
        for (let y = bottom; y <= Math.max(h, 0); y++) {
          let id;
          if (y > h) id = 'water';
          else if (y === h) {
            if (inVillage) id = this.isStreet(x, z) ? 'path' : 'grass';
            else id = h <= 0 ? 'sand' : 'grass';
          } else id = (h - y <= 2) ? (h <= 0 && !inVillage ? 'sand' : 'dirt') : 'stone';
          V.set(x, y, z, id);
        }
      }
      // plaza: paved square with the Cloud-Barista logo as a floor mosaic
      for (let x = -P; x < P; x++) for (let z = -P; z < P; z++) {
        const px = x + 0.5, pz = z + 0.5;
        let id = (x === -P || z === -P || x === P - 1 || z === P - 1) ? 'stone_bricks' : 'quartz';
        const circ = [[-5, -5], [5, -5], [-5, 5], [5, 5]].some(([cx, cz]) => Math.hypot(px - cx, pz - cz) <= 4.4);
        if (circ) id = 'concrete_yellow';
        const u = (px + pz) / Math.SQRT2, v = (px - pz) / Math.SQRT2;
        const arm = (a, b) => Math.abs(b) <= 1.0 && Math.abs(a) <= 5.2;
        const head = (a, b) => Math.abs(a) >= 3.6 && Math.abs(a) <= 7.4 && Math.abs(b) <= (7.4 - Math.abs(a)) * 0.95 + 0.2;
        if (arm(u, v) || arm(v, u) || head(u, v) || head(v, u) || (Math.abs(u) <= 2.2 && Math.abs(v) <= 2.2)) id = 'concrete_brown';
        V.set(x, 0, z, id);
      }
      // trees outside the village, and in the park lot
      const tree = (x, z, h, birch) => {
        const gy = hAt(x, z);
        if (gy < 1 && Math.max(Math.abs(x), Math.abs(z)) > VILLAGE) return;
        for (let y = 1; y <= h; y++) V.set(x, gy + y, z, birch ? 'birch_log' : 'oak_log');
        for (let y = h - 2; y <= h + 1; y++) {
          const r = y >= h ? 1 : 2;
          for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
            if (Math.abs(dx) === r && Math.abs(dz) === r && (y >= h || R() < 0.5)) continue;
            if (!V.get(x + dx, gy + y, z + dz)) V.set(x + dx, gy + y, z + dz, 'leaves');
          }
        }
        V.set(x, gy + h + 1, z, 'leaves');
      };
      const used = [];
      for (let k = 0; k < 2600; k++) {
        const x = Math.floor((R() * 2 - 1) * (WORLD - 4)), z = Math.floor((R() * 2 - 1) * (WORLD - 4));
        const d = Math.max(Math.abs(x), Math.abs(z));
        if (d < VILLAGE + 5) continue;
        if (used.some(([a, b]) => Math.abs(a - x) < 4 && Math.abs(b - z) < 4)) continue;
        if (R() < 0.35) continue;
        used.push([x, z]);
        tree(x, z, 4 + Math.floor(R() * 3), R() < 0.2);
      }
      for (const lot of this.lots) if (!lot.repo) {
        const x0 = lot.i * L, z0 = lot.j * L;
        tree(x0 + 4, z0 + 4, 5, false); tree(x0 + 8, z0 + 7, 4, true);
        for (let x = x0 + 2; x < x0 + 10; x++) for (let z = z0 + 2; z < z0 + 10; z++) if (Math.hypot(x - x0 - 7, z - z0 - 3) < 1.6) V.set(x, 0, z, 'water');
      }
      this.hAt = hAt;
      const occ = (x, y, z) => V.opaque(x, y, z);
      const cull = (x, y, z, i, id) => {
        if (x < -WORLD || x >= WORLD || z < -WORLD || z >= WORLD) return true;
        const b = this.colBottom.get(x * 4096 + z);
        if (b !== undefined && y < b) return true;
        const n = V.get(x, y, z);
        if (!n) return false;
        if (n === id) return true;
        return V.opaque(x, y, z);
      };
      const solid = [], water = [];
      for (const [k, id] of V.m) {
        const x = (k >> 18) - 512, y = ((k >> 10) & 255) - 64, z = (k & 1023) - 512;
        (id === 'water' ? water : solid).push([x, y, z, id]);
      }
      this.terrainMesh = this.world.addMesh(solid, occ, cull).mesh;
      this.waterMesh = this.world.addMesh(water, () => false, (x, y, z) => !!V.get(x, y, z), { water: true, ao: false }).mesh;
    }

    buildings() {
      const V = this.vox;
      this.blds = [];
      for (const lot of this.lots) {
        const r = lot.repo;
        if (!r) continue;
        const w = widthOf(r.commits), H = heightOf(r.commits);
        const st = STYLE[styleOf(r)];
        const facing = Math.abs(lot.cx) > Math.abs(lot.cz) ? (lot.cx > 0 ? 'w' : 'e') : (lot.cz > 0 ? 'n' : 's');
        const x0 = lot.i * L + 1 + Math.floor((L - 2 - w) / 2), z0 = lot.j * L + 1 + Math.floor((L - 2 - w) / 2);
        const R = rng(hash(r.name));
        const list = building(x0, z0, w, w, H, st, facing, R, r.archived);
        const own = new Map();
        list.forEach(([x, y, z, id], i) => own.set(x * 1e6 + y * 1e3 + z, i));
        const ownAt = (x, y, z) => own.get(x * 1e6 + y * 1e3 + z);
        const occ = (x, y, z) => { if (V.opaque(x, y, z)) return true; const i = ownAt(x, y, z); return i !== undefined && !BLOCKS[list[i][3]].see; };
        const cull = (x, y, z, i, id) => {
          if (V.opaque(x, y, z)) return true;
          const j = ownAt(x, y, z);
          if (j === undefined || j > i) return false;
          const nb = list[j][3];
          return nb === id || !BLOCKS[nb].see;
        };
        // front faces of directional blocks don't matter here; keep +z default
        const { mesh, ends } = this.world.addMesh(list, occ, cull);
        // door: the street point in front of it
        const dx = x0 + Math.floor(w / 2) + 0.5, dz = z0 + Math.floor(w / 2) + 0.5;
        let street, door;
        if (facing === 'w') { street = { x: lot.i * L, z: dz, vert: true }; door = { x: x0, z: dz }; }
        if (facing === 'e') { street = { x: (lot.i + 1) * L, z: dz, vert: true }; door = { x: x0 + w, z: dz }; }
        if (facing === 'n') { street = { x: dx, z: lot.j * L, vert: false }; door = { x: dx, z: z0 }; }
        if (facing === 's') { street = { x: dx, z: (lot.j + 1) * L, vert: false }; door = { x: dx, z: z0 + w }; }
        const top = Math.max(...list.map(b => b[1])) + 1;
        // growth curve: cumulative share of commits by month
        const cum = new Float32Array(D.months.length);
        let acc = 0;
        D.months.forEach((m, k) => { acc += (r.monthly && r.monthly[m]) || 0; cum[k] = r.commits ? acc / r.commits : 1; });
        const floorCount = 4 * w - 4;
        const b = { repo: r, lot, mesh, ends, list, created: monthOf(r.created), cum, street, door, top, w, x0, z0, H, base: Math.min(1, floorCount / list.length) };
        mesh.userData.b = b;
        this.blds.push(b);
      }
      this.byRepo = new Map(this.blds.map(b => [b.repo.name, b]));
    }

    // fraction of a building that exists at fractional month m
    builtFraction(b, m) {
      if (m < b.created) return 0;
      const k = Math.min(b.cum.length - 1, Math.max(0, Math.floor(m)));
      const prev = k > 0 ? b.cum[k - 1] : 0;
      const f = prev + (b.cum[k] - prev) * Math.min(1, m - k);
      const appear = Math.min(1, (m - b.created) / 0.6); // the foundation goes down over a few weeks
      return Math.max(b.base * appear, Math.min(1, b.base + (1 - b.base) * f));
    }
    setBuilt(m) {
      for (const b of this.blds) {
        const f = m === Infinity ? 1 : this.builtFraction(b, m);
        const n = Math.round(f * b.list.length);
        b.mesh.visible = n > 0;
        b.mesh.geometry.setDrawRange(0, n > 0 ? b.ends[n - 1] : 0);
        b.grew = n - (b.shown || 0);
        b.shown = n;
      }
    }

    // ---------- sky islands ----------
    makeIslands() {
      const clouds = D.clouds;
      this.hub = { x: 0, y: 64, z: 0 };
      this.islands = [];
      const g = new THREE.Group();
      this.world.scene.add(g);
      this.islandGroup = g;
      const meshOf = (list) => {
        const own = new Map(list.map((b, i) => [b[0] * 1e6 + b[1] * 1e3 + b[2], i]));
        const at = (x, y, z) => own.get(x * 1e6 + y * 1e3 + z);
        const occ = (x, y, z) => { const i = at(x, y, z); return i !== undefined && !BLOCKS[list[i][3]].see; };
        const cull = (x, y, z, i, id) => { const j = at(x, y, z); if (j === undefined) return false; const nb = list[j][3]; return nb === id || !BLOCKS[nb].see; };
        const m = this.world.addMesh(list, occ, cull).mesh;
        this.world.scene.remove(m);
        return m;
      };
      clouds.forEach((c, i) => {
        const a = i / clouds.length * Math.PI * 2 + 0.26;
        const R = 40;
        const pos = new THREE.Vector3(Math.sin(a) * R, 52 + (i % 3) * 4, Math.cos(a) * R);
        const list = island(null, 5.6, 100 + i).concat(dataCenter(CLOUD_STYLE[c.id] || ['concrete_white', 'concrete_gray']));
        const m = meshOf(list);
        m.position.copy(pos);
        g.add(m);
        this.islands.push({ cloud: c, mesh: m, pos, anchor: pos.clone().add(new THREE.Vector3(0, 6, 0)), angle: a });
      });
      const hubList = island(null, 7.6, 7, 'stone_bricks');
      for (const [x, z] of [[-6, -2], [5, 3], [-3, 5], [4, -5], [0, -7], [-7, 3]]) hubList.push([x, 1, z, 'cobweb']);
      this.hubMesh = meshOf(hubList);
      this.hubMesh.position.set(this.hub.x, this.hub.y, this.hub.z);
      g.add(this.hubMesh);
      this.spider = makeSpider();
      this.spider.position.set(0, this.hub.y + 1, 0);
      g.add(this.spider);
      // threads from the hub to each island
      this.threads = this.islands.map((is) => {
        const from = new THREE.Vector3(0, this.hub.y + 2.2, 0);
        const to = is.anchor.clone().add(new THREE.Vector3(0, -1, 0));
        const len = from.distanceTo(to);
        const piv = new THREE.Group(); piv.position.copy(from); piv.lookAt(to);
        const line = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 1), new THREE.MeshBasicMaterial({ color: 0xf2f2f2 }));
        line.position.z = 0.5;
        piv.add(line);
        piv.scale.set(1, 1, 0.0001);
        g.add(piv);
        return { piv, line, len, from, to };
      });
      // VMs for the Tumblebug scene
      this.vms = this.islands.map((is, i) => {
        const list = [[0, 0, 0, 'server'], [0, 1, 0, 'server'], [0, 2, 0, i % 2 ? 'lamp_on' : 'sea_lantern']];
        const m = meshOf(list);
        const grp = new THREE.Group();
        grp.add(m);
        m.position.set(-0.5, 0, -0.5);
        grp.position.copy(is.pos).add(new THREE.Vector3(3.2, 1, 3.2).applyAxisAngle(new THREE.Vector3(0, 1, 0), is.angle + Math.PI));
        grp.visible = false;
        g.add(grp);
        return grp;
      });
      this.setIslands(0);
    }
    // 0: hidden, 1: in place
    setIslands(f, perIsland) {
      this.islandGroup.visible = f > 0;
      this.islands.forEach((is, i) => {
        const fi = perIsland ? perIsland(i) : f;
        is.mesh.visible = fi > 0;
        is.mesh.position.y = is.pos.y - (1 - fi) * 30;
        is.mesh.scale.setScalar(0.3 + 0.7 * fi);
      });
    }
    setThreads(fn) { this.threads.forEach((t, i) => { const f = fn(i); t.piv.visible = f > 0; t.piv.scale.z = Math.max(0.0001, f * t.len); }); }

    // ---------- people ----------
    makePeople() {
      const A = window.CB_AVATARS || {};
      const R = rng(42);
      this.people = [];
      const crowd = new MC.Crowd(this.world.scene, D.people.length);
      this.world.crowd = crowd;
      this.world.registerTint([crowd.mat]);
      for (const p of D.people) {
        const pl = new MC.Player(p, A[p.login], crowd);
        pl.group.visible = false;
        const home = (p.repos || []).map(n => this.byRepo.get(n)).find(Boolean) || this.byRepo.get('cloud-barista');
        const person = { p, pl, home, join: monthOf(p.first), r: R(), off: (R() - 0.5) * 5, side: R() < 0.5 ? -0.45 : 0.45 };
        person.path = this.routeHome(person);
        this.people.push(person);
      }
      this.byLogin = new Map(this.people.map(x => [x.p.login, x]));
    }
    // plaza centre -> plaza edge -> streets -> home street point
    routeHome(person) {
      const s = person.home.street;
      const S = s.vert ? { x: s.x + person.side, z: s.z + person.off * 0.6 } : { x: s.x + person.off * 0.6, z: s.z + person.side };
      const pts = [S];
      const E = 12;
      if (s.vert) {
        if (Math.abs(s.x) <= E) pts.push({ x: S.x, z: Math.max(-E, Math.min(E, S.z)) });
        else { pts.push({ x: S.x, z: person.side }, { x: Math.sign(s.x) * E, z: person.side }); }
      } else {
        if (Math.abs(s.z) <= E) pts.push({ x: Math.max(-E, Math.min(E, S.x)), z: S.z });
        else { pts.push({ x: person.side, z: S.z }, { x: person.side, z: Math.sign(s.z) * E }); }
      }
      const a = person.r * Math.PI * 2;
      pts.push({ x: Math.sin(a) * 2.5, z: Math.cos(a) * 2.5 });
      pts.reverse();
      return makePath(pts);
    }
    // where a person loiters at home, at time t (seconds)
    idleAt(person, t) {
      const s = person.home.street;
      const k = Math.sin(t * 0.35 + person.r * 20) * 2.2;
      const v = Math.cos(t * 0.35 + person.r * 20);
      const S = person.path.end;
      if (s.vert) return { x: S.x, z: S.z + k, dx: 0, dz: v, moving: Math.abs(v) > 0.15 ? 0.6 : 0 };
      return { x: S.x + k, z: S.z, dx: v, dz: 0, moving: Math.abs(v) > 0.15 ? 0.6 : 0 };
    }
    place(person, q, t, opts) {
      opts = opts || {};
      const pl = person.pl;
      pl.group.position.set(q.x, 1 + (opts.y || 0), q.z);
      if (q.dx !== undefined) pl.face(q.dx, q.dz);
      pl.pose(t, q.moving || 0, opts.wave || 0, opts.jump || 0);
    }
    // chronicle: m fractional month; sec = seconds since chronicle start; secPerMonth
    setPeopleHistory(m, secPerMonth, t) {
      for (const person of this.people) {
        const vis = m >= person.join;
        person.pl.group.visible = vis;
        if (!vis) continue;
        const since = (m - person.join) * secPerMonth;
        const d = since * 7;
        if (d < person.path.len) {
          const q = person.path.at(d);
          this.place(person, { x: q.x, z: q.z, dx: q.dx, dz: q.dz, moving: 1 }, t);
        } else this.place(person, this.idleAt(person, t + person.r * 9), t);
      }
    }
    setPeopleIdle(t, except) {
      for (const person of this.people) {
        if (except && except.has(person.p.login)) continue;
        person.pl.group.visible = true;
        this.place(person, this.idleAt(person, t), t);
      }
    }

    // ---------- plaza pedestals for the hall of fame ----------
    makePedestals() {
      const heroes = (window.CB_CONFIG.heroes || []).filter(h => this.byLogin.has(h.login));
      this.heroes = heroes;
      const n = heroes.length, R = 9.5;
      const list = [];
      this.heroSpots = heroes.map((h, i) => {
        const a = Math.PI + i / n * Math.PI * 2;
        const x = Math.round(Math.sin(a) * R - 0.5), z = Math.round(Math.cos(a) * R - 0.5);
        list.push([x, 1, z, 'quartz_pillar'], [x, 2, z, 'gold_block']);
        return { x: x + 0.5, z: z + 0.5, y: 2, a, h };
      });
      const own = new Map(list.map((b, i) => [b[0] * 1e6 + b[1] * 1e3 + b[2], i]));
      const occ = (x, y, z) => this.vox.opaque(x, y, z) || own.has(x * 1e6 + y * 1e3 + z);
      const cull = (x, y, z) => this.vox.opaque(x, y, z) || own.has(x * 1e6 + y * 1e3 + z);
      this.pedestals = this.world.addMesh(list, occ, cull).mesh;
      this.pedestals.visible = false;
    }
  }

  function makePath(pts) {
    const segs = [];
    let len = 0;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      const l = Math.hypot(b.x - a.x, b.z - a.z);
      if (l < 1e-4) continue;
      segs.push({ a, b, l, s: len });
      len += l;
    }
    return {
      len, start: pts[0], end: pts[pts.length - 1], pts,
      at(d) {
        if (!segs.length) return { x: pts[0].x, z: pts[0].z, dx: 0, dz: 1 };
        d = Math.max(0, Math.min(len, d));
        let s = segs[segs.length - 1];
        for (const g of segs) if (d <= g.s + g.l) { s = g; break; }
        const f = (d - s.s) / s.l;
        return { x: s.a.x + (s.b.x - s.a.x) * f, z: s.a.z + (s.b.z - s.a.z) * f, dx: s.b.x - s.a.x, dz: s.b.z - s.a.z };
      },
      reversed() { return makePath(pts.slice().reverse()); },
    };
  }

  // Minecraft-style spider: abdomen, neck, head, 8 legs, red eyes
  function makeSpider() {
    const S = 3 / 16;
    const g = new THREE.Group();
    const mat = (c) => new THREE.MeshBasicMaterial({ color: c, vertexColors: true, map: MC.pixTex(8, 8, (ctx) => {
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const v = 200 + Math.random() * 55 | 0; ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(x, y, 1, 1); }
    }) });
    const dark = mat(0x3d332c), darker = mat(0x2c2420);
    const box = (w, h, d, m, x, y, z) => { const b = new THREE.Mesh(MC.shadedBox(w * S, h * S, d * S), m); b.position.set(x * S, y * S, z * S); g.add(b); return b; };
    box(10, 8, 12, dark, 0, 9, -9);
    box(6, 6, 6, darker, 0, 9, 0);
    const head = box(8, 8, 8, dark, 0, 9, 7);
    const eye = new THREE.MeshBasicMaterial({ color: 0xff2020 });
    for (const [x, y] of [[-2, 1], [2, 1], [-3, 2.5], [3, 2.5]]) {
      const e = new THREE.Mesh(new THREE.BoxGeometry(1.2 * S, 1.2 * S, 0.3 * S), eye);
      e.position.set(x * S, y * S, 4.05 * S); head.add(e);
    }
    g.legs = [];
    for (let i = 0; i < 8; i++) {
      const side = i < 4 ? 1 : -1, k = i % 4;
      const piv = new THREE.Group();
      piv.position.set(side * 3 * S, 9 * S, (1.5 - k) * 1.6 * S);
      const leg = new THREE.Mesh(MC.shadedBox(16 * S, 2 * S, 2 * S), darker);
      leg.position.x = side * 8 * S;
      piv.add(leg);
      piv.rotation.y = side * (k - 1.5) * 0.45;
      piv.rotation.z = -side * 0.45;
      piv.userData = { side, k, base: piv.rotation.y };
      g.add(piv);
      g.legs.push(piv);
    }
    g.animate = (t, speed) => {
      for (const l of g.legs) {
        const ph = t * 10 * speed + l.userData.k * 1.6 + (l.userData.side > 0 ? 0 : Math.PI);
        l.rotation.y = l.userData.base + Math.sin(ph) * 0.25 * speed * l.userData.side;
        l.rotation.z = -l.userData.side * (0.45 - Math.max(0, Math.cos(ph)) * 0.3 * speed);
      }
    };
    g.scale.setScalar(2.6);
    return g;
  }

  window.Village = { Town, monthOf, dateOf, makePath };
})();
