// Joins the collected GitHub data (data/data.js), the hand-written copy (data/curated.js) and config.js
// into one model the slides read from. Every number on screen comes from here.
(function () {
  const D = window.CB_DATA, C = window.CB_CURATED, cfg = window.CB_CONFIG;
  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  const ym = (d) => d.slice(0, 4) + '.' + d.slice(5, 7);
  const sum = (a) => a.reduce((x, y) => x + y, 0);

  function relKey(name) {
    const n = (name || '').toLowerCase().replace(/é/g, 'e').replace(/[^a-z]/g, '');
    return Object.keys(C.releases).find((k) => n.includes(k)) || null;
  }

  function build() {
    const gen = D.generatedAt.slice(0, 10);
    const hidden = new Set(C.hiddenRepos || []);
    const title = (name) => (C.titles && C.titles[name]) || name;

    // ---- time span: organisation birthday -> data date ----
    const [y0, m0, d0] = D.org.created.split('-').map(Number);
    const [y1, m1, d1] = gen.split('-').map(Number);
    let months = (y1 - y0) * 12 + (m1 - m0) - (d1 < d0 ? 1 : 0);
    const span = { years: Math.floor(months / 12), months: months % 12 };
    span.label = `${span.years}년${span.months ? ' ' + span.months + '개월' : ''}`;

    // ---- releases: the cloud-barista repo's coffee & tea ----
    const releases = D.coffee.map((r) => {
      const k = relKey(r.name) || relKey(r.tag);
      const c = C.releases[k] || { name: r.name, ko: '', kind: 'coffee', drink: '#6b3a19', accent: '#e0a86c' };
      const v = ((r.tag || '') + ' ' + (r.name || '')).match(/v?(\d+\.\d+(?:\.\d+)?)/);
      return { ...c, key: k, version: v ? 'v' + v[1] : r.tag, date: r.date, ym: ym(r.date), year: +r.date.slice(0, 4) };
    });
    const latest = releases[releases.length - 1];

    // ---- monthly timeline ----
    const T = D.timeline;
    const timeline = D.months.map((m, i) => ({ m, commits: T.commits[i], prs: T.prs[i], people: T.people[i], repos: T.repos[i] }));
    let acc = { commits: 0, prs: 0, people: 0, repos: 0 };
    for (const t of timeline) {
      acc = { commits: acc.commits + t.commits, prs: acc.prs + t.prs, people: acc.people + t.people, repos: acc.repos + t.repos };
      t.cum = acc;
    }
    const peak = timeline.reduce((a, b) => (b.commits > a.commits ? b : a));

    // ---- repos ----
    const repos = D.repos.filter((r) => !hidden.has(r.name)).map((r) => ({ ...r, title: title(r.name), year: +r.created.slice(0, 4) }));
    const repoBy = Object.fromEntries(repos.map((r) => [r.name, r]));

    // ---- people, in order of their first contribution ----
    const heroCfg = Object.fromEntries((cfg.heroes || []).map((x) => [x.login, x]));
    const people = [...D.people].sort((a, b) => (a.first < b.first ? -1 : a.first > b.first ? 1 : a.login.localeCompare(b.login))).map((p, i) => {
      const hc = heroCfg[p.login];
      const era = releases.find((r) => r.date >= p.first) || null;
      return {
        ...p, order: i + 1,
        displayName: (hc && hc.name) || p.name || p.login,
        koName: hc && hc.name ? hc.name : '',
        era,
        eraLabel: era ? `${era.name}부터 함께` : '다음 잔을 함께 준비 중',
      };
    });
    const personBy = Object.fromEntries(people.map((p) => [p.login, p]));

    // ---- years ----
    const years = [];
    for (let y = y0; y <= y1; y++) {
      const ms = timeline.filter((t) => +t.m.slice(0, 4) === y);
      years.push({
        year: y,
        title: (C.years[y] || {}).title || `${y}`,
        line: (C.years[y] || {}).line || '',
        releases: releases.filter((r) => r.year === y),
        conferences: (C.conferences || []).filter((c) => +c.date.slice(0, 4) === y),
        repos: repos.filter((r) => r.year === y),
        people: people.filter((p) => +p.first.slice(0, 4) === y),
        commits: sum(ms.map((t) => t.commits)),
        prs: sum(ms.map((t) => t.prs)),
        cum: ms.length ? ms[ms.length - 1].cum : acc,
        partial: y === y1,
      });
    }
    const mostPeople = years.reduce((a, b) => (b.people.length > a.people.length ? b : a));
    const mostCommits = years.reduce((a, b) => (b.commits > a.commits ? b : a));
    for (const Y of years) {
      Y.badges = [];
      if (Y === mostCommits) Y.badges.push('가장 많은 커밋');
      if (Y === mostPeople) Y.badges.push('가장 많은 새 얼굴');
    }

    // ---- milestones on the glance timeline ----
    // a milestone is a repo's creation date, or the first repo of a family (prefix)
    const milestones = (C.milestones || []).map((m) => {
      const r = m.repo ? repoBy[m.repo] : repos.filter((x) => x.name.startsWith(m.prefix)).sort((x, y) => (x.created < y.created ? -1 : 1))[0];
      return r && { ...m, date: r.created };
    }).filter(Boolean);

    // ---- bug dex ----
    const bugs = repos.filter((r) => C.bugs[r.name] && PX.INSECT[r.name])
      .sort((a, b) => (a.created < b.created ? -1 : a.created > b.created ? 1 : a.name.localeCompare(b.name)))
      .map((r) => ({ ...r, ...C.bugs[r.name], sprite: PX.INSECT[r.name] }));

    // ---- clouds (CB-Spider drivers) ----
    const clouds = D.clouds.map((c) => ({ id: c.id, name: (C.clouds[c.id] || {}).name || c.label, color: (C.clouds[c.id] || {}).color || '#e2bf94' }));

    // ---- punch card: when commits happen ----
    const grid = D.punch || null;
    let punch = null;
    if (grid) {
      const hours = [...Array(24)].map((_, h) => sum(grid.map((r) => r[h])));
      const total = sum(hours);
      const peakHour = hours.indexOf(Math.max(...hours));
      const night = sum(hours.slice(0, 6));
      const weekend = sum(grid[0]) + sum(grid[6]);
      const lunchDip = hours[12] < hours[11] * 0.75 && hours[12] < hours[13];
      punch = { grid, hours, total, peakHour, night, weekend, lunchDip, max: Math.max(...grid.flat()) };
    }

    // ---- head baristas ----
    const heroes = (cfg.heroes || []).map((x) => personBy[x.login] && {
      ...personBy[x.login], displayName: x.name || personBy[x.login].name || x.login, role: x.role || '',
      topRepos: personBy[x.login].repos.filter((n) => !hidden.has(n)).slice(0, 3).map((n) => ({ name: n, title: title(n) })),
    }).filter(Boolean);

    const totals = D.totals;
    return {
      gen, genYM: ym(gen), org: D.org, span, totals, releases, latest, timeline, peak, repos, repoBy,
      people, personBy, years, milestones, bugs, clouds, punch, heroes, conferences: C.conferences || [],
      blend: C.blend, qr: C.qr, fmt, ym,
      // ticker: everyone, by first contribution
      names: people.map((p) => ({ name: p.displayName !== p.login ? p.displayName : '', login: p.login })),
    };
  }

  window.ShowModel = { build };
})();
