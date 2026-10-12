// Cloud-Barista World: the community as a little pixel town that grows through time.
// Project families are zones, repositories are buildings (built when the repo is created),
// contributors are bobble-head characters (their avatar on a pixel body) who appear when they
// first commit and walk between the buildings they work on.
(function () {
  const { h, images, frag, ease, clock, cupSVG } = window.Show;
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  const SCALE = 5; // canvas px per sprite pixel

  // ---------- pixel sprites ----------
  // R roof · r roof shade · # wall · D door · W window · T leaves · t trunk · C cup
  const SPR = {
    S: [".RRRRRRRR.", "RRRRRRRRRR", "#W##DD##W#", "#W##DD##W#", "####DD####", "##########"],
    M: ["..RRRRRRRRRR..", ".RRRRRRRRRRRR.", "RRRRRRRRRRRRRR", "#W#W##DD##W#W#", "#W#W##DD##W#W#", "######DD######", "#W#W######W#W#", "##############"],
    L: [".RRRRRRRRRRRRRR.", "RRRRRRRRRRRRRRRR", "#W#W#W##W#W#W#W#", "#W#W#W##W#W#W#W#", "################", "#W#W#W##W#W#W#W#", "#W#W#W##W#W#W#W#", "#######DD#######", "#W#W###DD###W#W#", "#W#W###DD###W#W#", "################"],
    tree: ["..TT..", ".TTTT.", "TTTTTT", "TTTTTT", ".TTTT.", "..tt..", "..tt.."],
    cup: [".CCCCC.", ".CCCCCc", ".CCCCCc", ".CCCCC.", "..CCC..", "CCCCCCC"],
  };
  const spriteCache = new Map();
  function sprite(key, rows, pal, res) {
    let c = spriteCache.get(key);
    if (c) return c;
    const w = rows[0].length, hg = rows.length;
    const small = document.createElement("canvas");
    small.width = w; small.height = hg;
    const g = small.getContext("2d");
    rows.forEach((row, y) => [...row].forEach((ch, x) => { const col = pal[ch]; if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); } }));
    c = document.createElement("canvas");
    c.width = w * SCALE * res; c.height = hg * SCALE * res;
    const G = c.getContext("2d");
    G.imageSmoothingEnabled = false;
    G.drawImage(small, 0, 0, c.width, c.height);
    spriteCache.set(key, c);
    return c;
  }
  function shade(hex, k) { // k<1 darker, k>1 lighter
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
    return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
  }
  function housePal(color, lit) {
    return { R: color, r: shade(color, 0.7), "#": "#e6d5bb", D: "#5a3a22", W: lit ? "#ffd36b" : "#2b211b" };
  }
  const circleCache = new Map();
  function faceImage(key, img, d, ring, res) {
    const ck = `${key}:${Math.round(d)}:${ring}`;
    let c = circleCache.get(ck);
    if (c) return c;
    const s = Math.ceil(d * res);
    c = document.createElement("canvas");
    c.width = c.height = s;
    const g = c.getContext("2d");
    g.beginPath(); g.arc(s / 2, s / 2, s / 2 - 1.5 * res, 0, Math.PI * 2); g.closePath();
    g.save(); g.clip();
    if (img) {
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      g.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, s, s);
    } else { g.fillStyle = "#3a2b22"; g.fillRect(0, 0, s, s); }
    g.restore();
    g.lineWidth = 2 * res; g.strokeStyle = ring; g.stroke();
    circleCache.set(ck, c);
    return c;
  }

  // deterministic pseudo-random so the town looks the same every loop
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  // Zone anchors and grid shape; the zone's size follows its number of buildings.
  const ZONE_SPEC = {
    pioneers: { x: 180, y: 340, cols: 3 },
    community: { x: 180, y: 600, cols: 3 },
    core: { x: 700, y: 420, cols: 4 },
    poc: { x: 700, y: 760, cols: 5, cellH: 76 },
    migrator: { x: 1130, y: 400, cols: 4 },
    ecosystem: { x: 1200, y: 760, cols: 6 },
    ai: { x: 1540, y: 462, cols: 4, cellW: 64, cellH: 72 },
  };
  const ISLAND = { x: 150, y: 318, w: 1670, h: 667 };

  function scene(M) {
    return {
      id: "world", section: "constellation", cls: "s-world", accent: "#e9b872",
      async run(ctx) {
        const W = 1920, H = 1080;
        const res = Math.min(2, Math.max(1, Math.ceil(window.Show.stageScale() * (window.devicePixelRatio || 1))));
        const canvas = h("canvas", { width: W * res, height: H * res, style: { width: W + "px", height: H + "px" } });
        const g = canvas.getContext("2d");
        g.scale(res, res);
        await document.fonts.load('16px "Galmuri11"').catch(() => {});

        const t0 = Date.parse(M.stats.orgCreated), t1 = Date.parse(M.generatedAt);
        const T = (d) => Math.max(0, Math.min(1, (Date.parse(d) - t0) / (t1 - t0)));
        const rand = rng(20190201);

        // ---- zones sized by their buildings, then buildings on each zone's grid
        const repoList = M.repos.filter((r) => r.people.length).sort((a, b) => a.created_at.localeCompare(b.created_at));
        const zoneOf = (r) => (r.family && ZONE_SPEC[r.family.id] ? r.family.id : "core");
        const ZONES = {};
        for (const [id, spec] of Object.entries(ZONE_SPEC)) {
          const n = repoList.filter((r) => zoneOf(r) === id).length;
          if (!n) continue;
          const cellW = spec.cellW || 88, cellH = spec.cellH || 80;
          const rows = Math.ceil(n / spec.cols);
          ZONES[id] = { ...spec, cellW, cellH, w: 24 + spec.cols * cellW, h: 40 + rows * cellH, fill: 0 };
        }
        const buildings = repoList.map((r) => {
          const zid = zoneOf(r);
          const z = ZONES[zid];
          const i = z.fill++;
          const col = i % z.cols, row = Math.floor(i / z.cols);
          const tier = r.commits > 1500 ? "L" : r.commits > 150 ? "M" : "S";
          const rows = SPR[tier];
          const w = rows[0].length * SCALE, hg = rows.length * SCALE;
          const cx = z.x + 12 + col * z.cellW + z.cellW / 2 + (rand() - 0.5) * 6;
          const base = z.y + 40 + row * z.cellH + z.cellH - 14 + (rand() - 0.5) * 6;
          return { r, zone: zid, color: r.family ? r.family.color : "#e9b872", tier, w, h: hg, cx, base, t: T(r.created_at), on: false, born: 0, busy: 0 };
        });
        const bBy = new Map(buildings.map((b) => [b.r.name, b]));

        // ---- characters
        const chars = M.people.map((p) => {
          const works = p.repos.map((n) => bBy.get(n)).filter(Boolean).map((b) => ({ b, w: (b.r.people.find((q) => q.login === p.login) || {}).repoCommits || 1 }));
          if (!works.length) return null;
          const first = works.slice().sort((a, b) => (a.b.r.people.find((q) => q.login === p.login).repoFirst || "9").localeCompare(b.b.r.people.find((q) => q.login === p.login).repoFirst || "9"))[0];
          const home = first.b;
          return { p, img: images.get(p.login), works, home, x: home.cx, y: home.base + 20, tx: 0, ty: 0, state: "idle", until: 0, speed: 55 + rand() * 40, dir: 1, on: false, born: 0, t: Math.max(T(p.first), home.t), at: home, phase: rand() * 6.28 };
        }).filter(Boolean).sort((a, b) => a.t - b.t);

        // ---- trees on the island, away from zones
        const trees = [];
        const inZone = (x, y) => Object.values(ZONES).some((z) => x > z.x - 20 && x < z.x + z.w + 20 && y > z.y - 20 && y < z.y + z.h + 20);
        for (let k = 0; k < 400 && trees.length < 16; k++) {
          const x = ISLAND.x + 30 + rand() * (ISLAND.w - 60), y = ISLAND.y + 30 + rand() * (ISLAND.h - 60);
          if (!inZone(x, y)) trees.push({ x, y });
        }

        // ---- achievements (derived from the data)
        const ach = [];
        if (M.firstCommit) ach.push({ t: T(M.firstCommit.date), d: M.firstCommit.date, title: "첫 원두", sub: `“${M.firstCommit.message}”` });
        const people = M.people;
        for (const n of [50, 100]) if (people[n - 1]) ach.push({ t: T(people[n - 1].first), d: people[n - 1].first, title: `주민 ${n}명`, sub: `${n}번째 기여자 합류` });
        const reposByDate = M.repos.filter((r) => r.people.length).sort((a, b) => a.created_at.localeCompare(b.created_at));
        for (const n of [10, 25, 50]) if (reposByDate[n - 1]) ach.push({ t: T(reposByDate[n - 1].created_at), d: reposByDate[n - 1].created_at, title: `건물 ${n}채`, sub: `${n}번째 레포지토리` });
        let cum = 0;
        const cumByMonth = [];
        for (const m of M.months) { cum += m.n; cumByMonth.push({ m: m.m, cum }); }
        for (const n of [5000, 10000, 15000]) { const hit = cumByMonth.find((x) => x.cum >= n); if (hit) ach.push({ t: T(hit.m + "-28"), d: hit.m + "-28", title: `XP ${fmt(n)}`, sub: `누적 커밋 ${fmt(n)} 돌파` }); }
        const tea = M.releases.find((r) => r.kind === "tea");
        if (tea) ach.push({ t: T(tea.date), d: tea.date, title: "커피에서 차로", sub: `${tea.name} — 첫 번째 차 릴리스` });
        for (const f of M.families) {
          const firstRepo = f.repos.slice().sort((a, b) => a.created_at.localeCompare(b.created_at))[0];
          if (firstRepo && f.id !== "core" && f.id !== "poc") ach.push({ t: T(firstRepo.created_at), d: firstRepo.created_at, title: `새 구역: ${f.short || f.title}`, sub: f.title });
        }
        ach.sort((a, b) => a.t - b.t);
        const toastQueue = [];

        // ---- DOM
        const head = h("div", "head", h("div", "kicker", "Cloud-Barista World"), h("div", "h2", "바리스타 마을"),
          h("div", "lead muted", "레포지토리는 건물이 되고, 기여자는 주민이 되어 마을을 키웁니다"));
        const stageEl = h("div", "stage-no", `STAGE ${M.years[0].year}`);
        const monEl = h("div", "mon", "");
        const statEl = h("div", { class: "stats", html: "주민 <b>0</b> · 건물 <b>0</b> · XP <b>0</b>" });
        const ticker = h("div", "ticker", stageEl, monEl, statEl);
        const toasts = h("div", "toasts");
        const banner = h("div", "banner");
        banner.style.opacity = 0;
        const caption = h("div", { class: "caption", html: `<b>${chars.length}</b>명의 주민이 <b>${buildings.length}</b>채의 건물에서 지금도 커피를 내리고 있습니다` });
        caption.style.opacity = 0;
        ctx.root.append(canvas, head, ticker, toasts, banner, caption);
        ctx.stagger(head.children, { each: 120 });
        ctx.anim(ticker, [{ opacity: 0 }, { opacity: 1 }], { duration: 700, delay: 300 });

        // ---- state
        let progress = 0, now = 0;
        const floaters = [], confetti = [], sparkles = [];
        let bi = 0, ci = 0, ai = 0, ri = 0, lastYear = "", lastStats = "";
        const cumAt = (p) => { const d = new Date(t0 + p * (t1 - t0)); const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`; let c = 0; for (const x of cumByMonth) { if (x.m <= key) c = x.cum; else break; } return c; };

        function activate() {
          while (bi < buildings.length && buildings[bi].t <= progress) {
            const b = buildings[bi++]; b.on = true; b.born = now;
            for (let k = 0; k < 10; k++) sparkles.push({ x: b.cx + (rand() - 0.5) * b.w, y: b.base - rand() * b.h, vx: (rand() - 0.5) * 60, vy: -30 - rand() * 60, born: now, life: 900 + rand() * 500, color: "#e6d5bb" });
          }
          while (ci < chars.length && chars[ci].t <= progress) {
            const c = chars[ci++]; c.on = true; c.born = now; c.until = now + 1500 + rand() * 1500;
            c.x = c.home.cx + (rand() - 0.5) * 40; c.y = c.home.base + 14 + rand() * 20;
            for (let k = 0; k < 8; k++) sparkles.push({ x: c.x, y: c.y - 20, vx: (rand() - 0.5) * 120, vy: -40 - rand() * 80, born: now, life: 700 + rand() * 400, color: "#f6ede3" });
          }
          while (ai < ach.length && ach[ai].t <= progress) {
            const a = ach[ai++];
            const el = h("div", "toast", h("span", "ico", "★"), h("div", null, h("div", "t", `업적 달성 · ${a.title}`), h("div", "s", `${a.sub} · ${a.d.slice(0, 7).replace("-", ".")}`)));
            toasts.append(el);
            ctx.anim(el, [{ opacity: 0, transform: "translateX(40px)" }, { opacity: 1, transform: "none" }], { duration: 400 });
            ctx.wait(4200).then(() => ctx.anim(el, [{ opacity: 1 }, { opacity: 0, transform: "translateX(40px)" }], { duration: 400 }).finished.then(() => el.remove(), () => el.remove())).catch(() => {});
            while (toasts.children.length > 2) toasts.firstChild.remove();
          }
          while (ri < M.releases.length && T(M.releases[ri].date) <= progress) {
            const r = M.releases[ri++];
            banner.replaceChildren(frag(cupSVG(r.liquid, r.kind)), h("div", null, h("div", "k", "NEW MENU!"), h("div", "n", `${r.name} ${r.version}`)));
            banner.style.opacity = "";
            ctx.anim(banner, [{ opacity: 0, transform: "translate(-50%, -20px) scale(.9)" }, { opacity: 1, transform: "translate(-50%, 0) scale(1)", offset: 0.15 }, { opacity: 1, transform: "translate(-50%, 0) scale(1)", offset: 0.85 }, { opacity: 0, transform: "translate(-50%, -10px)" }], { duration: 3200 });
            for (let k = 0; k < 90; k++) confetti.push({ x: 960 + (rand() - 0.5) * 200, y: 290, vx: (rand() - 0.5) * 420, vy: -120 - rand() * 260, born: now, life: 2200 + rand() * 600, color: [r.accent, "#f6ede3", "#7cc4ff", "#ff7a9a", "#f5d96b"][Math.floor(rand() * 5)], rot: rand() * 6.28, vr: (rand() - 0.5) * 10 });
          }
        }

        function step(dtMs) {
          const dt = Math.min(dtMs, 50) / 1000;
          for (const c of chars) {
            if (!c.on) continue;
            if (c.state === "idle") {
              if (now < c.until) continue;
              const avail = c.works.filter((w) => w.b.on);
              let target;
              if (avail.length && rand() < 0.7) {
                let sum = 0; for (const w of avail) sum += Math.sqrt(w.w);
                let pick = rand() * sum;
                for (const w of avail) { pick -= Math.sqrt(w.w); if (pick <= 0) { target = w.b; break; } }
                target = target || avail[0].b;
                c.tx = target.cx + (rand() - 0.5) * (target.w + 70); c.ty = target.base + 8 + rand() * 40; c.goal = target;
              } else {
                c.tx = Math.max(ISLAND.x + 30, Math.min(ISLAND.x + ISLAND.w - 30, c.x + (rand() - 0.5) * 120));
                c.ty = Math.max(ISLAND.y + 40, Math.min(ISLAND.y + ISLAND.h - 20, c.y + (rand() - 0.5) * 60)); c.goal = null;
              }
              c.state = "walk"; c.dir = c.tx < c.x ? -1 : 1;
            } else {
              const dx = c.tx - c.x, dy = c.ty - c.y;
              const d = Math.hypot(dx, dy);
              const stepLen = c.speed * dt;
              if (d <= stepLen) {
                c.x = c.tx; c.y = c.ty; c.state = "idle"; c.until = now + 1200 + rand() * 2800;
                if (c.goal) {
                  c.at = c.goal; c.goal.busy = now;
                  if (rand() < 0.45) floaters.push({ x: c.x, y: c.y - 44, text: ["+커밋", "+1 PR", "☕", "+XP", "merge!"][Math.floor(rand() * 5)], born: now, color: c.goal.color });
                }
              } else { c.x += (dx / d) * stepLen; c.y += (dy / d) * stepLen; }
            }
          }
          for (const s of sparkles) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 60 * dt; }
          for (const s of confetti) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 420 * dt; s.vx *= 0.995; s.rot += s.vr * dt; }
          let k = sparkles.length; while (k--) if (now - sparkles[k].born > sparkles[k].life) sparkles.splice(k, 1);
          k = confetti.length; while (k--) if (now - confetti[k].born > confetti[k].life) confetti.splice(k, 1);
          k = floaters.length; while (k--) if (now - floaters[k].born > 1300) floaters.splice(k, 1);
        }

        function roundRect(x, y, w, hg, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + hg, r); g.arcTo(x + w, y + hg, x, y + hg, r); g.arcTo(x, y + hg, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

        function draw() {
          g.clearRect(0, 0, W, H);
          // time of day: one day per year
          const yearFrac = ((progress * (t1 - t0) / 864e5 / 365.25) % 1 + 1) % 1;
          const daylight = Math.max(0, Math.sin(yearFrac * Math.PI * 2 - Math.PI / 2)); // 0 at new year (night) → 1 mid-year
          // sun by day, moon by night, travelling along the top of the island
          const ax = ISLAND.x + 80 + yearFrac * (ISLAND.w - 160);
          const ay = ISLAND.y - 20 - Math.sin(yearFrac * Math.PI) * 24;
          if (daylight > 0.05) {
            g.strokeStyle = "#ffd36b"; g.lineWidth = 3; g.globalAlpha = 0.7;
            for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + now / 4000; g.beginPath(); g.moveTo(ax + Math.cos(a) * 18, ay + Math.sin(a) * 18); g.lineTo(ax + Math.cos(a) * 25, ay + Math.sin(a) * 25); g.stroke(); }
            g.globalAlpha = 1; g.fillStyle = "#ffd36b"; g.beginPath(); g.arc(ax, ay, 14, 0, Math.PI * 2); g.fill();
          } else {
            g.fillStyle = "#e3e8ff"; g.beginPath(); g.arc(ax, ay, 14, 0, Math.PI * 2); g.fill();
            g.fillStyle = "#120d0a"; g.beginPath(); g.arc(ax + 7, ay - 4, 12, 0, Math.PI * 2); g.fill();
          }
          // island
          roundRect(ISLAND.x, ISLAND.y, ISLAND.w, ISLAND.h, 36);
          g.fillStyle = `rgb(${28 + daylight * 10},${22 + daylight * 10},${16 + daylight * 6})`; g.fill();
          g.lineWidth = 3; g.strokeStyle = "rgba(246,237,227,.12)"; g.stroke();
          g.fillStyle = "rgba(246,237,227,.045)";
          for (let x = ISLAND.x + 24; x < ISLAND.x + ISLAND.w; x += 48) for (let y = ISLAND.y + 24; y < ISLAND.y + ISLAND.h; y += 48) g.fillRect(x, y, 3, 3);
          // paths from every zone to the core
          const core = ZONES.core;
          if (core) {
            g.strokeStyle = "rgba(246,237,227,.07)"; g.lineWidth = 14; g.lineCap = "round"; g.setLineDash([18, 14]);
            for (const [id, z] of Object.entries(ZONES)) {
              if (id === "core" || !buildings.some((b) => b.zone === id && b.on)) continue;
              g.beginPath(); g.moveTo(z.x + z.w / 2, z.y + z.h / 2); g.lineTo(core.x + core.w / 2, core.y + core.h / 2); g.stroke();
            }
            g.setLineDash([]);
          }
          // zones
          for (const f of M.families) {
            const z = ZONES[f.id]; if (!z) continue;
            const firstB = buildings.find((b) => b.zone === f.id && b.on);
            if (!firstB) continue;
            const age = (now - firstB.born) / 1000;
            g.globalAlpha = Math.min(1, age / 1.2);
            roundRect(z.x, z.y, z.w, z.h, 22);
            g.fillStyle = f.color; g.globalAlpha *= 0.07; g.fill();
            g.globalAlpha = Math.min(1, age / 1.2) * 0.35; g.lineWidth = 2; g.strokeStyle = f.color; g.setLineDash([6, 8]); g.stroke(); g.setLineDash([]);
            g.globalAlpha = Math.min(1, age / 1.2);
            g.font = '700 16px "Galmuri11", "Pretendard", sans-serif'; g.textAlign = "left"; g.textBaseline = "middle";
            const label = (f.short || f.title).toUpperCase();
            const tw = g.measureText(label).width;
            g.fillStyle = "#3b2a1c"; g.fillRect(z.x + 10, z.y + 6, tw + 22, 24); g.fillStyle = "#5a3f2a"; g.fillRect(z.x + 10, z.y + 30, tw + 22, 3);
            g.fillStyle = f.color; g.fillText(label, z.x + 21, z.y + 18);
            g.globalAlpha = 1;
          }
          // trees
          const tree = sprite("tree", SPR.tree, { T: "#4f8a5a", t: "#5a3a22" }, res);
          for (const t of trees) g.drawImage(tree, t.x - 12, t.y - 28, 24, 28);
          // buildings (back to front)
          const lit = daylight < 0.25;
          for (const b of buildings.slice().sort((a, b) => a.base - b.base)) {
            if (!b.on) continue;
            const age = (now - b.born) / 1000;
            const rise = Math.min(1, age / 0.7);
            const r = 1 - Math.pow(1 - rise, 3);
            const on = lit || now - b.busy < 2500;
            const img = sprite(`${b.tier}:${b.color}:${on}`, SPR[b.tier], housePal(b.color, on), res);
            const hg = b.h * r;
            g.drawImage(img, b.cx - b.w / 2, b.base - hg, b.w, hg);
            if (b.tier === "L") { const cup = sprite("cup", SPR.cup, { C: "#e9b872", c: "#b8894e" }, res); g.drawImage(cup, b.cx - 14, b.base - hg - 30, 28, 24); }
            if (age < 2.5) {
              g.font = '700 13px "Galmuri11", sans-serif'; g.textAlign = "center"; g.textBaseline = "bottom";
              g.fillStyle = "#ffd36b"; g.fillText("NEW!", b.cx, b.base - hg - (b.tier === "L" ? 34 : 6) - Math.sin(age * 6) * 3);
            }
            if (b.tier !== "S") {
              g.font = `600 ${b.tier === "L" ? 14 : 12}px "Pretendard", sans-serif`; g.textAlign = "center"; g.textBaseline = "top";
              g.lineWidth = 4; g.strokeStyle = "rgba(15,11,9,.8)"; g.lineJoin = "round";
              g.strokeText(b.r.title, b.cx, b.base + 3); g.fillStyle = "#f6ede3"; g.fillText(b.r.title, b.cx, b.base + 3);
            }
          }
          // characters (back to front)
          for (const c of chars.slice().sort((a, b) => a.y - b.y)) {
            if (!c.on) continue;
            const age = (now - c.born) / 1000;
            const walking = c.state === "walk";
            const bob = walking ? Math.abs(Math.sin(now / 90 + c.phase)) * 4 : Math.sin(now / 600 + c.phase) * 1.5;
            const bx = c.x, by = c.y - bob;
            // legs
            g.fillStyle = "#2b211b";
            const lo = walking ? Math.sin(now / 90 + c.phase) * 3 : 0;
            g.fillRect(bx - 6, by - 6 + Math.max(0, lo), 4, 7); g.fillRect(bx + 2, by - 6 + Math.max(0, -lo), 4, 7);
            // body
            g.fillStyle = c.home.color; roundRect(bx - 9, by - 22, 18, 17, 4); g.fill();
            g.fillStyle = "rgba(0,0,0,.18)"; g.fillRect(bx - 9, by - 9, 18, 4);
            // head
            const d = 28;
            const face = faceImage(c.p.login, c.img, d, c.home.color, res);
            g.drawImage(face, bx - d / 2, by - 22 - d + 4, d, d);
            if (age < 3) {
              g.globalAlpha = Math.min(1, 3 - age);
              g.font = '600 13px "Pretendard", sans-serif'; g.textAlign = "center"; g.textBaseline = "bottom";
              g.lineWidth = 4; g.strokeStyle = "rgba(15,11,9,.85)"; g.strokeText(c.p.koName || c.p.displayName, bx, by - 22 - d - 2);
              g.fillStyle = "#f6ede3"; g.fillText(c.p.koName || c.p.displayName, bx, by - 22 - d - 2);
              g.globalAlpha = 1;
            }
          }
          // floaters, sparkles, confetti
          g.font = '700 14px "Galmuri11", sans-serif'; g.textAlign = "center"; g.textBaseline = "bottom";
          for (const f of floaters) {
            const k = (now - f.born) / 1300;
            g.globalAlpha = 1 - k; g.fillStyle = f.color;
            g.fillText(f.text, f.x, f.y - k * 34);
          }
          for (const s of sparkles) { g.globalAlpha = 1 - (now - s.born) / s.life; g.fillStyle = s.color; g.fillRect(s.x - 2, s.y - 2, 4, 4); }
          for (const s of confetti) {
            g.globalAlpha = Math.min(1, (s.life - (now - s.born)) / 500); g.fillStyle = s.color;
            g.save(); g.translate(s.x, s.y); g.rotate(s.rot); g.fillRect(-5, -3, 10, 6); g.restore();
          }
          g.globalAlpha = 1;
        }

        ctx.everyFrame((dtMs) => {
          now = clock.t;
          activate();
          step(dtMs);
          draw();
          let cs = 0, bs = 0;
          for (const c of chars) if (c.on) cs++;
          for (const b of buildings) if (b.on) bs++;
          const xp = cumAt(progress);
          const key = `${cs}/${bs}/${xp}`;
          if (key !== lastStats) { lastStats = key; statEl.innerHTML = `주민 <b>${cs}</b> · 건물 <b>${bs}</b> · XP <b>${fmt(xp)}</b>`; }
        });

        await ctx.wait(800);
        await ctx.tween(36000, (p) => {
          progress = p;
          const date = new Date(t0 + p * (t1 - t0));
          const y = String(date.getUTCFullYear());
          monEl.textContent = `${date.getUTCMonth() + 1}월`;
          if (y !== lastYear) {
            lastYear = y; stageEl.textContent = `STAGE ${y}`;
            ctx.anim(stageEl, [{ transform: "scale(1.2)", opacity: 0.5 }, { transform: "none", opacity: 1 }], { duration: 500 });
          }
        }, ease.linear);
        progress = 1.0001;
        ctx.anim(caption, [{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], { duration: 900, delay: 2600 });
        await ctx.wait(7500);
      },
    };
  }

  window.ShowWorld = { scene };
})();
