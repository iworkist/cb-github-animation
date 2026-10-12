// All scenes. Each scene is { id, section, cls, accent, run(ctx) }.
(function () {
  const { h, avatar, cupSVG, heroCupSVG, frag, ease } = window.Show;
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  const SVGNS = "http://www.w3.org/2000/svg";

  const SECTIONS = [
    { id: "welcome", label: "Welcome" },
    { id: "numbers", label: "Numbers" },
    { id: "journey", label: "Journey" },
    { id: "menu", label: "Releases" },
    { id: "projects", label: "Projects" },
    { id: "people", label: "People" },
  ];

  // ======================================================= intro
  function intro(M, cfg) {
    return {
      id: "intro", section: "welcome", cls: "s-intro", accent: "#e9b872",
      async run(ctx) {
        const { root } = ctx;
        const cup = frag(heroCupSVG());
        cup.classList.add("hero-cup");
        const words = cfg.eventTitle.split(" ");
        const title = h("div", "title",
          h("span", "w grad", words[0]), words.length > 2 ? h("br") : " ",
          words.slice(1).map((w, i) => [h("span", "w", w), i < words.length - 2 ? " " : ""]));
        const kicker = h("div", "kicker", cfg.edition ? `${cfg.edition} · Welcome` : "Welcome");
        const metaBits = [cfg.eventDate, cfg.venue].filter(Boolean);
        const meta = metaBits.length ? h("div", "meta", metaBits.flatMap((m, i) => (i ? [h("span", "dot"), m] : [m]))) : null;
        const first = M.years[0].year, last = M.years[M.years.length - 1].year;
        const years = h("div", { class: "years", html: `<b>${first}</b> — <b>${last}</b> &nbsp;·&nbsp; ${cfg.tagline}` });
        const url = h("div", "url", "GITHUB.COM/CLOUD-BARISTA");
        root.append(...[cup, kicker, title, meta, years, url].filter(Boolean));

        const cloud = cup.querySelector(".cloud");
        cloud.setAttribute("pathLength", "1");
        cloud.style.strokeDasharray = "1";
        ctx.anim(cup, [{ opacity: 0, transform: "translateY(40px) scale(.9)" }, { opacity: 1, transform: "none" }], { duration: 1200 });
        ctx.anim(cloud, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 2200, delay: 600, easing: "ease-in-out" });
        ctx.anim(kicker, [{ opacity: 0, letterSpacing: "0.8em" }, { opacity: 1, letterSpacing: "0.32em" }], { duration: 1400, delay: 500 });
        ctx.stagger(title.querySelectorAll(".w"), { delay: 800, each: 160, duration: 1100, from: { opacity: 0, transform: "translateY(80px)", filter: "blur(12px)" }, to: { opacity: 1, transform: "none", filter: "blur(0)" } });
        ctx.stagger([meta, years, url].filter(Boolean), { delay: 1700, each: 220, duration: 1000 });
        ctx.anim(title, [{ transform: "scale(1)" }, { transform: "scale(1.03)" }], { duration: 11000, delay: 1800, easing: "ease-in-out" });
        await ctx.wait(11000);
      },
    };
  }

  // ======================================================= numbers
  function numbers(M) {
    return {
      id: "numbers", section: "numbers", cls: "s-numbers", accent: "#7cc4ff",
      async run(ctx) {
        const S = M.stats;
        const gen = M.generatedAt.slice(0, 10).replace(/-/g, ".");
        const tiles = [
          { v: S.yearsActive, suf: "년+", k: "함께한 시간", d: `${S.orgSince} GitHub 조직 생성부터`, tint: "#e9b872" },
          { v: S.repos, k: "레포지토리", d: "github.com/cloud-barista", tint: "#d98a4e" },
          { v: S.people, suf: "명", k: "기여자", d: "커밋으로 함께한 사람들", tint: "#7cc4ff" },
          { v: S.commits, k: "커밋", d: "자동화 계정을 제외한 사람의 커밋", tint: "#e9b872" },
          { v: S.releases, suf: "번", k: "릴리스", d: `${S.firstRelease.name} → ${S.lastRelease.name}`, tint: S.lastRelease.accent },
          { v: S.stars, k: "GitHub Stars", d: "모든 레포지토리 합계", tint: "#f5d96b" },
        ];
        const head = h("div", "head",
          h("div", "kicker", "By the numbers"),
          h("div", "h1", "숫자로 보는 Cloud-Barista"),
          h("div", "lead muted", `GitHub 기준 · ${gen}`));
        const vEls = [];
        const grid = h("div", "grid", tiles.map((t) => {
          const v = h("span", "num", "0");
          vEls.push(v);
          return h("div", { class: "stat", "--tint": t.tint },
            h("div", "v", v, t.suf ? h("small", null, t.suf) : null),
            h("div", "k", t.k), h("div", "d", t.d));
        }));
        ctx.root.append(head, grid);
        ctx.stagger(head.children, { each: 120 });
        ctx.stagger(grid.children, { delay: 500, each: 140, duration: 900, from: { opacity: 0, transform: "translateY(40px) scale(.97)" } });
        await ctx.wait(600);
        tiles.forEach((t, i) => ctx.wait(i * 140).then(() => ctx.countUp(vEls[i], t.v, 2000)).catch(() => {}));
        await ctx.wait(10500);
      },
    };
  }

  // ======================================================= activity chart
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

  function activity(M) {
    return {
      id: "activity", section: "journey", cls: "s-activity", accent: "#e9b872",
      async run(ctx) {
        // continuous month list
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
        for (let v = 0; v <= yMax; v += step) gridSvg += `<line x1="${L}" x2="${R}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${L - 18}" y="${Y(v) + 7}" text-anchor="end" class="axis-l">${fmt(v)}</text>`;
        let xSvg = "";
        months.forEach((x, i) => {
          if (x.m.endsWith("-01") || i === 0) xSvg += `<line x1="${X(i)}" x2="${X(i)}" y1="${B}" y2="${B + 10}" stroke="rgba(246,237,227,.3)"/><text class="year" x="${X(i)}" y="${B + 44}" text-anchor="start">${x.m.slice(0, 4)}</text>`;
        });

        const rels = M.releases.map((r, i) => {
          const x = L + (idxOfDate(r.date) / (N - 1)) * (R - L);
          const row = i % 2;
          const ny = row ? 350 : 296;
          const anchor = x > R - 70 ? "end" : x < L + 70 ? "start" : "middle";
          return { r, x, html: `<g class="rel" opacity="0"><line x1="${x}" x2="${x}" y1="${ny + 30}" y2="${B}"/>
            <circle cx="${x}" cy="${ny + 30}" r="5" fill="${r.accent}"/>
            <text class="rn" x="${x}" y="${ny}" text-anchor="${anchor}">${r.name}</text>
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
            <text x="${X(peakI) - 18}" y="${Y(max) - 18}" text-anchor="end">가장 뜨거웠던 달 · ${ShowModel.ym(months[peakI].m)} · ${fmt(max)} 커밋</text>
          </g>
        </svg>`);

        const whenV = h("span", "num", ShowModel.ym(firstM));
        const monthN = h("span", "when", "0");
        const top = h("div", "top",
          h("div", "head", h("div", "kicker", "The journey"), h("div", "h1", "7년의 커밋, 13번의 릴리스"),
            h("div", "lead muted", "월별 커밋 수 (머지 커밋·자동화 계정 제외) 와 릴리스 코드네임")),
          h("div", "total", h("div", "v", whenV), h("div", "k", "이 달의 커밋 ", monthN)));
        ctx.root.append(svg, top);
        // headline numbers follow the data, not hard-coded
        top.querySelector(".h1").textContent = `${M.stats.yearsActive}년의 커밋, ${M.releases.length}번의 릴리스`;

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
          whenV.textContent = ShowModel.ym(cur.m);
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

  // ======================================================= year
  function relChip(r) {
    return h("div", "rel-chip",
      frag(cupSVG(r.liquid, r.kind)),
      h("div", null, h("span", "nm", r.name), h("span", "ko", r.ko)),
      h("div", "vd", h("b", null, r.version), r.ym));
  }

  function yearScene(Y, M, cfg, isLast) {
    return {
      id: `year-${Y.year}`, section: "journey", cls: "s-year", accent: Y.accent,
      async run(ctx) {
        const strip = h("div", "strip", M.years.map((y) => h("span", { class: y.year === Y.year ? "on" : y.year < Y.year ? "past" : "" }, y.year)));
        const yr = h("div", "yr", String(Y.year).split("").map((d) => h("span", null, d)));
        const era = h("div", "era", Y.story.title);
        // keep hyphenated project names (CB-Spider, AI-MCMP …) on one line
        const line = h("div", { class: "line", html: Y.story.line.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]).replace(/[A-Za-z]+(?:-[A-Za-z0-9]+)+/g, '<span style="white-space:nowrap">$&</span>') });
        const rels = h("div", "rels", Y.releases.map(relChip));
        const confChips = Y.conferences.map((c) => h("span", "conf-chip", h("b", null, `#${c.n}`), c.label));
        if (isLast) confChips.push(h("span", "conf-chip now", h("b", null, "NOW"), [cfg.edition, cfg.eventTitle].filter(Boolean).join(" ")));
        const confs = h("div", "confs", confChips);
        const left = h("div", "left", yr, era, line, rels, confs);

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
        ctx.anim(yr, [{ transform: "scale(1)" }, { transform: "scale(1.04)" }], { duration: 13000, delay: 1000, easing: "ease-in-out", fill: "forwards" });
        ctx.stagger([era, line], { delay: 450, each: 150 });
        ctx.stagger(rels.children, { delay: 900, each: 180, from: { opacity: 0, transform: "translateX(-30px)" } });
        ctx.stagger(confs.children, { delay: 1300, each: 100 });
        if (heads[0]) ctx.anim(heads[0], [{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: 1100 });
        ctx.stagger(right.querySelectorAll(".repo-row, .more"), { delay: 1250, each: 90, from: { opacity: 0, transform: "translateX(24px)" } });
        const pStart = 1250 + repoRows.length * 90 + 300;
        if (Y.people.length) {
          ctx.anim(heads[heads.length - 1], [{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: pStart });
          ctx.stagger(personEls, { delay: pStart + 150, each: 45, duration: 650, from: { opacity: 0, transform: "scale(.4)" }, easing: "cubic-bezier(.34,1.56,.64,1)" });
        }
        await ctx.wait(12500);
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
        const foot = h("div", "foot", "아메리카노로 시작해 히비스커스까지 — 모든 릴리스는 커피와 차의 이름을 가집니다");
        ctx.root.append(head, board, foot);
        ctx.stagger(head.children, { each: 120 });
        ctx.anim(board, [{ opacity: 0, transform: "translateY(30px)" }, { opacity: 1, transform: "none" }], { duration: 900, delay: 300 });
        ctx.stagger(board.querySelectorAll("h3"), { delay: 600, each: 200 });
        const end = ctx.stagger(items, { delay: 900, each: 260, from: { opacity: 0, transform: "translateX(-20px)" } });
        ctx.anim(foot, [{ opacity: 0 }, { opacity: 1 }], { duration: 800, delay: end });
        const latest = board.querySelector(".latest");
        if (latest) ctx.anim(latest, [{ transform: "scale(1)" }, { transform: "scale(1.035)" }, { transform: "scale(1)" }], { duration: 1600, delay: end + 300, iterations: 3, easing: "ease-in-out" });
        await ctx.wait(Math.max(14000, end + 6000));
      },
    };
  }

  // ======================================================= project family
  function familyScene(F, idx, total) {
    return {
      id: `family-${F.id}`, section: "projects", cls: "s-family", accent: F.color,
      async run(ctx) {
        const people = new Set();
        F.repos.forEach((r) => r.people.forEach((p) => people.add(p.login)));
        const head = h("div", "head",
          h("div", "l", h("div", "kicker", `${F.kicker}`), h("div", "h2", F.title), h("div", "lead", F.line)),
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
        const nowYear = Number(ShowModel.ym(new Date().toISOString()).slice(0, 4));
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
        const inEnd = ctx.stagger(cardEls, { delay: 450, each: 90, duration: 800, from: { opacity: 0, transform: "translateY(30px) scale(.96)" } });
        await ctx.wait(inEnd + 400);
        const per = Math.max(550, Math.min(1100, 8000 / n));
        for (const c of cardEls) {
          c.classList.add("lit");
          await ctx.wait(per);
          c.classList.remove("lit");
        }
        await ctx.wait(1200);
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
        const left = h("div", "l",
          h("div", "kicker", `Spotlight · since ${ShowModel.ym(R.created_at)}`),
          h("div", "name", R.title),
          h("div", "desc", R.ko),
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
        await ctx.wait(11500);
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
            h("div", "n", x.p.displayName),
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
        const cup = frag(heroCupSVG());
        cup.classList.add("hero-cup");
        const count = hasCountdown ? h("div", "count", "--:--") : null;
        const big = h("div", "big", hasCountdown ? "오프닝까지" : "잠시 후 행사가 시작됩니다");
        const title = h("div", "big grad", [cfg.edition, cfg.eventTitle].filter(Boolean).join(" "));
        title.style.fontSize = "64px";
        const thanks = h("div", { class: "thanks", html: `<b>${M.stats.people}</b>명의 기여자, <b>${fmt(M.stats.commits)}</b>개의 커밋, <b>${M.stats.releases}</b>번의 릴리스 — 고맙습니다` });
        const faces = h("div", "faces", [...M.people].sort((a, b) => b.commits - a.commits).slice(0, 28).map((p) => avatar(p, 56)));
        ctx.root.append(...[cup, big, count, title, thanks, faces].filter(Boolean));
        ctx.stagger([cup, big, count, title, thanks].filter(Boolean), { each: 160, duration: 1000 });
        ctx.stagger(faces.children, { delay: 900, each: 35, from: { opacity: 0, transform: "translateY(16px)" } });
        await ctx.tween(10000, () => {
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
    const want = cfg.scenes || ["intro", "numbers", "activity", "years", "menu", "families", "spotlights", "wall", "outro"];
    for (const s of want) {
      if (s === "intro") out.push(intro(M, cfg));
      else if (s === "numbers") out.push(numbers(M));
      else if (s === "activity" && M.months.length > 1) out.push(activity(M));
      else if (s === "years") M.years.forEach((y, i) => out.push(yearScene(y, M, cfg, i === M.years.length - 1)));
      else if (s === "menu" && M.releases.length) out.push(menu(M));
      else if (s === "families") M.families.forEach((f, i) => out.push(familyScene(f, i, M.families.length)));
      else if (s === "spotlights") M.spotlights.forEach((r) => out.push(spotlight(r)));
      else if (s === "wall") out.push(wall(M));
      else if (s === "outro") out.push(outro(M, cfg));
    }
    const used = new Set(out.map((p) => p.section));
    return {
      playlist: out,
      sections: SECTIONS.filter((s) => used.has(s.id)),
      preload: ["assets/org.png", ...M.people.map((p) => p.avatar).filter(Boolean)],
    };
  }

  window.ShowScenes = { build };
})();
