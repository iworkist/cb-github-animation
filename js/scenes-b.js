// Version B — "Open Source Index": a bright editorial edition. Big type, one figure per screen,
// a timeline ribbon that pans through seven years, the platform as a stack, a project index,
// a chronicle of who stayed how long, a yearbook of every contributor.
(function () {
  const { h, avatar, ease } = window.Show;
  const { ym, ymd } = window.ShowModel;
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  const pad = (n) => String(n).padStart(2, "0");
  const ACC = "#2348ff";

  const SECTIONS = [
    { id: "cover", label: "Cover" },
    { id: "figures", label: "Figures" },
    { id: "timeline", label: "Timeline" },
    { id: "platform", label: "Platform" },
    { id: "index", label: "Index" },
    { id: "chronicle", label: "Chronicle" },
    { id: "contributors", label: "Contributors" },
    { id: "thanks", label: "Thanks" },
  ];

  function pageHead(n, total, label) {
    return h("div", "b-pagehead", h("span", null, "CLOUD-BARISTA — OPEN SOURCE INDEX"), h("span", null, `${pad(n)} / ${pad(total)} · ${label.toUpperCase()}`));
  }
  // text that slides up from behind a mask
  function maskLine(cls, ...children) {
    const inner = h("div", "in", ...children);
    return { el: h("div", `b-mask ${cls || ""}`, inner), inner };
  }
  function rise(ctx, inner, delay = 0, duration = 900) {
    return ctx.anim(inner, [{ transform: "translateY(105%)" }, { transform: "none" }], { duration, delay, easing: "cubic-bezier(.2,.8,.2,1)" });
  }
  // a block that scrolls through a fixed viewport at a steady pace
  async function scrollThrough(ctx, viewport, content, pxPerSec, { lead = 1600, tail = 2200 } = {}) {
    const dist = Math.max(0, content.offsetHeight - viewport.clientHeight);
    await ctx.wait(lead);
    if (dist > 0) await ctx.tween((dist / pxPerSec) * 1000, (p) => { content.style.transform = `translateY(${-dist * p}px)`; }, ease.linear);
    await ctx.wait(tail);
  }

  // ======================================================= 01 cover
  function cover(M, cfg, n, total) {
    return {
      id: "b-cover", section: "cover", cls: "b-scene b-cover", accent: ACC,
      async run(ctx) {
        const names = M.repos.filter((r) => r.people.length).map((r) => r.title);
        const rows = [0, 1, 2].map((i) => {
          const list = names.slice(i * 7).concat(names.slice(0, i * 7));
          const text = list.join("   /   ");
          return h("div", `mq r${i}`, h("div", "track", h("span", null, text), h("span", null, text)));
        });
        const words = cfg.eventTitle.split(" ");
        const wm = maskLine("wm", ...words[0].split(/(-)/).map((part) => (part === "-" ? h("span", "hy", "-") : part)));
        const rest = words.length > 1 ? maskLine("rest", words.slice(1).join(" ")) : null;
        const kicker = maskLine("kick", `OPEN SOURCE MULTI-CLOUD PLATFORM · SINCE ${M.years[0].year}`);
        const rule = h("div", "rule");
        const S = M.stats;
        const metaBits = [
          [`${S.orgSince}`, "GitHub 조직 생성"],
          [`${S.people} · ${S.repos}`, "기여자 · 레포지토리"],
          [cfg.eventDate || `${M.years[0].year} → ${M.years[M.years.length - 1].year}`, cfg.venue || (cfg.edition ? `${cfg.edition}` : "github.com/cloud-barista")],
        ];
        const meta = h("div", "meta", metaBits.map(([a, b]) => h("div", null, h("b", null, a), h("span", null, b))));
        ctx.root.append(h("div", "mqs", rows), pageHead(n, total, "Cover"), h("div", "block", kicker.el, wm.el, rest && rest.el, rule, meta));

        ctx.stagger(rows, { each: 200, duration: 1600, from: { opacity: 0 }, to: { opacity: 1 } });
        rise(ctx, kicker.inner, 300, 700);
        rise(ctx, wm.inner, 600, 1100);
        if (rest) rise(ctx, rest.inner, 950, 1000);
        ctx.anim(rule, [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: 1200, delay: 1400, easing: "cubic-bezier(.7,0,.2,1)" });
        ctx.stagger(meta.children, { delay: 1900, each: 160, duration: 700 });
        await ctx.wait(11000);
      },
    };
  }

  // ======================================================= 02 figures — one number per screen
  function figures(M, n, total) {
    return {
      id: "b-figures", section: "figures", cls: "b-scene b-figures", accent: ACC,
      async run(ctx) {
        const S = M.stats, G = M.growth;
        const yrs = M.years.map((y) => y.year);
        const yearly = (key) => yrs.map((y) => {
          const end = G.filter((g) => g.m.startsWith(String(y))).pop();
          const prev = G.filter((g) => g.m < `${y}-01`).pop();
          return (end ? end[key] : 0) - (prev ? prev[key] : 0);
        });
        const milestones = [[M.stats.orgCreated, "조직 생성"]];
        if (M.firstCommit) milestones.push([M.firstCommit.date, "첫 커밋"]);
        if (S.firstRelease) milestones.push([S.firstRelease.date, `첫 릴리스 ${S.firstRelease.name}`]);
        milestones.push([M.generatedAt, "오늘"]);
        const slides = [
          { k: "함께한 시간", v: S.yearsActive, suf: "년", d: `${S.orgSince}, GitHub 조직을 만든 날부터`, steps: milestones },
          { k: "기여자", v: S.people, suf: "명", d: "커밋으로 함께한 사람 · 해마다 새로 합류한 수", bars: yearly("people") },
          { k: "레포지토리", v: S.repos, suf: "개", d: "해마다 새로 만들어진 레포지토리", bars: yearly("repos") },
          { k: "커밋", v: S.commits, suf: "", d: "사람이 남긴 커밋 · 연도별", bars: yearly("commits") },
          M.hasPrs ? { k: "머지된 PR", v: S.prs, suf: "", d: "리뷰를 거쳐 합쳐진 변경 · 연도별", bars: yearly("prs") } : null,
          { k: "릴리스", v: S.releases, suf: "번", d: `${S.firstRelease.name}에서 ${S.lastRelease.name}까지 · 연도별`, bars: yearly("releases") },
          M.clouds.length ? { k: "연결된 클라우드", v: M.clouds.length, suf: "종", d: "CB-Spider 하나로 연결되는 클라우드", chips: M.clouds.map((c) => c.name) } : null,
        ].filter(Boolean);
        const counter = h("div", "counter");
        ctx.root.append(pageHead(n, total, "Figures"), counter);

        for (let i = 0; i < slides.length; i++) {
          const s = slides[i];
          const num = h("span", "num", "0");
          let visual = null, parts = [];
          if (s.bars) {
            const max = Math.max(1, ...s.bars);
            parts = s.bars.map((v, k) => {
              const fill = h("i");
              const col = h("div", { class: "col" + (k === s.bars.length - 1 ? " now" : "") }, h("div", "bar", h("span", "val", fmt(v)), fill), h("span", "yr", yrs[k]));
              return { col, fill, hgt: (v / max) * 100 };
            });
            visual = h("div", "bars", parts.map((p) => p.col));
            visual.style.gridTemplateColumns = `repeat(${parts.length}, 1fr)`;
          } else if (s.chips) {
            visual = h("div", "chips", s.chips.map((c) => h("span", null, c)));
          } else if (s.steps) {
            visual = h("div", "steps", s.steps.map(([d, t]) => h("div", null, h("b", null, ymd(d)), h("span", null, t))));
          }
          const fig = h("div", "fig",
            h("div", "fk", h("span", "fn", pad(i + 1)), s.k),
            h("div", "fv", num, s.suf ? h("small", null, s.suf) : null),
            h("div", "fd", s.d),
            visual);
          ctx.root.append(fig);
          counter.textContent = `${pad(i + 1)} / ${pad(slides.length)}`;
          ctx.anim(fig, [{ opacity: 0, transform: "translateY(70px)" }, { opacity: 1, transform: "none" }], { duration: 700, easing: "cubic-bezier(.2,.8,.2,1)" });
          ctx.countUp(num, s.v, 1400).catch(() => {});
          if (s.bars) parts.forEach((p, k) => ctx.anim(p.fill, [{ height: "0%" }, { height: p.hgt + "%" }], { duration: 800, delay: 300 + k * 80, easing: "cubic-bezier(.2,.8,.2,1)" }));
          else ctx.stagger(visual.children, { delay: 300, each: 70, duration: 500 });
          await ctx.wait(3500);
          ctx.anim(fig, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-60px)" }], { duration: 450, easing: "ease-in" });
          await ctx.wait(460);
          fig.remove();
        }
      },
    };
  }

  // ======================================================= 03 timeline ribbon
  function timeline(M, n, total) {
    return {
      id: "b-timeline", section: "timeline", cls: "b-scene b-timeline", accent: ACC,
      async run(ctx) {
        const G = M.growth, N = G.length;
        const PX = 84, X0 = 200, PH = 760;
        const idx = new Map(G.map((g, i) => [g.m, i]));
        const xOf = (date) => {
          const m = date.slice(0, 7);
          const i = idx.has(m) ? idx.get(m) : m < G[0].m ? 0 : N - 1;
          const day = Number(date.slice(8, 10)) || 15;
          return X0 + (i + (day - 1) / 31) * PX;
        };
        const strip = h("div", "strip");
        strip.style.width = X0 * 2 + (N - 1) * PX + 600 + "px";
        const tracked = []; // elements that light up once the playhead passes them
        const put = (el, x) => { el.style.left = x + "px"; strip.append(el); tracked.push({ el, x }); return el; };

        // axis, years, months
        strip.append(h("div", { class: "axis", style: { left: X0 + "px", width: (N - 1) * PX + "px" } }));
        G.forEach((g, i) => {
          const x = X0 + i * PX;
          const isYear = g.m.endsWith("-01") || i === 0;
          strip.append(h("div", { class: "mt" + (isYear ? " y" : ""), style: { left: x + "px" } }));
          if (isYear) put(h("div", "yl", g.m.slice(0, 4)), x);
        });
        // releases and the conferences held with them
        for (const r of M.releases) put(h("div", { class: "rel", "--rc": r.accent }, h("b", null, r.name), h("span", null, `${r.version} · ${r.ym}`)), xOf(r.date));
        for (const c of M.years.flatMap((y) => y.conferences)) {
          const rel = M.releases.find((r) => c.label.includes(r.name));
          if (rel) put(h("div", "conf", `#${c.n} Open Conference`), xOf(rel.date));
        }
        // repositories in lanes
        const laneEnd = [0, 0, 0, 0, 0, 0];
        for (const r of M.repos.filter((r) => r.people.length).sort((a, b) => a.created_at.localeCompare(b.created_at))) {
          const x = xOf(r.created_at);
          const w = r.title.length * 11.5 + 34;
          let lane = 0;
          for (let k = 1; k < laneEnd.length; k++) if (laneEnd[k] < laneEnd[lane]) lane = k;
          const lx = Math.max(x, laneEnd[lane] + 10);
          laneEnd[lane] = lx + w;
          const el = put(h("div", { class: "repo", "--fam": r.family ? r.family.color : ACC }, r.title), lx);
          el.style.top = 502 + lane * 32 + "px";
        }
        // people, stacked above the month they first contributed
        const byMonth = new Map();
        for (const p of M.people) { const m = p.first.slice(0, 7); (byMonth.get(m) || byMonth.set(m, []).get(m)).push(p); }
        for (const [m, list] of byMonth) {
          const x = xOf(m + "-15") - 17;
          list.slice(0, 5).forEach((p, k) => { const a = put(avatar(p, 34), x); a.classList.add("pp"); a.style.top = 912 - k * 40 + "px"; });
          if (list.length > 5) { const more = put(h("div", "more", `+${list.length - 5}`), x); more.style.top = 912 - 5 * 40 + "px"; }
        }

        const head = h("div", "head", h("div", "kick", `${pad(n)} — TIMELINE`), h("div", "h2", `${M.years[0].year} → ${M.years[M.years.length - 1].year}, 한 달씩`));
        const dateEl = h("div", "date", ym(G[0].m));
        const statEls = [["people", "기여자"], ["repos", "레포"], ["commits", "커밋"], M.hasPrs ? ["prs", "PR"] : null].filter(Boolean)
          .map(([key, label]) => ({ key, v: h("b", null, "0"), el: null, label }));
        const stats = h("div", "stats", statEls.map((s) => (s.el = h("div", null, s.v, h("span", null, s.label)))));
        const playhead = h("div", "playhead");
        ctx.root.append(pageHead(n, total, "Timeline"), strip, h("div", "fade l"), h("div", "fade r"), playhead, head, h("div", "now", dateEl, stats));
        ctx.stagger(head.children, { each: 120 });
        ctx.anim(strip, [{ opacity: 0 }, { opacity: 1 }], { duration: 900, delay: 200 });

        const setAt = (x) => {
          strip.style.transform = `translateX(${PH - x}px)`;
          for (const t of tracked) {
            const past = t.x <= x;
            if (past !== t.past) { t.past = past; t.el.classList.toggle("past", past); }
          }
          const i = Math.max(0, Math.min(N - 1, Math.floor((x - X0) / PX)));
          dateEl.textContent = ym(G[i].m);
          for (const s of statEls) s.v.textContent = fmt(G[i][s.key]);
        };
        setAt(X0);
        await ctx.wait(1200);
        await ctx.tween(36000, (p) => setAt(X0 + p * (N - 1) * PX), ease.inOut);
        await ctx.wait(3500);
      },
    };
  }

  // ======================================================= 04 platform stack
  function platform(M, n, total) {
    return {
      id: "b-platform", section: "platform", cls: "b-scene b-platform", accent: ACC,
      async run(ctx) {
        const spider = M.repoBy.get("cb-spider"), tumble = M.repoBy.get("cb-tumblebug"), mapui = M.repoBy.get("cb-mapui");
        const fam = (id) => M.families.find((f) => f.id === id);
        const people = (repos) => new Set(repos.flatMap((r) => r.people.map((p) => p.login))).size;
        const head = h("div", "head", h("div", "kick", `${pad(n)} — PLATFORM`), h("div", "h2", "아래에서 위로, 쌓아 올린 멀티클라우드"),
          h("div", "lead", "클라우드를 연결하는 층 위에 관리하는 층, 그 위에 마이그레이션과 AI를 위한 프로젝트들이 올라갑니다"));
        const layerStat = (r) => (r ? `커밋 ${fmt(r.commits)} · 기여자 ${r.people.length}명` : "");
        const layers = [];
        // top: what is built on Tumblebug
        const tops = ["migrator", "ai", "ecosystem"].map(fam).filter(Boolean).map((f) =>
          h("div", { class: "box", "--fam": f.color },
            h("div", "t", f.short || f.title), h("div", "d", f.title),
            h("div", "s", `레포 ${f.repos.length}개 · 기여자 ${people(f.repos)}명`)));
        if (tops.length) layers.push(h("div", "layer top", tops));
        if (tumble) layers.push(h("div", "layer bar", h("div", "t", "CB-Tumblebug"), h("div", "d", "멀티클라우드 인프라를 하나의 클라우드처럼 관리" + (mapui ? " · CB-MapUI 콘솔" : "")), h("div", "s", layerStat(tumble))));
        if (spider) layers.push(h("div", "layer bar", h("div", "t", "CB-Spider"), h("div", "d", "모든 클라우드를 하나의 인터페이스로 연결"), h("div", "s", layerStat(spider))));
        if (M.clouds.length) layers.push(h("div", "layer clouds", h("div", "t", `클라우드 ${M.clouds.length}종`), h("div", "names", M.clouds.map((c) => h("span", null, c.name)))));
        const stack = h("div", "stack", layers);
        ctx.root.append(pageHead(n, total, "Platform"), head, stack);
        ctx.stagger(head.children, { each: 120 });
        // build from the bottom up
        const order = [...layers].reverse();
        order.forEach((l, i) => ctx.anim(l, [{ opacity: 0, transform: "translateY(80px)" }, { opacity: 1, transform: "none" }], { duration: 800, delay: 700 + i * 650, easing: "cubic-bezier(.2,.8,.2,1)" }));
        const tops2 = stack.querySelectorAll(".top .box");
        ctx.stagger(tops2, { delay: 700 + (order.length - 1) * 650 + 200, each: 160, duration: 700 });
        await ctx.wait(15000);
      },
    };
  }

  // ======================================================= 05 project index
  function index(M, n, total) {
    return {
      id: "b-index", section: "index", cls: "b-scene b-index", accent: ACC,
      async run(ctx) {
        const count = M.families.reduce((s, f) => s + f.repos.length, 0);
        const head = h("div", "head", h("div", "kick", `${pad(n)} — INDEX`), h("div", "h2", `프로젝트 인덱스 · ${count}개 레포지토리`));
        const content = h("div", "content", M.families.map((f, i) => h("section", { "--fam": f.color },
          h("div", "fh", h("span", "no", pad(i + 1)), h("div", null, h("div", "fk", f.kicker), h("div", "ft", f.title), h("div", "fl", f.line))),
          h("div", "grid", f.repos.map((r) => h("div", "entry",
            h("div", "et", r.title, r.archived ? h("span", "tag", "ARCHIVED") : null),
            h("div", "es", `cloud-barista/${r.name}`),
            h("div", "ed", r.ko),
            h("div", "em", [`SINCE ${r.year}`, r.people.length ? `${r.people.length}명` : null, r.commits ? `${fmt(r.commits)} COMMITS` : null, r.stars ? `★ ${r.stars}` : null].filter(Boolean).join("  ·  "))))))));
        const viewport = h("div", "viewport", content);
        ctx.root.append(pageHead(n, total, "Index"), head, viewport, h("div", "fade t"), h("div", "fade b"));
        ctx.stagger(head.children, { each: 120 });
        ctx.anim(viewport, [{ opacity: 0, transform: "translateY(40px)" }, { opacity: 1, transform: "none" }], { duration: 900, delay: 300 });
        await scrollThrough(ctx, viewport, content, 90);
      },
    };
  }

  // ======================================================= 06 chronicle — who stayed how long
  function chronicle(M, n, total) {
    return {
      id: "b-chronicle", section: "chronicle", cls: "b-scene b-chronicle", accent: ACC,
      async run(ctx) {
        const list = M.tenure;
        const t0 = Date.parse(M.stats.orgCreated), t1 = Date.parse(M.generatedAt);
        const AX0 = 700, AX1 = 1700;
        const X = (d) => AX0 + ((Date.parse(d) - t0) / (t1 - t0)) * (AX1 - AX0);
        const head = h("div", "head", h("div", "kick", `${pad(n)} — CHRONICLE`), h("div", "h2", "처음부터, 오래, 함께"),
          h("div", "lead", "첫 커밋부터 가장 최근 커밋까지 · 가장 많이, 가장 오래 기여한 분들"));
        const top = 330, rowH = Math.min(44, 640 / list.length);
        const grid = h("div", "grid");
        for (const y of M.years) {
          const x = Math.max(AX0, X(`${y.year}-01-01`)); // the first year starts at the org's creation
          grid.append(h("div", { class: "gl", style: { left: x + "px", top: top - 40 + "px", height: list.length * rowH + 50 + "px" } }, h("span", null, y.year)));
        }
        const rows = list.map((p, i) => {
          const y = top + i * rowH;
          const x0 = X(p.first), x1 = p.active ? AX1 : Math.max(x0 + 8, X(p.lastSeen));
          const bar = h("div", { class: "bar" + (p.active ? " active" : ""), style: { left: x0 + "px", top: y + rowH / 2 - 7 + "px", width: x1 - x0 + "px" } });
          const label = h("div", { class: "bl", style: { left: x1 + 12 + "px", top: y + rowH / 2 - 11 + "px" } },
            `${p.years}년 · 커밋 ${fmt(p.commits)}`, p.active ? h("b", null, " · 지금도") : null);
          if (x1 > AX1 - 190) { label.style.left = ""; label.style.right = 1920 - x0 + 12 + "px"; label.classList.add("before"); }
          const who = h("div", { class: "who", style: { top: y + "px", height: rowH + "px" } }, avatar(p, Math.round(rowH - 10)),
            h("span", "nm", p.koName || p.displayName), p.koName && p.name ? h("span", "en", p.name) : h("span", "en", `@${p.login}`));
          return { who, bar, label, w: x1 - x0 };
        });
        ctx.root.append(pageHead(n, total, "Chronicle"), head, grid, ...rows.flatMap((r) => [r.who, r.bar, r.label]));
        ctx.stagger(head.children, { each: 120 });
        ctx.anim(grid, [{ opacity: 0 }, { opacity: 1 }], { duration: 800, delay: 300 });
        rows.forEach((r, i) => {
          const d = 600 + i * 140;
          ctx.anim(r.who, [{ opacity: 0, transform: "translateX(-20px)" }, { opacity: 1, transform: "none" }], { duration: 600, delay: d });
          r.bar.style.transformOrigin = "left center";
          ctx.anim(r.bar, [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: 1100, delay: d + 150, easing: "cubic-bezier(.4,0,.2,1)" });
          ctx.anim(r.label, [{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: d + 1100 });
        });
        await ctx.wait(Math.max(15000, 600 + rows.length * 140 + 8000));
      },
    };
  }

  // ======================================================= 07 contributors — the yearbook
  function yearbook(M, n, total) {
    return {
      id: "b-yearbook", section: "contributors", cls: "b-scene b-yearbook", accent: ACC,
      async run(ctx) {
        const head = h("div", "head", h("div", "kick", `${pad(n)} — CONTRIBUTORS`), h("div", "h2", `${M.stats.people}명의 이름`), h("div", "lead", "처음 기여한 순서대로"));
        const content = h("div", "content", M.years.filter((y) => y.people.length).map((y) => h("section", null,
          h("div", "yh", h("span", "yy", y.year), h("span", "yc", `${y.people.length}명 합류`), h("span", "yr", y.releases.map((r) => r.name).join(" · "))),
          h("div", "grid", [...y.people].sort((a, b) => a.first.localeCompare(b.first)).map((p) => h("div", "pc",
            avatar(p, 76), h("div", "nm", p.koName || p.displayName), h("div", "lg", `@${p.login}`)))))));
        const viewport = h("div", "viewport", content);
        ctx.root.append(pageHead(n, total, "Contributors"), head, viewport, h("div", "fade t"), h("div", "fade b"));
        ctx.stagger(head.children, { each: 120 });
        ctx.anim(viewport, [{ opacity: 0 }, { opacity: 1 }], { duration: 900, delay: 300 });
        await scrollThrough(ctx, viewport, content, 110, { lead: 1800, tail: 2500 });
      },
    };
  }

  // ======================================================= 08 thanks
  function thanks(M, cfg, n, total) {
    return {
      id: "b-thanks", section: "thanks", cls: "b-scene b-thanks", accent: ACC,
      async run(ctx) {
        const names = M.people.map((p) => p.koName || p.displayName);
        const rows = [0, 1, 2, 3].map((i) => {
          const list = names.filter((_, k) => k % 4 === i);
          const text = list.join("  ·  ");
          return h("div", `mq r${i}`, h("div", "track", h("span", null, text), h("span", null, text)));
        });
        const start = cfg.startTime ? new Date(cfg.startTime) : null;
        const hasCountdown = start && !isNaN(start) && start > new Date();
        const big = maskLine("big", "고맙습니다");
        const kick = maskLine("kick", "THANK YOU, CONTRIBUTORS");
        const S = M.stats;
        const line = h("div", "line", `기여자 ${S.people}명 · 커밋 ${fmt(S.commits)}${M.hasPrs ? ` · PR ${fmt(S.prs)}` : ""} · 릴리스 ${S.releases}번`);
        const count = hasCountdown ? h("div", "count", "--:--") : null;
        const next = h("div", "next", h("span", null, hasCountdown ? "오프닝까지" : "잠시 후 시작합니다"), h("b", null, [cfg.edition, cfg.eventTitle].filter(Boolean).join(" ")));
        ctx.root.append(h("div", "mqs", rows), pageHead(n, total, "Thanks"), h("div", "block", kick.el, big.el, line, next, count));
        ctx.stagger(rows, { each: 160, duration: 1400, from: { opacity: 0 }, to: { opacity: 1 } });
        rise(ctx, kick.inner, 300, 700);
        rise(ctx, big.inner, 600, 1100);
        ctx.stagger([line, next, count].filter(Boolean), { delay: 1500, each: 200, duration: 800 });
        await ctx.tween(13000, () => {
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
  const DEFAULT = ["cover", "figures", "timeline", "platform", "index", "chronicle", "contributors", "thanks"];
  function build(M, cfg) {
    const want = [...new Set(cfg.scenesB || DEFAULT)];
    const makers = {
      cover: (k, t) => cover(M, cfg, k, t),
      figures: (k, t) => figures(M, k, t),
      timeline: (k, t) => (M.growth.length > 1 ? timeline(M, k, t) : null),
      platform: (k, t) => platform(M, k, t),
      index: (k, t) => index(M, k, t),
      chronicle: (k, t) => (M.tenure.length ? chronicle(M, k, t) : null),
      contributors: (k, t) => yearbook(M, k, t),
      thanks: (k, t) => thanks(M, cfg, k, t),
    };
    const ids = want.filter((s) => makers[s]);
    const playlist = ids.map((s, i) => makers[s](i + 1, ids.length)).filter(Boolean);
    const used = new Set(playlist.map((p) => p.section));
    return {
      playlist,
      sections: SECTIONS.filter((s) => used.has(s.id)),
      preload: [[null, "assets/org.png"], ...M.people.filter((p) => p.avatar).map((p) => [p.login, p.avatar])],
    };
  }

  window.ShowScenesB = { build };
})();
