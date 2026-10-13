// Hand-written content layered on top of data/data.js (GitHub data, generated).
// Edit freely: wording, colors, project groups. Repos not listed here still appear with their GitHub description.
window.CB_CURATED = {
  // Release codenames (matched against the cloud-barista repo's release names).
  // drink = color of the drink in the pixel cup, accent = readable highlight on the dark background.
  releases: {
    americano:  { name: "Americano",  ko: "아메리카노", kind: "coffee", drink: "#3b1f0e", foam: "#a8743f", accent: "#e0a86c" },
    cappuccino: { name: "Cappuccino", ko: "카푸치노",   kind: "coffee", drink: "#a8743f", foam: "#f3e3c8", accent: "#e8c49c" },
    espresso:   { name: "Espresso",   ko: "에스프레소", kind: "coffee", drink: "#2a140a", foam: "#c8894a", accent: "#d08c52" },
    mocha:      { name: "Café Mocha", ko: "카페모카",   kind: "coffee", drink: "#5a2e1a", foam: "#fff6ea", accent: "#dba07a" },
    affogato:   { name: "Affogato",   ko: "아포가토",   kind: "coffee", drink: "#f6ecd6", foam: "#5a2e1a", accent: "#f3dca8" },
    latte:      { name: "Cafe Latte", ko: "카페라떼",   kind: "coffee", drink: "#c9a079", foam: "#fbf1e2", accent: "#ecc99d" },
    cortado:    { name: "Cortado",    ko: "코르타도",   kind: "coffee", drink: "#8a5a32", foam: "#e9d2b0", accent: "#e3a866" },
    chamomile:  { name: "Chamomile",  ko: "캐모마일",   kind: "tea", drink: "#f2d64b", accent: "#f5d96b" },
    cinnamon:   { name: "Cinnamon",   ko: "시나몬",     kind: "tea", drink: "#b5562a", accent: "#f09062" },
    darjeeling: { name: "Darjeeling", ko: "다즐링",     kind: "tea", drink: "#c8862a", accent: "#f2ab5e" },
    earlgrey:   { name: "Earl Grey",  ko: "얼그레이",   kind: "tea", drink: "#7a3f1c", accent: "#c9a8ff" },
    ginger:     { name: "Ginger",     ko: "진저",       kind: "tea", drink: "#e0b040", accent: "#f4c552" },
    hibiscus:   { name: "Hibiscus",   ko: "히비스커스", kind: "tea", drink: "#c2183f", accent: "#ff7a9a" },
  },

  // Open conferences (cloud-barista.github.io/blog). Add the next one here once it has happened.
  conferences: [
    { n: 1,  date: "2019-12", label: "1st Open Seminar" },
    { n: 2,  date: "2020-05", label: "2nd Open Conference" },
    { n: 3,  date: "2020-11", label: "3rd Open Conference" },
    { n: 4,  date: "2021-06", label: "4th Open Conference" },
    { n: 5,  date: "2021-11", label: "5th Open Conference" },
    { n: 6,  date: "2022-06", label: "6th Open Conference" },
    { n: 7,  date: "2022-11", label: "7th Open Conference" },
    { n: 8,  date: "2023-11", label: "8th Open Conference" },
    { n: 9,  date: "2024-06", label: "9th Open Conference" },
    { n: 10, date: "2024-10", label: "10th Open Conference" },
    { n: 11, date: "2025-06", label: "11th Open Conference" },
  ],

  // One chapter per year: a title in coffee terms and one line of what happened.
  years: {
    2019: { title: "첫 원두를 고르다", line: "GitHub 조직을 열고 PoC로 시작해, CB-Spider와 CB-Tumblebug이 태어난 해" },
    2020: { title: "추출을 시작하다", line: "Cappuccino와 Espresso — 쿠버네티스, 운영 도구, 지도 UI까지 프레임워크가 늘어나다" },
    2021: { title: "커뮤니티가 모이다", line: "Coffeehouse와 CI/CD, 국내 클라우드 SDK — 가장 많은 사람이 함께한 해" },
    2022: { title: "깊어지는 맛", line: "Cafe Latte와 Cortado — NHN Cloud·KT Cloud VPC까지, 더 넓은 클라우드로" },
    2023: { title: "커피에서 차로, 새로운 블렌드", line: "릴리스 이름이 차(Tea)로 — 클라우드 마이그레이션 Cloud-Migrator 출범" },
    2024: { title: "옮기는 것을 넘어 넓히는 것으로", line: "Cinnamon과 Darjeeling — 데이터 마이그레이션, 공통 모델, API 허브" },
    2025: { title: "한 잔 더 진하게", line: "Earl Grey와 Ginger — 플랫폼을 다듬고, 서비스로 넓히다" },
    2026: { title: "AI를 위한 멀티클라우드", line: "Hibiscus, 그리고 이기종 AI 가속기를 아우르는 AI-MCMP의 시작" },
  },

  // Turning points marked on the "at a glance" timeline: a repo's creation date, or the first repo with a prefix.
  milestones: [
    { repo: "cb-spider", label: "CB-Spider · CB-Tumblebug" },
    { prefix: "cm-", label: "Cloud-Migrator" },
    { prefix: "ai-", label: "AI-MCMP" },
  ],

  // "How it works": clouds are the beans, the frameworks are the barista's tools.
  blend: {
    grinder: { repo: "cb-spider", title: "CB-Spider", role: "그라인더", line: "어떤 원두든 같은 입자로 — 모든 클라우드를 하나의 인터페이스로" },
    machine: { repo: "cb-tumblebug", title: "CB-Tumblebug", role: "에스프레소 머신", line: "여러 클라우드를 하나의 인프라처럼 — 한 번에 추출하고 관리" },
    drinks: [
      { repo: "cloud-migrator", title: "Cloud-Migrator", line: "클라우드 마이그레이션", drink: "#7cc4ff" },
      { repo: "ai-mcmp", title: "AI-MCMP", line: "AI 멀티클라우드", drink: "#ff7a9a" },
      { repo: "mc-terrarium", title: "MC-Terrarium", line: "인프라 확장 (OpenTofu)", drink: "#62d49b" },
      { repo: "cb-mapui", title: "CB-MapUI", line: "지도로 보는 멀티클라우드", drink: "#f5d96b" },
    ],
  },

  // Cloud drivers in CB-Spider: display name + sack label color.
  clouds: {
    aws: { name: "AWS", color: "#ff9900" }, azure: { name: "Azure", color: "#2f8fe0" }, gcp: { name: "Google Cloud", color: "#4caf50" },
    alibaba: { name: "Alibaba", color: "#ff6a00" }, tencent: { name: "Tencent", color: "#2f7bf5" }, ibm: { name: "IBM", color: "#4f7cff" },
    oracle: { name: "Oracle", color: "#e8412c" }, openstack: { name: "OpenStack", color: "#ed1944" }, ncp: { name: "NAVER Cloud", color: "#03c75a" },
    nhn: { name: "NHN Cloud", color: "#4a7bff" }, kt: { name: "KT Cloud", color: "#ff4646" }, ktclassic: { name: "KT Classic", color: "#d93a3a" },
  },

  // Insect-named repositories: the "Bug Dex".
  bugs: {
    "cb-spider":      { ko: "거미",       line: "모든 클라우드를 실로 잇는 연동 프레임워크" },
    "cb-tumblebug":   { ko: "쇠똥구리",   line: "멀티클라우드 인프라를 굴리는 오케스트레이터" },
    "cb-dragonfly":   { ko: "잠자리",     line: "멀티클라우드 통합 모니터링" },
    "cb-ladybug":     { ko: "무당벌레",   line: "멀티클라우드 쿠버네티스 런타임" },
    "cb-larva":       { ko: "애벌레",     line: "핵심 기술을 키우는 인큐베이터" },
    "cm-beetle":      { ko: "딱정벌레",   line: "목표 인프라 추천과 마이그레이션" },
    "cm-grasshopper": { ko: "메뚜기",     line: "소프트웨어 마이그레이션" },
    "cm-damselfly":   { ko: "실잠자리",   line: "마이그레이션 모델 관리" },
    "cm-ant":         { ko: "개미",       line: "성능·비용 평가와 예측" },
    "cm-mayfly":      { ko: "하루살이",   line: "Cloud-Migrator 운영 도구" },
    "cm-honeybee":    { ko: "꿀벌",       line: "소스 환경 정보 수집" },
    "cm-cicada":      { ko: "매미",       line: "마이그레이션 워크플로" },
    "cm-butterfly":   { ko: "나비",       line: "웹 포털과 개방형 API" },
    "cm-centipede":   { ko: "지네",       line: "데이터 마이그레이션 실행" },
  },

  // Display title per repo (used for chips and the hero cards). Unlisted repos use their name.
  titles: {
    "cb-spider": "CB-Spider", "cb-tumblebug": "CB-Tumblebug", "cb-mapui": "CB-MapUI", "cloud-barista": "Cloud-Barista",
    "cb-log": "CB-Log", "cb-store": "CB-Store", "cb-client": "CB-Client", "cb-ladybug": "CB-Ladybug",
    "cb-dragonfly": "CB-Dragonfly", "cb-larva": "CB-Larva", "cb-webtool": "CB-Webtool", "cb-operator": "CB-Operator",
    "cb-milkyway": "CB-Milkyway", "cloud-migrator": "Cloud-Migrator", "cm-honeybee": "CM-Honeybee", "cm-beetle": "CM-Beetle",
    "cm-grasshopper": "CM-Grasshopper", "cm-centipede": "CM-Centipede", "cm-damselfly": "CM-Damselfly", "cm-cicada": "CM-Cicada",
    "cm-ant": "CM-Ant", "cm-butterfly": "CM-Butterfly", "cm-mayfly": "CM-Mayfly", "cm-model": "CM-Model",
    "cm-data-mold": "CM-Data-Mold", "mc-terrarium": "MC-Terrarium", "mc-data-manager": "MC-Data-Manager",
    "ai-mcmp": "AI-MCMP", "ai-ui": "AI-UI", "ai-ops": "AI-Ops", "ai-app": "AI-App", "ai-ha": "AI-HA", "ai-o11y": "AI-O11y",
    "ai-adm": "AI-Adm", "mc-meta-365": "MC-Meta 365", "cloud-barista.github.io": "Homepage", docs: "Docs", "cb-coffeehouse": "CB-Coffeehouse",
    api: "API Hub", "poc-farmoni": "PoC Farmoni",
  },

  // Never shown (forks of unrelated projects / org plumbing).
  hiddenRepos: [".github", "cb-tumblebug-dashboard", "cloud-barista.github.com"],

  // QR code (29x29, error correction M) for the last screens. Regenerate if the URL changes.
  qr: {
    url: "https://github.com/cloud-barista",
    rows: ["11111110110010110010001111111","10000010010110001100101000001","10111010100100100000101011101","10111010101000010101101011101","10111010010110001101101011101","10000010100001100010101000001","11111110101010101010101111111","00000000100110001001100000000","11010011011001010011011101101","00110100111011000001000011001","00101010111100111001010100111","00100100011101100011011100101","11101011000011111110100111001","11000100111000100011100101101","10011010010011011111101100100","10010101110010101010000011000","01101111001101110110110011001","01011001111011100001100010000","01100110011100011011100000001","10011100010001111000001001001","10100010010000111010111110111","00000000001100010000100011011","11111110110101110011101010001","10000010011000010111100011110","10111010010100011011111111000","10111010100010001100111101010","10111010001011100111110010100","10000010101001111100011010011","11111110110101100000010101100"],
  },
};
