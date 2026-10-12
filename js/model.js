// Builds the show's data model from window.CB_GITHUB (collected) + window.CB_CURATED (hand-written).
(function () {
  function versionKey(tag) {
    const m = /^v?(\d+)\.(\d+)/.exec(tag);
    return m ? `v${m[1]}.${m[2]}` : tag;
  }
  const ym = (d) => d.slice(0, 7).replace("-", ".");
  const ymd = (d) => d.slice(0, 10).replace(/-/g, ".");

  function build(G, C) {
    const hidden = new Set(C.hiddenRepos || []);
    const people = new Map(G.people.map((p) => [p.login, { ...p, displayName: p.name || p.login }]));

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

    const years = [];
    let cumPeople = 0, cumRepos = 0;
    for (let y = orgYear; y <= nowYear; y++) {
      const yrRel = releases.filter((r) => r.year === y);
      const yrRepos = repos
        .filter((r) => r.year === y)
        .sort((a, b) => b.commits + b.stars * 20 - (a.commits + a.stars * 20));
      const yrPeople = allPeople.filter((p) => Number(p.first.slice(0, 4)) === y).sort((a, b) => b.commits - a.commits);
      const lastRel = yrRel[yrRel.length - 1];
      cumPeople += yrPeople.length;
      cumRepos += yrRepos.length;
      years.push({
        year: y,
        story: (C.years || {})[y] || { title: String(y), line: "" },
        releases: yrRel,
        conferences: (C.conferences || []).filter((c) => c.year === y),
        repos: yrRepos,
        people: yrPeople,
        cumPeople,
        cumRepos,
        commits: Object.entries(G.activity || {}).reduce((s, [m, n]) => (m.startsWith(String(y)) ? s + n : s), 0),
        accent: lastRel ? lastRel.accent : "#e9b872",
      });
    }

    const families = C.families
      .map((f) => ({ ...f, repos: f.repos.map((n) => repoBy.get(n)).filter(Boolean) }))
      .filter((f) => f.repos.length);

    const spotlights = (C.spotlights || []).map((n) => repoBy.get(n)).filter(Boolean);

    const months = Object.entries(G.activity || {}).map(([m, n]) => ({ m, n }));

    const totalCommits = G.people.reduce((s, p) => s + p.commits, 0);
    const totalStars = G.repos.reduce((s, r) => s + r.stars, 0);
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
      months,
      punch: G.punch || null,
      firstCommit: G.first_commit || null,
      people: allPeople,
      peopleBy: people,
      stats: {
        yearsActive,
        orgSince: ym(G.org.created_at.slice(0, 10)),
        orgCreated: G.org.created_at.slice(0, 10),
        repos: G.repos.length,
        activeRepos: repos.filter((r) => r.people.length).length,
        people: people.size,
        commits: totalCommits,
        releases: releases.length,
        stars: totalStars,
        firstRelease: releases[0],
        lastRelease: releases[releases.length - 1],
      },
    };
  }

  window.ShowModel = { build, ym, ymd };
})();
