// The storyline: one object per scene with a fixed duration. Each scene owns the camera,
// the world state and the overlay while it runs. All numbers come from data/data.js.
(function () {
  'use strict';
  const D = window.CB_DATA, CFG = window.CB_CONFIG;
  const { h, t, esc, fmt, layer } = UI;
  const V3 = THREE.Vector3;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const ease = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const lerp = (a, b, f) => a + (b - a) * f;
  const seg = (x, a, b) => clamp((x - a) / (b - a), 0, 1);
  const pop = (x) => { x = clamp(x, 0, 1); return x < 0.7 ? (x / 0.7) * 1.15 : 1.15 - 0.15 * (x - 0.7) / 0.3; };

  // ---------- derived data ----------
  const { monthOf } = Village;
  const cum = {};
  for (const k of ['commits', 'prs', 'people', 'repos', 'releases']) { let a = 0; cum[k] = D.timeline[k].map(v => (a += v)); }
  function cumAt(k, m) {
    if (m < 0) return 0;
    const arr = cum[k], i = Math.floor(m);
    if (i >= arr.length - 1 && m >= NOW_M - 1e-3) return arr[arr.length - 1];
    if (i >= arr.length) return arr[arr.length - 1];
    const prev = i > 0 ? arr[i - 1] : 0;
    // the current month is partial: stretch it so the counters land on today's totals
    const f = i === arr.length - 1 ? (m - i) / Math.max(1e-3, NOW_M - i) : m - i;
    return prev + (arr[i] - prev) * Math.min(1, f);
  }
  const NOW_M = Math.min(D.months.length - 0.02, monthOf(D.generatedAt.slice(0, 10)));
  const BREW = {
    americano: ['Americano', '아메리카노'], cappuccino: ['Cappuccino', '카푸치노'], espresso: ['Espresso', '에스프레소'],
    mocha: ['Café Mocha', '카페 모카'], affogato: ['Affogato', '아포가토'], latte: ['Cafe Latte', '카페 라떼'], cortado: ['Cortado', '코르타도'],
    chamomile: ['Chamomile', '캐모마일'], cinnamon: ['Cinnamon', '시나몬'], darjeeling: ['Darjeeling', '다즐링'],
    'earl grey': ['Earl Grey', '얼그레이'], ginger: ['Ginger', '진저'], hibiscus: ['Hibiscus', '히비스커스'],
  };
  const coffee = D.coffee.map(c => {
    const k = PX.brewKey(c.name + ' ' + c.tag);
    const ver = (c.tag.match(/v\d+\.\d+\.\d+/) || [c.tag])[0];
    return { ...c, key: k, en: BREW[k] ? BREW[k][0] : c.name, ko: BREW[k] ? BREW[k][1] : '', ver, m: monthOf(c.date), icon: PX.brewIcon(c.name + ' ' + c.tag), tea: ['chamomile', 'cinnamon', 'darjeeling', 'earl grey', 'ginger', 'hibiscus'].includes(k) };
  });
  const latest = coffee[coffee.length - 1];
  const T = D.totals;
  const ymd = (s) => s.replace(/-/g, '.');
  const ym = (s) => { const [y, m] = s.split('-'); return `${y}년 ${+m}월`; };
  const since = D.org.created.slice(0, 4);
  const span = (() => {
    const [y0, m0] = D.org.created.split('-').map(Number), [y1, m1] = D.generatedAt.slice(0, 7).split('-').map(Number);
    const mm = (y1 - y0) * 12 + (m1 - m0);
    return `${Math.floor(mm / 12)}년 ${mm % 12}개월`;
  })();
  const heroCfg = new Map((CFG.heroes || []).map(x => [x.login, x]));
  const personOf = new Map(D.people.map(p => [p.login, p]));
  const displayName = (p) => (heroCfg.get(p.login) && heroCfg.get(p.login).name) || p.name || p.login;
  const avatar = (login) => (window.CB_AVATARS || {})[login] || PX.icon('nametag');
  const yearNotes = (() => {
    const out = {};
    for (let y = +since; y <= +D.generatedAt.slice(0, 4); y++) {
      const parts = [];
      if (y === +since) parts.push('첫 커밋');
      const made = D.repos.filter(r => r.created.startsWith(String(y))).map(r => r.name);
      if (made.some(n => n.startsWith('cm-')) && !D.repos.some(r => r.name.startsWith('cm-') && +r.created.slice(0, 4) < y)) parts.push('Cloud-Migrator 시작');
      if (made.some(n => n.startsWith('ai-')) && !D.repos.some(r => r.name.startsWith('ai-') && +r.created.slice(0, 4) < y)) parts.push('AI-MCMP 시작');
      const rel = coffee.filter(c => c.date.startsWith(String(y))).map(c => c.en);
      out[y] = parts.concat(rel).join(' · ');
    }
    return out;
  })();
  const HOTBAR = ['spider', 'tumblebug', 'ladybug', 'dragonfly', 'beetle', 'honeybee', 'butterfly', 'flowerpot', 'cup'].map(k => PX.icon(k, k === 'cup' ? { W: '#e0b030', w: '#f8d64a' } : undefined));
  const FW = ['#ff5555', '#ffaa00', '#ffff55', '#55ff55', '#55ffff', '#5555ff', '#ff55ff', '#ffffff'];

  function firework(world, x, y, z, color) {
    const c = color || FW[Math.floor(Math.random() * FW.length)];
    world.particles.burst(x, y, z, c, 110, 11, 0.45, 1.8);
    world.particles.burst(x, y, z, '#ffffff', 25, 5, 0.3, 0.9);
  }
  function orbit(cam, cx, cy, cz, r, hgt, a, tx, ty, tz) {
    cam.position.set(cx + Math.sin(a) * r, hgt, cz + Math.cos(a) * r);
    cam.lookAt(tx === undefined ? cx : tx, ty === undefined ? cy : ty, tz === undefined ? cz : tz);
  }

  // ======================================================================
  function scenes(ctx) {
    const { world, town } = ctx;
    const cam = world.camera;
    const labels = new UI.Labels();
    ctx.labels = labels;

    function finalWorld() {
      town.setBuilt(Infinity);
      town.setIslands(1);
      town.setThreads(() => 1);
      town.vms.forEach(v => { v.visible = true; v.scale.setScalar(1); });
      town.pedestals.visible = false;
    }
    function hideIslands() {
      town.setIslands(0);
      town.setThreads(() => 0);
      town.vms.forEach(v => { v.visible = false; });
    }

    // ---------------------------------------------------------------- 1. title
    const title = {
      id: 'title', dur: 16,
      enter() {
        finalWorld();
        world.setDayTime(0.12);
        world.fov = 70;
        const s = layer.screen;
        const lg = UI.logo('CLOUD-BARISTA', 18);
        lg.className = 'logo';
        s.appendChild(lg);
        h('div', 'edition t', 'MULTI-CLOUD EDITION', s);
        this.splash = h('div', 'splash t', '', s);
        this.splashes = [`${since}년부터!`, `기여자 ${fmt(T.people)}명!`, `커밋 ${fmt(T.commits)}개!`, `${T.clouds}개의 클라우드!`, `머지된 PR ${fmt(T.mergedPrs)}개!`,
          `${latest.en} 출시!`, '오픈소스는 함께!', '커피 한 잔 하실래요?', `저장소 ${T.repos}개!`, '멀티클라우드!', 'Apache-2.0!'];
        const menu = h('div', 'menu', '', s);
        const btn = (txt) => { const b = h('div', 'btn t', `<span>${esc(txt)}</span>`, menu); b.style.backgroundImage = `url(${PX.tileURL('stone', 4)})`; return b; };
        btn('싱글클라우드');
        this.target = btn('멀티클라우드');
        btn(CFG.event.title || 'Cloud-Barista 컨퍼런스');
        const row = h('div', 'btn-row', '', menu);
        [['설정...'], ['커뮤니티']].forEach(([x]) => { const b = h('div', 'btn t', `<span>${x}</span>`, row); b.style.backgroundImage = `url(${PX.tileURL('stone', 4)})`; });
        h('div', 'corner bl t', `Cloud-Barista ${latest.ver} (${latest.en})`, s);
        h('div', 'corner br t', 'Copyright Cloud-Barista Community. 마음껏 배포하세요! (Apache-2.0)', s);
        this.cursor = UI.cursor();
        this.cursor.style.opacity = 0;
        this.disabled = menu.firstChild; this.disabled.style.opacity = 0.55;
      },
      update(tt) {
        orbit(cam, 0, 0, 0, 104, 54, 0.9 + tt * 0.03, 0, 30, 0);
        town.setPeopleIdle(tt);
        town.spider.animate(tt, 0.3);
        const k = Math.floor(tt / 3) % this.splashes.length;
        if (this.splash.textContent !== this.splashes[k]) this.splash.textContent = this.splashes[k];
        const sc = 1.0 + Math.abs(Math.sin(tt * Math.PI * 1.6)) * 0.08;
        this.splash.style.transform = `translate(-50%, -50%) rotate(-17deg) scale(${sc})`;
        // cursor drifts in, hovers "멀티클라우드" and clicks it
        const r = this.target.getBoundingClientRect();
        const tg = UI.toStage((r.left + r.width * 0.62) / window.innerWidth, (r.top + r.height * 0.55) / window.innerHeight);
        const f = ease(seg(tt, 10.2, 12.4));
        this.cursor.style.opacity = tt > 9.6 ? 1 : 0;
        this.cursor.move(lerp(1500, tg.x, f), lerp(980, tg.y, f));
        this.target.classList.toggle('hover', tt > 12.3);
        this.target.classList.toggle('press', tt > 14.6 && tt < 14.9);
      },
    };

    // ---------------------------------------------------------------- 2. world generation
    const worldgen = {
      id: 'worldgen', dur: 7, no3d: true,
      enter() {
        const s = UI.dirt(layer.screen);
        this.h1 = h('div', 'center t', '', s); this.h1.style.top = '300px'; this.h1.style.fontSize = '44px';
        this.h2 = h('div', 'center t', '', s); this.h2.style.top = '380px'; this.h2.style.fontSize = '36px';
        this.seed = h('div', 'center t c-gray', `시드: cloud-barista  ·  ${ym(D.org.created)} ${+D.org.created.slice(8, 10)}일`, s); this.seed.style.top = '470px'; this.seed.style.fontSize = '30px';
        this.grid = h('div', 'chunks', '', s);
        const N = 19;
        this.grid.style.gridTemplateColumns = `repeat(${N}, 18px)`;
        this.cells = [];
        for (let i = 0; i < N * N; i++) { const c = h('i', '', '', this.grid); const x = i % N - 9, y = Math.floor(i / N) - 9; this.cells.push({ c, d: Math.max(Math.abs(x), Math.abs(y)) + Math.random() * 0.9, on: false }); }
      },
      update(tt) {
        const p1 = seg(tt, 0.3, 3.0), p2 = seg(tt, 3.0, 6.4);
        this.h1.innerHTML = tt < 3 ? t('월드 생성 중') : t('Cloud-Barista 월드 불러오는 중');
        this.h2.innerHTML = tt < 3 ? t(`지형 생성 중: ${Math.round(p1 * 100)}%`, 'gray') : t(`청크 불러오는 중: ${Math.round(p2 * 100)}%`, 'gray');
        const R = p2 * 10.5;
        const cols = ['#58b04a', '#6bc35b', '#4e9a40', '#c8c8c8', '#e6e6e6'];
        for (const c of this.cells) {
          const on = c.d < R;
          if (on !== c.on) { c.on = on; c.c.style.background = on ? cols[Math.floor(Math.random() * 3)] : 'transparent'; }
          if (!on && c.d < R + 1.2) c.c.style.background = '#606060';
        }
      },
    };

    // ---------------------------------------------------------------- 3. chronicle 2019 -> now
    const chronicle = {
      id: 'chronicle', dur: 64,
      enter() {
        hideIslands();
        town.pedestals.visible = false;
        town.setBuilt(-1);
        this.T0 = 3; this.T1 = 57;
        this.spm = (this.T1 - this.T0) / NOW_M;
        this.chat = new UI.Chat(); this.toasts = new UI.Toasts(); this.boss = new UI.Boss();
        this.score = new UI.Score('Cloud-Barista');
        this.title = new UI.Title(170);
        this.hot = UI.hotbar(HOTBAR, 8);
        // events, timed in scene seconds
        const ev = [];
        const tm = (m) => this.T0 + m * this.spm;
        for (const r of D.repos) ev.push({ at: tm(monthOf(r.created)), kind: 'repo', r });
        for (const p of D.people) ev.push({ at: tm(monthOf(p.first)), kind: 'join', p });
        for (const c of coffee) ev.push({ at: tm(c.m), kind: 'release', c });
        for (let y = +since + 1; y <= +D.generatedAt.slice(0, 4); y++) ev.push({ at: tm(monthOf(`${y}-01-01`)), kind: 'year', y });
        ev.sort((a, b) => a.at - b.at);
        this.ev = ev; this.ei = 0;
        this.repoLabels = new Map();
        this.joinLabels = [];
        for (const b of town.blds) {
          const big = b.repo.commits >= 300;
          const created = tm(b.created);
          const it = labels.add(`<img src="${PX.repoIcon(b.repo.name)}">${esc(b.repo.name)}`, () => b.shown > 0 ? new V3(b.x0 + b.w / 2, b.list[b.shown - 1][1] + 2.2, b.z0 + b.w / 2) : null, 'repo', {
            ref: 34, max: 1.1, min: 0.42,
            opacity: () => { const a = this.tt - created; return a < 0 ? 0 : big ? Math.min(1, a / 0.5) : a < 4 ? Math.min(1, a / 0.4) : Math.max(0, 1 - (a - 4) / 0.8); },
          });
          this.repoLabels.set(b.repo.name, it);
        }
        for (const person of town.people) {
          const join = tm(person.join);
          labels.add(esc(person.p.login), () => person.pl.group.visible ? person.pl.group.position.clone().add(new V3(0, 2.35, 0)) : null, '', {
            ref: 16, max: 0.9, min: 0.3,
            opacity: () => { const a = this.tt - join; return a < 0 ? 0 : a < 3.2 ? 1 : Math.max(0, 1 - (a - 3.2) / 0.6); },
          });
        }
        this.mainB = town.byRepo.get('cloud-barista');
        this.tt = 0;
        this.dayOne = false; this.nowShown = false;
      },
      update(tt, dt) {
        this.tt = tt;
        const m = clamp((tt - this.T0) / this.spm, -0.001, NOW_M);
        town.setBuilt(m);
        town.setPeopleHistory(m, this.spm, tt);
        // block-placing sparks on buildings that grew this frame
        if (dt > 0) for (const b of town.blds) {
          if (b.grew > 0 && b.grew < 200 && Math.random() < 0.6) {
            const [x, y, z] = b.list[b.shown - 1];
            world.particles.add(x + 0.5, y + 1.1, z + 0.5, (Math.random() - 0.5) * 2, 2 + Math.random() * 2, (Math.random() - 0.5) * 2, Math.random() < 0.5 ? '#ffffff' : '#ffe9a8', 0.22, 0.6, -6);
          }
        }
        world.setDayTime(Math.max(0, m) / NOW_M * 7.25);
        // events
        while (this.ei < this.ev.length && this.ev[this.ei].at <= tt) {
          const e = this.ev[this.ei++];
          if (e.kind === 'repo') this.chat.push(`<img src="${PX.repoIcon(e.r.name)}">` + t(` ${e.r.name}`, 'aqua') + t(' 저장소가 세워졌습니다', 'gray'), e.at);
          if (e.kind === 'join') this.chat.push(t(`${e.p.login} 님이 게임에 참가했습니다`, 'yellow'), e.at);
          if (e.kind === 'release') {
            this.toasts.show(e.c.icon, '발전 과제 달성!', `${e.c.en} · ${e.c.ver}`, e.at, 'yellow');
            this.chat.push(t('[Cloud-Barista] ', 'gold') + t(`${e.c.ver} ${e.c.en} 릴리스!`, 'green'), e.at);
            if (tt - e.at < 0.5 && this.mainB) {
              const b = this.mainB;
              for (let k = 0; k < 3; k++) setTimeout(() => firework(world, b.x0 + b.w / 2 + (Math.random() - 0.5) * 14, b.top + 10 + Math.random() * 8, b.z0 + b.w / 2 + (Math.random() - 0.5) * 14), k * 220);
            }
          }
          if (e.kind === 'year') this.title.show(String(e.y), esc(yearNotes[e.y] || ''), e.at, 2.6, { subCls: 'c-yellow' });
        }
        if (tt < this.T0 + 0.1 && !this.dayOne) { this.dayOne = true; this.title.show('Day 1', `${ym(D.org.created)} ${+D.org.created.slice(8, 10)}일 · 월드가 열렸습니다`, 0.2, 2.8, { subCls: 'c-yellow' }); }
        if (tt > this.T1 + 0.3 && !this.nowShown) {
          this.nowShown = true;
          this.title.show('지금', `저장소 ${T.repos} · 기여자 ${fmt(T.people)} · 커밋 ${fmt(T.commits)}`, tt, 6.4, { subCls: 'c-yellow' });
        }
        // HUD
        const d = Village.dateOf(Math.max(0, m));
        this.boss.set(t(`Cloud-Barista 연대기 · ${d.y}년 ${d.m}월`), Math.max(0, m) / NOW_M);
        const rel = coffee.filter(c => c.m <= m).length;
        this.score.set([['기여자', cumAt('people', m)], ['저장소', cumAt('repos', m)], ['커밋', cumAt('commits', m)], ['머지된 PR', cumAt('prs', m)], ['정식 릴리스', rel]]);
        this.chat.render(tt); this.toasts.render(tt); this.title.render(tt);
        // camera: a slow orbit while the town grows, then rise for the overview
        const g = ease(seg(tt, this.T1 - 1, this.dur - 0.5));
        const a = -0.35 + tt * 0.022;
        const r = lerp(lerp(46, 70, ease(seg(tt, 0, 30))), 92, g);
        const hh = lerp(lerp(16, 38, ease(seg(tt, 0, 30))), 72, g);
        orbit(cam, 0, 0, 0, r, hh, a, 0, lerp(2, 6, g), 0);
      },
    };

    // ---------------------------------------------------------------- 4. CB-Spider
    const spider = {
      id: 'spider', dur: 20,
      enter() {
        finalWorld();
        town.setThreads(() => 0);
        town.vms.forEach(v => { v.visible = false; });
        world.setDayTime(0.2);
        this.title = new UI.Title(150);
        this.title.show('CB-Spider', '하나의 인터페이스로, 여러 클라우드를', 0.6, 4.6, { bigCls: 'c-yellow' });
        this.act = h('div', 'actionbar t', '', layer.hud);
        this.hot = UI.hotbar(HOTBAR, 0);
        this.chat = new UI.Chat();
        this.n = town.islands.length;
        this.tc = (i) => 5.2 + i * 0.75;
        this.done = new Set();
        town.islands.forEach((is, i) => labels.add(t(is.cloud.label, 'white', 'b'), is.anchor.clone().add(new V3(0, 1.6, 0)), 'big', {
          ref: 30, max: 1.25, opacity: () => clamp((this.tt - this.tc(i) - 0.4) / 0.3, 0, 1),
        }));
        labels.add(t('CB-Spider', 'yellow', 'b'), new V3(0, town.hub.y + 7.5, 0), 'big', { ref: 30, max: 1.3, opacity: () => clamp((this.tt - 4) / 0.5, 0, 1) });
        this.tt = 0;
        this.lastPacket = 0;
      },
      update(tt, dt) {
        this.tt = tt;
        town.setPeopleIdle(tt + 40);
        town.setIslands(1, (i) => ease(seg(tt, 0.4 + i * 0.22, 2.2 + i * 0.22)));
        town.setThreads((i) => ease(seg(tt, this.tc(i), this.tc(i) + 0.45)));
        const cur = clamp(Math.floor((tt - 5.2 + 0.4) / 0.75), 0, this.n - 1);
        const ang = town.islands[cur].angle;
        const sp = town.spider;
        let da = ang - sp.rotation.y; da = Math.atan2(Math.sin(da), Math.cos(da));
        sp.rotation.y += da * Math.min(1, dt * 6);
        sp.animate(tt, tt > 4.6 && tt < 14.5 ? 1 : 0.35);
        for (let i = 0; i < this.n; i++) {
          if (!this.done.has(i) && tt >= this.tc(i) + 0.45) {
            this.done.add(i);
            const a = town.islands[i].anchor;
            world.particles.burst(a.x, a.y, a.z, '#ffffff', 40, 6, 0.3, 0.9);
            this.chat.push(t('[CB-Spider] ', 'gold') + t(`${town.islands[i].cloud.label} 드라이버 연결 완료`, 'green'), this.tc(i) + 0.45);
          }
        }
        const k = this.done.size;
        this.act.innerHTML = tt > 4.6 ? t('연결된 클라우드 ', 'white') + t(`${k} / ${this.n}`, k === this.n ? 'green' : 'yellow', 'b') + (k === this.n ? t('  ·  AWS부터 국내 클라우드까지, 하나의 API로', 'gray') : '') : '';
        if (tt > 14 && tt - this.lastPacket > 0.06) {
          this.lastPacket = tt;
          const th = town.threads[Math.floor(Math.random() * town.threads.length)];
          const dir = th.to.clone().sub(th.from).normalize();
          const out = Math.random() < 0.5;
          const p0 = out ? th.from : th.to;
          const v = dir.multiplyScalar(out ? 16 : -16);
          world.particles.add(p0.x, p0.y, p0.z, v.x, v.y, v.z, ['#ffff55', '#55ffff', '#ffffff', '#ffaa00'][Math.floor(Math.random() * 4)], 0.28, th.len / 16, 0);
        }
        this.title.render(tt); this.chat.render(tt);
        const lift = ease(seg(tt, 0, 4.5));
        orbit(cam, 0, 0, 0, lerp(84, 70, lift), lerp(24, 80, lift), 0.6 + tt * 0.045, 0, lerp(26, 54, lift), 0);
      },
    };

    // ---------------------------------------------------------------- 5. CB-Tumblebug
    const tumblebug = {
      id: 'tumblebug', dur: 18,
      enter() {
        finalWorld();
        town.vms.forEach(v => { v.visible = false; });
        world.setDayTime(0.27);
        this.title = new UI.Title(150);
        this.title.show('CB-Tumblebug', '명령 한 번으로, 여러 클라우드에 하나의 인프라를', 0.4, 4.2, { bigCls: 'c-yellow' });
        this.chat = new UI.Chat();
        this.input = h('div', 'chat-input t', '', layer.hud);
        this.input.style.opacity = 0;
        this.act = h('div', 'actionbar t', '', layer.hud);
        this.act.style.bottom = '76px';
        const n = town.islands.length;
        this.n = n;
        this.cmd1 = `/mci create cb-conference --clouds ${n}`;
        this.cmd2 = '/mci status cb-conference';
        this.tv = (i) => 7.0 + i * 0.2;
        this.popped = new Set();
        this.chat.push(t('[CB-Tumblebug] ', 'gold') + t(`MCI 'cb-conference' 생성 시작 · 클라우드 ${n}곳에 VM ${n}대`, 'gray'), 6.6);
        this.chat.push(t('[CB-Tumblebug] ', 'gold') + t(`VM ${n}대 생성 완료 (${n}/${n}) · 상태: Running`, 'green'), this.tv(n - 1) + 0.6);
        this.chat.push(t('cb-conference ', 'aqua') + t(`· Running · VM ${n} · 클라우드 ${n} · 하나의 인프라처럼`, 'white'), 13.9);
        town.islands.forEach((is, i) => {
          labels.add(t(is.cloud.label, 'white', 'b'), is.anchor.clone().add(new V3(0, 1.6, 0)), 'big', { ref: 30, max: 1.1 });
          labels.add(t(`vm-${String(i + 1).padStart(2, '0')}`, 'green'), town.vms[i].position.clone().add(new V3(0, 4.2, 0)), '', {
            ref: 30, max: 1.0, opacity: () => clamp((this.tt - this.tv(i) - 0.2) / 0.3, 0, 1),
          });
        });
        this.tt = 0; this.lastPacket = 0;
      },
      update(tt, dt) {
        this.tt = tt;
        town.setPeopleIdle(tt + 60);
        town.spider.animate(tt, 0.3);
        // typing in the chat bar
        let line = '';
        if (tt > 4.2 && tt < 6.6) line = this.cmd1.slice(0, Math.floor(seg(tt, 4.4, 6.1) * this.cmd1.length));
        if (tt > 11.0 && tt < 13.8) line = this.cmd2.slice(0, Math.floor(seg(tt, 11.2, 13.0) * this.cmd2.length));
        const typing = (tt > 4.2 && tt < 6.6) || (tt > 11.0 && tt < 13.8);
        this.input.style.opacity = typing ? 1 : 0;
        this.input.innerHTML = esc(line) + (Math.floor(tt * 3) % 2 ? '_' : '&nbsp;');
        town.vms.forEach((v, i) => {
          const f = seg(tt, this.tv(i), this.tv(i) + 0.35);
          v.visible = f > 0;
          v.scale.setScalar(Math.max(0.001, pop(f)));
          if (f > 0 && !this.popped.has(i)) {
            this.popped.add(i);
            world.particles.burst(v.position.x, v.position.y + 1.5, v.position.z, '#55ff55', 30, 5, 0.28, 0.8);
          }
        });
        if (tt > 9.5 && tt - this.lastPacket > 0.05) {
          this.lastPacket = tt;
          const a = town.vms[Math.floor(Math.random() * this.n)], b = town.vms[Math.floor(Math.random() * this.n)];
          if (a !== b) {
            const hub = new V3(0, town.hub.y + 2.2, 0), p0 = a.position.clone().add(new V3(0, 3.2, 0));
            const v = hub.clone().sub(p0); const len = v.length(); v.normalize().multiplyScalar(18);
            world.particles.add(p0.x, p0.y, p0.z, v.x, v.y, v.z, ['#55ff55', '#55ffff', '#ffff55'][Math.floor(Math.random() * 3)], 0.3, len / 18, 0);
          }
        }
        const k = this.popped.size;
        this.act.innerHTML = tt > 7 ? t('MCI ', 'aqua', 'b') + t(`cb-conference  ·  VM ${k}/${this.n}  ·  `, 'white') + t(k === this.n ? 'Running' : 'Creating', k === this.n ? 'green' : 'yellow') : '';
        this.title.render(tt); this.chat.render(tt);
        orbit(cam, 0, 0, 0, lerp(56, 46, ease(seg(tt, 0, 18))), lerp(98, 90, ease(seg(tt, 0, 18))), 1.5 + tt * 0.04, 0, 50, 0);
      },
    };

    // ---------------------------------------------------------------- 6. inventory of repositories
    const inventory = {
      id: 'inventory', dur: 18, dim: 1,
      enter() {
        finalWorld();
        world.setDayTime(0.3);
        const s = layer.screen;
        const hd = h('div', 'center', `<div class="t c-yellow b" style="font-size:56px">Cloud-Barista 인벤토리</div><div class="t c-gray" style="font-size:32px;margin-top:8px">저장소 ${T.repos}개 · 아이템 개수 = 그 저장소의 기여자 수</div>`, s);
        hd.style.top = '60px';
        const repos = D.repos.slice().sort((a, b) => a.created < b.created ? -1 : 1);
        const rows = Math.ceil(repos.length / 9);
        const g = h('div', 'gui', `<div class="gt">대형 상자 · ${since}–${D.generatedAt.slice(0, 4)}</div>`, s);
        g.style.left = '330px'; g.style.top = '220px';
        const grid = h('div', 'slots', '', g);
        this.slots = [];
        for (let i = 0; i < rows * 9; i++) {
          const r = repos[i];
          const sl = h('div', 'slot', r ? `<img src="${PX.repoIcon(r.name)}" style="opacity:0">${r.authors > 1 ? `<span class="n t" style="opacity:0">${Math.min(64, r.authors)}</span>` : ''}` : '', grid);
          this.slots.push({ sl, r });
        }
        this.tip = h('div', 'tooltip', '', layer.top); this.tip.style.opacity = 0;
        this.cursor = UI.cursor();
        const want = ['cb-spider', 'cb-tumblebug', 'cloud-barista', 'cm-beetle', 'cm-honeybee', 'mc-terrarium', 'cb-mapui', 'ai-mcmp'];
        this.focus = want.map(n => this.slots.findIndex(x => x.r && x.r.name === n)).filter(i => i >= 0);
        this.cur = -1;
      },
      tipHTML(r) {
        const rare = r.commits >= 2000 ? 'purple' : r.commits >= 500 ? 'aqua' : r.commits >= 100 ? 'yellow' : null;
        const desc = (r.desc || '').length > 64 ? r.desc.slice(0, 62) + '…' : r.desc;
        return `<div>${t(r.name, rare)}</div>` + (desc ? `<div class="l2">${t(desc, 'gray')}</div>` : '') +
          `<div class="l2">${t(`생성 ${ymd(r.created)}`, 'gray')}${r.archived ? t('  · 보관됨', 'dgray') : ''}</div>` +
          `<div class="l2">${t('개발 기록:', 'gray')}</div>` +
          `<div>${t(` +${fmt(r.commits)} 커밋`, 'aqua')}</div>` +
          (r.prs ? `<div>${t(` +${fmt(r.prs)} 머지된 PR`, 'aqua')}</div>` : '') +
          `<div>${t(` ${r.authors}명의 기여자`, 'green')}${r.stars ? t(`   ★ ${r.stars}`, 'gold') : ''}</div>`;
      },
      update(tt) {
        orbit(cam, 0, 0, 0, 78, 34, 2.4 + tt * 0.03, 0, 18, 0);
        town.setPeopleIdle(tt + 80);
        const nItems = this.slots.filter(x => x.r).length;
        this.slots.forEach((x, i) => {
          if (!x.r) return;
          const on = tt > 0.4 + i * (2.6 / nItems);
          if (on && !x.on) { x.on = true; x.sl.classList.add('pop'); x.sl.querySelector('img').style.opacity = 1; const n = x.sl.querySelector('.n'); if (n) n.style.opacity = 1; }
        });
        const step = 1.75, t0 = 3.6;
        const fi = Math.floor((tt - t0) / step);
        const local = (tt - t0) - fi * step;
        const idx = fi >= 0 && fi < this.focus.length ? this.focus[fi] : -1;
        const prevIdx = fi - 1 >= 0 && fi - 1 < this.focus.length ? this.focus[fi - 1] : -1;
        const pos = (i) => { const r = this.slots[i].sl.getBoundingClientRect(); return UI.toStage((r.left + r.width * 0.55) / window.innerWidth, (r.top + r.height * 0.5) / window.innerHeight); };
        let cx = 1500, cy = 900;
        if (idx >= 0) {
          const a = prevIdx >= 0 ? pos(prevIdx) : { x: 1500, y: 900 }, b = pos(idx), f = ease(local / 0.45);
          cx = lerp(a.x, b.x, f); cy = lerp(a.y, b.y, f);
        } else if (fi >= this.focus.length) { const b = pos(this.focus[this.focus.length - 1]); cx = b.x; cy = b.y; }
        this.cursor.move(cx, cy);
        const show = idx >= 0 && local > 0.45;
        if (idx !== this.cur) {
          this.slots.forEach(x => x.sl.classList.remove('hl'));
          if (idx >= 0) { this.slots[idx].sl.classList.add('hl'); this.tip.innerHTML = this.tipHTML(this.slots[idx].r); }
          this.cur = idx;
        }
        this.tip.style.opacity = show ? 1 : 0;
        this.tip.style.transform = `translate(${cx + 36}px, ${cy - 40}px)`;
      },
    };

    // ---------------------------------------------------------------- 7. brewing releases
    const brewing = {
      id: 'brewing', dur: 18, dim: 1,
      enter() {
        finalWorld();
        world.setDayTime(0.36);
        const s = layer.screen;
        const hd = h('div', 'center', `<div class="t c-yellow b" style="font-size:56px">${coffee.length}번의 정식 릴리스</div><div class="t c-gray" style="font-size:32px;margin-top:8px">커피에서 차(茶)까지 · ${coffee[0].en} → ${latest.en}</div>`, s);
        hd.style.top = '60px';
        // brewing stand GUI
        const g = h('div', 'gui', '<div class="gt">양조기</div>', s);
        Object.assign(g.style, { left: '120px', top: '250px', width: '560px', height: '560px' });
        const at = (cls, x, y, html) => { const e = h('div', cls, html || '', g); Object.assign(e.style, { position: 'absolute', left: x + 'px', top: y + 'px' }); return e; };
        this.ing = at('slot', 244, 96);
        this.fuel = at('slot', 60, 96, `<img src="${PX.icon('redstone', { r: '#ffb02e', R: '#d26a00' })}">`);
        this.bottles = [at('slot', 140, 360), at('slot', 244, 410), at('slot', 348, 360)];
        const stand = document.createElement('canvas'); stand.width = 92; stand.height = 70;
        const sg = stand.getContext('2d');
        sg.fillStyle = '#6b6b6b'; sg.fillRect(43, 0, 6, 70); sg.fillRect(13, 40, 66, 6); sg.fillRect(13, 40, 6, 30); sg.fillRect(73, 40, 6, 30);
        sg.fillStyle = '#3c3c3c'; sg.fillRect(41, 60, 10, 10);
        stand.style.cssText = 'position:absolute;left:144px;top:190px;width:276px;height:210px;image-rendering:pixelated';
        g.appendChild(stand);
        this.arrow = at('', 350, 96, '<div style="width:36px;height:112px;background:#8b8b8b;box-shadow:inset 4px 4px 0 #555"><div class="af" style="width:100%;height:0;background:#fff"></div></div>');
        this.af = this.arrow.querySelector('.af');
        this.bub = at('', 190, 96, '');
        this.bub.style.cssText += ';width:36px;height:112px';
        this.bubs = [0, 1, 2, 3].map(k => { const b = h('i', '', '', this.bub); b.style.cssText = `position:absolute;width:${8 + k % 2 * 4}px;height:${8 + k % 2 * 4}px;background:#ddd;box-shadow:0 0 0 2px #888;left:${(k * 9) % 24}px`; return b; });
        this.now = at('t', 30, 500, ''); this.now.style.fontSize = '28px'; this.now.style.color = '#404040'; this.now.style.textShadow = 'none';
        // shelf
        const sh = h('div', 'shelf', '', s);
        Object.assign(sh.style, { left: '780px', top: '260px' });
        this.items = coffee.map((c) => h('div', 'it', `<div class="slot"><img src="${c.icon}"></div><div class="nm t ${c.tea ? 'c-purple' : 'c-yellow'}">${esc(c.en)}</div><div class="dt t c-gray">${c.ver} · ${ymd(c.date).slice(0, 7)}</div>`, sh));
        this.items[this.items.length - 1].classList.add('glint');
        this.start = 1.6; this.step = Math.min(1.05, 13.6 / coffee.length);
        this.k = -1;
      },
      update(tt) {
        orbit(cam, 0, 0, 0, 78, 34, 2.9 + tt * 0.03, 0, 18, 0);
        town.setPeopleIdle(tt + 100);
        const i = Math.floor((tt - this.start) / this.step);
        const local = (tt - this.start) - i * this.step;
        const cur = clamp(i, 0, coffee.length - 1);
        const c = coffee[cur];
        if (i >= 0) {
          if (cur !== this.k) {
            this.k = cur;
            this.ing.innerHTML = `<img src="${PX.icon(c.tea ? 'leaf' : 'bean')}">`;
            this.bottles.forEach(b => { b.innerHTML = ''; });
            this.now.innerHTML = `${esc(c.en)}${c.ko ? ` (${esc(c.ko)})` : ''} · ${c.ver}`;
          }
          const p = i >= coffee.length ? 1 : seg(local, 0.12, 0.78);
          this.af.style.height = (p * 100) + '%';
          this.bubs.forEach((b, k) => { b.style.top = (100 - ((tt * 70 + k * 27) % 100)) + 'px'; b.style.opacity = p > 0 && p < 1 ? 1 : 0; });
          if (p >= 1 && !this.bottles[0].innerHTML) {
            this.ing.innerHTML = '';
            this.bottles.forEach(b => { b.innerHTML = `<img src="${c.icon}">`; b.classList.add('pop'); });
          }
          this.items.forEach((e, k) => { const on = k < cur || (k === cur && p >= 1); if (on && !e.classList.contains('on')) e.classList.add('on'); });
        }
      },
    };

    // ---------------------------------------------------------------- 8. statistics
    const stats = {
      id: 'stats', dur: 15, no3d: true,
      enter() {
        const s = UI.dirt(layer.screen);
        h('div', 'center', '<div class="t b" style="font-size:52px">통계</div>', s).style.top = '60px';
        const tabs = h('div', 'center', `<span class="t" style="font-size:30px">일반</span><span class="t c-dgray" style="font-size:30px;margin-left:60px">아이템</span><span class="t c-dgray" style="font-size:30px;margin-left:60px">몹</span>`, s);
        tabs.style.top = '136px';
        const rows = [
          ['월드 생성일', `${D.org.created.slice(0, 4)}년 ${+D.org.created.slice(5, 7)}월 ${+D.org.created.slice(8, 10)}일`],
          ['함께한 시간', span],
          ['참가한 플레이어 (기여자)', T.people, '명'],
          ['쌓아 올린 커밋', T.commits],
          ['머지된 PR', T.mergedPrs],
          ['등록된 이슈', T.issues],
          ['저장소', T.repos],
          ['정식 릴리스', coffee.length],
          ['릴리스 태그 (전체 저장소)', T.releases],
          ['연결된 클라우드 (CB-Spider)', T.clouds],
          ['스타', T.stars],
          ['포크', T.forks],
        ];
        const box = h('div', 'stats', '', s);
        this.rows = rows.map((r, i) => { const e = h('div', 'row', `<span class="t">${esc(r[0])}</span><span class="t c-yellow v"></span>`, box); e.style.opacity = 0; return { e, v: e.querySelector('.v'), r, at: 0.5 + i * 0.32 }; });
        // commits per year as stacks of blocks
        const years = {};
        D.months.forEach((m, i) => { const y = m.slice(0, 4); years[y] = (years[y] || 0) + D.timeline.commits[i]; });
        const ys = Object.keys(years).sort();
        const mx = Math.max(...ys.map(y => years[y]));
        const unit = Math.ceil(mx / 14 / 50) * 50;
        const ch = h('div', 'chart', `<div class="t c-gray" style="font-size:28px;text-align:center">연도별 커밋 · 블록 1개 = ${unit}</div>`, s);
        const colW = 720 / ys.length;
        this.cols = ys.map((y, i) => {
          const n = Math.max(1, Math.round(years[y] / unit));
          const col = h('div', 'col', '', ch); col.style.left = (i * colW + (colW - 64) / 2) + 'px';
          const blocks = [];
          for (let k = 0; k < n; k++) { const im = h('img', '', null, col); im.src = PX.icon(k === n - 1 ? 'block:grass' : k < 2 ? 'block:stone' : 'block:dirt'); im.style.opacity = 0; blocks.push(im); }
          const val = h('div', 'val t c-yellow', fmt(years[y]), col); val.style.opacity = 0;
          const yl = h('div', 'yl t', y, ch); yl.style.left = (i * colW + (colW - 90) / 2) + 'px';
          return { blocks, val, at: 1.2 + i * 0.5 };
        });
      },
      update(tt) {
        for (const x of this.rows) {
          if (tt < x.at) continue;
          x.e.style.opacity = 1;
          if (!x.on) { x.on = true; x.e.classList.add('on'); }
          const r = x.r;
          if (typeof r[1] === 'number') x.v.textContent = fmt(r[1] * ease(seg(tt, x.at, x.at + 1.2))) + (r[2] || '');
          else x.v.textContent = r[1];
        }
        for (const c of this.cols) {
          const per = 0.06;
          c.blocks.forEach((b, k) => { b.style.opacity = tt > c.at + k * per ? 1 : 0; });
          c.val.style.opacity = tt > c.at + c.blocks.length * per ? 1 : 0;
        }
      },
    };

    // ---------------------------------------------------------------- 9. hall of fame
    const heroes = {
      id: 'heroes', dur: 0, // set in enter
      enter() {
        finalWorld();
        town.pedestals.visible = true;
        world.setDayTime(0.4);
        this.list = town.heroSpots;
        this.intro = 4.5; this.each = 2.9;
        this.dur = this.intro + this.list.length * this.each + 0.6;
        this.title = new UI.Title(60);
        this.title.show('명예의 전당', 'Cloud-Barista를 만들어 온 핵심 기여자', 0.3, this.intro - 0.2, { bigCls: 'c-gold', subCls: 'c-yellow' });
        this.card = h('div', 'hero', '', layer.screen);
        Object.assign(this.card.style, { left: '96px', top: '560px', opacity: 0 });
        this.heroSet = new Set(this.list.map(s => s.h.login));
        this.tags = this.list.map((s) => {
          const p = personOf.get(s.h.login);
          return labels.add(t(displayName(p), 'yellow', 'b'), new V3(s.x, s.y + 1 + 2.45, s.z), 'big', { ref: 9, max: 1.25, min: 0.4 });
        });
        this.k = -1;
        this.fired = new Set();
      },
      cardHTML(s, i) {
        const p = personOf.get(s.h.login);
        const nm = displayName(p);
        const handle = nm === p.login ? '' : `@${p.login}`;
        const repos = (p.repos || []).slice(0, 3);
        return `<div class="badge t c-gold">핵심 기여자 ${i + 1} / ${this.list.length}</div>` +
          `<div class="top"><img class="av" src="${avatar(p.login)}"><div><div class="nm t">${esc(nm)}</div>` +
          `<div class="hd t c-gray">${esc(handle || (p.name && p.name !== nm ? p.name : ''))}</div></div></div>` +
          (s.h.role ? `<div class="ln t c-yellow">${esc(s.h.role)}</div>` : '') +
          `<div class="ln t"><span class="t lbl">첫 기여</span>${esc(ym(p.first))}</div>` +
          (repos.length ? `<div class="ln t"><span class="t lbl">주요 저장소</span>${repos.map(r => `<span class="rp"><img class="ic" src="${PX.repoIcon(r)}">${esc(r)}</span>`).join('')}</div>` : '');
      },
      update(tt, dt) {
        town.setPeopleIdle(tt + 120, this.heroSet);
        const n = this.list.length;
        const i = Math.floor((tt - this.intro) / this.each);
        const local = (tt - this.intro) - i * this.each;
        // heroes stand on their pedestals facing the centre
        this.list.forEach((s, k) => {
          const person = town.byLogin.get(s.h.login);
          person.pl.group.visible = true;
          const focus = k === i;
          town.place(person, { x: s.x, z: s.z, dx: -s.x, dz: -s.z, moving: 0 }, tt, { y: 2, wave: focus ? ease(seg(local, 0.2, 0.6)) : 0 });
        });
        if (tt < this.intro) {
          const f = ease(seg(tt, 0, this.intro));
          orbit(cam, 0, 0, 0, lerp(26, 16, f), lerp(52, 34, f), 0.4 + tt * 0.08, 0, 1, 0);
          this.card.style.opacity = 0;
        } else {
          const ic = clamp(i, 0, n - 1);
          const s = this.list[ic], prev = this.list[clamp(ic - 1, 0, n - 1)];
          const f = i === 0 ? ease(seg(tt, this.intro, this.intro + 0.8)) : ease(seg(local, 0, 0.7));
          let a0 = Math.atan2(prev.x, prev.z), a1 = Math.atan2(s.x, s.z);
          let da = a1 - a0; da = Math.atan2(Math.sin(da), Math.cos(da));
          const a = i === 0 ? a1 : a0 + da * f;
          // camera inside the ring, looking out at the hero; hero sits right of centre
          const R = 5.4;
          const cp = new V3(Math.sin(a) * R, 3.7, Math.cos(a) * R);
          const left = new V3(Math.cos(a), 0, -Math.sin(a));
          const tgt = new V3(Math.sin(a) * 9.5, 4.25, Math.cos(a) * 9.5).add(left.multiplyScalar(1.25));
          if (i === 0) {
            const f0 = ease(seg(tt, this.intro, this.intro + 1.0));
            const ip = new V3(Math.sin(0.4 + this.intro * 0.08) * 16, 34, Math.cos(0.4 + this.intro * 0.08) * 16);
            cam.position.copy(ip.lerp(cp, f0));
          } else cam.position.copy(cp);
          cam.lookAt(tgt);
          if (ic !== this.k && i < n) {
            this.k = ic;
            this.card.innerHTML = this.cardHTML(s, ic);
          }
          const vis = i < n ? Math.min(seg(local, 0.45, 0.75), 1 - seg(local, this.each - 0.25, this.each)) : 0;
          this.card.style.opacity = vis;
          this.card.style.transform = `translateX(${(1 - vis) * -40}px)`;
          if (i < n && local > 0.5 && !this.fired.has(i)) {
            this.fired.add(i);
            const out = new V3(Math.sin(a1), 0, Math.cos(a1));
            for (let k = 0; k < 2; k++) firework(world, out.x * 30 + (Math.random() - 0.5) * 16, 24 + Math.random() * 10, out.z * 30 + (Math.random() - 0.5) * 16);
          }
        }
        this.tags.forEach((tg, k) => { tg.opacity = tt < this.intro ? clamp((tt - 1) / 0.5, 0, 1) : 1; });
        this.title.render(tt);
      },
    };

    // ---------------------------------------------------------------- 10. player list
    const players = {
      id: 'players', dur: 14, dim: 1,
      enter() {
        finalWorld();
        world.setDayTime(0.47);
        const s = layer.screen;
        const list = D.people.slice().sort((a, b) => a.first < b.first ? -1 : a.first > b.first ? 1 : 0);
        const cols = 5;
        const tab = h('div', 'tab', `<div class="hdr t c-yellow b">Cloud-Barista 오픈소스 서버</div><div class="t c-gray" style="font-size:28px">함께 만든 사람들 · ${fmt(list.length)}명 · 참가 순서</div>`, s);
        const g = h('div', 'grid', '', tab);
        g.style.gridTemplateColumns = `repeat(${cols}, 350px)`;
        g.style.gridAutoFlow = 'column';
        g.style.gridTemplateRows = `repeat(${Math.ceil(list.length / cols)}, 28px)`;
        this.cells = list.map((p) => {
          const pg = [0, 1, 2, 3, 4].map(k => `<i style="height:${4 + k * 3}px"></i>`).join('');
          return h('div', 'p', `<img src="${avatar(p.login)}"><span class="nm t">${esc(p.login)}</span><span class="ping">${pg}</span>`, g);
        });
        h('div', 'ftr t c-aqua', '모든 기여자 여러분, 고맙습니다!', tab);
      },
      update(tt) {
        orbit(cam, 0, 0, 0, 70, 30, 3.4 + tt * 0.03, 0, 16, 0);
        town.setPeopleIdle(tt + 140);
        const n = this.cells.length;
        this.cells.forEach((c, i) => { if (!c.on && tt > 0.4 + i * (6.5 / n)) { c.on = true; c.classList.add('on'); } });
      },
    };

    // ---------------------------------------------------------------- 11. together
    const together = {
      id: 'together', dur: 16,
      enter() {
        finalWorld();
        town.pedestals.visible = true;
        world.setDayTime(0.6);
        this.title = new UI.Title(140);
        this.title.show('고맙습니다!', `${fmt(T.people)}명이 함께 만든 Cloud-Barista`, 7.5, 8.2, { bigCls: 'c-yellow', subCls: '' });
        const heroSet = new Set(town.heroSpots.map(s => s.h.login));
        this.heroSet = heroSet;
        const crowd = town.people.filter(p => !heroSet.has(p.p.login));
        // rings around the logo
        const spots = [];
        for (let r = 3.2; spots.length < crowd.length; r += 1.35) {
          const n = Math.floor(Math.PI * 2 * r / 1.15);
          for (let k = 0; k < n && spots.length < crowd.length; k++) { const a = k / n * Math.PI * 2 + r; spots.push({ x: Math.sin(a) * r, z: Math.cos(a) * r }); }
        }
        crowd.sort((a, b) => Math.atan2(a.path.end.x, a.path.end.z) - Math.atan2(b.path.end.x, b.path.end.z));
        const sortedSpots = spots.slice().sort((a, b) => Math.hypot(b.x, b.z) - Math.hypot(a.x, a.z));
        this.walks = crowd.map((person, i) => {
          const sp = sortedSpots[i];
          const rev = person.path.reversed();
          const pts = rev.pts.slice(0, -1).concat([{ x: sp.x, z: sp.z }]);
          const path = Village.makePath(pts);
          return { person, path, delay: Math.random() * 1.2, speed: Math.max(6, path.len / 6.5) };
        });
        // beacons on the logo's four circles
        this.beams = [[-5, -5], [5, -5], [-5, 5], [5, 5]].map(([x, z]) => {
          const m = new THREE.Mesh(new THREE.BoxGeometry(0.9, 260, 0.9), new THREE.MeshBasicMaterial({ color: 0xffc21a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
          m.position.set(x, 131, z);
          world.scene.add(m);
          return m;
        });
        this.nextFw = 3;
      },
      exit() { this.beams.forEach(b => { world.scene.remove(b); b.geometry.dispose(); b.material.dispose(); }); },
      update(tt) {
        for (const w of this.walks) {
          const d = (tt - w.delay) * w.speed;
          const p = w.person;
          p.pl.group.visible = true;
          if (d < 0) { town.place(p, town.idleAt(p, tt + 160), tt); continue; }
          const q = w.path.at(d);
          const arrived = d >= w.path.len;
          const jump = arrived && tt > 8 ? Math.abs(Math.sin((tt + p.r * 3) * 5.5)) * 0.45 : 0;
          town.place(p, arrived ? { x: q.x, z: q.z, dx: -q.x, dz: -q.z, moving: 0 } : { x: q.x, z: q.z, dx: q.dx, dz: q.dz, moving: 1 }, tt, { jump, wave: arrived && tt > 8 && p.r < 0.4 ? 1 : 0 });
        }
        town.heroSpots.forEach((s) => {
          const person = town.byLogin.get(s.h.login);
          person.pl.group.visible = true;
          town.place(person, { x: s.x, z: s.z, dx: -s.x, dz: -s.z, moving: 0 }, tt, { y: 2, wave: tt > 8 ? 1 : 0 });
        });
        const b = ease(seg(tt, 6.5, 8));
        this.beams.forEach(m => { m.material.opacity = 0.55 * b; });
        world.setDayTime(lerp(0.52, 0.6, ease(seg(tt, 0, 6))));
        if (tt > this.nextFw) {
          this.nextFw = tt + (tt > 7.5 ? 0.22 : 0.7);
          const a = Math.random() * Math.PI * 2, r = 14 + Math.random() * 26;
          firework(world, Math.sin(a) * r, 30 + Math.random() * 22, Math.cos(a) * r);
        }
        const f = ease(seg(tt, 0, 9));
        orbit(cam, 0, 0, 0, lerp(30, 17, f), lerp(60, 38, f), 0.2 + tt * 0.07, 0, lerp(0, 4, f), 0);
        this.title.render(tt);
      },
    };

    // ---------------------------------------------------------------- 12. connecting to the conference
    const connect = {
      id: 'connect', dur: 11, no3d: true,
      enter() {
        const s = UI.dirt(layer.screen);
        this.a = h('div', 'center t', '', s); this.a.style.top = '440px'; this.a.style.fontSize = '44px';
        const ev = CFG.event || {};
        const info = [ev.date, ev.time, ev.venue].filter(Boolean).join('  ·  ');
        this.b = h('div', 'center', `<div class="t b" style="font-size:84px">${esc(ev.title || 'Cloud-Barista 컨퍼런스')}</div>` +
          (info ? `<div class="t c-gray" style="font-size:40px;margin-top:22px">${esc(info)}</div>` : '') +
          `<div class="t c-yellow soon" style="font-size:56px;margin-top:56px">잠시 후 시작합니다</div>` +
          `<div class="t c-dgray" style="font-size:28px;margin-top:70px">github.com/cloud-barista  ·  cloud-barista.github.io</div>`, s);
        this.b.style.top = '300px';
        this.soon = this.b.querySelector('.soon');
      },
      update(tt) {
        const dots = '.'.repeat(1 + Math.floor(tt * 2.5) % 3);
        this.a.innerHTML = tt < 3 ? t('서버에 연결하는 중' + dots) : '';
        this.b.style.opacity = ease(seg(tt, 3.1, 3.7));
        this.soon.style.opacity = 0.65 + 0.35 * Math.sin(tt * 4);
      },
    };

    return [title, worldgen, chronicle, spider, tumblebug, inventory, brewing, stats, heroes, players, together, connect];
  }

  window.Scenes = { scenes, coffee, firework };
})();
