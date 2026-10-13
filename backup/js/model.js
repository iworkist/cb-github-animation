// Builds the show's data model from window.CB_GITHUB (collected) + window.CB_CURATED (hand-written).
(function () {
  function versionKey(tag) {
    const m = /^v?(\d+)\.(\d+)/.exec(tag);
    return m ? `v${m[1]}.${m[2]}` : tag;
  }
  const ym = (d) => d.slice(0, 7).replace("-", ".");
  const ymd = (d) => d.slice(0, 10).replace(/-/g, ".");

  function monthsBetween(first, last) {
    const out = [];
    let [y, m] = first.split("-").map(Number);
    for (;;) {
      const key = `${y}-${String(m).padStart(2, "0")}`;
      out.push(key);
      if (key >= last) break;
      if (++m > 12) { m = 1; y++; }
    }
    return out;
  }

  function build(G, C) {
    const hidden = new Set(C.hiddenRepos || []);
    const people = new Map(G.people.map((p) => [p.login, { ...p, displayName: p.name || p.login }]));
    for (const hn of C.honored || []) if (people.has(hn.login)) people.get(hn.login).koName = hn.ko;

    const famOf = {};
    for (const f of C.families) for (const r of f.repos) famOf[r] = f;

    const repos = G.repos
      .filter((r) => !hidden.has(r.name))
      .map((r) => {
        const cur = C.repos[r.name] || {};
        const contributors = r.contributors
          .map((c) => ({ ...people.get(c.login), repoCommits: c.commits, repoFirst: c.first, repoLast: c.last }))
          .filter((p) => p.login);
        const fc = r.first_commit && !r.first_commit.imported ? r.first_commit : null;
        return {
          ...r,
          title: cur.title || r.name,
          ko: cur.ko || r.description || "",
          family: famOf[r.name] || null,
          year: Number(r.created_at.slice(0, 4)),
          commits: r.contributors.reduce((s, c) => s + c.commits, 0),
          people: contributors,
          firstCommit: fc,
        };
      });
    const repoBy = new Map(repos.map((r) => [r.name, r]));

    const releases = G.releases.map((r) => {
      const v = versionKey(r.tag);
      const cur = C.releases[v] || { name: r.name, ko: "", kind: "coffee", liquid: "#6b3f2a", accent: "#e9b872" };
      return { ...cur, version: v, tag: r.tag, date: r.date, ym: ym(r.date), year: Number(r.date.slice(0, 4)) };
    });

    const orgYear = Number(G.org.created_at.slice(0, 4));
    const nowYear = Number(G.generated_at.slice(0, 4));
    const allPeople = [...people.values()].sort((a, b) => a.first.localeCompare(b.first) || b.commits - a.commits);

    // ---- cumulative growth, month by month, from the org's first month to now
    const commitsM = (G.growth && G.growth.commits) || G.activity || {};
    const prsM = (G.growth && G.growth.prs) || {};
    const months = monthsBetween(G.org.created_at.slice(0, 7), G.generated_at.slice(0, 7));
    const growth = [];
    {
      let commits = 0, prs = 0;
      for (const m of months) {
        commits += commitsM[m] || 0;
        prs += prsM[m] || 0;
        growth.push({
          m,
          people: allPeople.filter((p) => p.first.slice(0, 7) <= m).length,
          repos: G.repos.filter((r) => r.created_at.slice(0, 7) <= m).length,
          commits,
          prs,
          releases: releases.filter((r) => r.date.slice(0, 7) <= m).length,
        });
      }
    }
    const last = growth[growth.length - 1];
    const hasPrs = last.prs > 0;

    const years = [];
    for (let y = orgYear; y <= nowYear; y++) {
      const yrRel = releases.filter((r) => r.year === y);
      const yrRepos = repos
        .filter((r) => r.year === y)
        .sort((a, b) => b.commits + b.stars * 20 - (a.commits + a.stars * 20));
      const yrPeople = allPeople.filter((p) => Number(p.first.slice(0, 4)) === y).sort((a, b) => b.commits - a.commits);
      const lastRel = yrRel[yrRel.length - 1];
      const end = growth.filter((g) => g.m.startsWith(String(y))).pop() || last;
      const start = growth.filter((g) => g.m < `${y}-01`).pop();
      years.push({
        year: y,
        story: (C.years || {})[y] || { title: String(y), line: "" },
        releases: yrRel,
        conferences: (C.conferences || []).filter((c) => c.year === y),
        repos: yrRepos,
        people: yrPeople,
        cumPeople: end.people,
        cumRepos: end.repos,
        cumCommits: end.commits,
        commits: end.commits - (start ? start.commits : 0),
        accent: lastRel ? lastRel.accent : "#e9b872",
      });
    }

    const families = C.families
      .map((f) => ({ ...f, repos: f.repos.map((n) => repoBy.get(n)).filter(Boolean) }))
      .filter((f) => f.repos.length);

    const spotlights = (C.spotlights || []).map((n) => repoBy.get(n)).filter(Boolean);

    // Contributors to feature: honored people + the busiest + the longest-serving, at most 12.
    const yearsOf = (p) => Number((p.last || p.first).slice(0, 4)) - Number(p.first.slice(0, 4)) + 1;
    const crew = new Map();
    for (const hn of C.honored || []) if (people.has(hn.login)) crew.set(hn.login, people.get(hn.login));
    const byCommits = [...people.values()].sort((a, b) => b.commits - a.commits);
    const bySpan = byCommits.filter((p) => p.commits >= 50).sort((a, b) => yearsOf(b) - yearsOf(a) || b.commits - a.commits);
    for (const list of [byCommits.slice(0, 6), bySpan.slice(0, 6)]) for (const p of list) if (crew.size < 12) crew.set(p.login, p);
    const commitRank = new Map(byCommits.map((p, i) => [p.login, i + 1]));
    const crewList = [...crew.values()].sort((a, b) => a.first.localeCompare(b.first));
    for (const p of crewList) {
      p.years = yearsOf(p);
      p.tags = [];
      if (commitRank.get(p.login) <= 3) p.tags.push(`커밋 ${commitRank.get(p.login)}위`);
      if (p.first.slice(0, 4) === String(orgYear)) p.tags.push("첫 해부터");
      if (p.years >= 5) p.tags.push(`${p.years}년째 함께`);
    }

    // Tenure (version B): honored + busiest + longest-serving, up to 16, each with first/last activity.
    const recentCutoff = new Date(Date.parse(G.generated_at) - 120 * 864e5).toISOString().slice(0, 10);
    const tenureMap = new Map();
    for (const hn of C.honored || []) if (people.has(hn.login)) tenureMap.set(hn.login, people.get(hn.login));
    for (const list of [byCommits.slice(0, 10), bySpan.slice(0, 10)]) for (const p of list) if (tenureMap.size < 16) tenureMap.set(p.login, p);
    const tenure = [...tenureMap.values()]
      .map((p) => ({ ...p, lastSeen: p.last || p.first, active: (p.last || p.first) >= recentCutoff, years: yearsOf(p) }))
      .sort((a, b) => a.first.localeCompare(b.first) || b.commits - a.commits);

    const cloudNames = C.cloudNames || {};
    const clouds = (G.clouds || []).map((id) => ({ id, name: cloudNames[id] || id.toUpperCase() }));

    const orgCreated = new Date(G.org.created_at);
    const generated = new Date(G.generated_at);
    const yearsActive = Math.floor((generated - orgCreated) / (365.25 * 864e5));

    return {
      org: G.org,
      generatedAt: G.generated_at,
      repos,
      repoBy,
      releases,
      years,
      families,
      spotlights,
      growth,
      hasPrs,
      clouds,
      crew: crewList,
      tenure,
      firstCommit: G.first_commit || null,
      people: allPeople,
      peopleBy: people,
      stats: {
        yearsActive,
        orgSince: ym(G.org.created_at.slice(0, 10)),
        orgCreated: G.org.created_at.slice(0, 10),
        repos: G.repos.length,
        people: people.size,
        commits: last.commits,
        prs: last.prs,
        releases: releases.length,
        stars: G.repos.reduce((s, r) => s + r.stars, 0),
        clouds: clouds.length,
        firstRelease: releases[0],
        lastRelease: releases[releases.length - 1],
      },
    };
  }

  window.ShowModel = { build, ym, ymd };
})();
