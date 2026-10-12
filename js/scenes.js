// All scenes. Each scene is { id, section, cls, accent, run(ctx) }.
// The show is one story: a cup of coffee brewed over seven years by a community.
(function () {
  const { h, avatar, images, cupSVG, heroCupSVG, beanSVG, frag, ease, clock } = window.Show;
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  const { ym, ymd } = window.ShowModel;
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
  // keep hyphenated project names (CB-Spider, AI-MCMP …) on one line
  const nowrapNames = (s) => esc(s).replace(/[A-Za-z]+(?:-[A-Za-z0-9]+)+/g, '<span style="white-space:nowrap">$&</span>');

  const SECTIONS = [
    { id: "prologue", label: "Prologue" },
    { id: "numbers", label: "Numbers" },
    { id: "timeline", label: "Timeline" },
    { id: "years", label: "Years" },
    { id: "menu", label: "Menu" },
    { id: "projects", label: "Projects" },
    { id: "constellation", label: "World" },
    { id: "people", label: "People" },
    { id: "now", label: "Now" },
  ];

  // Draws the hero cup's outline, pours the liquid, then lets the steam become a cloud.
  function brewCup(ctx, cup, { delay = 0, draw = 1100, pour = 1500 } = {}) {
    const strokes = [...cup.querySelectorAll(".body, .handle, .saucer")];
    const cloud = cup.querySelector(".cloud");
    const pourEl = cup.querySelector(".pour");
    const steam = cup.querySelector(".steam");
    for (const s of [...strokes, cloud]) { s.setAttribute("pathLength", "1"); s.style.strokeDasharray = "1"; s.style.strokeDashoffset = "1"; }
    steam.style.opacity = 0;
    strokes.forEach((s, i) => ctx.anim(s, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: draw, delay: delay + i * 120, easing: "ease-in-out" }));
    ctx.wait(delay + draw * 0.6).then(() => ctx.tween(pour, (p) => { pourEl.style.transform = `translateY(${100 * (1 - p)}px)`; }, ease.inOut)).catch(() => {});
    ctx.anim(steam, [{ opacity: 0 }, { opacity: 0.75 }], { duration: 800, delay: delay + draw + pour * 0.5 });
    ctx.anim(cloud, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 1800, delay: delay + draw + pour * 0.6, easing: "ease-in-out" });
    return delay + draw + pour + 1200;
  }

  // ======================================================= prologue
  function prologue(M, cfg) {
    return {
      id: "prologue", section: "prologue", cls: "s-prologue", accent: "#e9b872",
      async run(ctx) {
        const { root } = ctx;
        // phase A: a bean and the first lines of history
        const bean = frag(beanSVG());
        const entries = [[M.stats.orgCreated, "GitHub 조직 cloud-barista 생성"]];
        if (M.firstCommit) entries.push([M.firstCommit.date, `첫 커밋  “${M.firstCommit.message}”  — ${M.firstCommit.name || M.firstCommit.login}`]);
        if (M.stats.firstRelease) entries.push([M.stats.firstRelease.date, `첫 릴리스  ${M.stats.firstRelease.tag}`]);
        const lines = entries.map(([d, t]) => ({ text: t, el: h("div", "line", h("span", "d", ymd(d)), h("span", "t")) }));
        const term = h("div", "term", lines.map((l) => l.el));
        const A = h("div", "ph ph-a", bean, term);

        // phase B: the cup, and the title
        const since = h("div", "since", h("b", null, `그로부터 ${M.stats.yearsActive}년`), ", 한 잔의 이야기");
        const cup = frag(heroCupSVG({ level: 0 }));
        cup.classList.add("hero-cup");
        const words = cfg.eventTitle.split(" ");
        const title = h("div", "title",
          h("span", "w grad", words[0]), words.length > 2 ? h("br") : " ",
          words.slice(1).map((w, i) => [h("span", "w", w), i < words.length - 2 ? " " : ""]));
        const metaBits = [cfg.edition, cfg.eventDate, cfg.venue].filter(Boolean);
        const meta = metaBits.length ? h("div", "meta", metaBits.flatMap((m, i) => (i ? [h("span", "dot"), m] : [m]))) : null;
        const first = M.years[0].year, last = M.years[M.years.length - 1].year;
        const years = h("div", { class: "years", html: `<b>${first}</b> — <b>${last}</b> &nbsp;·&nbsp; ${esc(cfg.tagline)}` });
        const url = h("div", "url", "GITHUB.COM/CLOUD-BARISTA");
        const press = h("div", "press", "▶ PRESS START");
        const B = h("div", "ph ph-b", ...[since, h("div", "float", h("div", "halo"), cup), title, meta, years, press, url].filter(Boolean));
        B.style.opacity = 0;
        root.append(A, B);

        // A
        ctx.anim(bean, [
          { opacity: 0, transform: "translateY(-520px) rotate(-40deg)", offset: 0 },
          { opacity: 1, offset: 0.15 },
          { transform: "translateY(0) rotate(0)", offset: 0.75, easing: "cubic-bezier(.3,0,.6,1)" },
          { transform: "translateY(-36px) scale(1.04,.96)", offset: 0.88 },
          { transform: "translateY(0) scale(1)", offset: 1 },
        ], { duration: 1500, easing: "linear" });
        await ctx.wait(1500);
        for (const l of lines) {
          ctx.anim(l.el, [{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], { duration: 400 });
          l.el.classList.add("typing");
          await ctx.type(l.el.querySelector(".t"), l.text, 34);
          l.el.classList.remove("typing");
          await ctx.wait(650);
        }
        await ctx.wait(900);
        ctx.anim(A, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-40px)", filter: "blur(6px)" }], { duration: 700, easing: "ease-in" });
        await ctx.wait(600);

        // B
        B.style.opacity = 1;
        ctx.anim(since, [{ opacity: 0, transform: "translateY(20px)" }, { opacity: 1, transform: "none" }], { duration: 900 });
        const brewed = brewCup(ctx, cup, { delay: 500 });
        ctx.stagger(title.querySelectorAll(".w"), { delay: 2400, each: 160, duration: 1200, from: { opacity: 0, transform: "perspective(1200px) rotateX(70deg) translateY(70px)", filter: "blur(12px)" }, to: { opacity: 1, transform: "none", filter: "blur(0)" } });
        ctx.stagger([meta, years, press, url].filter(Boolean), { delay: 3400, each: 220, duration: 1000 });
        ctx.anim(title, [{ transform: "scale(1)" }, { transform: "scale(1.03)" }], { duration: 9000, delay: 3600, easing: "ease-in-out" });
        await ctx.wait(Math.max(brewed, 3400) + 7600);
      },
    };
  }

  // ======================================================= numbers: what's in the cup
  function cupNumbers(M) {
    return {
      id: "cup", section: "numbers", cls: "s-cup", accent: "#e9b872",
      async run(ctx) {
        const S = M.stats;
        const tiles = [
          { v: S.yearsActive, suf: "년", k: "함께한 시간", d: `${S.orgSince} GitHub 조직 생성부터`, tint: "#e9b872" },
          { v: S.repos, k: "레포지토리", d: "github.com/cloud-barista", tint: "#d98a4e" },
          { v: S.people, suf: "명", k: "기여자", d: "커밋으로 함께한 사람들", tint: "#7cc4ff" },
          { v: S.commits, k: "커밋", d: "자동화 계정을 제외한 사람의 커밋", tint: "#e9b872" },
          { v: S.releases, suf: "번", k: "릴리스", d: `${S.firstRelease.name} → ${S.lastRelease.name}`, tint: S.lastRelease.accent },
          { v: S.stars, k: "GitHub Stars", d: "모든 레포지토리 합계", tint: "#f5d96b" },
        ];
        const head = h("div", "head",
          h("div", "kicker", "What's in the cup"),
          h("div", "h1", "한 잔에 담긴 것"),
          h("div", "lead muted", `GitHub 기준 · ${ymd(M.generatedAt)}`));
        const cup = frag(heroCupSVG({ level: 0 }));
        cup.classList.add("big-cup");
        const vEls = [];
        const tileEls = tiles.map((t) => {
          const v = h("span", "num", "0");
          vEls.push(v);
          const el = h("div", { class: "stat", "--tint": t.tint },
            h("div", "v", v, t.suf ? h("small", null, t.suf) : null),
            h("div", "k", t.k), h("div", "d", t.d));
          el.style.opacity = 0;
          return el;
        });
        const grid = h("div", "grid", tileEls);
        ctx.root.append(head, h("div", "cols", h("div", "cupcol", h("div", "float", h("div", "halo"), cup)), grid));
        ctx.stagger(head.children, { each: 120 });
        ctx.anim(cup, [{ opacity: 0, transform: "translateY(30px)" }, { opacity: 1, transform: "none" }], { duration: 900, delay: 300 });
        const steam = cup.querySelector(".steam");
        steam.style.opacity = 0;
        const pourEl = cup.querySelector(".pour");
        await ctx.wait(900);
        let shown = 0;
        await ctx.tween(5200, (p) => {
          pourEl.style.transform = `translateY(${100 * (1 - p)}px)`;
          while (shown < tiles.length && p >= (shown + 0.5) / tiles.length) {
            const i = shown++;
            tileEls[i].style.opacity = "";
            ctx.anim(tileEls[i], [{ opacity: 0, transform: "perspective(1200px) rotateY(-35deg) translateX(60px)" }, { opacity: 1, transform: "none" }], { duration: 900 });
            ctx.countUp(vEls[i], tiles[i].v, 1800).catch(() => {});
          }
        }, ease.inOut);
        ctx.anim(steam, [{ opacity: 0 }, { opacity: 0.75 }], { duration: 800 });
        await ctx.wait(6200);
      },
    };
  }

  // ======================================================= timeline: commits & releases
  function monotonePath(pts) {
    // Fritsch–Carlson monotone cubic: smooth without overshooting below zero.
    const n = pts.length;
    if (n < 2) return "";
    const dx = [], dy = [], m = [];
    for (let i = 0; i < n - 1; i++) { dx[i] = pts[i + 1][0] - pts[i][0]; dy[i] = pts[i + 1][1] - pts[i][1]; m[i] = dy[i] / dx[i]; }
    const t = [m[0]];
    for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]);
    t[n - 1] = m[n - 2];
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < n - 1; i++) {
      const h3 = dx[i] / 3;
      d += `C${pts[i][0] + h3},${pts[i][1] + t[i] * h3} ${pts[i + 1][0] - h3},${pts[i + 1][1] - t[i + 1] * h3} ${pts[i + 1][0]},${pts[i + 1][1]}`;
    }
    return d;
  }

  function timeline(M) {
    return {
      id: "timeline", section: "timeline", cls: "s-activity", accent: "#e9b872",
      async run(ctx) {
        const byM = new Map(M.months.map((x) => [x.m, x.n]));
        const firstM = M.months[0].m, lastM = M.months[M.months.length - 1].m;
        const months = [];
        for (let [y, mo] = firstM.split("-").map(Number); ; ) {
          const key = `${y}-${String(mo).padStart(2, "0")}`;
          months.push({ m: key, n: byM.get(key) || 0 });
          if (key === lastM) break;
          if (++mo > 12) { mo = 1; y++; }
        }
        const N = months.length;
        const L = 190, R = 1800, T = 400, B = 880;
        const max = Math.max(...months.map((x) => x.n));
        const step = [50, 100, 200, 250, 500, 1000, 2000].find((s) => Math.ceil(max / s) <= 4) || 500;
        const yMax = Math.ceil(max / step) * step;
        const X = (i) => L + (i / (N - 1)) * (R - L);
        const Y = (v) => B - (v / yMax) * (B - T);
        const idxOfDate = (d) => {
          const [y, mo, day] = d.split("-").map(Number);
          const [fy, fm] = firstM.split("-").map(Number);
          return (y - fy) * 12 + (mo - fm) + (day - 1) / 31;
        };
        const pts = months.map((x, i) => [X(i), Y(x.n)]);
        const line = monotonePath(pts);
        const area = `${line}L${R},${B}L${L},${B}Z`;

        let gridSvg = "";
        for (let v = 0; v <= yMax; v += step) gridSvg += `<line x1="${L}" x2="${R}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${L - 18}" y="${Y(v) + 7}" text-anchor="end">${fmt(v)}</text>`;
        let xSvg = "";
        months.forEach((x, i) => {
          if (x.m.endsWith("-01") || i === 0) xSvg += `<line x1="${X(i)}" x2="${X(i)}" y1="${B}" y2="${B + 10}" stroke="rgba(246,237,227,.3)"/><text class="year" x="${X(i)}" y="${B + 44}" text-anchor="start">${x.m.slice(0, 4)}</text>`;
        });

        const rels = M.releases.map((r, i) => {
          const x = L + (idxOfDate(r.date) / (N - 1)) * (R - L);
          const ny = i % 2 ? 350 : 296;
          const anchor = x > R - 70 ? "end" : x < L + 70 ? "start" : "middle";
          return { r, x, html: `<g class="rel" opacity="0"><line x1="${x}" x2="${x}" y1="${ny + 30}" y2="${B}"/>
            <circle cx="${x}" cy="${ny + 30}" r="5" fill="${r.accent}"/>
            <text class="rn" x="${x}" y="${ny}" text-anchor="${anchor}">${esc(r.name)}</text>
            <text class="rv" x="${x}" y="${ny + 20}" text-anchor="${anchor}">${r.version} · ${r.ym}</text></g>` };
        });

        const peakI = months.findIndex((x) => x.n === max);
        const svg = frag(`<svg width="1920" height="1080" viewBox="0 0 1920 1080">
          <defs>
            <linearGradient id="actFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9b872" stop-opacity=".42"/><stop offset="1" stop-color="#e9b872" stop-opacity="0"/></linearGradient>
            <clipPath id="actClip"><rect class="clip" x="${L - 4}" y="0" width="0" height="1080"/></clipPath>
          </defs>
          <g class="grid axis">${gridSvg}</g>
          <g class="axis">${xSvg}</g>
          <g class="rels">${rels.map((x) => x.html).join("")}</g>
          <g clip-path="url(#actClip)">
            <path d="${area}" fill="url(#actFill)"/>
            <path d="${line}" fill="none" stroke="#e9b872" stroke-width="3" stroke-linejoin="round"/>
          </g>
          <g class="head-marker" opacity="0">
            <line class="ph" x1="0" x2="0" y1="${T - 20}" y2="${B}" stroke="#f6ede3" stroke-opacity=".5" stroke-width="1.5"/>
            <circle class="pd" r="9" fill="#f6ede3" stroke="#0f0b09" stroke-width="3"/>
          </g>
          <g class="peak" opacity="0">
            <circle cx="${X(peakI)}" cy="${Y(max)}" r="9" fill="#e9b872" stroke="#0f0b09" stroke-width="3"/>
            <text x="${X(peakI) - 18}" y="${Y(max) - 18}" text-anchor="end">가장 뜨거웠던 달 · ${ym(months[peakI].m)} · ${fmt(max)} 커밋</text>
          </g>
        </svg>`);

        const whenV = h("span", "num", ym(firstM));
        const monthN = h("span", "when", "0");
        const top = h("div", "top",
          h("div", "head", h("div", "kicker", "The journey"), h("div", "h1", `${M.stats.yearsActive}년의 커밋, ${M.releases.length}번의 릴리스`),
            h("div", "lead muted", "월별 커밋 수 (머지 커밋·자동화 계정 제외) 와 릴리스 코드네임")),
          h("div", "total", h("div", "v", whenV), h("div", "k", "이 달의 커밋 ", monthN)));
        ctx.root.append(svg, top);

        ctx.stagger(top.querySelectorAll(".head > *, .total"), { each: 120 });
        ctx.anim(svg.querySelector(".grid"), [{ opacity: 0 }, { opacity: 1 }], { duration: 1000, delay: 300 });

        const clip = svg.querySelector(".clip");
        const marker = svg.querySelector(".head-marker");
        const ph = svg.querySelector(".ph"), pd = svg.querySelector(".pd");
        const relEls = [...svg.querySelectorAll(".rel")];
        const shown = new Set();
        await ctx.wait(900);
        marker.setAttribute("opacity", "1");
        await ctx.tween(8500, (p) => {
          const fi = p * (N - 1);
          const i = Math.floor(fi), f = fi - i;
          const x = L + p * (R - L);
          const y = i >= N - 1 ? pts[N - 1][1] : pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f;
          clip.setAttribute("width", x - L + 4);
          ph.setAttribute("x1", x); ph.setAttribute("x2", x);
          pd.setAttribute("cx", x); pd.setAttribute("cy", y);
          const cur = months[Math.min(N - 1, Math.round(fi))];
          whenV.textContent = ym(cur.m);
          monthN.textContent = fmt(cur.n);
          rels.forEach((r, k) => {
            if (!shown.has(k) && r.x <= x + 2) {
              shown.add(k);
              ctx.anim(relEls[k], [{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }], { duration: 600 });
            }
          });
        }, ease.inOut);
        ctx.anim(marker, [{ opacity: 1 }, { opacity: 0 }], { duration: 600 });
        ctx.anim(svg.querySelector(".peak"), [{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], { duration: 800, delay: 200 });
        await ctx.wait(4200);
      },
    };
  }

  // ======================================================= year chapters
  function relChip(r) {
    return h("div", "rel-chip",
      frag(cupSVG(r.liquid, r.kind)),
      h("div", null, h("span", "nm", r.name), h("span", "ko", r.ko)),
      h("div", "vd", h("b", null, r.version), r.ym));
  }

  function yearScene(Y, M, cfg, isLast) {
    return {
      id: `year-${Y.year}`, section: "years", cls: "s-year", accent: Y.accent,
      async run(ctx) {
        const strip = h("div", "strip", M.years.map((y) => h("span", { class: y.year === Y.year ? "on" : y.year < Y.year ? "past" : "" }, y.year)));
        const yr = h("div", "yr", String(Y.year).split("").map((d) => h("span", null, d)));
        const cum = h("div", { class: "cum", html: `그 해 커밋 <b>${fmt(Y.commits)}</b> · 누적 기여자 <b>${Y.cumPeople}</b>명 · 누적 레포지토리 <b>${Y.cumRepos}</b>개` });
        const era = h("div", "era", Y.story.title);
        const line = h("div", { class: "line", html: nowrapNames(Y.story.line) });
        const rels = h("div", "rels", Y.releases.map(relChip));
        const confChips = Y.conferences.map((c) => h("span", "conf-chip", h("b", null, `#${c.n}`), c.label));
        if (isLast) confChips.push(h("span", "conf-chip now", h("b", null, "NOW"), [cfg.edition, cfg.eventTitle].filter(Boolean).join(" ")));
        const confs = h("div", "confs", confChips);
        const stamp = h("div", "stamp", "CLEAR!");
        const left = h("div", "left", h("div", "yrbox", yr, stamp), cum, era, line, rels, confs);

        const many = Y.people.length > 20;
        const maxRepos = many ? 4 : 8;
        const shownRepos = Y.repos.slice(0, maxRepos);
        const right = h("div", "right");
        let repoRows = [], personEls = [], heads = [];
        if (Y.repos.length) {
          const hd = h("div", "sec-h", h("span", null, "새 레포지토리"), h("b", null, Y.repos.length), h("span", "rule"));
          repoRows = shownRepos.map((r) => h("div", { class: "repo-row", "--fam": r.family ? r.family.color : null },
            h("div", "t", r.title, r.name !== r.title.toLowerCase() && r.title.length <= 16 ? h("span", "s", r.name) : null),
            h("div", "d", r.ko)));
          const extra = Y.repos.length - shownRepos.length;
          const grid = h("div", "repos", repoRows);
          right.append(...[hd, grid, extra > 0 ? h("div", "more", `+ ${extra}개 더 · ${Y.repos.slice(maxRepos).map((r) => r.title).slice(0, 4).join(", ")}${extra > 4 ? " …" : ""}`) : null].filter(Boolean));
          heads.push(hd);
        }
        if (Y.people.length) {
          const n = Y.people.length;
          const size = n <= 8 ? 104 : n <= 18 ? 84 : 62;
          const cell = size + (n <= 8 ? 24 : n <= 18 ? 16 : 22);
          const hd = h("div", "sec-h", h("span", null, "새로 합류한 기여자"), h("b", null, n), h("span", "rule"));
          personEls = Y.people.map((p) => h("div", { class: "person", "--cell": cell + "px" }, avatar(p, size), h("div", "n", p.displayName)));
          right.append(hd, h("div", "people", personEls));
          heads.push(hd);
        }
        ctx.root.append(strip, h("div", "cols", left, right));

        ctx.anim(strip, [{ opacity: 0 }, { opacity: 1 }], { duration: 800 });
        ctx.anim(strip.querySelector(".on"), [{ transform: "scale(.6)" }, { transform: "scale(1)" }], { duration: 900, delay: 200, easing: "cubic-bezier(.34,1.56,.64,1)" });
        ctx.stagger(yr.children, { each: 90, duration: 1000, from: { transform: "translateY(105%)" }, to: { transform: "none" } });
        ctx.anim(yr, [{ transform: "scale(1)" }, { transform: "scale(1.04)" }], { duration: 11000, delay: 1000, easing: "ease-in-out", fill: "forwards" });
        ctx.stagger([cum, era, line], { delay: 450, each: 150 });
        ctx.stagger(rels.children, { delay: 900, each: 180, from: { opacity: 0, transform: "translateX(-30px)" } });
        ctx.stagger(confs.children, { delay: 1300, each: 100 });
        if (heads[0]) ctx.anim(heads[0], [{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: 1100 });
        ctx.stagger(right.querySelectorAll(".repo-row, .more"), { delay: 1250, each: 90, from: { opacity: 0, transform: "translateX(24px)" } });
        const pStart = 1250 + repoRows.length * 90 + 300;
        if (Y.people.length) {
          ctx.anim(heads[heads.length - 1], [{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: pStart });
          ctx.stagger(personEls, { delay: pStart + 150, each: 45, duration: 650, from: { opacity: 0, transform: "scale(.4)" }, easing: "cubic-bezier(.34,1.56,.64,1)" });
        }
        // stage clear: a stamp slams onto the year
        if (!isLast) ctx.anim(stamp, [{ opacity: 0, transform: "rotate(-12deg) scale(3)" }, { opacity: 1, transform: "rotate(-12deg) scale(1)" }], { duration: 350, delay: 8200, easing: "cubic-bezier(.2,.9,.3,1.4)" });
        else stamp.remove();
        await ctx.wait(11000);
      },
    };
  }

  // ======================================================= release menu board
  function menu(M) {
    const last = M.releases[M.releases.length - 1];
    return {
      id: "menu", section: "menu", cls: "s-menu", accent: last ? last.accent : "#e9b872",
      async run(ctx) {
        const coffee = M.releases.filter((r) => r.kind !== "tea");
        const tea = M.releases.filter((r) => r.kind === "tea");
        const span = (rs) => (rs.length ? `${rs[0].year} — ${rs[rs.length - 1].year}` : "");
        const item = (r) => h("div", { class: "item" + (r === last ? " latest" : ""), "--rc": r.accent },
          frag(cupSVG(r.liquid, r.kind)),
          h("span", "nm", r.name), h("span", "ko", r.ko),
          r === last ? h("span", "badge", "LATEST") : null,
          h("span", "lead-dots"),
          h("span", "v", r.version), h("span", "dt", r.ym));
        const items = [];
        const col = (title, rs) => {
          const els = rs.map(item);
          items.push(...els);
          return h("div", "col", h("h3", null, title, h("span", null, span(rs))), els);
        };
        const head = h("div", "head", h("div", "kicker", "The release menu"), h("div", "h1", "오늘의 메뉴, Cloud-Barista 릴리스"));
        const board = h("div", "board", col("COFFEE", coffee), col("TEA", tea));
        const foot = h("div", "foot", `${M.releases[0].name}로 시작해 ${last.name}까지 — 모든 릴리스는 커피와 차의 이름을 가집니다`);
        ctx.root.append(head, board, foot);
        ctx.stagger(head.children, { each: 120 });
        ctx.anim(board, [{ opacity: 0, transform: "translateY(30px)" }, { opacity: 1, transform: "none" }], { duration: 900, delay: 300 });
        ctx.stagger(board.querySelectorAll("h3"), { delay: 600, each: 200 });
        const end = ctx.stagger(items, { delay: 900, each: 260, from: { opacity: 0, transform: "translateX(-20px)" } });
        ctx.anim(foot, [{ opacity: 0 }, { opacity: 1 }], { duration: 800, delay: end });
        const latest = board.querySelector(".latest");
        if (latest) ctx.anim(latest, [{ transform: "scale(1)" }, { transform: "scale(1.035)" }, { transform: "scale(1)" }], { duration: 1600, delay: end + 300, iterations: 3, easing: "ease-in-out" });
        await ctx.wait(Math.max(13000, end + 5500));
      },
    };
  }

  // ======================================================= where the work went (commit share by family, per year)
  function shift(M) {
    return {
      id: "shift", section: "timeline", cls: "s-shift", accent: "#e9b872",
      async run(ctx) {
        const S = M.shift, I = M.insights;
        const L = 150, R = 1230, T = 330, B = 860;
        const n = S.length, slot = (R - L) / n, bw = Math.min(112, slot * 0.62);
        let rects = "", labels = "";
        S.forEach((Y, i) => {
          const x = L + slot * i + (slot - bw) / 2;
          const segs = Y.segments.filter((s) => s.n > 0);
          let y = B;
          segs.forEach((s, k) => {
            const hgt = (B - T) * s.share;
            const yTop = y - hgt;
            rects += `<rect class="seg" data-i="${i}" x="${x}" y="${yTop + (k ? 2 : 0)}" width="${bw}" height="${Math.max(0, hgt - (k ? 2 : 0))}" fill="${s.fam.color}" style="transform-origin:${x}px ${B}px"/>`;
            if (s.share >= 0.1) labels += `<text class="pct" data-i="${i}" x="${x + bw / 2}" y="${yTop + hgt / 2 + 7}" text-anchor="middle">${Math.round(s.share * 100)}%</text>`;
            y = yTop;
          });
          labels += `<text class="yr" x="${x + bw / 2}" y="${B + 40}" text-anchor="middle">${Y.year}</text>`;
          labels += `<text class="tot" data-i="${i}" x="${x + bw / 2}" y="${T - 14}" text-anchor="middle">${fmt(Y.total)}</text>`;
        });
        const svg = frag(`<svg width="1920" height="1080" viewBox="0 0 1920 1080">
          <line x1="${L}" x2="${R}" y1="${B}" y2="${B}" stroke="rgba(246,237,227,.25)"/>
          <g class="bars">${rects}</g><g class="labels">${labels}</g></svg>`);
        const head = h("div", "head",
          h("div", "kicker", "Where the work went"),
          h("div", "h1", "무게중심의 이동"),
          h("div", "lead muted", "해마다 커밋이 어느 프로젝트 묶음에서 일어났는지 · 비율"));
        const legend = h("div", "legend", M.families.map((f) => h("span", null, h("i", { style: { background: f.color } }), f.short || f.title)));
        const firstYear = M.years[0].year;
        const calls = [
          { k: "둘 이상의 프로젝트에", v: `${Math.round(I.multiShare * 100)}%`, d: `기여자 ${I.multi}명이 2개 이상의 레포지토리에 커밋했습니다` },
          { k: "지금도 함께", v: `${I.activeNow}명`, d: `지난 1년 안에 커밋한 기여자 · 첫 해(${firstYear}) 합류자 ${I.firstCohort}명 중 ${I.firstCohortActive}명이 아직 함께합니다` },
          { k: "릴리스 리듬", v: `${I.releaseMonths.toFixed(1)}개월`, d: `${M.releases.length}번의 릴리스 사이 평균 간격` },
        ].map((c) => h("div", "call", h("div", "k", c.k), h("div", "v", c.v), h("div", "d", c.d)));
        const callBox = h("div", "calls", calls);
        ctx.root.append(svg, head, legend, callBox);

        ctx.stagger(head.children, { each: 120 });
        ctx.anim(legend, [{ opacity: 0 }, { opacity: 1 }], { duration: 700, delay: 500 });
        const segEls = [...svg.querySelectorAll(".seg")];
        const lblEls = [...svg.querySelectorAll(".pct, .tot")];
        for (const el of segEls) el.style.transform = "scaleY(0)";
        for (const el of lblEls) el.style.opacity = 0;
        await ctx.wait(700);
        for (let i = 0; i < n; i++) {
          const segs = segEls.filter((el) => Number(el.dataset.i) === i);
          const lbls = lblEls.filter((el) => Number(el.dataset.i) === i);
          ctx.tween(800, (p) => { for (const el of segs) el.style.transform = `scaleY(${p})`; }, ease.outExpo).catch(() => {});
          ctx.wait(500).then(() => lbls.forEach((el) => ctx.anim(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 500 }))).catch(() => {});
          await ctx.wait(180);
        }
        ctx.stagger(calls, { delay: 600, each: 300, from: { opacity: 0, transform: "perspective(1200px) rotateY(-30deg) translateX(40px)" } });
        await ctx.wait(10500);
      },
    };
  }

  // ======================================================= project family
  function familyScene(F, idx) {
    return {
      id: `family-${F.id}`, section: "projects", cls: "s-family", accent: F.color,
      async run(ctx) {
        const people = new Set();
        F.repos.forEach((r) => r.people.forEach((p) => people.add(p.login)));
        const head = h("div", "head",
          h("div", "l", h("div", "kicker", `Zone ${idx + 1} · ${F.kicker}`), h("div", "h2", F.title), h("div", "lead", F.line)),
          h("div", "r", h("b", null, F.repos.length), `레포지토리 · 기여자 ${people.size}명`));
        const n = F.repos.length;
        const cols = n <= 3 ? n : n === 4 ? 2 : n <= 6 ? 3 : n <= 8 ? 4 : n <= 12 ? 4 : 5;
        const rows = Math.ceil(n / cols);
        const cards = h("div", { class: "cards" + (rows >= 3 ? " compact" : "") });
        cards.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        cards.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        const maxAv = rows >= 3 ? 5 : 7;
        // an ARCHIVED tag only tells something when the family mixes active and archived repos
        const tagArchived = F.repos.some((r) => r.archived) && F.repos.some((r) => !r.archived);
        const nowYear = new Date().getFullYear();
        const cardEls = F.repos.map((r) => {
          const ppl = r.people.slice(0, maxAv);
          const extra = r.people.length - ppl.length;
          const meta = [];
          if (r.stars) meta.push(h("span", null, "★ ", h("b", null, fmt(r.stars))));
          if (r.commits) meta.push(h("span", null, h("b", null, fmt(r.commits)), r.commits === 1 ? " commit" : " commits"));
          meta.push(h("span", null, `since ${r.year}`));
          return h("div", { class: "card", "--fam": F.color },
            h("div", "t", h("span", "tt", r.title), tagArchived && r.archived ? h("span", "tag", "ARCHIVED") : null, r.year >= nowYear ? h("span", "tag new", "NEW") : null),
            h("div", "m", meta.flatMap((m, i) => (i ? [" · ", m] : [m]))),
            h("div", "d", r.ko),
            h("div", "f",
              h("div", "stack", ppl.map((p) => avatar(p, rows >= 3 ? 32 : 40)), extra > 0 ? h("span", "plus", `+${extra}`) : null),
              r.people.length ? h("div", "cnt", `기여자 ${r.people.length}명`) : null));
        });
        cards.append(...cardEls);
        ctx.root.append(head, cards);
        ctx.stagger(head.querySelectorAll(".l > *, .r"), { each: 110 });
        const inEnd = ctx.stagger(cardEls, { delay: 450, each: 90, duration: 900, from: { opacity: 0, transform: "perspective(1400px) rotateX(28deg) translateY(50px)" } });
        await ctx.wait(inEnd + 400);
        const per = Math.max(500, Math.min(1000, 7000 / n));
        for (const c of cardEls) {
          c.classList.add("lit");
          await ctx.wait(per);
          c.classList.remove("lit");
        }
        await ctx.wait(1000);
      },
    };
  }

  // ======================================================= spotlight
  function spotlight(R) {
    const color = R.family ? R.family.color : "#e9b872";
    return {
      id: `spot-${R.name}`, section: "projects", cls: "s-spot", accent: color,
      async run(ctx) {
        const facts = [
          { v: R.commits, k: "커밋" },
          { v: R.people.length, k: "기여자" },
          { v: R.stars, k: "GitHub Stars" },
          { v: R.forks, k: "Forks" },
        ];
        const fv = facts.map(() => h("span", "num", "0"));
        const fc = R.firstCommit;
        const left = h("div", "l",
          h("div", "kicker", `Spotlight · since ${ym(R.created_at)}`),
          h("div", "name", R.title),
          h("div", "desc", R.ko),
          fc ? h("div", "first", h("span", "d", ymd(fc.date)), " 첫 커밋 ", h("span", "q", `“${fc.message}”`), fc.login ? h("span", "who", ` — @${fc.login}`) : null) : null,
          h("div", "facts", facts.map((f, i) => h("div", "fact", h("div", "v", fv[i]), h("div", "k", f.k)))));
        const top = R.people.slice(0, 10);
        const max = Math.max(1, ...top.map((p) => p.repoCommits));
        const MAXW = 430;
        const rows = top.map((p) => {
          const fill = h("div", { class: "fill", "--fam": color });
          const val = h("span", "val", "0");
          return { p, fill, val, el: h("div", "bar-row", avatar(p, 52), h("div", "who", h("div", "n", p.displayName), h("div", "l2", `@${p.login}`)), h("div", "track", fill, val)) };
        });
        const right = h("div", "r", h("div", "sec-h", h("span", null, "Top contributors"), h("span", "rule")), h("div", "bars", rows.map((r) => r.el)));
        ctx.root.append(left, right);
        // shrink long names (e.g. CB-Tumblebug) to fit on one line
        const nameEl = left.querySelector(".name");
        for (let fs = 104; fs > 56 && nameEl.scrollWidth > nameEl.clientWidth; fs -= 4) nameEl.style.fontSize = fs - 4 + "px";
        ctx.stagger(left.children, { each: 140, duration: 900 });
        ctx.stagger([right.firstChild, ...rows.map((r) => r.el)], { delay: 500, each: 90, from: { opacity: 0, transform: "translateX(30px)" } });
        await ctx.wait(700);
        facts.forEach((f, i) => ctx.countUp(fv[i], f.v, 1800).catch(() => {}));
        rows.forEach((r, i) => {
          const w = Math.max(6, (r.p.repoCommits / max) * MAXW);
          ctx.wait(300 + i * 90).then(() => Promise.all([
            ctx.tween(1400, (t) => { r.fill.style.width = w * t + "px"; }),
            ctx.countUp(r.val, r.p.repoCommits, 1400),
          ])).catch(() => {});
        });
        await ctx.wait(10500);
      },
    };
  }

  // ======================================================= constellation: the community graph growing through time
  const circleCache = new Map();
  function circleImage(key, img, d, ring, res) {
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

  function constellation(M) {
    return {
      id: "constellation", section: "constellation", cls: "s-const", accent: "#e9b872",
      async run(ctx) {
        const W = 1920, H = 1080;
        const res = Math.min(2, Math.max(1, Math.ceil(window.Show.stageScale() * (window.devicePixelRatio || 1))));
        const canvas = h("canvas", { width: W * res, height: H * res, style: { width: W + "px", height: H + "px" } });
        const g = canvas.getContext("2d");
        g.scale(res, res);

        const t0 = Date.parse(M.stats.orgCreated), t1 = Date.parse(M.generatedAt);
        const T = (d) => Math.max(0, Math.min(1, (Date.parse(d) - t0) / (t1 - t0)));
        const rand = (a, b) => a + Math.random() * (b - a);
        const BOUNDS = { x0: 140, x1: 1780, y0: 330, y1: 878 }; // leaves room for hub labels above the time bar
        const anchors = {
          core: [960, 600], pioneers: [470, 470], community: [420, 790], poc: [700, 880],
          migrator: [1460, 600], ecosystem: [1220, 880], ai: [1600, 420],
        };
        const famLabel = new Map(); // family id -> { el, x, y }

        const hubs = M.repos.filter((r) => r.people.length).map((r) => {
          const a = anchors[r.family ? r.family.id : ""] || [960, 600];
          return { kind: "hub", r, t: T(r.created_at), fam: r.family, color: r.family ? r.family.color : "#e9b872",
            x: a[0] + rand(-70, 70), y: a[1] + rand(-70, 70), vx: 0, vy: 0, ax: a[0], ay: a[1],
            rad: 8 + 3 * Math.log2(r.commits + 2), on: false, born: 0, label: r.title, labeled: r.people.length >= 6 };
        });
        // label budget: the three busiest repos of each family, plus any repo with 6+ contributors
        const byFam = new Map();
        for (const hb of hubs) { const k = hb.fam ? hb.fam.id : ""; (byFam.get(k) || byFam.set(k, []).get(k)).push(hb); }
        for (const list of byFam.values()) list.sort((a, b) => b.r.commits - a.r.commits).slice(0, 3).forEach((hb) => { hb.labeled = true; });
        const labelOrder = hubs.filter((hb) => hb.labeled).sort((a, b) => b.r.commits - a.r.commits);
        const stars = M.people.map((p) => ({ kind: "star", p, t: T(p.first), img: images.get(p.login),
          x: 980, y: 620, vx: 0, vy: 0, rad: Math.min(23, 9 + 1.7 * Math.log2(p.commits + 1)), on: false, born: 0, color: "#e9b872", home: null }));
        const starBy = new Map(stars.map((n) => [n.p.login, n]));
        const edges = [];
        for (const hub of hubs) for (const c of hub.r.people) {
          const s = starBy.get(c.login);
          if (s) edges.push({ a: hub, b: s, t: Math.max(hub.t, T(c.repoFirst || hub.r.created_at)), on: false, born: 0 });
        }
        edges.sort((a, b) => a.t - b.t);
        for (const e of edges) if (!e.b.home) { e.b.home = e.a; e.b.color = e.a.color; }
        // a person becomes visible together with their first edge, never before
        for (const s of stars) if (s.home) s.t = Math.max(s.t, edges.find((e) => e.b === s).t);
        const nodes = [...hubs, ...stars].sort((a, b) => a.t - b.t);
        const active = [];
        let ni = 0, ei = 0;

        // ---- DOM: header, ticker, family labels, timeline bar, caption
        const head = h("div", "head", h("div", "kicker", "The constellation"), h("div", "h2", "커뮤니티의 별자리"),
          h("div", "lead muted", "레포지토리는 별이 되고, 사람들이 그 사이를 잇습니다"));
        const yEl = h("div", "y", String(M.years[0].year));
        const mEl = h("div", "m", "");
        const cEl = h("div", { class: "c", html: "기여자 <b>0</b> · 레포지토리 <b>0</b>" });
        const ticker = h("div", "ticker", yEl, mEl, cEl);
        const caption = h("div", { class: "caption", html: `<b>${M.stats.people}</b>명이 <b>${hubs.length}</b>개의 레포지토리에서 함께 만든 하나의 별자리` });
        caption.style.opacity = 0;
        const bar = h("div", "bar");
        const BL = 200, BR = 1720;
        for (const y of M.years) {
          const x = BL + T(`${y.year}-01-01`) * (BR - BL);
          bar.append(h("span", { class: "tick", style: { left: x + "px" } }, y.year));
        }
        const relDots = M.releases.map((r) => h("span", { class: "dot", style: { left: BL + T(r.date) * (BR - BL) + "px", "--rc": r.accent } }));
        bar.append(...relDots);
        const playhead = h("span", { class: "ph" }, h("span", "lbl"));
        const phLabel = playhead.firstChild;
        bar.append(playhead);
        const labelsBox = h("div", "famlabels");
        ctx.root.append(h("div", "space", canvas, labelsBox), head, ticker, bar, caption);
        ctx.stagger(head.children, { each: 120 });
        ctx.stagger([ticker, bar], { delay: 300, each: 150 });

        // ---- simulation
        function activate(p) {
          while (ni < nodes.length && nodes[ni].t <= p) {
            const n = nodes[ni++];
            n.on = true; n.born = clock.t;
            if (n.kind === "star") {
              const home = n.home || hubs[0];
              n.x = home.x + rand(-50, 50); n.y = home.y + rand(-50, 50);
            } else if (n.fam && !famLabel.has(n.fam.id)) {
              const lab = h("div", { class: "famlabel", style: { left: n.x + "px", top: n.y - 60 + "px", color: n.fam.color } }, n.fam.kicker);
              labelsBox.append(lab);
              famLabel.set(n.fam.id, { el: lab, x: n.x, y: n.y - 60, fam: n.fam });
              ctx.anim(lab, [{ opacity: 0, transform: "translate(-50%, 10px)" }, { opacity: 0.85, transform: "translate(-50%, 0)" }], { duration: 900 });
            }
            active.push(n);
          }
          while (ei < edges.length && edges[ei].t <= p) {
            const e = edges[ei];
            if (!(e.a.on && e.b.on)) break; // endpoint activates on a later frame
            e.on = true; e.born = clock.t; ei++;
          }
        }
        function step(dtMs) {
          const dt = Math.min(dtMs, 40) / 16.7;
          const n = active.length;
          for (let i = 0; i < n; i++) {
            const a = active[i];
            for (let j = i + 1; j < n; j++) {
              const b = active[j];
              const dx = b.x - a.x, dy = b.y - a.y;
              const d2 = dx * dx + dy * dy + 0.01;
              if (d2 > 90000) continue;
              const d = Math.sqrt(d2);
              const minD = a.rad + b.rad + 10;
              let f = (1400 * (a.rad + b.rad)) / 30 / d2;
              if (d < minD) f += (minD - d) * 0.12; // firm core so avatars don't overlap
              f = Math.min(f, 9);
              const fx = (dx / d) * f, fy = (dy / d) * f;
              a.vx -= fx; a.vy -= fy; b.vx += fx; b.vy += fy;
            }
            if (a.kind === "hub") { a.vx += (a.ax - a.x) * 0.018; a.vy += (a.ay - a.y) * 0.018; }
            else { a.vx += (960 - a.x) * 0.0003; a.vy += (620 - a.y) * 0.0003; }
          }
          for (let k = 0; k < ei; k++) {
            const e = edges[k];
            const dx = e.b.x - e.a.x, dy = e.b.y - e.a.y;
            const d = Math.sqrt(dx * dx + dy * dy) + 0.01;
            const rest = e.a.rad + e.b.rad + 34;
            const f = (d - rest) * 0.02;
            const fx = (dx / d) * f, fy = (dy / d) * f;
            e.a.vx += fx * 0.3; e.a.vy += fy * 0.3; e.b.vx -= fx; e.b.vy -= fy;
          }
          for (const a of active) {
            a.vx *= 0.8; a.vy *= 0.8;
            a.x += a.vx * dt; a.y += a.vy * dt;
            if (a.x < BOUNDS.x0 + a.rad) { a.x = BOUNDS.x0 + a.rad; a.vx *= -0.3; }
            if (a.x > BOUNDS.x1 - a.rad) { a.x = BOUNDS.x1 - a.rad; a.vx *= -0.3; }
            if (a.y < BOUNDS.y0 + a.rad) { a.y = BOUNDS.y0 + a.rad; a.vy *= -0.3; }
            if (a.y > BOUNDS.y1 - a.rad) { a.y = BOUNDS.y1 - a.rad; a.vy *= -0.3; }
          }
        }
        const pop = (age) => (age >= 0.6 ? 1 : 1.7 * (age / 0.6) - 0.7 * Math.pow(age / 0.6, 2)); // overshoot in, then settle
        function draw() {
          g.clearRect(0, 0, W, H);
          const now = clock.t;
          g.lineCap = "round";
          for (let k = 0; k < ei; k++) {
            const e = edges[k];
            const age = (now - e.born) / 1000;
            const flash = Math.max(0, 1 - age / 1.4);
            g.strokeStyle = e.a.color;
            g.globalAlpha = 0.13 + 0.7 * flash;
            g.lineWidth = 1 + 2 * flash;
            g.beginPath(); g.moveTo(e.a.x, e.a.y); g.lineTo(e.b.x, e.b.y); g.stroke();
          }
          g.globalAlpha = 1;
          for (const n of active) {
            const age = (now - n.born) / 1000;
            const s = pop(Math.min(age, 0.6));
            if (n.kind === "hub") {
              const r = n.rad * s;
              const glow = 0.5 * Math.max(0, 1 - age / 3) + 0.12;
              const gr = g.createRadialGradient(n.x, n.y, r * 0.5, n.x, n.y, r * 3.2);
              gr.addColorStop(0, n.color); gr.addColorStop(1, "rgba(0,0,0,0)");
              g.globalAlpha = glow; g.fillStyle = gr;
              g.beginPath(); g.arc(n.x, n.y, r * 3.2, 0, Math.PI * 2); g.fill();
              g.globalAlpha = 1;
              g.fillStyle = "#17100c"; g.beginPath(); g.arc(n.x, n.y, r, 0, Math.PI * 2); g.fill();
              g.lineWidth = 2.5; g.strokeStyle = n.color; g.stroke();
              g.fillStyle = n.color; g.beginPath(); g.arc(n.x, n.y, r * 0.42, 0, Math.PI * 2); g.fill();
            } else {
              const d = n.rad * 2 * s;
              if (age < 1.2) {
                g.globalAlpha = (1 - age / 1.2) * 0.9;
                g.lineWidth = 2; g.strokeStyle = "#f6ede3";
                g.beginPath(); g.arc(n.x, n.y, n.rad + 4 + age * 26, 0, Math.PI * 2); g.stroke();
                g.globalAlpha = 1;
              }
              const img = circleImage(n.p.login, n.img, n.rad * 2, n.color, res);
              g.drawImage(img, n.x - d / 2, n.y - d / 2, d, d);
            }
          }
          // labels last, with a dark halo, so avatars never cover them. Busier repos are placed
          // first; a label that would overlap one already placed moves above its hub, or hides.
          g.textAlign = "center"; g.textBaseline = "top"; g.lineJoin = "round";
          g.strokeStyle = "rgba(15,11,9,.85)"; g.lineWidth = 5; g.fillStyle = "#f6ede3";
          const placed = [];
          const overlaps = (r) => placed.some((q) => r[0] < q[0] + q[2] + 6 && r[0] + r[2] + 6 > q[0] && r[1] < q[1] + q[3] + 4 && r[1] + r[3] + 4 > q[1]);
          for (const n of labelOrder) {
            if (!n.on) continue;
            const age = (now - n.born) / 1000;
            const fs = n.rad > 30 ? 20 : 16;
            g.font = `650 ${fs}px Pretendard, sans-serif`;
            if (!n.lw) n.lw = g.measureText(n.label).width;
            const r = n.rad * pop(Math.min(age, 0.6));
            const rectFor = (pos) => [n.x - n.lw / 2, pos === "below" ? n.y + r + 6 : n.y - r - 6 - fs, n.lw, fs];
            let pos = n.labelPos || "below";
            if (overlaps(rectFor(pos))) pos = pos === "below" ? "above" : "below";
            if (overlaps(rectFor(pos))) { n.labelPos = n.labelPos || "below"; continue; }
            n.labelPos = pos;
            const rect = rectFor(pos);
            placed.push(rect);
            g.globalAlpha = Math.min(1, age / 0.8);
            g.strokeText(n.label, n.x, rect[1]);
            g.fillText(n.label, n.x, rect[1]);
          }
          g.globalAlpha = 1;
          // family captions float above their hubs (hubs only: people shared with other families would drag them)
          const labs = [...famLabel.values()];
          for (const lab of labs) {
            let minY = Infinity, sx = 0, k = 0;
            for (const n of active) {
              if (n.kind !== "hub" || n.fam !== lab.fam) continue;
              minY = Math.min(minY, n.y - n.rad); sx += n.x; k++;
            }
            if (!k) continue;
            lab.x += (sx / k - lab.x) * 0.08;
            lab.y += (minY - 54 - lab.y) * 0.08; // clears labels that sit above their hub
            if (!lab.w) lab.w = lab.el.offsetWidth;
          }
          labs.sort((a, b) => a.x - b.x);
          for (let i = 0; i < labs.length; i++) {
            const a = labs[i];
            a.lift = 0;
            for (let j = 0; j < i; j++) {
              const b = labs[j];
              if (Math.abs(a.x - b.x) < (a.w + b.w) / 2 + 24 && Math.abs(a.y - (b.y - b.lift)) < 24) a.lift = 28;
            }
            a.el.style.left = a.x + "px";
            a.el.style.top = a.y - a.lift + "px";
          }
        }
        let progress = 0, lastYear = "", shownRel = 0, lastCounts = "";
        ctx.everyFrame((dtMs) => {
          activate(progress);
          step(dtMs);
          draw();
          let s = 0, hb = 0;
          for (const n of active) if (n.kind === "star") s++; else hb++;
          const counts = `${s}/${hb}`;
          if (counts !== lastCounts) { lastCounts = counts; cEl.innerHTML = `기여자 <b>${s}</b> · 레포지토리 <b>${hb}</b>`; }
        });

        await ctx.wait(800);
        await ctx.tween(30000, (p) => {
          progress = p;
          const date = new Date(t0 + p * (t1 - t0));
          const y = String(date.getUTCFullYear());
          mEl.textContent = `${date.getUTCMonth() + 1}월`;
          if (y !== lastYear) {
            lastYear = y; yEl.textContent = y;
            ctx.anim(yEl, [{ transform: "scale(1.15)", opacity: 0.6 }, { transform: "none", opacity: 1 }], { duration: 500 });
          }
          playhead.style.left = BL + p * (BR - BL) + "px";
          while (shownRel < M.releases.length && T(M.releases[shownRel].date) <= p) {
            const r = M.releases[shownRel++];
            relDots[shownRel - 1].classList.add("on");
            phLabel.textContent = `${r.name} ${r.version}`;
            ctx.anim(phLabel, [{ opacity: 0, transform: "translate(-50%, 8px)" }, { opacity: 1, transform: "translate(-50%, 0)" }], { duration: 500 });
          }
        }, ease.linear);
        progress = 1.0001;
        ctx.anim(caption, [{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], { duration: 900, delay: 400 });
        await ctx.wait(6500);
      },
    };
  }

  // ======================================================= head baristas
  function crew(M) {
    return {
      id: "crew", section: "people", cls: "s-crew", accent: "#e9b872",
      async run(ctx) {
        const list = M.crew;
        const head = h("div", "head",
          h("div", "kicker", "Head baristas"),
          h("div", "h1", "오래, 많이, 함께 내린 사람들"),
          h("div", "lead muted", "가장 많이 기여했거나 가장 오래 함께한 분들, 그리고 처음부터 이 길을 연 분들"));
        const grid = h("div", "cards");
        grid.style.gridTemplateColumns = `repeat(${list.length > 8 ? 6 : 4}, 1fr)`;
        const level = (p) => 1 + Math.floor(Math.log2(p.commits + 1) * 2);
        const xpInLevel = (p) => { const l = Math.log2(p.commits + 1) * 2; return l - Math.floor(l); };
        const CLASS = { core: "바리스타", pioneers: "개척자", migrator: "마이그레이터", ecosystem: "탐험가", ai: "AI 연구원", community: "커뮤니티 호스트", poc: "실험가" };
        const classOf = (p) => {
          const top = p.repos.map((n) => M.repoBy.get(n)).filter(Boolean).sort((a, b) => ((b.people.find((q) => q.login === p.login) || {}).repoCommits || 0) - ((a.people.find((q) => q.login === p.login) || {}).repoCommits || 0))[0];
          return top && top.family ? CLASS[top.family.id] || "바리스타" : "바리스타";
        };
        const cards = list.map((p) => h("div", "card3d", h("div", "face",
          h("div", "lv", `Lv.${level(p)}`),
          h("div", "cls", classOf(p)),
          avatar(p, 108),
          h("div", "xp", h("i", { style: { width: Math.round(xpInLevel(p) * 100) + "%" } })),
          h("div", "nm", p.koName || p.displayName),
          p.koName && p.name ? h("div", "en", p.name) : null,
          h("div", "lg", `@${p.login}`),
          p.company ? h("div", "co", p.company) : null,
          h("div", "tags", p.tags.map((t) => h("span", "tg", t))),
          h("div", "st",
            h("span", null, h("b", null, p.first.slice(0, 4)), "년부터"),
            h("span", null, "커밋 ", h("b", null, fmt(p.commits))),
            h("span", null, "레포 ", h("b", null, p.repos.length))))));
        grid.append(...cards);
        ctx.root.append(head, grid);
        ctx.stagger(head.children, { each: 120 });
        cards.forEach((c, i) => ctx.anim(c, [{ opacity: 0, transform: "rotateY(-75deg) translateZ(-220px) translateY(40px)" }, { opacity: 1, transform: "none" }], { duration: 1100, delay: 500 + i * 110, fill: "backwards" }));
        await ctx.wait(500 + cards.length * 110 + 900);
        for (const c of cards) {
          c.classList.add("lit");
          await ctx.wait(900);
          c.classList.remove("lit");
        }
        await ctx.wait(1600);
      },
    };
  }

  // ======================================================= contributor wall
  let wallCursor = 0;
  let wallOrder = null;
  function wall(M) {
    return {
      id: "wall", section: "people", cls: "s-wall", accent: "#e9b872",
      async run(ctx) {
        const P = M.people; // ordered by first contribution
        const n = P.length;
        const yEl = h("div", "y", P[0] ? P[0].first.slice(0, 4) : "");
        const cEl = h("div", "c", "0명");
        const head = h("div", "head",
          h("div", null, h("div", "kicker", "Thank you"), h("div", "h1", "함께 만든 사람들"),
            h("div", "lead muted", `처음 기여한 순서대로 · ${n}명의 기여자`)),
          h("div", "ticker", yEl, cEl));
        const W = 1712, H = 688;
        let s = 160;
        while (s > 40 && Math.floor(W / s) * Math.floor(H / s) < n) s -= 2;
        const cols = Math.floor(W / s);
        const rowsUsed = Math.ceil(n / cols);
        const offX = (W - cols * s) / 2, offY = Math.max(0, (H - rowsUsed * s) / 2);
        const size = Math.round(s * 0.84);
        const wallEl = h("div", "wall");
        const avs = P.map((p, i) => {
          const a = avatar(p, size);
          const cx = offX + (i % cols) * s + s / 2, cy = offY + Math.floor(i / cols) * s + s / 2;
          a.style.left = cx - size / 2 + "px";
          a.style.top = cy - size / 2 + "px";
          a.style.opacity = 0;
          return { a, p, cx, cy, row: Math.floor(i / cols) };
        });
        wallEl.append(...avs.map((x) => x.a));
        ctx.root.append(head, wallEl);
        ctx.stagger(head.querySelectorAll(".head > div > *, .ticker"), { each: 120 });

        let shown = 0;
        await ctx.wait(500);
        await ctx.tween(Math.min(7000, 60 * n), (p) => {
          const k = Math.min(n, Math.ceil(p * n));
          for (; shown < k; shown++) {
            const x = avs[shown];
            x.a.style.opacity = "";
            ctx.anim(x.a, [{ opacity: 0, transform: "scale(.2)" }, { opacity: 1, transform: "scale(1)" }], { duration: 650, easing: "cubic-bezier(.34,1.56,.64,1)", fill: "backwards" });
            yEl.textContent = x.p.first.slice(0, 4);
            cEl.textContent = `${shown + 1}명`;
          }
        }, ease.linear);
        await ctx.wait(1200);

        // spotlight a few people each loop, continuing where the last loop stopped
        if (!wallOrder || wallOrder.length !== n) {
          wallOrder = [...Array(n).keys()];
          for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [wallOrder[i], wallOrder[j]] = [wallOrder[j], wallOrder[i]]; }
        }
        const card = h("div", "tag-card");
        card.style.opacity = 0;
        wallEl.append(card);
        wallEl.classList.add("focus");
        const picks = Math.min(8, n);
        for (let k = 0; k < picks; k++) {
          const x = avs[wallOrder[wallCursor++ % n]];
          x.a.classList.add("hot");
          const repos = x.p.repos.length;
          card.replaceChildren(
            h("div", "n", x.p.koName ? `${x.p.koName} · ${x.p.displayName}` : x.p.displayName),
            h("div", "l", `@${x.p.login}${x.p.company ? " · " + x.p.company : ""}`),
            h("div", { class: "m", html: `<b>${x.p.first.slice(0, 4)}</b>년부터 · 레포지토리 <b>${repos}</b>개 · 커밋 <b>${fmt(x.p.commits)}</b>` }));
          const below = x.row === 0;
          const dy = size * 0.95;
          card.style.left = x.cx + "px";
          card.style.top = (below ? x.cy + dy : x.cy - dy) + "px";
          const tx = x.cx < 260 ? "-12%" : x.cx > W - 260 ? "-88%" : "-50%";
          card.style.transform = `translate(${tx}, ${below ? "0" : "-100%"})`;
          card.style.opacity = 1;
          await ctx.wait(1500);
          x.a.classList.remove("hot");
          card.style.opacity = 0;
          await ctx.wait(250);
        }
        wallEl.classList.remove("focus");
        await ctx.wait(1500);
      },
    };
  }

  // ======================================================= outro
  function outro(M, cfg) {
    return {
      id: "outro", section: "now", cls: "s-outro", accent: "#e9b872",
      async run(ctx) {
        const start = cfg.startTime ? new Date(cfg.startTime) : null;
        const hasCountdown = start && !isNaN(start) && start > new Date();
        const cup = frag(heroCupSVG({ level: 0 }));
        cup.classList.add("hero-cup");
        const l1 = h("div", "big", "한 잔이 완성되었습니다");
        const l2 = h("div", "big grad", "이제, 함께 마실 시간입니다");
        const count = hasCountdown ? h("div", "count", "--:--") : null;
        const sub = h("div", "sub", hasCountdown ? "오프닝까지" : "잠시 후 행사가 시작됩니다");
        const title = h("div", "ttl", h("span", "next", "NEXT STAGE ▶ "), [cfg.edition, cfg.eventTitle].filter(Boolean).join(" "));
        const thanks = h("div", { class: "thanks", html: `<b>${M.stats.people}</b>명의 기여자, <b>${fmt(M.stats.commits)}</b>개의 커밋, <b>${M.stats.releases}</b>번의 릴리스 — 고맙습니다` });
        const faces = h("div", "faces", [...M.people].sort((a, b) => b.commits - a.commits).slice(0, 28).map((p) => avatar(p, 56)));
        const tbc = h("div", "tbc", "TO BE CONTINUED…");
        ctx.root.append(...[h("div", "float", h("div", "halo"), cup), l1, l2, sub, count, title, thanks, faces, tbc].filter(Boolean));
        brewCup(ctx, cup, { delay: 200, draw: 900, pour: 1300 });
        ctx.stagger([l1, l2], { delay: 1500, each: 900, duration: 1100, from: { opacity: 0, transform: "translateY(26px)", filter: "blur(8px)" }, to: { opacity: 1, transform: "none", filter: "blur(0)" } });
        ctx.stagger([sub, count, title, thanks].filter(Boolean), { delay: 3600, each: 200, duration: 900 });
        ctx.stagger(faces.children, { delay: 4300, each: 35, from: { opacity: 0, transform: "translateY(16px)" } });
        ctx.anim(tbc, [{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: 5400 });
        await ctx.tween(14000, () => {
          if (!count) return;
          const ms = start - new Date();
          if (ms <= 0) { count.textContent = "NOW"; return; }
          const t = Math.floor(ms / 1000);
          const hh = Math.floor(t / 3600), mm = Math.floor((t % 3600) / 60), ss = t % 60;
          count.textContent = (hh ? hh + ":" : "") + String(mm).padStart(2, "0") + ":" + String(ss).padStart(2, "0");
        }, ease.linear);
      },
    };
  }

  // ======================================================= playlist
  function build(M, cfg) {
    const out = [];
    const alias = { intro: "prologue", numbers: "cup", activity: "timeline", punch: "shift" };
    const want = (cfg.scenes || ["prologue", "cup", "timeline", "years", "menu", "shift", "families", "spotlights", "world", "crew", "wall", "outro"]).map((s) => alias[s] || s);
    for (const s of want) {
      if (s === "prologue") out.push(prologue(M, cfg));
      else if (s === "cup") out.push(cupNumbers(M));
      else if (s === "timeline" && M.months.length > 1) out.push(timeline(M));
      else if (s === "years") M.years.forEach((y, i) => out.push(yearScene(y, M, cfg, i === M.years.length - 1)));
      else if (s === "menu" && M.releases.length) out.push(menu(M));
      else if (s === "shift" && M.shift) out.push(shift(M));
      else if (s === "families") M.families.forEach((f, i) => out.push(familyScene(f, i)));
      else if (s === "spotlights") M.spotlights.forEach((r) => out.push(spotlight(r)));
      else if (s === "constellation") out.push(constellation(M));
      else if (s === "world" && window.ShowWorld) out.push(window.ShowWorld.scene(M));
      else if (s === "crew" && M.crew.length) out.push(crew(M));
      else if (s === "wall") out.push(wall(M));
      else if (s === "outro") out.push(outro(M, cfg));
    }
    const used = new Set(out.map((p) => p.section));
    return {
      playlist: out,
      sections: SECTIONS.filter((s) => used.has(s.id)),
      preload: [[null, "assets/org.png"], ...M.people.filter((p) => p.avatar).map((p) => [p.login, p.avatar])],
      hudInfo: { lv: M.stats.yearsActive, xp: M.stats.commits },
    };
  }

  window.ShowScenes = { build };
})();
