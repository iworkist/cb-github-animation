// Boot: pick a version (URL ?v=, config.version, or the chooser screen) and start the show.
(function () {
  const cfg = window.CB_CONFIG;
  const loading = document.getElementById("loading");
  if (!window.CB_GITHUB) {
    loading.textContent = "data/data.js 가 없습니다 — python3 scripts/collect.py 를 먼저 실행하세요";
    return;
  }
  const model = window.ShowModel.build(window.CB_GITHUB, window.CB_CURATED);

  const VERSIONS = {
    a: {
      key: "1", name: "A · Coffee Journey",
      desc: "따뜻한 다크 톤. 한 잔의 커피처럼 내려온 이야기 — 누적 성장, 연도별 챕터, 릴리스 메뉴판, 프로젝트 카드, 오픈소스 빌리지, 기여자 사진.",
      meta: "약 6분 20초 · 11개 장면",
      previews: ["assets/preview-a.jpg"],
    },
    b: {
      key: "2", name: "B · Open Source Index",
      desc: "밝은 에디토리얼 톤. 큰 숫자 한 장씩, 7년을 가로지르는 타임라인 리본, 플랫폼 구조, 프로젝트 인덱스, 기여자 연대기와 명부.",
      meta: "약 3분 10초 · 8개 장면",
      previews: ["assets/preview-b.jpg"],
    },
    ab: {
      key: "3", name: "A ↔ B 번갈아 재생",
      desc: "A를 한 바퀴, 이어서 B를 한 바퀴 — 대기 시간이 길 때 같은 화면이 반복되지 않도록.",
      meta: "약 9분 30초 · 19개 장면",
      previews: ["assets/preview-a.jpg", "assets/preview-b.jpg"],
    },
  };
  const AUTO_START_SEC = 30;

  const params = new URLSearchParams(location.search);
  const chosen = (params.get("v") || (params.has("choose") ? "" : cfg.version || "")).toLowerCase();
  if (VERSIONS[chosen]) play(chosen);
  else showChooser();

  function play(v) {
    const parts = [];
    if (v.includes("a")) parts.push(["a", window.ShowScenesA.build(model, cfg)]);
    if (v.includes("b")) parts.push(["b", window.ShowScenesB.build(model, cfg)]);
    const playlist = parts.flatMap(([ver, s]) => s.playlist.map((item) => ({ ...item, version: ver, theme: ver })));
    const sections = Object.fromEntries(parts.map(([ver, s]) => [ver, s.sections]));
    document.body.dataset.theme = playlist[0].theme;
    window.Show.run({ cfg, playlist, sections, preload: parts[0][1].preload });
  }

  function choose(v) {
    const p = new URLSearchParams(location.search);
    p.delete("choose");
    p.set("v", v);
    location.search = p.toString();
  }

  function showChooser() {
    const { h } = window.Show;
    loading.remove();
    const fallback = VERSIONS[cfg.version] ? cfg.version : "a";
    const autoEl = h("b", null, String(AUTO_START_SEC));
    const box = h("div", { id: "chooser" },
      h("h1", null, `${cfg.eventTitle} — 오프닝 루프`),
      h("div", "sub", "재생할 버전을 고르세요. 고른 버전은 주소(?v=)에 남아서 새로 고침해도 유지됩니다."),
      h("div", "opts", Object.entries(VERSIONS).map(([id, v]) => {
        const btn = h("button", { class: "opt", type: "button" },
          h("div", { class: "pv" + (v.previews.length > 1 ? " split" : "") }, v.previews.map((src) => h("img", { src, alt: "" }))),
          h("div", "nm", h("span", "key", v.key), v.name),
          h("div", "ds", v.desc),
          h("div", "mt", v.meta));
        btn.addEventListener("click", () => choose(id));
        return btn;
      })),
      h("div", "auto", "키보드 1 · 2 · 3 또는 클릭 · 재생 중에 V를 누르면 이 화면으로 돌아옵니다 · ", autoEl, `초 뒤 ${VERSIONS[fallback].name} 자동 재생`));
    document.body.append(box);
    box.querySelector(".opt").focus();

    const keys = Object.fromEntries(Object.entries(VERSIONS).map(([id, v]) => [v.key, id]));
    window.addEventListener("keydown", (e) => { if (keys[e.key]) choose(keys[e.key]); });
    let left = AUTO_START_SEC;
    const timer = setInterval(() => {
      left -= 1;
      autoEl.textContent = String(left);
      if (left <= 0) { clearInterval(timer); choose(fallback); }
    }, 1000);
  }
})();
