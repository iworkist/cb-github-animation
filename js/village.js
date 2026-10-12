// Open-source village: the community as a small town that grows through time.
// Project families are neighbourhoods, repositories are houses (built when the repo is created),
// contributors are residents (their avatar on a small body) who arrive with their first commit and
// walk between the houses they work on. A house's windows light up while someone is working there.
(function () {
  const { h, images, ease, clock } = window.Show;
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  const { ym } = window.ShowModel;
  const SCALE = 5; // canvas px per sprite pixel

  // ---------- pixel-art houses ----------
  // R roof · # wall · D door · W window
  const SPR = {
    S: [".RRRRRRRR.", "RRRRRRRRRR", "#W##DD##W#", "#W##DD##W#", "####DD####", "##########"],
    M: ["..RRRRRRRRRR..", ".RRRRRRRRRRRR.", "RRRRRRRRRRRRRR", "#W#W##DD##W#W#", "#W#W##DD##W#W#", "######DD######", "#W#W######W#W#", "##############"],
    L: [".RRRRRRRRRRRRRR.", "RRRRRRRRRRRRRRRR", "#W#W#W##W#W#W#W#", "#W#W#W##W#W#W#W#", "################", "#W#W#W##W#W#W#W#", "#W#W#W##W#W#W#W#", "#######DD#######", "#W#W###DD###W#W#", "#W#W###DD###W#W#", "################"],
    tree: ["..TT..", ".TTTT.", "TTTTTT", "TTTTTT", ".TTTT.", "..tt..", "..tt.."],
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
  const housePal = (color, lit) => ({ R: color, "#": "#e6d5bb", D: "#5a3a22", W: lit ? "#ffd36b" : "#5c4a3c" });

  const faceCache = new Map();
  function faceImage(key, img, d, ring, res) {
    const ck = `${key}:${Math.round(d)}:${ring}`;
    let c = faceCache.get(ck);
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
    faceCache.set(ck, c);
    return c;
  }

  // deterministic pseudo-random so the village looks the same every loop
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  // Neighbourhood anchors and grid shape; a neighbourhood's size follows its number of houses.
  const HOODS = {
    pioneers: { x: 180, y: 330, cols: 3 },
    community: { x: 180, y: 590, cols: 3 },
    core: { x: 700, y: 410, cols: 4 },
    poc: { x: 700, y: 742, cols: 5, cellH: 76 },
    migrator: { x: 1130, y: 390, cols: 4 },
    ecosystem: { x: 1200, y: 742, cols: 6 },
    ai: { x: 1540, y: 452, cols: 4, cellW: 64, cellH: 72 },
  };
  const ISLAND = { x: 150, y: 310, w: 1670, h: 616 };
  const BAR = { y: 966, x0: 200, x1: 1720 };

  function scene(M) {
    return {
      id: "village", section: "village", cls: "s-village", accent: "#e9b872",
      async run(ctx) {
        const W = 1920, H = 1080;
        const res = Math.min(2, Math.max(1, Math.ceil(window.Show.stageScale() * (window.devicePixelRatio || 1))));
        const canvas = h("canvas", { width: W * res, height: H * res, style: { width: W + "px", height: H + "px" } });
        const g = canvas.getContext("2d");
        g.scale(res, res);

        const t0 = Date.parse(M.stats.orgCreated), t1 = Date.parse(M.generatedAt);
        const T = (d) => Math.max(0, Math.min(1, (Date.parse(d) - t0) / (t1 - t0)));
        const rand = rng(20190201);

        // ---- neighbourhoods sized by their houses, then houses on each grid
        const repoList = M.repos.filter((r) => r.people.length).sort((a, b) => a.created_at.localeCompare(b.created_at));
        const hoodOf = (r) => (r.family && HOODS[r.family.id] ? r.family.id : "core");
        const zones = {};
        for (const [id, spec] of Object.entries(HOODS)) {
          const n = repoList.filter((r) => hoodOf(r) === id).length;
          if (!n) continue;
          const cellW = spec.cellW || 88, cellH = spec.cellH || 80;
          zones[id] = { ...spec, cellW, cellH, w: 24 + spec.cols * cellW, h: 40 + Math.ceil(n / spec.cols) * cellH, fill: 0, fam: M.families.find((f) => f.id === id) };
        }
        const houses = repoList.map((r) => {
          const z = zones[hoodOf(r)];
          const i = z.fill++;
          const col = i % z.cols, row = Math.floor(i / z.cols);
          const tier = r.commits > 1500 ? "L" : r.commits > 150 ? "M" : "S";
          const rows = SPR[tier];
          return {
            r, zone: hoodOf(r), color: r.family ? r.family.color : "#e9b872", tier,
            w: rows[0].length * SCALE, h: rows.length * SCALE,
            cx: z.x + 12 + col * z.cellW + z.cellW / 2 + (rand() - 0.5) * 6,
            base: z.y + 40 + row * z.cellH + z.cellH - 14 + (rand() - 0.5) * 6,
            t: T(r.created_at), on: false, born: 0, busy: -1e9,
          };
        });
        const houseBy = new Map(houses.map((b) => [b.r.name, b]));

        // ---- residents
        const residents = M.people.map((p) => {
          const works = p.repos.map((n) => houseBy.get(n)).filter(Boolean).map((b) => {
            const me = b.r.people.find((q) => q.login === p.login) || {};
            return { b, w: me.repoCommits || 1, first: me.repoFirst || "9999" };
          });
          if (!works.length) return null;
          const home = works.slice().sort((a, b) => a.first.localeCompare(b.first))[0].b;
          return { p, img: images.get(p.login), works, home, x: home.cx, y: home.base + 20, tx: 0, ty: 0, walking: false, until: 0, speed: 55 + rand() * 40, on: false, born: 0, t: Math.max(T(p.first), home.t), phase: rand() * 6.28 };
        }).filter(Boolean).sort((a, b) => a.t - b.t);

        // ---- trees away from the neighbourhoods
        const trees = [];
        const inZone = (x, y) => Object.values(zones).some((z) => x > z.x - 20 && x < z.x + z.w + 20 && y > z.y - 20 && y < z.y + z.h + 20);
        for (let k = 0; k < 400 && trees.length < 16; k++) {
          const x = ISLAND.x + 30 + rand() * (ISLAND.w - 60), y = ISLAND.y + 30 + rand() * (ISLAND.h - 60);
          if (!inZone(x, y)) trees.push({ x, y });
        }

        // ---- milestones worth a caption (all derived from the data)
        const notes = [];
        for (const n of [50, 100]) if (M.people[n - 1]) notes.push({ t: T(M.people[n - 1].first), text: `${n}번째 기여자가 마을에 합류했습니다` });
        for (const n of [25, 50]) if (repoList[n - 1]) notes.push({ t: T(repoList[n - 1].created_at), text: `${n}번째 레포지토리가 세워졌습니다` });
        for (const n of [10000, 20000]) { const g2 = M.growth.find((x) => x.commits >= n); if (g2) notes.push({ t: T(g2.m + "-15"), text: `누적 커밋 ${fmt(n)}개를 넘었습니다` }); }
        for (const z of Object.values(zones)) {
          const first = houses.find((b) => zones[b.zone] === z);
          if (first && z.fam && first.t > 0.05) notes.push({ t: first.t, text: `${z.fam.short || z.fam.title} 구역이 생겼습니다` });
        }
        notes.sort((a, b) => a.t - b.t);

        // ---- DOM
        const head = h("div", "head", h("div", "kicker", "Open source village"), h("div", "h2", "Cloud-Barista 마을"),
          h("div", "lead muted", "레포지토리는 집이 되고, 기여자는 주민이 되어 함께 마을을 키워 왔습니다"));
        const yEl = h("div", "y", String(M.years[0].year));
        const mEl = h("div", "m", "");
        const sEl = h("div", "s");
        const ticker = h("div", "ticker", yEl, mEl, sEl);
        const note = h("div", "note");
        note.style.opacity = 0;
        const bar = h("div", "bar");
        for (const y of M.years) bar.append(h("span", { class: "tick", style: { left: BAR.x0 + T(`${y.year}-01-01`) * (BAR.x1 - BAR.x0) + "px" } }, y.year));
        const relDots = M.releases.map((r) => h("span", { class: "dot", style: { left: BAR.x0 + T(r.date) * (BAR.x1 - BAR.x0) + "px", "--rc": r.accent } }));
        bar.append(...relDots);
        const playhead = h("span", { class: "ph" }, h("span", "lbl"));
        const phLabel = playhead.firstChild;
        bar.append(playhead);
        ctx.root.append(canvas, head, ticker, note, bar);
        ctx.stagger(head.children, { each: 120 });
        ctx.stagger([ticker, bar], { delay: 300, each: 150 });

        // ---- simulation
        let progress = 0, now = 0;
        const dust = [];
        let hi = 0, ri = 0, ni = 0, reli = 0;

        function activate() {
          while (hi < houses.length && houses[hi].t <= progress) {
            const b = houses[hi++]; b.on = true; b.born = now;
            for (let k = 0; k < 8; k++) dust.push({ x: b.cx + (rand() - 0.5) * b.w, y: b.base - 4, vx: (rand() - 0.5) * 50, vy: -20 - rand() * 30, born: now, life: 800 + rand() * 400 });
          }
          while (ri < residents.length && residents[ri].t <= progress) {
            const c = residents[ri++]; c.on = true; c.born = now; c.until = now + 1200 + rand() * 1500;
            c.x = c.home.cx + (rand() - 0.5) * 40; c.y = c.home.base + 14 + rand() * 20;
          }
          while (ni < notes.length && notes[ni].t <= progress) {
            const n = notes[ni++];
            note.textContent = n.text;
            ctx.anim(note, [{ opacity: 0, transform: "translate(-50%, 8px)" }, { opacity: 1, transform: "translate(-50%, 0)", offset: 0.12 }, { opacity: 1, transform: "translate(-50%, 0)", offset: 0.85 }, { opacity: 0, transform: "translate(-50%, 0)" }], { duration: 3600 });
          }
          while (reli < M.releases.length && T(M.releases[reli].date) <= progress) {
            const r = M.releases[reli++];
            relDots[reli - 1].classList.add("on");
            phLabel.textContent = `${r.name} ${r.version}`;
            ctx.anim(phLabel, [{ opacity: 0, transform: "translate(-50%, 8px)" }, { opacity: 1, transform: "translate(-50%, 0)" }], { duration: 500 });
          }
        }

        function step(dtMs) {
          const dt = Math.min(dtMs, 50) / 1000;
          for (const c of residents) {
            if (!c.on) continue;
            if (!c.walking) {
              if (now < c.until) continue;
              const avail = c.works.filter((w) => w.b.on);
              if (avail.length && rand() < 0.7) {
                let sum = 0; for (const w of avail) sum += Math.sqrt(w.w);
                let pick = rand() * sum, target = avail[0].b;
                for (const w of avail) { pick -= Math.sqrt(w.w); if (pick <= 0) { target = w.b; break; } }
                c.tx = target.cx + (rand() - 0.5) * (target.w + 70); c.ty = target.base + 8 + rand() * 40; c.goal = target;
              } else {
                c.tx = Math.max(ISLAND.x + 30, Math.min(ISLAND.x + ISLAND.w - 30, c.x + (rand() - 0.5) * 120));
                c.ty = Math.max(ISLAND.y + 40, Math.min(ISLAND.y + ISLAND.h - 20, c.y + (rand() - 0.5) * 60)); c.goal = null;
              }
              c.walking = true;
            } else {
              const dx = c.tx - c.x, dy = c.ty - c.y;
              const d = Math.hypot(dx, dy), len = c.speed * dt;
              if (d <= len) {
                c.x = c.tx; c.y = c.ty; c.walking = false; c.until = now + 1200 + rand() * 2800;
                if (c.goal) c.goal.busy = now;
              } else { c.x += (dx / d) * len; c.y += (dy / d) * len; }
            }
          }
          for (const s of dust) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 40 * dt; }
          let k = dust.length; while (k--) if (now - dust[k].born > dust[k].life) dust.splice(k, 1);
        }

        function roundRect(x, y, w, hg, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + hg, r); g.arcTo(x + w, y + hg, x, y + hg, r); g.arcTo(x, y + hg, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

        function draw() {
          g.clearRect(0, 0, W, H);
          // ground
          roundRect(ISLAND.x, ISLAND.y, ISLAND.w, ISLAND.h, 36);
          g.fillStyle = "#1c1611"; g.fill();
          g.lineWidth = 2; g.strokeStyle = "rgba(246,237,227,.10)"; g.stroke();
          g.fillStyle = "rgba(246,237,227,.04)";
          for (let x = ISLAND.x + 24; x < ISLAND.x + ISLAND.w; x += 48) for (let y = ISLAND.y + 24; y < ISLAND.y + ISLAND.h; y += 48) g.fillRect(x, y, 3, 3);
          // paths from every neighbourhood to the core
          const core = zones.core;
          if (core) {
            g.strokeStyle = "rgba(246,237,227,.07)"; g.lineWidth = 14; g.lineCap = "round"; g.setLineDash([18, 14]);
            for (const [id, z] of Object.entries(zones)) {
              if (id === "core" || !houses.some((b) => b.zone === id && b.on)) continue;
              g.beginPath(); g.moveTo(z.x + z.w / 2, z.y + z.h / 2); g.lineTo(core.x + core.w / 2, core.y + core.h / 2); g.stroke();
            }
            g.setLineDash([]);
          }
          // neighbourhoods
          for (const [id, z] of Object.entries(zones)) {
            const first = houses.find((b) => b.zone === id && b.on);
            if (!first || !z.fam) continue;
            const a = Math.min(1, (now - first.born) / 1200);
            g.globalAlpha = a * 0.06; roundRect(z.x, z.y, z.w, z.h, 22); g.fillStyle = z.fam.color; g.fill();
            g.globalAlpha = a * 0.3; g.lineWidth = 2; g.strokeStyle = z.fam.color; g.setLineDash([6, 8]); g.stroke(); g.setLineDash([]);
            g.globalAlpha = a;
            g.font = '800 14px "Pretendard", sans-serif'; g.textAlign = "left"; g.textBaseline = "middle";
            g.fillStyle = z.fam.color;
            g.fillText((z.fam.short || z.fam.title).toUpperCase().split("").join(String.fromCharCode(8202)), z.x + 16, z.y + 18);
            g.globalAlpha = 1;
          }
          // trees
          const tree = sprite("tree", SPR.tree, { T: "#4f8a5a", t: "#5a3a22" }, res);
          for (const t of trees) g.drawImage(tree, t.x - 12, t.y - 28, 24, 28);
          // houses, back to front; they rise out of the ground when built
          for (const b of houses.slice().sort((a, b) => a.base - b.base)) {
            if (!b.on) continue;
            const rise = Math.min(1, (now - b.born) / 700);
            const k = 1 - Math.pow(1 - rise, 3);
            const lit = now - b.busy < 2600;
            const img = sprite(`${b.tier}:${b.color}:${lit}`, SPR[b.tier], housePal(b.color, lit), res);
            g.drawImage(img, b.cx - b.w / 2, b.base - b.h * k, b.w, b.h * k);
            if (b.tier !== "S") {
              g.font = `600 ${b.tier === "L" ? 14 : 12}px "Pretendard", sans-serif`; g.textAlign = "center"; g.textBaseline = "top";
              g.lineWidth = 4; g.strokeStyle = "rgba(15,11,9,.8)"; g.lineJoin = "round";
              g.globalAlpha = k;
              g.strokeText(b.r.title, b.cx, b.base + 3); g.fillStyle = "#f6ede3"; g.fillText(b.r.title, b.cx, b.base + 3);
              g.globalAlpha = 1;
            }
          }
          // residents, back to front
          for (const c of residents.slice().sort((a, b) => a.y - b.y)) {
            if (!c.on) continue;
            const age = (now - c.born) / 1000;
            const appear = Math.min(1, age / 0.4);
            const bob = c.walking ? Math.abs(Math.sin(now / 90 + c.phase)) * 4 : Math.sin(now / 600 + c.phase) * 1.5;
            const bx = c.x, by = c.y - bob;
            g.globalAlpha = appear;
            g.fillStyle = "#2b211b";
            const lo = c.walking ? Math.sin(now / 90 + c.phase) * 3 : 0;
            g.fillRect(bx - 6, by - 6 + Math.max(0, lo), 4, 7); g.fillRect(bx + 2, by - 6 + Math.max(0, -lo), 4, 7);
            g.fillStyle = c.home.color; roundRect(bx - 9, by - 22, 18, 17, 4); g.fill();
            g.fillStyle = "rgba(0,0,0,.18)"; g.fillRect(bx - 9, by - 9, 18, 4);
            const d = 28;
            g.drawImage(faceImage(c.p.login, c.img, d, c.home.color, res), bx - d / 2, by - 22 - d + 4, d, d);
            if (age < 3) {
              g.globalAlpha = Math.min(appear, 3 - age);
              g.font = '600 13px "Pretendard", sans-serif'; g.textAlign = "center"; g.textBaseline = "bottom";
              const name = c.p.koName || c.p.displayName;
              g.lineWidth = 4; g.strokeStyle = "rgba(15,11,9,.85)"; g.strokeText(name, bx, by - 22 - d - 2);
              g.fillStyle = "#f6ede3"; g.fillText(name, bx, by - 22 - d - 2);
            }
            g.globalAlpha = 1;
          }
          for (const s of dust) { g.globalAlpha = (1 - (now - s.born) / s.life) * 0.6; g.fillStyle = "#e6d5bb"; g.fillRect(s.x - 2, s.y - 2, 4, 4); }
          g.globalAlpha = 1;
        }

        let lastYear = "", lastStats = "";
        ctx.everyFrame((dtMs) => {
          now = clock.t;
          activate();
          step(dtMs);
          draw();
          let rs = 0, hs = 0;
          for (const c of residents) if (c.on) rs++;
          for (const b of houses) if (b.on) hs++;
          const month = new Date(t0 + Math.min(1, progress) * (t1 - t0)).toISOString().slice(0, 7);
          let commits = 0;
          for (const x of M.growth) { if (x.m <= month) commits = x.commits; else break; }
          const key = `${rs}/${hs}/${commits}`;
          if (key !== lastStats) { lastStats = key; sEl.innerHTML = `주민 <b>${rs}</b> · 집 <b>${hs}</b> · 커밋 <b>${fmt(commits)}</b>`; }
        });

        await ctx.wait(800);
        await ctx.tween(32000, (p) => {
          progress = p;
          const date = new Date(t0 + p * (t1 - t0));
          const y = String(date.getUTCFullYear());
          mEl.textContent = `${date.getUTCMonth() + 1}월`;
          if (y !== lastYear) {
            lastYear = y; yEl.textContent = y;
            ctx.anim(yEl, [{ opacity: 0.5 }, { opacity: 1 }], { duration: 500 });
          }
          playhead.style.left = BAR.x0 + p * (BAR.x1 - BAR.x0) + "px";
        }, ease.linear);
        progress = 1.0001;
        let rs = 0; for (const c of residents) if (c.on) rs++;
        note.textContent = `${rs}명의 주민이 ${houses.length}채의 집에서, 지금도 함께 만들고 있습니다`;
        ctx.anim(note, [{ opacity: 0, transform: "translate(-50%, 8px)" }, { opacity: 1, transform: "translate(-50%, 0)" }], { duration: 900, delay: 2000 });
        await ctx.wait(7500);
      },
    };
  }

  window.ShowVillage = { scene };
})();
