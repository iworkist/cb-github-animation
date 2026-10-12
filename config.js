// Event settings — edit these before the conference.
window.CB_CONFIG = {
  eventTitle: "Cloud-Barista Open Conference",
  edition: "",                 // e.g. "13th" -> shown with the title
  eventDate: "",               // e.g. "2026.11.20 (금)"
  venue: "",                   // e.g. "서울 aT센터"
  tagline: "함께 내려온 멀티클라우드 이야기",

  // Opening time. When set, the HUD and the final scene show a countdown.
  // ISO format with timezone, e.g. "2026-11-20T13:30:00+09:00". Leave "" to show a clock instead.
  startTime: "",

  speed: 1,                    // 1 = normal; URL ?speed=1.5 overrides
  showHud: true,               // bottom bar (logo · section · progress cup · countdown)

  // Scene order. Remove an entry to skip it.
  //   prologue    the first commit, the cup is brewed, the title
  //   growth      contributors · repositories · commits · merged PRs, accumulating month by month
  //   clouds      one interface, many clouds (the clouds CB-Spider connects)
  //   years       one chapter per year: releases, new repos, new contributors
  //   menu        the release menu (coffee → tea)
  //   families    projects by family
  //   spotlights  top contributors of a few repos
  //   village     the open-source village growing through time (repos = houses, people = residents)
  //   crew        head baristas: honored, most active and longest-serving contributors
  //   wall        every contributor
  //   outro       "the cup is ready" + countdown
  scenes: ["prologue", "growth", "clouds", "years", "menu", "families", "spotlights", "village", "crew", "wall", "outro"],
};
