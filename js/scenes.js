// All scenes. Each scene is { id, section, cls, accent, run(ctx) }.
// The show is one story: a cup of coffee brewed over seven years by an open-source community.
(function () {
  const { h, avatar, cupSVG, heroCupSVG, beanSVG, frag, ease } = window.Show;
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  const { ym, ymd } = window.ShowModel;
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
  // keep hyphenated project names (CB-Spider, AI-MCMP …) on one line
  const nowrapNames = (s) => esc(s).replace(/[A-Za-z]+(?:-[A-Za-z0-9]+)+/g, '<span style="white-space:nowrap">$&</span>');

  const SECTIONS = [
    { id: "welcome", label: "Welcome" },
    { id: "growth", label: "Growth" },
    { id: "years", label: "Years" },
    { id: "menu", label: "Releases" },
    { id: "projects", label: "Projects" },
    { id: "village", label: "Village" },
    { id: "people", label: "People" },
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
      id: "prologue", section: "welcome", cls: "s-prologue", accent: "#e9b872",
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
        const B = h("div", "ph ph-b", ...[since, h("div", "float", h("div", "halo"), cup), title, meta, years, url].filter(Boolean));
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
        ctx.stagger(title.querySelectorAll(".w"), { delay: 2400, each: 160, duration: 1100, from: { opacity: 0, transform: "translateY(60px)", filter: "blur(12px)" }, to: { opacity: 1, transform: "none", filter: "blur(0)" } });
        ctx.stagger([meta, years, url].filter(Boolean), { delay: 3400, each: 220, duration: 1000 });
        await ctx.wait(Math.max(brewed, 3400) + 7000);
      },
    };
  }

  // ======================================================= growth: everything, accumulated month by month
  function areaPath(vals, x0, y0, w, hgt) {
    const max = Math.max(1, vals[vals.length - 1]);
    const n = vals.length;
    let d = `M${x0},${y0 + hgt}`;
    vals.forEach((v, i) => { d += `L${(x0 + (i / (n - 1)) * w).toFixed(1)},${(y0 + hgt - (v / max) * hgt).toFixed(1)}`; });
    const line = d.replace(/^M[^L]+L/, "M");
    return { area: `${d}L${x0 + w},${y0 + hgt}Z`, line };
  }

  function growth(M) {
    return {
      id: "growth", section: "growth", cls: "s-growth", accent: "#e9b872",
      async run(ctx) {
        const G = M.growth, N = G.length;
        const metrics = [
          { key: "people", k: "기여자", suf: "명", d: "커밋으로 함께한 사람" },
          { key: "repos", k: "레포지토리", suf: "개", d: "github.com/cloud-barista" },
          { key: "commits", k: "커밋", suf: "", d: "사람이 만든 커밋 (자동화 제외)" },
          M.hasPrs ? { key: "prs", k: "머지된 PR", suf: "", d: "리뷰를 거쳐 합쳐진 변경" } : null,
        ].filter(Boolean);
        const L = 104, R = 1816, GAP = 36;
        const colW = (R - L - GAP * (metrics.length - 1)) / metrics.length;
        const SP_T = 560, SP_H = 150;          // sparkline band
        const AX = 800;                        // time axis
        const X = (i) => L + (i / (N - 1)) * (R - L);

        const head = h("div", "head",
          h("div", "kicker", "Growing together"),
          h("div", "h1", `0에서 시작해, 함께 자라온 ${M.stats.yearsActive}년`),
          h("div", "lead muted", `${M.stats.orgSince} GitHub 조직 생성부터 지금까지, 매달 쌓여 온 숫자들`));
        const cols = metrics.map((mt, i) => {
          const v = h("span", "num", "0");
          const el = h("div", { class: "metric", style: { left: L + i * (colW + GAP) + "px", width: colW + "px" } },
            h("div", "k", mt.k), h("div", "v", v, mt.suf ? h("small", null, mt.suf) : null), h("div", "d", mt.d));
          return { ...mt, el, v };
        });

        // each small chart is revealed up to the same point in time as the axis playhead
        let svgBody = `<defs><linearGradient id="grFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9b872" stop-opacity=".45"/><stop offset="1" stop-color="#e9b872" stop-opacity="0"/></linearGradient>
          ${cols.map((c, i) => `<clipPath id="grClip${i}"><rect class="clip" x="${L + i * (colW + GAP) - 4}" y="0" width="0" height="1080"/></clipPath>`).join("")}</defs>`;
        cols.forEach((c, i) => {
          const x0 = L + i * (colW + GAP);
          const { area, line } = areaPath(G.map((g) => g[c.key]), x0, SP_T, colW, SP_H);
          svgBody += `<line class="base" x1="${x0}" x2="${x0 + colW}" y1="${SP_T + SP_H}" y2="${SP_T + SP_H}"/>
            <g clip-path="url(#grClip${i})"><path d="${area}" fill="url(#grFill)"/><path d="${line}" fill="none" stroke="#e9b872" stroke-width="3" stroke-linejoin="round"/></g>
            <circle class="dot" data-i="${i}" r="6" fill="#f6ede3" stroke="#0f0b09" stroke-width="3" cx="${x0}" cy="${SP_T + SP_H}"/>`;
        });
        // time axis with years and release codenames
        svgBody += `<line class="axis" x1="${L}" x2="${R}" y1="${AX}" y2="${AX}"/>`;
        G.forEach((g, i) => {
          if (g.m.endsWith("-01") || i === 0) svgBody += `<line class="tick" x1="${X(i)}" x2="${X(i)}" y1="${AX - 6}" y2="${AX + 6}"/><text class="yr" x="${X(i)}" y="${AX - 16}" text-anchor="${i === 0 ? "start" : "middle"}">${g.m.slice(0, 4)}</text>`;
        });
        const idxOf = (d) => G.findIndex((g) => g.m === d.slice(0, 7));
        const rels = M.releases.map((r, k) => {
          const i = Math.max(0, idxOf(r.date));
          const x = X(i), y = k % 2 ? AX + 70 : AX + 40;
          const anchor = x > R - 60 ? "end" : "middle";
          return { i, html: `<g class="rel" opacity="0"><line x1="${x}" x2="${x}" y1="${AX}" y2="${y - 18}"/><circle cx="${x}" cy="${AX}" r="5" fill="${r.accent}"/><text x="${x}" y="${y}" text-anchor="${anchor}">${esc(r.name)}</text></g>` };
        });
        svgBody += rels.map((r) => r.html).join("");
        svgBody += `<g class="ph"><line x1="0" x2="0" y1="${AX - 34}" y2="${AX}"/><circle cx="0" cy="${AX}" r="8"/></g>`;
        const svg = frag(`<svg width="1920" height="1080" viewBox="0 0 1920 1080">${svgBody}</svg>`);
        const when = h("div", "when", ym(G[0].m));
        const relNow = h("div", "relnow", "");
        ctx.root.append(svg, head, ...cols.map((c) => c.el), when, relNow);

        ctx.stagger(head.children, { each: 120 });
        ctx.stagger(cols.map((c) => c.el), { delay: 300, each: 120, duration: 800 });
        const clips = [...svg.querySelectorAll(".clip")];
        const ph = svg.querySelector(".ph"), phLine = ph.querySelector("line"), phDot = ph.querySelector("circle");
        const dots = [...svg.querySelectorAll(".dot")];
        const relEls = [...svg.querySelectorAll(".rel")];
        const shown = new Set();
        await ctx.wait(1300);
        await ctx.tween(17000, (p) => {
          const fi = p * (N - 1), i = Math.min(N - 1, Math.floor(fi)), f = fi - i;
          const j = Math.min(N - 1, i + 1);
          const x = L + p * (R - L);
          for (const c of clips) c.setAttribute("width", p * colW + 4);
          phLine.setAttribute("x1", x); phLine.setAttribute("x2", x); phDot.setAttribute("cx", x);
          when.style.left = x + "px";
          when.textContent = ym(G[Math.round(fi)].m);
          cols.forEach((c, k) => {
            const v = G[i][c.key] + (G[j][c.key] - G[i][c.key]) * f;
            c.v.textContent = fmt(v);
            const max = Math.max(1, G[N - 1][c.key]);
            const x0 = L + k * (colW + GAP);
            dots[k].setAttribute("cx", x0 + p * colW);
            dots[k].setAttribute("cy", SP_T + SP_H - (v / max) * SP_H);
          });
          rels.forEach((r, k) => {
            if (!shown.has(k) && r.i <= fi + 0.5) {
              shown.add(k);
              ctx.anim(relEls[k], [{ opacity: 0, transform: "translateY(-8px)" }, { opacity: 1, transform: "none" }], { duration: 500 });
              const rel = M.releases[k];
              relNow.innerHTML = `<b>${esc(rel.name)}</b> ${rel.version} 릴리스 · ${rel.ym}`;
              ctx.anim(relNow, [{ opacity: 0, transform: "translate(-50%, 8px)" }, { opacity: 1, transform: "translate(-50%, 0)" }], { duration: 400 });
            }
          });
        }, ease.inOut);
        ctx.anim(ph, [{ opacity: 1 }, { opacity: 0 }], { duration: 600 });
        ctx.anim(when, [{ opacity: 1 }, { opacity: 0 }], { duration: 600 });
        relNow.innerHTML = `그리고 지금도, 계속 자라고 있습니다 · ${ymd(M.generatedAt)} 기준`;
        ctx.anim(relNow, [{ opacity: 0 }, { opacity: 1 }], { duration: 700, delay: 300 });
        cols.forEach((c, k) => ctx.anim(c.v, [{ transform: "scale(1)" }, { transform: "scale(1.06)" }, { transform: "scale(1)" }], { duration: 700, delay: 200 + k * 120, easing: "ease-in-out" }));
        await ctx.wait(6000);
      },
    };
  }

  // ======================================================= clouds: one interface, many clouds
  function clouds(M) {
    return {
      id: "clouds", section: "growth", cls: "s-clouds", accent: "#7cc4ff",
      async run(ctx) {
        const list = M.clouds;
        const CX = 960, CY = 650, RX = 660, RY = 250;
        const head = h("div", "head",
          h("div", "kicker", "One interface, many clouds"),
          h("div", "h1", `하나의 인터페이스로, ${list.length}개의 클라우드`),
          h("div", "lead muted", "CB-Spider가 각 클라우드를 연결하고, CB-Tumblebug이 그 위에서 멀티클라우드 인프라를 하나처럼 운영합니다"));
        let lines = "";
        const pos = list.map((c, i) => {
          const a = -Math.PI / 2 + (i / list.length) * Math.PI * 2;
          return { x: CX + Math.cos(a) * RX, y: CY + Math.sin(a) * RY };
        });
        pos.forEach((p) => { lines += `<line x1="${CX}" y1="${CY}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" pathLength="1"/>`; });
        const svg = frag(`<svg width="1920" height="1080" viewBox="0 0 1920 1080"><g class="links">${lines}</g></svg>`);
        const hub = h("div", { class: "hub", style: { left: CX + "px", top: CY + "px" } }, h("div", "n", "CB-Spider"), h("div", "s", "Multi-Cloud Interface"));
        const chips = list.map((c, i) => h("div", { class: "chip", style: { left: pos[i].x + "px", top: pos[i].y + "px" } },
          frag(`<svg viewBox="0 0 40 28" aria-hidden="true"><path d="M11 25c-5 0-9-3.6-9-8.2 0-4 3-7.3 7-7.9C10.3 4.9 14 2 18.5 2c4.6 0 8.4 3 9.6 7.1 5 .2 9.9 3.8 9.9 8.3 0 4.4-3.6 7.6-8.2 7.6z"/></svg>`),
          h("span", null, c.name)));
        ctx.root.append(svg, head, hub, ...chips);
        ctx.stagger(head.children, { each: 120 });
        ctx.anim(hub, [{ opacity: 0, transform: "translate(-50%, -50%) scale(.6)" }, { opacity: 1, transform: "translate(-50%, -50%) scale(1)" }], { duration: 900, delay: 500, easing: "cubic-bezier(.34,1.56,.64,1)" });
        const lineEls = [...svg.querySelectorAll("line")];
        lineEls.forEach((l, i) => {
          l.style.strokeDasharray = "1"; l.style.strokeDashoffset = "1";
          ctx.anim(l, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 600, delay: 1200 + i * 180, easing: "ease-out" });
        });
        chips.forEach((c, i) => ctx.anim(c, [{ opacity: 0, transform: "translate(-50%, -50%) scale(.7)" }, { opacity: 1, transform: "translate(-50%, -50%) scale(1)" }], { duration: 600, delay: 1500 + i * 180, easing: "cubic-bezier(.34,1.56,.64,1)" }));
        // a pulse travels out along every link, over and over
        await ctx.wait(1500 + list.length * 180 + 800);
        hub.classList.add("live");
        svg.querySelector(".links").classList.add("live");
        await ctx.wait(7000);
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
        const left = h("div", "left", yr, cum, era, line, rels, confs);

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
          personEls = Y.people.map((p) => h("div", { class: "person", "--cell": cell + "px" }, avatar(p, size), h("div", "n", p.koName || p.displayName)));
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

  // ======================================================= project family
  function familyScene(F) {
    return {
      id: `family-${F.id}`, section: "projects", cls: "s-family", accent: F.color,
      async run(ctx) {
        const people = new Set();
        F.repos.forEach((r) => r.people.forEach((p) => people.add(p.login)));
        const head = h("div", "head",
          h("div", "l", h("div", "kicker", F.kicker), h("div", "h2", F.title), h("div", "lead", F.line)),
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
        const inEnd = ctx.stagger(cardEls, { delay: 450, each: 90, duration: 800, from: { opacity: 0, transform: "translateY(30px) scale(.97)" } });
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
          return { p, fill, val, el: h("div", "bar-row", avatar(p, 52), h("div", "who", h("div", "n", p.koName ? `${p.koName} · ${p.displayName}` : p.displayName), h("div", "l2", `@${p.login}`)), h("div", "track", fill, val)) };
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

  // ======================================================= the people who carried it the longest and furthest
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
        const cards = list.map((p) => h("div", "face",
          avatar(p, 104),
          h("div", "nm", p.koName || p.displayName),
          p.koName && p.name ? h("div", "en", p.name) : null,
          h("div", "lg", `@${p.login}`),
          p.company ? h("div", "co", p.company) : null,
          h("div", "tags", p.tags.map((t) => h("span", "tg", t))),
          h("div", "st",
            h("span", null, h("b", null, p.first.slice(0, 4)), "년부터"),
            h("span", null, "커밋 ", h("b", null, fmt(p.commits))),
            h("span", null, "레포 ", h("b", null, p.repos.length)))));
        grid.append(...cards);
        ctx.root.append(head, grid);
        ctx.stagger(head.children, { each: 120 });
        const inEnd = ctx.stagger(cards, { delay: 500, each: 100, duration: 800, from: { opacity: 0, transform: "translateY(30px)" } });
        await ctx.wait(inEnd + 300);
        for (const c of cards) {
          c.classList.add("lit");
          await ctx.wait(850);
          c.classList.remove("lit");
        }
        await ctx.wait(1500);
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
      id: "outro", section: "welcome", cls: "s-outro", accent: "#e9b872",
      async run(ctx) {
        const start = cfg.startTime ? new Date(cfg.startTime) : null;
        const hasCountdown = start && !isNaN(start) && start > new Date();
        const cup = frag(heroCupSVG({ level: 0 }));
        cup.classList.add("hero-cup");
        const l1 = h("div", "big", "한 잔이 완성되었습니다");
        const l2 = h("div", "big grad", "이제, 함께 마실 시간입니다");
        const count = hasCountdown ? h("div", "count", "--:--") : null;
        const sub = h("div", "sub", hasCountdown ? "오프닝까지" : "잠시 후 행사가 시작됩니다");
        const title = h("div", "ttl", [cfg.edition, cfg.eventTitle].filter(Boolean).join(" "));
        const S = M.stats;
        const thanks = h("div", { class: "thanks", html: `<b>${S.people}</b>명의 기여자 · <b>${fmt(S.commits)}</b>개의 커밋${M.hasPrs ? ` · <b>${fmt(S.prs)}</b>개의 PR` : ""} · <b>${S.releases}</b>번의 릴리스 — 고맙습니다` });
        const faces = h("div", "faces", [...M.people].sort((a, b) => b.commits - a.commits).slice(0, 28).map((p) => avatar(p, 56)));
        ctx.root.append(...[h("div", "float", h("div", "halo"), cup), l1, l2, sub, count, title, thanks, faces].filter(Boolean));
        brewCup(ctx, cup, { delay: 200, draw: 900, pour: 1300 });
        ctx.stagger([l1, l2], { delay: 1500, each: 900, duration: 1100, from: { opacity: 0, transform: "translateY(26px)", filter: "blur(8px)" }, to: { opacity: 1, transform: "none", filter: "blur(0)" } });
        ctx.stagger([sub, count, title, thanks].filter(Boolean), { delay: 3600, each: 200, duration: 900 });
        ctx.stagger(faces.children, { delay: 4300, each: 35, from: { opacity: 0, transform: "translateY(16px)" } });
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
  const DEFAULT = ["prologue", "growth", "clouds", "years", "menu", "families", "spotlights", "village", "crew", "wall", "outro"];
  function build(M, cfg) {
    const out = [];
    const alias = { intro: "prologue", numbers: "growth", cup: "growth", activity: "growth", timeline: "growth", world: "village" };
    const want = [...new Set((cfg.scenes || DEFAULT).map((s) => alias[s] || s))];
    for (const s of want) {
      if (s === "prologue") out.push(prologue(M, cfg));
      else if (s === "growth" && M.growth.length > 1) out.push(growth(M));
      else if (s === "clouds" && M.clouds.length) out.push(clouds(M));
      else if (s === "years") M.years.forEach((y, i) => out.push(yearScene(y, M, cfg, i === M.years.length - 1)));
      else if (s === "menu" && M.releases.length) out.push(menu(M));
      else if (s === "families") M.families.forEach((f) => out.push(familyScene(f)));
      else if (s === "spotlights") M.spotlights.forEach((r) => out.push(spotlight(r)));
      else if (s === "village" && window.ShowVillage) out.push(window.ShowVillage.scene(M));
      else if (s === "crew" && M.crew.length) out.push(crew(M));
      else if (s === "wall") out.push(wall(M));
      else if (s === "outro") out.push(outro(M, cfg));
    }
    const used = new Set(out.map((p) => p.section));
    return {
      playlist: out,
      sections: SECTIONS.filter((s) => used.has(s.id)),
      preload: [[null, "assets/org.png"], ...M.people.filter((p) => p.avatar).map((p) => [p.login, p.avatar])],
    };
  }

  window.ShowScenes = { build };
})();
