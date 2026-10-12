// Event settings — edit these before the conference.
window.CB_CONFIG = {
  eventTitle: "Cloud-Barista Open Conference",
  edition: "",                 // e.g. "13th" -> shown with the title and in the HUD
  eventDate: "",               // e.g. "2026.11.20 (금)"
  venue: "",                   // e.g. "서울 aT센터"
  tagline: "함께 내려온 멀티클라우드 이야기",

  // Opening time. When set, the HUD and the final scene show a countdown.
  // ISO format with timezone, e.g. "2026-11-20T13:30:00+09:00". Leave "" to show a clock instead.
  startTime: "",

  speed: 1,                    // 1 = normal; URL ?speed=1.5 overrides
  showHud: true,               // bottom bar (logo · section · progress cup · countdown)

  // Scene order. Remove an entry to skip it.
  //   prologue      a bean, the first commit, the cup is brewed, the title
  //   cup           the numbers pour into the cup
  //   timeline      monthly commits with release codenames
  //   years         one chapter per year: releases, new repos, new contributors
  //   menu          the release menu (coffee → tea)
  //   shift         where the work went: commit share by project family, per year
  //   families      projects by family
  //   spotlights    top contributors of a few repos
  //   world         Cloud-Barista World: a pixel town growing through time (repos = buildings, people = residents)
  //   constellation the community graph growing through time (alternative to "world")
  //   crew          head baristas: honored, most active and longest-serving contributors
  //   wall          every contributor
  //   outro         "the cup is ready" + countdown
  scenes: ["prologue", "cup", "timeline", "years", "menu", "shift", "families", "spotlights", "world", "crew", "wall", "outro"],
};
