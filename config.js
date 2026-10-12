// Event settings — edit these before the conference.
window.CB_CONFIG = {
  eventTitle: "Cloud-Barista Open Conference",
  edition: "",                 // e.g. "13th" -> shown as a kicker above the title
  eventDate: "",               // e.g. "2026.11.20 (금)"
  venue: "",                   // e.g. "서울 aT센터"
  tagline: "함께 내려온 멀티클라우드 이야기",

  // Opening time. When set, the HUD and the final scene show a countdown.
  // ISO format with timezone, e.g. "2026-11-20T13:30:00+09:00". Leave "" to show a clock instead.
  startTime: "",

  speed: 1,                    // 1 = normal; URL ?speed=1.5 overrides
  showHud: true,               // bottom bar (logo · section · countdown)

  // Scene order. Remove an entry to skip it.
  scenes: ["intro", "numbers", "activity", "years", "menu", "families", "spotlights", "wall", "outro"],
};
