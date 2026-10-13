// Rendering core: voxel meshing with Minecraft-style face shading + ambient occlusion,
// sky / day cycle, clouds, square particles and blocky players.
(function () {
  'use strict';
  const { BLOCKS, UV, faceTex, atlas, rng, hash } = PX;

  // ---------- voxel store ----------
  function key(x, y, z) { return ((x + 512) << 18) | ((y + 64) << 10) | (z + 512); }
  class Voxels {
    constructor() { this.m = new Map(); }
    set(x, y, z, id) { if (id) this.m.set(key(x, y, z), id); else this.m.delete(key(x, y, z)); }
    get(x, y, z) { return this.m.get(key(x, y, z)); }
    opaque(x, y, z) { const b = this.m.get(key(x, y, z)); return !!b && !BLOCKS[b].see && !BLOCKS[b].water; }
  }

  // ---------- mesher ----------
  const FACES = [
    { dir: [-1, 0, 0], tex: 'side', shade: 0.72, c: [[0, 1, 0, 0, 1], [0, 0, 0, 0, 0], [0, 1, 1, 1, 1], [0, 0, 1, 1, 0]] },
    { dir: [1, 0, 0], tex: 'side', shade: 0.72, c: [[1, 1, 1, 0, 1], [1, 0, 1, 0, 0], [1, 1, 0, 1, 1], [1, 0, 0, 1, 0]] },
    { dir: [0, -1, 0], tex: 'bottom', shade: 0.5, c: [[1, 0, 1, 1, 0], [0, 0, 1, 0, 0], [1, 0, 0, 1, 1], [0, 0, 0, 0, 1]] },
    { dir: [0, 1, 0], tex: 'top', shade: 1.0, c: [[0, 1, 1, 1, 1], [1, 1, 1, 0, 1], [0, 1, 0, 1, 0], [1, 1, 0, 0, 0]] },
    { dir: [0, 0, -1], tex: 'side', shade: 0.86, c: [[1, 0, 0, 0, 0], [0, 0, 0, 1, 0], [1, 1, 0, 0, 1], [0, 1, 0, 1, 1]] },
    { dir: [0, 0, 1], tex: 'front', shade: 0.86, c: [[0, 0, 1, 0, 0], [1, 0, 1, 1, 0], [0, 1, 1, 0, 1], [1, 1, 1, 1, 1]] },
  ];
  const AO = [0.45, 0.62, 0.8, 1.0];

  // list: [[x,y,z,id], ...] in build order.
  // occ(x,y,z): opaque neighbour for AO; cull(x,y,z,i,id): hide the face toward that neighbour.
  // facing(i) optionally names which side is the block's "front" (0..5 index into FACES) — default +z.
  function mesh(list, occ, cull, opts) {
    opts = opts || {};
    const pos = [], uv = [], col = [], glow = [], idx = [];
    const ends = new Int32Array(list.length);
    for (let i = 0; i < list.length; i++) {
      const [x, y, z, id, front] = list[i];
      const b = BLOCKS[id];
      const isWater = b && b.water;
      for (let f = 0; f < 6; f++) {
        const F = FACES[f];
        if (isWater && f !== 3) continue;
        const nx = x + F.dir[0], ny = y + F.dir[1], nz = z + F.dir[2];
        if (cull(nx, ny, nz, i, id)) continue;
        let tname;
        const frontFace = front === undefined ? 5 : front;
        if (f === frontFace) tname = faceTex(id, 'front');
        else tname = faceTex(id, F.tex === 'front' ? 'side' : F.tex);
        const t = UV[tname];
        const base = pos.length / 3;
        const ao = [];
        for (let k = 0; k < 4; k++) {
          const c = F.c[k];
          const yo = isWater ? (c[1] ? -0.12 : 0) : 0;
          pos.push(x + c[0], y + c[1] + yo, z + c[2]);
          uv.push(c[3] ? t[2] : t[0], c[4] ? t[3] : t[1]);
          let a = 3;
          if (!b.glow && opts.ao !== false) {
            // two axes perpendicular to the face normal
            const axes = [0, 1, 2].filter(a => !F.dir[a]);
            const o1 = [0, 0, 0], o2 = [0, 0, 0];
            o1[axes[0]] = c[axes[0]] ? 1 : -1;
            o2[axes[1]] = c[axes[1]] ? 1 : -1;
            const s1 = occ(nx + o1[0], ny + o1[1], nz + o1[2]) ? 1 : 0;
            const s2 = occ(nx + o2[0], ny + o2[1], nz + o2[2]) ? 1 : 0;
            const cc = occ(nx + o1[0] + o2[0], ny + o1[1] + o2[1], nz + o1[2] + o2[2]) ? 1 : 0;
            a = s1 && s2 ? 0 : 3 - (s1 + s2 + cc);
          }
          ao.push(a);
          const s = (b.glow ? 1 : F.shade) * AO[a];
          col.push(s, s, s);
          glow.push(b.glow ? 1 : 0);
        }
        if (ao[0] + ao[3] > ao[1] + ao[2]) idx.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
        else idx.push(base, base + 1, base + 3, base, base + 3, base + 2);
      }
      ends[i] = idx.length;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setAttribute('glow', new THREE.Float32BufferAttribute(glow, 1));
    g.setIndex(pos.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(idx, 1) : new THREE.Uint16BufferAttribute(idx, 1));
    g.computeBoundingSphere();
    return { geometry: g, ends };
  }

  // ---------- materials ----------
  const atlasTex = new THREE.CanvasTexture(atlas);
  atlasTex.magFilter = THREE.NearestFilter;
  atlasTex.minFilter = THREE.NearestMipmapLinearFilter;
  atlasTex.generateMipmaps = true;
  if ('colorSpace' in atlasTex) atlasTex.colorSpace = 'srgb'; else atlasTex.encoding = THREE.sRGBEncoding;

  // Glow faces ignore the day/night tint (material colour).
  function glowPatch(mat) {
    mat.onBeforeCompile = (sh) => {
      sh.vertexShader = 'attribute float glow;\nvarying float vGlow;\n' + sh.vertexShader.replace('#include <color_vertex>', '#include <color_vertex>\nvGlow = glow;');
      sh.fragmentShader = 'varying float vGlow;\n' + sh.fragmentShader.replace('#include <color_fragment>',
        '#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb / max(diffuse, vec3(0.05)), vGlow);');
    };
    return mat;
  }
  const blockMat = glowPatch(new THREE.MeshBasicMaterial({ map: atlasTex, vertexColors: true, alphaTest: 0.5 }));
  const waterMat = new THREE.MeshBasicMaterial({ map: atlasTex, vertexColors: true, transparent: true, opacity: 0.82, depthWrite: false });

  // ---------- sky ----------
  const SKY_KEYS = [ // t: 0 sunrise, .25 noon, .5 sunset, .75 midnight
    { t: 0.00, top: '#5a7ec8', hor: '#f0a878', light: 0.8 },
    { t: 0.08, top: '#78a7ff', hor: '#bcd4ff', light: 1.0 },
    { t: 0.42, top: '#78a7ff', hor: '#bcd4ff', light: 1.0 },
    { t: 0.50, top: '#4a5f9a', hor: '#f08a5a', light: 0.78 },
    { t: 0.56, top: '#141b38', hor: '#36406a', light: 0.5 },
    { t: 0.94, top: '#141b38', hor: '#36406a', light: 0.5 },
    { t: 1.00, top: '#5a7ec8', hor: '#f0a878', light: 0.8 },
  ];
  function skyAt(t) {
    t = ((t % 1) + 1) % 1;
    let a = SKY_KEYS[0], b = SKY_KEYS[1];
    for (let i = 0; i < SKY_KEYS.length - 1; i++) if (t >= SKY_KEYS[i].t && t <= SKY_KEYS[i + 1].t) { a = SKY_KEYS[i]; b = SKY_KEYS[i + 1]; break; }
    const f = (t - a.t) / Math.max(1e-6, b.t - a.t);
    const top = new THREE.Color(a.top).lerp(new THREE.Color(b.top), f);
    const hor = new THREE.Color(a.hor).lerp(new THREE.Color(b.hor), f);
    return { top, hor, light: a.light + (b.light - a.light) * f };
  }

  function squareTex(draw, size) {
    const c = document.createElement('canvas'); c.width = c.height = size || 32;
    draw(c.getContext('2d'), c.width);
    const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    return t;
  }

  // ---------- particles (square, per-particle size + alpha) ----------
  class Particles {
    constructor(max) {
      this.max = max; this.n = 0;
      this.p = new Float32Array(max * 3); this.v = new Float32Array(max * 3);
      this.c = new Float32Array(max * 4); this.s = new Float32Array(max);
      this.life = new Float32Array(max); this.age = new Float32Array(max); this.grav = new Float32Array(max); this.size0 = new Float32Array(max);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(this.p, 3).setUsage(THREE.DynamicDrawUsage));
      g.setAttribute('rgba', new THREE.BufferAttribute(this.c, 4).setUsage(THREE.DynamicDrawUsage));
      g.setAttribute('size', new THREE.BufferAttribute(this.s, 1).setUsage(THREE.DynamicDrawUsage));
      this.mat = new THREE.ShaderMaterial({
        uniforms: { scale: { value: 500 } },
        vertexShader: 'attribute float size; attribute vec4 rgba; varying vec4 vC; uniform float scale;\n' +
          'void main(){ vC = rgba; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = size * scale / max(0.1, -mv.z); gl_Position = projectionMatrix * mv; }',
        fragmentShader: 'varying vec4 vC; void main(){ if (vC.a < 0.02) discard; gl_FragColor = vC; }',
        transparent: true, depthWrite: false,
      });
      this.points = new THREE.Points(g, this.mat);
      this.points.frustumCulled = false;
      this.geo = g;
    }
    add(x, y, z, vx, vy, vz, color, size, life, grav) {
      let i = this.n < this.max ? this.n++ : Math.floor(Math.random() * this.max);
      this.p[i * 3] = x; this.p[i * 3 + 1] = y; this.p[i * 3 + 2] = z;
      this.v[i * 3] = vx; this.v[i * 3 + 1] = vy; this.v[i * 3 + 2] = vz;
      const c = color instanceof THREE.Color ? color : new THREE.Color(color);
      this.c[i * 4] = c.r; this.c[i * 4 + 1] = c.g; this.c[i * 4 + 2] = c.b; this.c[i * 4 + 3] = 1;
      this.s[i] = size; this.size0[i] = size; this.life[i] = life; this.age[i] = 0; this.grav[i] = grav === undefined ? -9 : grav;
    }
    burst(x, y, z, color, count, speed, size, life) {
      for (let k = 0; k < count; k++) {
        const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u);
        const sp = speed * (0.6 + Math.random() * 0.4);
        this.add(x, y, z, r * Math.cos(th) * sp, u * sp, r * Math.sin(th) * sp, color, size * (0.7 + Math.random() * 0.6), life * (0.7 + Math.random() * 0.5), -3);
      }
    }
    puff(x, y, z, count) {
      for (let k = 0; k < count; k++) this.add(x + (Math.random() - 0.5) * 0.8, y + Math.random() * 1.6, z + (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 1.2, 0.6 + Math.random(), (Math.random() - 0.5) * 1.2, new THREE.Color().setHSL(0, 0, 0.75 + Math.random() * 0.2), 0.16, 0.9, 0);
    }
    clear() { this.n = 0; }
    update(dt) {
      let w = 0;
      for (let i = 0; i < this.n; i++) {
        this.age[i] += dt;
        if (this.age[i] >= this.life[i]) continue;
        const f = this.age[i] / this.life[i];
        this.v[i * 3 + 1] += this.grav[i] * dt;
        this.v[i * 3] *= 0.985; this.v[i * 3 + 2] *= 0.985;
        for (let k = 0; k < 3; k++) this.p[i * 3 + k] += this.v[i * 3 + k] * dt;
        if (w !== i) {
          for (let k = 0; k < 3; k++) { this.p[w * 3 + k] = this.p[i * 3 + k]; this.v[w * 3 + k] = this.v[i * 3 + k]; }
          for (let k = 0; k < 4; k++) this.c[w * 4 + k] = this.c[i * 4 + k];
          this.life[w] = this.life[i]; this.age[w] = this.age[i]; this.grav[w] = this.grav[i]; this.size0[w] = this.size0[i];
        }
        this.c[w * 4 + 3] = f < 0.7 ? 1 : 1 - (f - 0.7) / 0.3;
        this.s[w] = this.size0[w] * (1 - f * 0.4);
        w++;
      }
      this.n = w;
      this.geo.setDrawRange(0, this.n);
      this.geo.attributes.position.needsUpdate = true;
      this.geo.attributes.rgba.needsUpdate = true;
      this.geo.attributes.size.needsUpdate = true;
    }
  }

  // ---------- players ----------
  function shadedBox(w, h, d) {
    const g = new THREE.BoxGeometry(w, h, d);
    const shades = [0.72, 0.72, 1.0, 0.5, 0.9, 0.62]; // +x -x +y -y +z -z
    const col = [];
    for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) col.push(shades[f], shades[f], shades[f]);
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    return g;
  }
  const P = 1 / 16;
  const SKINS = ['#f0c8a0', '#e3b48c', '#c99a72', '#f5d2b0', '#d8a882'];
  const HAIR = ['#2a1d14', '#3b2a1c', '#1b1714', '#4a3322', '#5a4030', '#151515'];
  const SHIRTS = ['#3aa0d8', '#e0582f', '#4caf50', '#8e44ad', '#f1c40f', '#16a085', '#d35454', '#2f6fd0', '#e67e22', '#7f8c8d', '#c0398b', '#00a3a3', '#6b8e23', '#b8860b'];
  const PANTS = ['#2b3a8c', '#34495e', '#3a3a3a', '#5a4632', '#24304f', '#4a4a6a'];

  function pixTex(w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); draw(g, w, h);
    const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    if ('colorSpace' in t) t.colorSpace = 'srgb'; else t.encoding = THREE.sRGBEncoding;
    return t;
  }
  function noisy(g, x0, y0, w, h, color, r, j) {
    const c = new THREE.Color(color);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const f = 1 + (r() - 0.5) * (j || 0.14);
      g.fillStyle = `rgb(${Math.min(255, c.r * 255 * f) | 0},${Math.min(255, c.g * 255 * f) | 0},${Math.min(255, c.b * 255 * f) | 0})`;
      g.fillRect(x0 + x, y0 + y, 1, 1);
    }
  }

  // Each player owns a 64px cell of one skin atlas. Faces map into the cell like a
  // Minecraft skin, but the head is 16px per face so GitHub avatars stay recognisable.
  // Order of BoxGeometry faces: +x, -x, +y, -y, +z (front), -z (back).
  const SKIN_RECTS = {
    head: [[16, 0, 16, 16], [32, 0, 16, 16], [48, 0, 16, 16], [0, 16, 16, 16], [0, 0, 16, 16], [16, 16, 16, 16]],
    body: [[16, 32, 4, 12], [20, 32, 4, 12], [24, 32, 8, 4], [24, 36, 8, 4], [0, 32, 8, 12], [8, 32, 8, 12]],
    arm: [[40, 32, 4, 12], [44, 32, 4, 12], [48, 32, 4, 4], [48, 36, 4, 4], [32, 32, 4, 12], [36, 32, 4, 12]],
    leg: [[40, 48, 4, 12], [44, 48, 4, 12], [48, 48, 4, 4], [48, 52, 4, 4], [32, 48, 4, 12], [36, 48, 4, 12]],
  };
  const CELL = 64, GRID = 16;
  function partGeo(w, h, d, rects) {
    const g = shadedBox(w, h, d);
    const uv = g.attributes.uv;
    for (let f = 0; f < 6; f++) {
      const [rx, ry, rw, rh] = rects[f];
      for (let k = 0; k < 4; k++) {
        const i = f * 4 + k, U = uv.getX(i), V = uv.getY(i);
        uv.setXY(i, (rx + U * rw) / CELL, 1 - (ry + (1 - V) * rh) / CELL);
      }
    }
    return g;
  }

  class Crowd {
    constructor(scene, max) {
      this.max = Math.min(max, GRID * GRID);
      const c = document.createElement('canvas'); c.width = c.height = CELL * GRID;
      this.canvas = c; this.g = c.getContext('2d');
      const tex = new THREE.CanvasTexture(c);
      tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
      if ('colorSpace' in tex) tex.colorSpace = 'srgb'; else tex.encoding = THREE.sRGBEncoding;
      this.tex = tex;
      this.mat = new THREE.MeshBasicMaterial({ map: tex, vertexColors: true });
      this.mat.onBeforeCompile = (sh) => {
        sh.vertexShader = 'attribute vec2 skinOff;\n' + sh.vertexShader.replace('#include <uv_vertex>',
          '#include <uv_vertex>\n#ifdef USE_UV\nvUv = uv * ' + (1 / GRID).toFixed(6) + ' + skinOff;\n#endif');
      };
      const off = new Float32Array(this.max * 2);
      for (let i = 0; i < this.max; i++) { off[i * 2] = (i % GRID) / GRID; off[i * 2 + 1] = 1 - (Math.floor(i / GRID) + 1) / GRID; }
      const offAttr = new THREE.InstancedBufferAttribute(off, 2);
      const mk = (geo) => {
        geo.setAttribute('skinOff', offAttr);
        const m = new THREE.InstancedMesh(geo, this.mat, this.max);
        m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        m.frustumCulled = false; m.count = 0;
        scene.add(m);
        return m;
      };
      const head = partGeo(8 * P, 8 * P, 8 * P, SKIN_RECTS.head), body = partGeo(8 * P, 12 * P, 4 * P, SKIN_RECTS.body);
      this.parts = {
        head: mk(head), body: mk(body),
        armL: mk(partGeo(4 * P, 12 * P, 4 * P, SKIN_RECTS.arm)), armR: mk(partGeo(4 * P, 12 * P, 4 * P, SKIN_RECTS.arm)),
        legL: mk(partGeo(4 * P, 12 * P, 4 * P, SKIN_RECTS.leg)), legR: mk(partGeo(4 * P, 12 * P, 4 * P, SKIN_RECTS.leg)),
      };
      this.shadow = new THREE.InstancedMesh(SHADOW_GEO, SHADOW_MAT, this.max);
      this.shadow.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.shadow.frustumCulled = false; this.shadow.count = 0;
      scene.add(this.shadow);
      this.players = [];
      this.zero = new THREE.Matrix4().makeScale(0, 0, 0);
    }
    add(pl) { const i = this.players.length; if (i >= this.max) return -1; this.players.push(pl); return i; }
    paint(i, avatarURL, look, r) {
      const g = this.g, x0 = (i % GRID) * CELL, y0 = Math.floor(i / GRID) * CELL;
      const { skin, hair, shirt, pants } = look;
      const fill = (rx, ry, w, h, col, j) => noisy(g, x0 + rx, y0 + ry, w, h, col, r, j);
      // head
      fill(0, 0, 16, 16, skin, 0.08);
      g.fillStyle = hair; g.fillRect(x0, y0, 16, 4);
      g.fillStyle = '#ffffff'; g.fillRect(x0 + 3, y0 + 8, 3, 2); g.fillRect(x0 + 10, y0 + 8, 3, 2);
      g.fillStyle = '#3b5bdb'; g.fillRect(x0 + 4, y0 + 8, 2, 2); g.fillRect(x0 + 11, y0 + 8, 2, 2);
      g.fillStyle = '#9a6a52'; g.fillRect(x0 + 6, y0 + 12, 4, 1);
      for (const [rx, ry] of [[16, 0], [32, 0]]) { fill(rx, ry, 16, 16, skin, 0.08); g.fillStyle = hair; g.fillRect(x0 + rx, y0 + ry, 16, 6); g.fillRect(x0 + rx + 9, y0 + ry + 6, 7, 3); }
      fill(48, 0, 16, 16, hair, 0.2); fill(0, 16, 16, 16, skin, 0.08); fill(16, 16, 16, 16, hair, 0.2);
      // body, arms, legs
      fill(0, 32, 32, 12, shirt);
      fill(32, 32, 20, 12, skin, 0.08);
      g.fillStyle = shirt; g.fillRect(x0 + 32, y0 + 32, 16, 4); g.fillRect(x0 + 48, y0 + 32, 4, 4);
      fill(32, 48, 20, 12, pants);
      g.fillStyle = '#4a4a4a'; g.fillRect(x0 + 32, y0 + 58, 16, 2); g.fillRect(x0 + 48, y0 + 52, 4, 4);
      this.tex.needsUpdate = true;
      if (avatarURL) {
        const img = new Image();
        img.onload = () => {
          g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
          g.drawImage(img, x0, y0, 16, 16);
          this.tex.needsUpdate = true;
        };
        img.src = avatarURL;
      }
    }
    sync() {
      const n = this.players.length;
      for (const k in this.parts) this.parts[k].count = n;
      this.shadow.count = n;
      for (let i = 0; i < n; i++) {
        const pl = this.players[i];
        if (!pl.group.visible) {
          for (const k in this.parts) this.parts[k].setMatrixAt(i, this.zero);
          this.shadow.setMatrixAt(i, this.zero);
          continue;
        }
        pl.group.updateMatrixWorld(true);
        for (const k in this.parts) this.parts[k].setMatrixAt(i, pl.nodes[k].matrixWorld);
        this.shadow.setMatrixAt(i, pl.nodes.shadow.matrixWorld);
      }
      for (const k in this.parts) this.parts[k].instanceMatrix.needsUpdate = true;
      this.shadow.instanceMatrix.needsUpdate = true;
    }
  }

  class Player {
    constructor(person, avatarURL, crowd) {
      const h = hash(person.login);
      const r = rng(h);
      this.login = person.login;
      const look = { skin: SKINS[h % SKINS.length], hair: HAIR[(h >>> 3) % HAIR.length], shirt: SHIRTS[(h >>> 6) % SHIRTS.length], pants: PANTS[(h >>> 10) % PANTS.length] };
      this.index = crowd.add(this);
      crowd.paint(this.index, avatarURL, look, r);
      const node = (parent, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); parent.add(o); return o; };
      const root = new THREE.Group();
      this.body = node(root, 0, 0, 0);
      this.headPivot = node(this.body, 0, 24 * P, 0);
      this.armL = node(this.body, 6 * P, 22 * P, 0); this.armR = node(this.body, -6 * P, 22 * P, 0);
      this.legL = node(this.body, 2 * P, 12 * P, 0); this.legR = node(this.body, -2 * P, 12 * P, 0);
      this.nodes = {
        head: node(this.headPivot, 0, 4 * P, 0), body: node(this.body, 0, 18 * P, 0),
        armL: node(this.armL, 0, -4 * P, 0), armR: node(this.armR, 0, -4 * P, 0),
        legL: node(this.legL, 0, -6 * P, 0), legR: node(this.legR, 0, -6 * P, 0),
        shadow: node(root, 0, 0.02, 0),
      };
      this.nodes.shadow.rotation.x = -Math.PI / 2;
      this.group = root;
      this.phase = r() * 10;
    }
    // walk: 0..1 speed, wave: 0..1, jump height
    pose(t, walk, wave, jump) {
      const s = Math.sin(t * 9 + this.phase) * 0.75 * walk;
      this.legL.rotation.x = s; this.legR.rotation.x = -s;
      this.armL.rotation.x = -s * 0.9; this.armR.rotation.x = s * 0.9;
      this.armL.rotation.z = 0.05; this.armR.rotation.z = -0.05;
      if (wave) {
        this.armR.rotation.x = -2.7 * wave + Math.sin(t * 10) * 0.25 * wave;
        this.armR.rotation.z = -0.35 * wave + Math.sin(t * 10) * 0.25 * wave;
      }
      this.body.position.y = jump || 0;
    }
    face(dx, dz) { if (dx * dx + dz * dz > 1e-6) this.group.rotation.y = Math.atan2(dx, dz); }
  }
  const SHADOW_GEO = new THREE.PlaneGeometry(0.75, 0.75);
  const SHADOW_MAT = new THREE.MeshBasicMaterial({
    map: squareTex((g, s) => { const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); }),
    transparent: true, depthWrite: false,
  });

  // ---------- the world ----------
  class World {
    constructor(canvas) {
      const r = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
      const cfg = window.CB_CONFIG || {};
      r.setPixelRatio(Math.min(window.devicePixelRatio || 1, cfg.maxPixelRatio || 1.5));
      if ('outputColorSpace' in r) r.outputColorSpace = 'srgb'; else r.outputEncoding = THREE.sRGBEncoding;
      this.renderer = r;
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.1, 1200);
      this.scene.fog = new THREE.Fog(0xbcd4ff, 60, 230);
      this.voxels = new Voxels();
      this.particles = new Particles(5000);
      this.scene.add(this.particles.points);
      this.dayTime = 0.15;
      this.makeSky();
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }
    resize() {
      const w = window.innerWidth, h = window.innerHeight;
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
      this.particles.mat.uniforms.scale.value = h * this.renderer.getPixelRatio() / (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)));
    }
    makeSky() {
      const geo = new THREE.SphereGeometry(900, 32, 16);
      this.skyMat = new THREE.ShaderMaterial({
        uniforms: { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() } },
        vertexShader: 'varying float vY; void main(){ vY = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: 'uniform vec3 top; uniform vec3 hor; varying float vY; void main(){ float f = smoothstep(-0.05, 0.45, vY); gl_FragColor = vec4(mix(hor, top, f), 1.0); }',
        side: THREE.BackSide, depthWrite: false, fog: false,
      });
      this.sky = new THREE.Mesh(geo, this.skyMat);
      this.sky.renderOrder = -10;
      this.scene.add(this.sky);
      const sunT = squareTex((g, s) => { g.fillStyle = '#fff9c8'; g.fillRect(0, 0, s, s); g.fillStyle = '#fffbe8'; g.fillRect(s * 0.2, s * 0.2, s * 0.6, s * 0.6); g.fillStyle = '#ffffff'; g.fillRect(s * 0.35, s * 0.35, s * 0.3, s * 0.3); }, 16);
      const moonT = squareTex((g, s) => { g.fillStyle = '#d8dce8'; g.fillRect(0, 0, s, s); g.fillStyle = '#aab0c4'; [[3, 3, 3], [9, 5, 4], [5, 10, 3], [11, 11, 2]].forEach(([x, y, w]) => g.fillRect(x, y, w, w)); }, 16);
      const mk = (t) => new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ map: t, fog: false, transparent: true, depthWrite: false }));
      this.sun = mk(sunT); this.moon = mk(moonT);
      this.sun.renderOrder = this.moon.renderOrder = -9;
      this.scene.add(this.sun, this.moon);
      // stars
      const sp = [];
      const R = rng(7);
      for (let i = 0; i < 700; i++) { const u = R() * 0.9 + 0.1, th = R() * Math.PI * 2, rr = Math.sqrt(1 - u * u); sp.push(rr * Math.cos(th) * 800, u * 800, rr * Math.sin(th) * 800); }
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
      this.starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
      this.stars = new THREE.Points(sg, this.starMat); this.stars.renderOrder = -9;
      this.scene.add(this.stars);
      this.makeClouds();
    }
    makeClouds() {
      const N = 48, S = 12, H = 4, R = rng(99);
      const on = [];
      // blobby value noise
      const g = [];
      for (let i = 0; i < 13 * 13; i++) g.push(R());
      const vn = (x, z) => { const X = Math.floor(x), Z = Math.floor(z), fx = x - X, fz = z - Z; const a = g[(X % 13) * 13 + Z % 13], b = g[((X + 1) % 13) * 13 + Z % 13], c = g[(X % 13) * 13 + (Z + 1) % 13], d = g[((X + 1) % 13) * 13 + (Z + 1) % 13]; const sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz); return a + (b - a) * sx + (c - a) * sz + (a - b - c + d) * sx * sz; };
      for (let x = 0; x < N; x++) { on[x] = []; for (let z = 0; z < N; z++) on[x][z] = vn(x / 4, z / 4) * 0.7 + R() * 0.3 > 0.62; }
      const pos = [], col = [];
      const quad = (a, b, c, d, s) => { pos.push(...a, ...b, ...c, ...a, ...c, ...d); for (let k = 0; k < 6; k++) col.push(s, s, s); };
      const has = (x, z) => on[(x + N) % N][(z + N) % N];
      for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) {
        if (!on[x][z]) continue;
        const x0 = (x - N / 2) * S, x1 = x0 + S, z0 = (z - N / 2) * S, z1 = z0 + S;
        quad([x0, H, z0], [x0, H, z1], [x1, H, z1], [x1, H, z0], 1.0);
        quad([x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [x0, 0, z1], 0.78);
        if (!has(x - 1, z)) quad([x0, 0, z0], [x0, 0, z1], [x0, H, z1], [x0, H, z0], 0.88);
        if (!has(x + 1, z)) quad([x1, 0, z1], [x1, 0, z0], [x1, H, z0], [x1, H, z1], 0.88);
        if (!has(x, z - 1)) quad([x1, 0, z0], [x0, 0, z0], [x0, H, z0], [x1, H, z0], 0.92);
        if (!has(x, z + 1)) quad([x0, 0, z1], [x1, 0, z1], [x1, H, z1], [x0, H, z1], 0.92);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      this.cloudMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.82, side: THREE.DoubleSide, depthWrite: false });
      this.clouds = new THREE.Mesh(geo, this.cloudMat);
      this.clouds.position.y = 118;
      this.cloudSpan = N * S;
      this.scene.add(this.clouds);
    }
    setDayTime(t) {
      this.dayTime = t;
      const s = skyAt(t);
      this.skyMat.uniforms.top.value.copy(s.top);
      this.skyMat.uniforms.hor.value.copy(s.hor);
      this.scene.fog.color.copy(s.hor);
      const L = s.light;
      blockMat.color.setRGB(L, L, L);
      waterMat.color.setRGB(L, L, L);
      this.light = L;
      for (const m of this.tintMats || []) m.color.setRGB(L, L, L);
      this.cloudMat.color.setRGB(Math.max(0.35, L), Math.max(0.35, L), Math.max(0.4, L));
      const night = THREE.MathUtils.clamp((0.6 - L) / 0.1, 0, 1);
      this.starMat.opacity = night;
      // sun goes up in the east (+x) at t=0 and sets at t=.5
      const a = t * Math.PI * 2;
      const cam = this.camera.position;
      this.sun.position.set(cam.x + Math.cos(a) * 500, cam.y + Math.sin(a) * 500, cam.z + 80);
      this.moon.position.set(cam.x - Math.cos(a) * 500, cam.y - Math.sin(a) * 500, cam.z + 80);
      this.sun.lookAt(cam); this.moon.lookAt(cam);
    }
    // characters use their own materials; register them for the day/night tint
    registerTint(mats) { this.tintMats = (this.tintMats || []).concat(mats); }
    addMesh(list, occ, cull, opts) {
      const { geometry, ends } = mesh(list, occ, cull, opts);
      const m = new THREE.Mesh(geometry, opts && opts.water ? waterMat : blockMat);
      if (opts && opts.water) m.renderOrder = 2;
      this.scene.add(m);
      return { mesh: m, ends };
    }
    update(dt) {
      this.particles.update(dt);
      const cam = this.camera.position;
      this.sky.position.copy(cam);
      this.stars.position.copy(cam);
      this.clouds.position.x = ((performance.now() / 1000 * 1.2) % this.cloudSpan) - 0 + Math.floor(cam.x / this.cloudSpan) * this.cloudSpan;
      this.clouds.position.z = Math.floor(cam.z / this.cloudSpan) * this.cloudSpan;
      this.setDayTime(this.dayTime);
    }
    render() { if (this.crowd) this.crowd.sync(); this.renderer.render(this.scene, this.camera); }
    project(v) { // world → stage px (1920x1080 space) or null
      const p = v.clone().project(this.camera);
      if (p.z > 1 || p.z < -1) return null;
      return { x: (p.x + 1) / 2, y: (1 - p.y) / 2, z: p.z };
    }
  }

  window.MC = { World, Player, Crowd, Voxels, mesh, blockMat, waterMat, shadedBox, pixTex, SHIRTS };
})();
