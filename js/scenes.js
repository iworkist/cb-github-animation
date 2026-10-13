// The slides. Each is { id, chapter, cls, accent, chrome?, group?, run(ctx) }; run() resolves when the slide is done.
(function () {
  const { h, avatar, ease, BOUNCE } = window.Show;
  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  const PALETTE = ['#f2a33a', '#79c7ff', '#57e0b0', '#ff7a9a', '#c9a8ff', '#ffd966', '#f2a33a', '#ff7a9a'];
  const BITS = ['#ffd966', '#f2a33a', '#57e0b0', '#ff7a9a', '#79c7ff', '#f7eee2'];

  const CHAPTERS = [
    { id: 'opening', label: 'OPENING' }, { id: 'numbers', label: 'NUMBERS' }, { id: 'history', label: 'HISTORY' },
    { id: 'projects', label: 'PROJECTS' }, { id: 'devlife', label: 'DEV LIFE' }, { id: 'people', label: 'PEOPLE' },
    { id: 'join', label: 'JOIN US' },
  ];

  // ---------- shared pieces ----------
  function head(kicker, title, sub) {
    return h('div', 'head',
      h('div', 'kick', h('span', 'sticker', kicker)),
      h('h1', { class: 'h1', html: title }),
      sub ? h('p', { class: 'sub', html: sub }) : null);
  }
  const showHead = (ctx, hd, delay = 0) => ctx.stagger(hd.children, { delay, each: 120, duration: 800 });

  async function type(ctx, el, text, cps = 32) {
    for (let i = 1; i <= text.length; i++) { el.textContent = text.slice(0, i); await ctx.wait(1000 / cps); }
  }

  // pixel steam: squares that rise in steps
  function steam(ctx, parent, o) {
    const size = o.size || 20, n = o.n || 7;
    const box = h('div', { class: 'steam', style: { left: o.x + 'px', top: o.y + 'px', width: o.w + 'px', height: (o.rise || 160) + size + 'px' } });
    parent.append(box);
    for (let i = 0; i < n; i++) {
      const col = Math.round(((i + 0.5) / n) * (o.w / size - 1));
      const s = h('i', { style: { left: col * size + 'px', width: size + 'px', height: size + 'px', background: o.color || 'rgba(247,238,226,.8)' } });
      box.append(s);
      ctx.anim(s, [
        { transform: 'translate(0,0)', opacity: 0 },
        { opacity: 0.85, offset: 0.2 },
        { transform: `translate(${(i % 2 ? 1 : -1) * size}px, ${-(o.rise || 160)}px)`, opacity: 0 },
      ], { duration: 2600 + (i % 3) * 500, delay: (o.delay || 0) + i * 330, iterations: Infinity, easing: 'steps(7, end)' });
    }
    return box;
  }

  // pixel confetti
  function burst(ctx, parent, x, y, n = 18, spread = 150) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.4, d = spread * (0.5 + Math.random() * 0.7), s = [10, 14, 18][i % 3];
      const p = h('i', { class: 'bit', style: { left: x + 'px', top: y + 'px', width: s + 'px', height: s + 'px', background: BITS[i % BITS.length] } });
      parent.append(p);
      const an = ctx.anim(p, [
        { transform: 'translate(-50%,-50%)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d + 50}px))`, opacity: 0 },
      ], { duration: 1000, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' });
      an.finished.then(() => p.remove(), () => p.remove());
    }
  }

  // fit one line of text into a width by stepping the font size down
  function fit(el, maxPx, minPx) {
    let fs = parseFloat(getComputedStyle(el).fontSize);
    while (el.scrollWidth > el.clientWidth + 1 && fs > minPx) { fs -= 2; el.style.fontSize = fs + 'px'; }
    return fs;
  }

  function monotonePath(pts) {
    const n = pts.length;
    if (n < 2) return '';
    const dx = [], dy = [], m = [];
    for (let i = 0; i < n - 1; i++) { dx[i] = pts[i + 1][0] - pts[i][0]; dy[i] = pts[i + 1][1] - pts[i][1]; m[i] = dy[i] / dx[i]; }
    const t = [m[0]];
    for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]);
    t[n - 1] = m[n - 2];
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < n - 1; i++) {
      const k = dx[i] / 3;
      d += `C${pts[i][0] + k},${pts[i][1] + t[i] * k} ${pts[i + 1][0] - k},${pts[i + 1][1] - t[i + 1] * k} ${pts[i + 1][0]},${pts[i + 1][1]}`;
    }
    return d;
  }

  // ======================================================= 1. boot: a terminal cold open
  function boot(M) {
    return {
      id: 'boot', chapter: 'opening', chrome: false, cls: 's-boot', accent: '#57e0b0',
      async run(ctx) {
        const T = M.totals;
        const body = h('div', 'tbody');
        const term = h('div', 'term', h('div', 'tbar', h('i'), h('i'), h('i'), h('span', null, 'barista@open-conference — zsh')), body);
        ctx.root.append(term);
        ctx.anim(term, [{ opacity: 0, transform: 'translateY(40px) scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 800 });
        await ctx.wait(700);
        const line = (cls) => { const l = h('div', 'ln' + (cls ? ' ' + cls : '')); body.append(l); return l; };
        const prompt = () => h('span', 'pr', h('b', null, 'barista@open-conf'), ' ', h('i', null, '~'), ' $ ');
        async function cmd(text) {
          const l = line(), t = h('span', 'cmd'), cur = h('span', 'cursor');
          l.append(prompt(), t, cur);
          await ctx.wait(450);
          await type(ctx, t, text, 30);
          await ctx.wait(300);
          cur.remove();
        }
        const out = (html, cls) => {
          const l = line('out' + (cls ? ' ' + cls : ''));
          l.innerHTML = html;
          ctx.anim(l, [{ opacity: 0, transform: 'translateX(-10px)' }, { opacity: 1, transform: 'none' }], { duration: 260 });
          return l;
        };
        const first = M.releases[0], last = M.latest;

        await cmd('gh api orgs/cloud-barista --jq .created_at');
        out(`<span class="str">"${M.org.created}"</span>  <span class="cm"># Day 1 — 첫 원두를 고르던 날</span>`);
        await ctx.wait(800);
        await cmd('brew install cloud-barista');
        await ctx.wait(250);
        out(`<b class="ar">==&gt;</b> <b>Fetching</b> cloud-barista/* <span class="cm">(${T.repos} repositories)</span>`);
        await ctx.wait(420);
        const bar = out(`<b class="ar">==&gt;</b> <b>Grinding</b> ${fmt(T.commits)} commits  <span class="bar"></span> <span class="pct">0%</span>`);
        const barEl = bar.querySelector('.bar'), pct = bar.querySelector('.pct');
        await ctx.tween(1500, (p) => {
          const n = Math.round(p * 24);
          barEl.textContent = '[' + '█'.repeat(n) + '·'.repeat(24 - n) + ']';
          pct.textContent = Math.round(p * 100) + '%';
        }, ease.inOut);
        out(`<b class="ar">==&gt;</b> <b>Merging</b> ${fmt(T.mergedPrs)} pull requests`);
        await ctx.wait(420);
        out(`<b class="ar">==&gt;</b> <b>Pouring</b> ${M.releases.length} releases  <span class="cm">${first.name} → ${last.name}</span>`);
        await ctx.wait(420);
        const thanks = out(`<b class="ar">==&gt;</b> <b>Thanking</b> ${T.people} contributors `);
        thanks.append(PX.img('heart', null, 30, 'inl'));
        await ctx.wait(650);
        const ok = out('', 'ok');
        ok.append(PX.img('mug', null, 44, 'inl'), h('span', null, ` cloud-barista ${M.ym(M.org.created)} → ${M.genYM}: `), h('b', null, 'successfully brewed!'));
        ctx.anim(ok, [{ background: 'rgba(87,224,176,.35)' }, { background: 'rgba(87,224,176,0)' }], { duration: 1400 });
        const l = line();
        l.append(prompt(), h('span', 'cursor'));
        await ctx.wait(2600);
      },
    };
  }

  // ======================================================= 2. title
  function title(M, cfg) {
    return {
      id: 'title', chapter: 'opening', chrome: false, cls: 's-title', accent: '#f2a33a',
      async run(ctx) {
        const R = ctx.root, ev = cfg.event, T = M.totals;
        const art = h('div', 'art');
        const mug = PX.img('mug', null, 448, 'mug');
        const cloud = PX.img('cloud', null, 256, 'cloud');
        art.append(cloud, mug);
        const rest = (ev.title || '').replace(/^\s*Cloud-Barista\s*/i, '') || 'Open Conference';
        const word = h('div', 'brandword', 'Cloud', h('span', 'dash', '-'), 'Barista');
        const evname = h('div', 'evname', rest);
        const stickers = h('div', 'stickers', h('span', 'sticker s1', 'Open Source'), h('span', 'sticker s2', 'Multi-Cloud'), h('span', 'sticker s3', `Since ${M.org.created.slice(0, 4)}`));
        const sub = h('p', 'tsub', h('b', null, M.span.label), `, ${T.people}명이 함께 내린 멀티클라우드 한 잔`);
        const meta = [ev.date, ev.time, ev.venue].filter(Boolean);
        const metaEl = meta.length ? h('div', 'tmeta', meta.flatMap((x, i) => (i ? [h('i'), x] : [x]))) : null;
        const crew = [...M.people].sort((a, b) => b.commits + b.prs - (a.commits + a.prs)).slice(0, 11);
        const stack = h('div', 'stack', crew.map((p) => avatar(p, 64)), h('span', 'more', `+${T.people - crew.length}`));
        const trow = h('div', 'trow', stack, h('span', 'turl', 'github.com/cloud-barista'));
        const text = h('div', 'ttext', stickers, word, evname, sub, metaEl, trow);
        const splash = h('div', 'splash', h('span'));
        R.append(art, text, splash);

        ctx.anim(mug, [{ opacity: 0, transform: 'translateY(120px)' }, { opacity: 1, transform: 'none' }], { duration: 900, easing: BOUNCE });
        steam(ctx, art, { x: 90, y: 162, w: 260, n: 6, size: 24, rise: 140, delay: 600 });
        ctx.anim(cloud, [{ opacity: 0, transform: 'translateY(40px) scale(.6)' }, { opacity: 1, transform: 'none' }], { duration: 900, delay: 1300, easing: BOUNCE });
        ctx.anim(cloud, [{ transform: 'translateY(0)' }, { transform: 'translateY(-14px)' }], { duration: 2400, delay: 2200, iterations: Infinity, direction: 'alternate', easing: 'steps(4, end)', fill: 'none' });
        ctx.stagger(stickers.children, { delay: 300, each: 140, from: { opacity: 0, transform: 'scale(.4) rotate(-12deg)' }, easing: BOUNCE });
        ctx.stagger([word, evname, sub, metaEl].filter(Boolean), { delay: 600, each: 180, duration: 1000, from: { opacity: 0, transform: 'translateY(60px)' } });
        ctx.stagger([...stack.children, trow.lastChild], { delay: 1500, each: 50, duration: 500, from: { opacity: 0, transform: 'translateY(20px) scale(.6)' }, easing: BOUNCE });

        const lines = [`커밋 ${fmt(T.commits)}개!`, `기여자 ${T.people}명!`, `${M.latest.name} 출시!`, `클라우드 ${T.clouds}개!`, 'PR 환영!', `머지된 PR ${fmt(T.mergedPrs)}개!`,
          `버그 ${M.bugs.length}마리 (의도됨)!`, '오픈소스는 함께!', '커피 한 잔 하실래요?', 'Apache-2.0!'];
        const sp = splash.firstChild;
        ctx.anim(splash, [{ transform: 'rotate(-14deg) scale(1)' }, { transform: 'rotate(-14deg) scale(1.08)' }], { duration: 420, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out', delay: 1800, fill: 'none' });
        ctx.every(2300, (i) => {
          sp.textContent = lines[i % lines.length];
          ctx.anim(sp, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: BOUNCE, delay: i ? 0 : 1800 });
        });
        await ctx.wait(14500);
      },
    };
  }

  // ======================================================= 3. numbers
  function numbers(M) {
    return {
      id: 'numbers', chapter: 'numbers', cls: 's-numbers', accent: '#ffd966',
      async run(ctx) {
        const T = M.totals;
        const go = M.repos.filter((r) => r.lang === 'Go').length;
        const tiles = [
          { icon: PX.img('clock', null, 64), v: M.span.years, unit: '년', v2: M.span.months, unit2: '개월', k: '함께한 시간', d: `${M.org.created.replace(/-/g, '.')} 조직 생성부터`, c: '#ffd966' },
          { icon: PX.img('heart', null, 64), v: T.people, unit: '명', k: '기여자', d: '커밋하거나 PR이 머지된 사람', c: '#ff7a9a' },
          { icon: PX.img('chest', null, 64), v: T.repos, unit: '개', k: '저장소', d: `그중 Go 저장소 ${go}개`, c: '#e2bf94' },
          { icon: PX.img('bean', null, 64), v: T.commits, k: '커밋', d: '봇을 뺀, 사람이 남긴 커밋', c: '#f2a33a' },
          { icon: PX.img('merge', null, 64), v: T.mergedPrs, k: '머지된 PR', d: `열린 PR ${fmt(T.prs)}개 중`, c: '#c9a8ff' },
          { icon: PX.img('issue', null, 64), v: T.issues, k: '이슈', d: '함께 나눈 질문과 제안', c: '#57e0b0' },
          { icon: PX.drink(M.latest, 64), v: M.releases.length, unit: '잔', k: '정식 릴리스', d: `${M.releases[0].name} → ${M.latest.name}`, c: M.latest.accent },
          { icon: PX.img('cloud', null, 64), v: T.clouds, unit: '개', k: '연결된 클라우드', d: 'CB-Spider 드라이버 기준', c: '#79c7ff' },
        ];
        const hd = head('By the numbers', '숫자로 보는 <em>Cloud-Barista</em>', `${M.genYM} 기준 · github.com/cloud-barista 공개 저장소 전체`);
        const nums = [];
        const cards = tiles.map((t) => {
          const n1 = h('span', 'num', '0'), n2 = t.v2 != null ? h('span', 'num', '0') : null;
          nums.push([n1, t.v], ...(n2 ? [[n2, t.v2]] : []));
          return h('div', { class: 'stat', '--c': t.c },
            h('div', 'v', n1, t.unit ? h('small', null, t.unit) : null, n2, t.unit2 ? h('small', null, t.unit2) : null),
            h('div', 'k', t.icon, t.k), h('div', 'd', t.d));
        });
        const grid = h('div', 'grid', cards);
        const kg = (T.commits * 0.13) / 1000, cups = Math.round((T.commits * 0.13) / 15);
        const fact = h('div', 'fact sticker', PX.img('bean', null, 40), h('span', null, '커밋 1개 = 원두 1알이라면? ', h('b', null, `약 ${kg.toFixed(1)}kg`), ` — 커피 ${cups}잔 분량`));
        fact.style.opacity = 0;
        ctx.root.append(hd, grid, fact);
        showHead(ctx, hd);
        ctx.stagger(cards, { delay: 400, each: 110, duration: 800, from: { opacity: 0, transform: 'translateY(50px) scale(.95)' } });
        await ctx.wait(700);
        nums.forEach(([el, v], i) => ctx.spawn(async () => { await ctx.wait(i * 110); await ctx.countUp(el, v, 1800); }));
        await ctx.wait(2600);
        ctx.pop(fact);
        await ctx.wait(9500);
      },
    };
  }

  // ======================================================= 4. at a glance: the whole timeline
  function glance(M) {
    return {
      id: 'glance', chapter: 'history', cls: 's-glance', accent: '#f2a33a',
      async run(ctx) {
        const TL = M.timeline, N = TL.length;
        const L = 150, R = 1770, TOP = 540, B = 850;
        const max = Math.max(...TL.map((t) => Math.max(t.commits, t.prs)));
        const step = [50, 100, 200, 250, 500, 1000].find((s) => Math.ceil(max / s) <= 4) || 1000;
        const yMax = Math.ceil(max / step) * step;
        const X = (i) => L + (i / (N - 1)) * (R - L);
        const Y = (v) => B - (v / yMax) * (B - TOP);
        const [fy, fm] = TL[0].m.split('-').map(Number);
        const idxOf = (d) => { const [y, m, day] = d.split('-').map(Number); return (y - fy) * 12 + (m - fm) + ((day || 15) - 1) / 31; };
        const xOf = (d) => L + (Math.min(N - 1, idxOf(d)) / (N - 1)) * (R - L);

        const cPts = TL.map((t, i) => [X(i), Y(t.commits)]), pPts = TL.map((t, i) => [X(i), Y(t.prs)]);
        const cLine = monotonePath(cPts), pLine = monotonePath(pPts);
        let grid = '';
        for (let v = 0; v <= yMax; v += step) grid += `<line x1="${L}" x2="${R}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${L - 16}" y="${Y(v) + 6}" text-anchor="end">${fmt(v)}</text>`;
        let years = '';
        TL.forEach((t, i) => { if (t.m.endsWith('-01')) years += `<line class="yl" x1="${X(i)}" x2="${X(i)}" y1="${TOP - 10}" y2="${B + 12}"/><text class="yt" x="${X(i) + 8}" y="${B + 42}">${t.m.slice(0, 4)}</text>`; });
        const svg = h('div', { class: 'chart', html: `<svg width="1920" height="1080" viewBox="0 0 1920 1080">
          <defs><linearGradient id="gFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2a33a" stop-opacity=".5"/><stop offset="1" stop-color="#f2a33a" stop-opacity="0"/></linearGradient>
          <clipPath id="gClip"><rect class="clip" x="${L - 4}" y="0" width="0" height="1080"/></clipPath></defs>
          <g class="grid">${grid}</g><g class="years">${years}</g>
          <g clip-path="url(#gClip)">
            <path d="${cLine}L${R},${B}L${L},${B}Z" fill="url(#gFill)"/>
            <path d="${cLine}" class="cl"/><path d="${pLine}" class="pl"/>
          </g>
          <line class="ph" x1="0" x2="0" y1="${TOP - 20}" y2="${B}" opacity="0"/>
        </svg>` });

        // releases above the chart, conferences below, milestones inside
        const rels = M.releases.map((r, i) => {
          const x = xOf(r.date), row = i % 2;
          const el = h('div', { class: 'rel' + (row ? ' low' : ''), style: { left: x + 'px' } }, PX.drink(r, 44), h('span', null, r.name));
          return { x, el };
        });
        const confs = M.conferences.map((c) => {
          const x = xOf(c.date + '-15');
          return { x, el: h('div', { class: 'conf', style: { left: x + 'px' } }, h('i'), `#${c.n}`) };
        });
        const now = h('div', { class: 'now sticker', style: { left: R + 'px' } }, '지금 여기');
        const miles = M.milestones.map((m, i) => {
          const x = xOf(m.date);
          return { x, el: h('div', { class: 'mile', style: { left: x + 'px' } }, h('b', null, m.label), h('span', null, M.ym(m.date))) };
        });
        const pk = M.peak, pkI = TL.indexOf(pk);
        const peak = h('div', { class: 'peak', style: { left: X(pkI) + 'px', top: Y(pk.commits) + 'px' } }, h('i'),
          h('div', 'sticker', '가장 뜨거웠던 달 ', h('b', null, M.ym(pk.m)), ` · ${fmt(pk.commits)} 커밋`));

        const hd = head('At a glance', `한눈에 보는 <em>${M.span.label}</em>`, '<span class="lg c">■</span> 월별 커밋 &nbsp; <span class="lg p">■</span> 머지된 PR &nbsp; · 위에는 릴리스, 아래에는 오픈 컨퍼런스');
        const when = h('div', 'when', TL[0].m.replace('-', '.'));
        const cnt = { people: h('b', null, '0'), repos: h('b', null, '0'), commits: h('b', null, '0') };
        const panel = h('div', 'counters', when, h('div', 'row', h('span', null, '기여자 ', cnt.people), h('span', null, '저장소 ', cnt.repos), h('span', null, '커밋 ', cnt.commits)));
        const layer = h('div', 'marks', rels.map((r) => r.el), confs.map((c) => c.el), miles.map((m) => m.el), now, peak);
        ctx.root.append(svg, hd, panel, layer);
        showHead(ctx, hd);
        ctx.stagger([panel], { delay: 300 });
        ctx.anim(svg.querySelector('.grid'), [{ opacity: 0 }, { opacity: 1 }], { duration: 900, delay: 200 });
        ctx.anim(svg.querySelector('.years'), [{ opacity: 0 }, { opacity: 1 }], { duration: 900, delay: 400 });
        for (const x of [...rels, ...confs, ...miles]) x.el.style.opacity = 0;
        now.style.opacity = 0; peak.style.opacity = 0;

        await ctx.wait(1000);
        const clip = svg.querySelector('.clip'), ph = svg.querySelector('.ph');
        ph.setAttribute('opacity', '1');
        const shown = new Set();
        await ctx.tween(11000, (p) => {
          const x = L + p * (R - L);
          clip.setAttribute('width', x - L + 4);
          ph.setAttribute('x1', x); ph.setAttribute('x2', x);
          const t = TL[Math.min(N - 1, Math.round(p * (N - 1)))];
          when.textContent = t.m.replace('-', '.');
          cnt.people.textContent = fmt(t.cum.people); cnt.repos.textContent = fmt(t.cum.repos); cnt.commits.textContent = fmt(t.cum.commits);
          for (const it of [...rels, ...confs, ...miles]) {
            if (!shown.has(it) && it.x <= x + 2) {
              shown.add(it);
              it.el.style.opacity = '';
              ctx.anim(it.el, [{ opacity: 0, transform: 'translate(-50%, 16px) scale(.6)' }, { opacity: 1, transform: 'translate(-50%, 0)' }], { duration: 600, easing: BOUNCE, fill: 'none' });
            }
          }
        }, ease.inOut);
        ctx.anim(ph, [{ opacity: 1 }, { opacity: 0 }], { duration: 500 });
        ctx.pop(now);
        await ctx.wait(500);
        peak.style.opacity = '';
        ctx.anim(peak, [{ opacity: 0, transform: 'scale(.4)' }, { opacity: 1, transform: 'none' }], { duration: 700, easing: BOUNCE });
        burst(ctx, layer, X(pkI), Y(pk.commits), 16, 110);
        await ctx.wait(5200);
      },
    };
  }

  // ======================================================= 5. one chapter per year
  function yearScene(Y, i, M) {
    return {
      id: `year-${Y.year}`, group: 'years', chapter: 'history', cls: 's-year', accent: PALETTE[i % PALETTE.length],
      async run(ctx) {
        const strip = h('div', 'ystrip', M.years.map((y) => h('span', { class: y.year === Y.year ? 'on' : y.year < Y.year ? 'past' : '' }, y.year)));
        const big = h('div', 'ybig', String(Y.year).split('').map((d) => h('span', null, d)));
        const ttl = h('div', 'ytitle', Y.title);
        const line = h('div', { class: 'yline', html: Y.line.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]).replace(/[A-Za-z]+(?:-[A-Za-z0-9]+)+/g, '<span class="nw">$&</span>') });
        const badges = h('div', 'badges', Y.badges.map((b) => h('span', 'sticker', b)), Y.partial ? h('span', 'sticker ghost', `${M.genYM}까지`) : null);
        const rels = h('div', 'yrels', Y.releases.map((r) => h('div', { class: 'yrel', '--rc': r.accent }, PX.drink(r, 64),
          h('div', null, h('b', null, r.name), h('span', null, r.ko)), h('div', 'vd', h('b', null, r.version), r.ym))));
        const confs = h('div', 'yconfs', Y.conferences.map((c) => h('span', null, h('b', null, `#${c.n}`), c.label)));
        const left = h('div', 'yleft', big, ttl, line, badges, rels, confs);

        const stat = (k, v) => { const n = h('b', null, '0'); return { el: h('div', 'ys', n, h('span', null, k)), n, v }; };
        const stats = [stat('커밋', Y.commits), stat('머지된 PR', Y.prs), stat('새 저장소', Y.repos.length), stat('새 기여자', Y.people.length)];
        const MAXR = 8;
        const chips = Y.repos.slice(0, MAXR).map((r) => h('span', 'chip', PX.INSECT[r.name] ? PX.img(PX.INSECT[r.name], null, 28) : PX.img('chest', null, 24), r.title));
        if (Y.repos.length > MAXR) chips.push(h('span', 'chip more', `+${Y.repos.length - MAXR}`));
        const n = Y.people.length;
        const size = n <= 10 ? 104 : n <= 18 ? 84 : n <= 28 ? 70 : 62;
        const named = n <= 18;
        const faces = Y.people.map((p) => h('div', { class: 'face', style: { width: size + (named ? 26 : 10) + 'px' } }, avatar(p, size), named ? h('span', null, p.displayName) : null));
        const right = h('div', 'yright',
          h('div', 'ystats', stats.map((s) => s.el)),
          Y.repos.length ? h('div', 'ysec', h('span', 'lab', '새 저장소'), h('div', 'chips', chips)) : null,
          n ? h('div', 'ysec', h('span', 'lab', `새로 합류한 얼굴 ${n}명`), h('div', 'faces', faces)) : h('div', 'ysec', h('span', 'lab', '새로 합류한 얼굴'), h('div', 'quiet', '올해는 기존 멤버들이 함께 내렸습니다')),
        );
        const cum = h('div', 'ycum', Y.partial ? '지금까지 누적 · 기여자 ' : `${Y.year}년 말 누적 · 기여자 `, h('b', null, fmt(Y.cum.people)), '명 · 저장소 ', h('b', null, fmt(Y.cum.repos)), '개 · 커밋 ', h('b', null, fmt(Y.cum.commits)));
        ctx.root.append(strip, left, right, cum);

        ctx.anim(strip, [{ opacity: 0 }, { opacity: 1 }], { duration: 600 });
        ctx.pop(strip.querySelector('.on'), 150);
        ctx.stagger(big.children, { each: 80, duration: 900, from: { opacity: 0, transform: 'translateY(100%)' }, easing: BOUNCE });
        ctx.stagger([ttl, line, badges, rels, confs], { delay: 400, each: 140 });
        ctx.stagger(stats.map((s) => s.el), { delay: 500, each: 90 });
        stats.forEach((s) => ctx.spawn(async () => { await ctx.wait(600); await ctx.countUp(s.n, s.v, 1300); }));
        ctx.stagger(right.querySelectorAll('.lab'), { delay: 700, each: 300 });
        ctx.stagger(chips, { delay: 800, each: 60, from: { opacity: 0, transform: 'translateX(20px)' } });
        ctx.stagger(faces, { delay: 1100, each: Math.max(28, Math.min(70, 1500 / Math.max(1, n))), duration: 600, from: { opacity: 0, transform: 'scale(.3)' }, easing: BOUNCE });
        ctx.stagger([cum], { delay: 1800 });
        await ctx.wait(7200);
      },
    };
  }

  // ======================================================= 6. how it works: twelve beans, one blend
  function blend(M) {
    return {
      id: 'blend', chapter: 'projects', cls: 's-blend', accent: '#57e0b0',
      async run(ctx) {
        const B = M.blend, R = ctx.root;
        const hd = head('How it works', `${M.clouds.length}가지 원두, <em>하나의 블렌드</em>`, '어떤 클라우드든 — Cloud-Barista가 한 잔으로 내립니다');
        const sacks = M.clouds.map((c) => h('div', 'sack', PX.img('sack', { label: c.color }, 84), h('span', null, c.name)));
        const beansBox = h('div', 'beans', h('div', 'lab', '원두 = 클라우드'), h('div', 'sgrid', sacks));
        const station = (s, sprite, n) => h('div', 'station', h('div', 'step', n), h('div', 'pic', PX.img(sprite, null, 144)), h('div', 'role sticker', s.role), h('div', 'nm', s.title), h('div', 'ln', s.line));
        const grinder = station(B.grinder, 'spider', '1'), machine = station(B.machine, 'tumblebug', '2');
        grinder.classList.add('g'); machine.classList.add('m');
        const drinks = B.drinks.map((d) => h('div', 'drink', PX.img('cup', { drink: d.drink, foam: '#fbf1e2' }, 72), h('div', null, h('b', null, d.title), h('span', null, d.line))));
        const menu = h('div', 'menu', h('div', 'lab', '오늘의 메뉴'), drinks);
        const flow = h('div', 'flow');
        R.append(hd, flow, beansBox, grinder, machine, menu);
        showHead(ctx, hd);
        ctx.stagger(sacks, { delay: 300, each: 70, from: { opacity: 0, transform: 'translateY(-40px)' }, easing: BOUNCE });
        ctx.stagger([grinder], { delay: 1300, duration: 800, from: { opacity: 0, transform: 'scale(.8)' }, easing: BOUNCE });
        ctx.stagger([machine], { delay: 1900, duration: 800, from: { opacity: 0, transform: 'scale(.8)' }, easing: BOUNCE });
        ctx.stagger(menu.children, { delay: 2500, each: 160, from: { opacity: 0, transform: 'translateX(40px)' } });
        await ctx.wait(2700);

        // beans travel: sack -> grinder -> machine -> a drink, on repeat
        const pos = (el) => { const r = el.getBoundingClientRect(), s = R.getBoundingClientRect(), k = s.width / 1920; return [(r.left - s.left + r.width / 2) / k, (r.top - s.top + r.height / 2) / k]; };
        const gC = pos(grinder.querySelector('img')), mC = pos(machine.querySelector('img'));
        const sackC = sacks.map((s) => pos(s.querySelector('img')));
        const drinkC = drinks.map((d) => pos(d.querySelector('img')));
        const route = (pts, delay, dur) => {
          const b = PX.img('bean', null, 30, 'tbean');
          b.style.left = pts[0][0] + 'px'; b.style.top = pts[0][1] + 'px';
          flow.append(b);
          const kf = pts.map((p, i) => ({ transform: `translate(${p[0] - pts[0][0] - 15}px, ${p[1] - pts[0][1] - 15}px) rotate(${i * 90}deg)`, opacity: i === 0 || i === pts.length - 1 ? 0 : 1, offset: i / (pts.length - 1) }));
          ctx.anim(b, kf, { duration: dur, delay, iterations: Infinity, easing: 'linear', fill: 'none' });
        };
        for (let k = 0; k < 18; k++) {
          const s = sackC[k % sackC.length], d = drinkC[k % drinkC.length];
          route([s, [s[0] + 40, s[1]], gC, mC, d], k * 380, 5600);
        }
        ctx.anim(grinder.querySelector('img'), [{ transform: 'rotate(-6deg)' }, { transform: 'rotate(6deg)' }], { duration: 300, iterations: Infinity, direction: 'alternate', easing: 'steps(2, end)', fill: 'none' });
        ctx.anim(machine.querySelector('img'), [{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }], { duration: 500, iterations: Infinity, direction: 'alternate', easing: 'steps(3, end)', fill: 'none' });
        await ctx.wait(13000);
      },
    };
  }

  // ======================================================= 7. bug dex
  function bugs(M) {
    return {
      id: 'bugs', chapter: 'projects', cls: 's-bugs', accent: '#ff7a9a',
      async run(ctx) {
        const list = M.bugs, others = M.totals.repos - list.length;
        const hd = head('Bug Dex · 버그 도감', `우리 코드엔 <em>버그가 ${list.length}마리</em> 있습니다`, '걱정 마세요, 전부 의도된 버그입니다 — 곤충 이름을 가진 프로젝트들');
        const cards = list.map((b, i) => h('div', { class: 'bug' + (b.archived ? ' sleep' : ''), '--c': PALETTE[i % PALETTE.length] },
          h('div', 'no', `No.${String(i + 1).padStart(3, '0')}`),
          h('div', 'pic', PX.img(b.sprite, null, 112)),
          h('div', 'nm', b.title), h('div', 'ko', b.ko), h('div', 'ln', b.line),
          h('div', 'ft', h('span', null, `since ${b.year}`), h('span', null, `${fmt(b.commits)} 커밋`)),
          b.archived ? h('div', 'zz', '휴면 중 zZ') : null));
        const grid = h('div', 'dex', cards);
        const tail = h('div', 'tail sticker', `+ 곤충이 아닌 저장소 ${others}개도 함께 자라고 있어요`);
        tail.style.opacity = 0;
        ctx.root.append(hd, grid, tail);
        showHead(ctx, hd);
        const end = ctx.stagger(cards, { delay: 400, each: 120, duration: 700, from: { opacity: 0, transform: 'perspective(800px) rotateY(80deg) scale(.9)' } });
        await ctx.wait(end);
        ctx.pop(tail);
        // a scanner light runs over the dex, one bug at a time
        for (const c of cards) {
          c.classList.add('scan');
          ctx.anim(c.querySelector('.pic img'), [{ transform: 'translateY(0)' }, { transform: 'translateY(-14px)' }, { transform: 'translateY(0)' }], { duration: 500, easing: 'steps(4, end)', fill: 'none' });
          await ctx.wait(560);
          c.classList.remove('scan');
        }
        await ctx.wait(3000);
      },
    };
  }

  // ======================================================= 8. the menu: every release
  function menu(M) {
    return {
      id: 'menu', chapter: 'projects', cls: 's-menu', accent: '#e2bf94',
      async run(ctx) {
        const coffee = M.releases.filter((r) => r.kind !== 'tea'), tea = M.releases.filter((r) => r.kind === 'tea');
        const span = (rs) => (rs.length ? `${rs[0].year} — ${rs[rs.length - 1].year}` : '');
        const items = [];
        const item = (r) => {
          const el = h('div', { class: 'item' + (r === M.latest ? ' latest' : ''), '--rc': r.accent }, PX.drink(r, 56),
            h('b', 'nm', r.name), h('span', 'ko', r.ko), h('span', 'dots'), h('span', 'v', r.version), h('span', 'dt', r.ym),
            r === M.latest ? h('span', 'new sticker', 'NEW') : null);
          items.push(el);
          return el;
        };
        const mystery = h('div', 'item mystery', h('div', 'q', PX.img('potion', { drink: '#5a5048' }, 56), h('i', null, '?')),
          h('b', 'nm', '다음 메뉴'), h('span', 'ko', '곧 공개'), h('span', 'dots'), h('span', 'v', 'v0.' + (M.releases.length + 1)), h('span', 'dt', '????.??'));
        const col = (label, rs, extra) => h('div', 'col', h('h3', null, label, h('span', null, span(rs))), rs.map(item), extra);
        const hd = head('The menu', `오늘의 메뉴 — 정식 릴리스 <em>${M.releases.length}잔</em>`, `${M.releases[0].name}에서 ${M.latest.name}까지 · ${tea.length ? tea[0].year + '년부터는 커피 대신 차를 내립니다' : ''}`);
        const board = h('div', 'board', col('COFFEE', coffee), col('TEA', tea, mystery));
        ctx.root.append(hd, board);
        showHead(ctx, hd);
        ctx.anim(board, [{ opacity: 0, transform: 'translateY(40px)' }, { opacity: 1, transform: 'none' }], { duration: 900, delay: 300 });
        const end = ctx.stagger([...items, mystery], { delay: 700, each: 190, from: { opacity: 0, transform: 'translateX(-30px)' } });
        await ctx.wait(end);
        const latest = board.querySelector('.latest');
        if (latest) {
          ctx.anim(latest, [{ transform: 'scale(1)' }, { transform: 'scale(1.04)' }, { transform: 'scale(1)' }], { duration: 1200, iterations: 3, easing: 'ease-in-out', fill: 'none' });
          const r = latest.getBoundingClientRect(), s = ctx.root.getBoundingClientRect(), k = s.width / 1920;
          burst(ctx, ctx.root, (r.left - s.left + 40) / k, (r.top - s.top + r.height / 2) / k, 18, 120);
        }
        ctx.anim(mystery.querySelector('i'), [{ transform: 'translateY(0) rotate(-8deg)' }, { transform: 'translateY(-10px) rotate(8deg)' }], { duration: 500, iterations: Infinity, direction: 'alternate', easing: 'steps(3, end)', fill: 'none' });
        await ctx.wait(8000);
      },
    };
  }

  // ======================================================= 9. dev life: when we commit
  function devlife(M) {
    const P = M.punch;
    return {
      id: 'devlife', chapter: 'devlife', cls: 's-devlife', accent: '#c9a8ff',
      async run(ctx) {
        const days = [1, 2, 3, 4, 5, 6, 0], dayK = ['일', '월', '화', '수', '목', '금', '토'];
        const ROAST = ['#2b1b11', '#4a2c17', '#7a4521', '#b5652a', '#f2a33a', '#ffd966'];
        const lvl = (v) => (v <= 0 ? 0 : Math.min(5, 1 + Math.floor((v / P.max) * 5)));
        const hd = head('Dev life', '우리가 <em>커밋한 시간들</em>', `GitHub punch card · 커밋을 남긴 현지 시각 기준 · 사람이 남긴 커밋 ${fmt(P.total)}개`);
        const hoursRow = h('div', 'hrs', [...Array(24)].map((_, hh) => h('span', null, hh % 3 === 0 ? String(hh) : '')));
        const rows = days.map((d) => h('div', 'prow', h('span', 'dk', dayK[d]), P.grid[d].map((v) => h('i', { class: 'l' + lvl(v), style: { background: ROAST[lvl(v)] } }))));
        const hmax = Math.max(...P.hours);
        const bars = P.hours.map((v, hh) => {
          const pk = hh === P.peakHour, dip = hh === 12 && P.lunchDip;
          return h('div', { class: 'bar' + (pk ? ' pk' : '') + (dip ? ' dip' : ''), 'data-l': pk || dip ? `${hh}시` : null, style: { height: Math.max(4, (v / hmax) * 150) + 'px' } });
        });
        const hist = h('div', 'hist', bars);
        const legend = h('div', 'legend', '적음', ROAST.slice(1).map((c) => h('i', { style: { background: c } })), '많음 — 진하게 볶을수록 많이 커밋');
        const left = h('div', 'pleft', hoursRow, rows, hist, legend);

        const pct = (v) => Math.round((v / P.total) * 100);
        const hourLabel = (hh) => (hh === 0 ? '자정' : hh < 12 ? `오전 ${hh}시` : hh === 12 ? '낮 12시' : `오후 ${hh - 12}시`);
        const peakQuip = P.peakHour >= 16 && P.peakHour <= 19 ? '퇴근 전 마지막 푸시' : P.peakHour >= 9 && P.peakHour <= 11 ? '출근하자마자 커밋' : P.peakHour >= 20 ? '저녁 먹고 한 번 더' : '언제나 커밋 중';
        const facts = [
          { big: hourLabel(P.peakHour), k: '커밋이 가장 많은 시간', q: peakQuip, c: '#f2a33a' },
          P.lunchDip ? { big: '낮 12시 ↓', k: '점심시간엔 커밋도 쉽니다', q: '밥은 먹고 합시다', c: '#57e0b0' } : null,
          { big: `${pct(P.night)}%`, k: `자정 ~ 새벽 6시 커밋 ${fmt(P.night)}개`, q: '새벽 커밋, 그 마음 압니다', c: '#79c7ff' },
          { big: `${pct(P.weekend)}%`, k: `주말 커밋 ${fmt(P.weekend)}개`, q: '주말에도 고생 많으셨습니다', c: '#ff7a9a' },
        ].filter(Boolean);
        const factEls = facts.map((f) => h('div', { class: 'pfact', '--c': f.c }, h('div', 'big', f.big), h('div', null, h('div', 'k', f.k), h('div', 'q', f.q))));
        const right = h('div', 'pright', factEls);
        ctx.root.append(hd, left, right);
        showHead(ctx, hd);
        ctx.anim(hoursRow, [{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: 300 });
        ctx.stagger(left.querySelectorAll('.dk'), { delay: 300, each: 50 });
        // cells light up hour by hour, like a sunrise over the week
        const cells = rows.map((r) => [...r.querySelectorAll('i')]);
        for (let hh = 0; hh < 24; hh++) {
          cells.forEach((rc, d) => ctx.anim(rc[hh], [{ opacity: 0, transform: 'scale(.2)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: 500 + hh * 70 + d * 20, easing: BOUNCE, fill: 'backwards' }));
          ctx.anim(bars[hh], [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: 600, delay: 900 + hh * 70, fill: 'backwards' });
        }
        ctx.anim(legend, [{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: 2600 });
        ctx.stagger(factEls, { delay: 2400, each: 650, duration: 800, from: { opacity: 0, transform: 'translateX(60px)' } });
        await ctx.wait(4600);
        const pk = bars[P.peakHour];
        ctx.anim(pk, [{ filter: 'brightness(1)' }, { filter: 'brightness(1.6)' }], { duration: 500, iterations: 6, direction: 'alternate', fill: 'none' });
        await ctx.wait(10500);
      },
    };
  }

  // ======================================================= 10. head baristas
  let heroCursor = 0;
  function heroes(M) {
    return {
      id: 'heroes', chapter: 'people', cls: 's-heroes', accent: '#ffd966',
      async run(ctx) {
        const HS = M.heroes, n = HS.length;
        const R = ctx.root;
        // --- overview: everyone at once ---
        const hd = head('Head Baristas', 'Cloud-Barista를 내려 온 <em>바리스타들</em>', `핵심 기여자 ${n}명 — 고맙습니다`);
        const half = Math.ceil(n / 2);
        const mk = (p) => h('div', 'hcard', avatar(p, 120), h('b', null, p.displayName), h('span', null, '@' + p.login));
        const grid = h('div', 'hgrid', h('div', 'hrow', HS.slice(0, half).map(mk)), h('div', 'hrow', HS.slice(half).map(mk)));
        R.append(hd, grid);
        showHead(ctx, hd);
        const cards = [...grid.querySelectorAll('.hcard')];
        ctx.stagger(cards, { delay: 400, each: 70, duration: 700, from: { opacity: 0, transform: 'translateY(40px) scale(.8)' }, easing: BOUNCE });
        await ctx.wait(5200);
        ctx.anim(grid, [{ opacity: 1 }, { opacity: 0, transform: 'scale(.96)' }], { duration: 500, fill: 'forwards' });
        ctx.anim(hd, [{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: 'forwards' });
        await ctx.wait(500);
        grid.remove(); hd.remove();

        // --- spotlight: one by one ---
        const mini = h('div', 'hmini', HS.map((p) => h('div', 'mi', avatar(p, 92), h('span', null, p.displayName))));
        const minis = [...mini.children];
        const spot = h('div', 'hspot');
        const tag = h('div', 'htag', h('span', 'sticker', 'Head Baristas'), h('span', 'cnt'));
        R.append(tag, spot, mini);
        ctx.stagger([tag], {});
        ctx.stagger(minis, { delay: 100, each: 30, from: { opacity: 0, transform: 'scale(.5)' } });
        await ctx.wait(500);
        for (let k = 0; k < n; k++) {
          const i = (heroCursor + k) % n, p = HS[i];
          tag.querySelector('.cnt').textContent = `${String(i + 1).padStart(2, '0')} / ${n}`;
          minis.forEach((m, j) => m.classList.toggle('on', j === i));
          minis[i].classList.add('seen');
          const name = h('div', 'nm', p.displayName);
          const card = h('div', 'card',
            h('div', 'portrait', avatar(p, 340)),
            h('div', 'info',
              name,
              h('div', 'login', '@' + p.login),
              p.role ? h('div', 'role', p.role) : null,
              h('div', 'since', h('span', null, 'since'), h('b', null, M.ym(p.first))),
              h('div', 'era', p.era ? PX.drink(p.era, 44) : PX.img('potion', { drink: '#5a5048' }, 44), h('span', null, p.eraLabel)),
              p.topRepos.length ? h('div', 'repos', h('span', 'lab', '주로 함께한 프로젝트'), h('div', 'chips', p.topRepos.map((r) => h('span', 'chip', PX.INSECT[r.name] ? PX.img(PX.INSECT[r.name], null, 28) : PX.img('chest', null, 24), r.title)))) : null));
          const thx = h('div', 'thx', PX.img('heart', null, 34), h('span', null, `고맙습니다, ${p.displayName} 님!`));
          spot.replaceChildren(card, thx);
          fit(name, 760, 56);
          ctx.anim(card.querySelector('.portrait'), [{ opacity: 0, transform: 'translateX(-60px) rotate(-6deg)' }, { opacity: 1, transform: 'rotate(-2deg)' }], { duration: 700, easing: BOUNCE });
          ctx.stagger(card.querySelector('.info').children, { delay: 120, each: 70, duration: 600, from: { opacity: 0, transform: 'translateX(40px)' } });
          ctx.anim(thx, [{ opacity: 0, transform: 'translateY(20px) rotate(-2deg)' }, { opacity: 1, transform: 'rotate(-2deg)' }], { duration: 600, delay: 700, easing: BOUNCE });
          burst(ctx, R, 470, 250, 14, 160);
          await ctx.wait(2700);
        }
        heroCursor = (heroCursor + 1) % Math.max(1, n);
        await ctx.wait(400);
      },
    };
  }

  // ======================================================= 11. everyone, as one mug
  let wallOrder = null, wallCursor = 0;
  function wall(M) {
    return {
      id: 'wall', chapter: 'people', cls: 's-wall', accent: '#f2a33a',
      async run(ctx) {
        const P = M.people, n = P.length, R = ctx.root;
        // the mug: body of COLS x ROWS seats, a ceramic rim around it, a handle on the right
        const ROWS = 10, COLS = Math.ceil((n + 4) / ROWS);
        const cell = Math.min(60, Math.floor(1060 / (COLS + 4)), Math.floor(720 / (ROWS + 2)));
        const ox = 1880 - (COLS + 4) * cell, oy = 960 - (ROWS + 2) * cell;
        const mug = h('div', 'mosaic');
        const block = (cx, cy, cls) => { const b = h('div', { class: 'blk ' + cls, style: { left: ox + cx * cell + 'px', top: oy + cy * cell + 'px', width: cell + 'px', height: cell + 'px' } }); mug.append(b); return b; };
        for (let y = 0; y < ROWS + 2; y++) for (let x = 0; x < COLS + 2; x++) {
          const edge = x === 0 || y === 0 || x === COLS + 1 || y === ROWS + 1;
          if (!edge) continue;
          if ((x === 0 || x === COLS + 1) && y === ROWS + 1) continue; // rounded bottom corners
          block(x, y, y === 0 ? 'rim' : x === COLS + 1 || y === ROWS + 1 ? 'shade' : 'ceramic');
        }
        for (const [x, y] of [[COLS + 2, 2], [COLS + 3, 2], [COLS + 3, 3], [COLS + 3, 4], [COLS + 3, 5], [COLS + 3, 6], [COLS + 2, 6]]) block(x, y, 'ceramic');
        const seats = [];
        for (let k = 0; k < COLS * ROWS; k++) {
          const x = 1 + (k % COLS), y = ROWS - Math.floor(k / COLS); // fill from the bottom up, like pouring
          const s = block(x, y, 'seat');
          seats.push({ el: s, x, y });
        }
        const pad = Math.round(cell * 0.06);
        const avs = P.map((p, i) => {
          const a = avatar(p, cell - pad * 2, 'm');
          a.style.left = ox + seats[i].x * cell + pad + 'px';
          a.style.top = oy + seats[i].y * cell + pad + 'px';
          a.style.opacity = 0;
          mug.append(a);
          return a;
        });

        const hd = head('Thank you', '함께 <em>만든</em> 사람들', `${n}명 · 처음 기여한 순서대로, 바닥부터 채웁니다`);
        const yr = h('div', 'yr', P[0] ? P[0].first.slice(0, 4) : '');
        const cnt = h('div', 'cnt', h('b', null, '0'), '명');
        const counter = h('div', 'wcount', yr, cnt);
        const msg = h('div', 'wmsg');
        const spot = h('div', 'wspot');
        R.append(mug, hd, counter, msg, spot);
        showHead(ctx, hd);
        ctx.stagger(mug.querySelectorAll('.blk:not(.seat)'), { each: 6, duration: 400, from: { opacity: 0, transform: 'scale(.4)' } });
        ctx.stagger(seats.map((s) => s.el), { delay: 200, each: 3, duration: 300, from: { opacity: 0 } });
        ctx.stagger([counter], { delay: 400 });
        await ctx.wait(900);

        let shown = 0;
        await ctx.tween(Math.min(8000, 60 * n), (p) => {
          const k = Math.min(n, Math.ceil(p * n));
          for (; shown < k; shown++) {
            const a = avs[shown];
            a.style.opacity = '';
            ctx.anim(a, [{ opacity: 0, transform: 'translateY(-60px) scale(.5)' }, { opacity: 1, transform: 'none' }], { duration: 500, easing: BOUNCE, fill: 'backwards' });
            yr.textContent = P[shown].first.slice(0, 4);
            cnt.firstChild.textContent = shown + 1;
          }
        }, ease.linear);
        // the empty seats left on top are for whoever comes next
        seats.slice(n).forEach((s, i) => { s.el.classList.add('free'); ctx.pop(s.el, i * 120); });
        steam(ctx, mug, { x: ox + cell * 2, y: oy - 130, w: (COLS - 2) * cell, n: 7, size: Math.round(cell * 0.4), rise: 100 });
        msg.append(h('div', 'big', '고맙습니다!'), h('div', 'line', `이 한 잔은 ${n}명이 함께 내렸습니다.`), h('div', 'line dim', h('span', 'plus', '+'), ' 빈 자리는 다음 바리스타의 자리예요'));
        ctx.stagger(msg.children, { each: 200, duration: 800 });
        await ctx.wait(2600);

        // spotlight a few people each loop, carrying on where the last loop stopped
        if (!wallOrder || wallOrder.length !== n) {
          wallOrder = [...Array(n).keys()];
          for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [wallOrder[i], wallOrder[j]] = [wallOrder[j], wallOrder[i]]; }
        }
        ctx.anim(msg, [{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: 'forwards' });
        mug.classList.add('focus');
        for (let k = 0; k < 6; k++) {
          const i = wallOrder[wallCursor++ % n], p = P[i], a = avs[i];
          a.classList.add('hot');
          spot.replaceChildren(h('div', 'sc', avatar(p, 128), h('div', null,
            h('div', 'nm', p.displayName), h('div', 'lg', '@' + p.login),
            h('div', 'mt', `${M.ym(p.first)} 첫 기여 · ${p.order}번째 바리스타`),
            h('div', 'er', p.era ? PX.drink(p.era, 34) : PX.img('potion', { drink: '#5a5048' }, 34), p.eraLabel))));
          ctx.anim(spot.firstChild, [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'none' }], { duration: 450 });
          await ctx.wait(1900);
          a.classList.remove('hot');
        }
        mug.classList.remove('focus');
        await ctx.wait(600);
      },
    };
  }

  // ======================================================= 12. join us
  function join(M) {
    return {
      id: 'join', chapter: 'join', cls: 's-join', accent: '#57e0b0',
      async run(ctx) {
        const next = M.totals.people + 1;
        const hd = head('Join us', '다음 커밋의 주인공은 <em>당신</em>입니다', 'Cloud-Barista는 누구에게나 열려 있습니다 · Apache-2.0');
        const body = h('div', 'tbody');
        const term = h('div', 'term', h('div', 'tbar', h('i'), h('i'), h('i'), h('span', null, 'you@open-conference — zsh')), body);
        const q = M.qr, nq = q.rows.length;
        let rects = '';
        q.rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] === '1') rects += `<rect x="${x + 2}" y="${y + 2}" width="1.02" height="1.02"/>`; });
        const qr = h('div', 'qr', h('div', { class: 'code', html: `<svg viewBox="0 0 ${nq + 4} ${nq + 4}" shape-rendering="crispEdges"><rect width="${nq + 4}" height="${nq + 4}" fill="#f7eee2"/><g fill="#150d08">${rects}</g></svg>` }),
          h('div', 'url', q.url.replace(/^https?:\/\//, '')), h('div', 'url2', 'cloud-barista.github.io'), h('span', 'scan sticker', 'SCAN ME'));
        ctx.root.append(hd, term, qr);
        showHead(ctx, hd);
        ctx.anim(term, [{ opacity: 0, transform: 'translateY(30px)' }, { opacity: 1, transform: 'none' }], { duration: 800, delay: 300 });
        ctx.anim(qr, [{ opacity: 0, transform: 'rotate(8deg) scale(.7)' }, { opacity: 1, transform: 'rotate(2deg)' }], { duration: 900, delay: 700, easing: BOUNCE });
        await ctx.wait(1000);
        const prompt = () => h('span', 'pr', h('b', null, 'you'), ' ', h('i', null, '~'), ' $ ');
        const cmds = ['git clone https://github.com/cloud-barista/cb-tumblebug', 'git checkout -b my-first-brew', 'git commit -m "Hello, Cloud-Barista!"', 'gh pr create --fill'];
        for (const c of cmds) {
          const l = h('div', 'ln'), t = h('span', 'cmd'), cur = h('span', 'cursor');
          l.append(prompt(), t, cur);
          body.append(l);
          await ctx.wait(250);
          await type(ctx, t, c, 38);
          cur.remove();
          await ctx.wait(200);
        }
        const ok = h('div', 'ln out ok');
        ok.append(PX.img('mug', null, 40, 'inl'), h('span', null, ' Pull request opened — '), h('b', null, `${next}번째 바리스타`), h('span', null, '를 기다립니다'));
        body.append(ok);
        ctx.anim(ok, [{ opacity: 0, background: 'rgba(87,224,176,.4)' }, { opacity: 1, background: 'rgba(87,224,176,0)' }], { duration: 1200 });
        await ctx.wait(4800);
      },
    };
  }

  // ======================================================= 13. outro
  function outro(M, cfg) {
    return {
      id: 'outro', chapter: 'join', chrome: false, cls: 's-outro', accent: '#f2a33a',
      async run(ctx) {
        const ev = cfg.event, T = M.totals, R = ctx.root;
        const a = PX.img('mug', null, 240, 'ma'), b = PX.img('cup', { drink: M.latest.drink, foam: M.latest.foam || '#fbf1e2' }, 240, 'mb');
        const cheers = h('div', 'cheers', a, b);
        const start = ev.startTime ? new Date(ev.startTime) : null;
        const hasCount = start && !isNaN(start) && start > new Date();
        const count = hasCount ? h('div', 'count', '--:--') : null;
        const big = h('div', 'big', hasCount ? '오프닝까지' : '잠시 후 행사가 시작됩니다');
        const name = h('div', 'evt', ev.title || 'Cloud-Barista Open Conference');
        const meta = [ev.date, ev.time, ev.venue].filter(Boolean);
        const metaEl = meta.length ? h('div', 'meta', meta.flatMap((x, i) => (i ? [h('i'), x] : [x]))) : null;
        const thanks = h('div', 'thanks', h('b', null, T.people), '명의 기여자 · ', h('b', null, fmt(T.commits)), '개의 커밋 · ', h('b', null, M.releases.length), '잔의 릴리스 — 함께해 주셔서 고맙습니다');
        R.append(...[cheers, big, count, name, metaEl, thanks].filter(Boolean));
        ctx.anim(a, [{ transform: 'translateX(-420px) scaleX(-1) rotate(20deg)', opacity: 0 }, { transform: 'translateX(0) scaleX(-1) rotate(-12deg)', opacity: 1 }], { duration: 900, easing: BOUNCE });
        ctx.anim(b, [{ transform: 'translateX(420px) rotate(20deg)', opacity: 0 }, { transform: 'translateX(0) rotate(-12deg)', opacity: 1 }], { duration: 900, easing: BOUNCE });
        ctx.stagger([big, count, name, metaEl, thanks].filter(Boolean), { delay: 700, each: 160, duration: 900 });
        await ctx.wait(800);
        burst(ctx, R, 960, 300, 26, 260);
        steam(ctx, cheers, { x: 150, y: -150, w: 260, n: 6, size: 22, rise: 130 });
        const tick = () => {
          if (!count) return;
          const ms = start - new Date();
          if (ms <= 0) { count.textContent = 'NOW'; return; }
          const s = Math.floor(ms / 1000), hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
          count.textContent = (hh ? hh + ':' : '') + String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
        };
        ctx.every(250, tick);
        await ctx.wait(4000);
        burst(ctx, R, 960, 300, 20, 220);
        await ctx.wait(8000);
      },
    };
  }

  // ======================================================= playlist
  function build(M, cfg) {
    const out = [];
    for (const s of cfg.scenes || []) {
      if (s === 'boot') out.push(boot(M));
      else if (s === 'title') out.push(title(M, cfg));
      else if (s === 'numbers') out.push(numbers(M));
      else if (s === 'glance' && M.timeline.length > 2) out.push(glance(M));
      else if (s === 'years') M.years.forEach((y, i) => out.push(yearScene(y, i, M)));
      else if (s === 'blend' && M.clouds.length) out.push(blend(M));
      else if (s === 'bugs' && M.bugs.length) out.push(bugs(M));
      else if (s === 'menu' && M.releases.length) out.push(menu(M));
      else if (s === 'devlife' && M.punch) out.push(devlife(M));
      else if (s === 'heroes' && M.heroes.length) out.push(heroes(M));
      else if (s === 'wall') out.push(wall(M));
      else if (s === 'join') out.push(join(M));
      else if (s === 'outro') out.push(outro(M, cfg));
    }
    const used = new Set(out.map((p) => p.chapter));
    return { playlist: out, chapters: CHAPTERS.filter((c) => used.has(c.id)) };
  }

  window.ShowScenes = { build };
})();
