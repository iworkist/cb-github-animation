// Hand-curated content layered on top of data/data.js (GitHub data).
// Edit freely: wording, families, year stories. Repos not listed here still appear with their GitHub description.
window.CB_CURATED = {
  // Release codenames. liquid = color of the drink in the cup icon, accent = readable highlight on dark bg.
  releases: {
    "v0.1":  { name: "Americano",  ko: "아메리카노",   kind: "coffee", liquid: "#4a2c1a", accent: "#e0a86c" },
    "v0.2":  { name: "Cappuccino", ko: "카푸치노",     kind: "coffee", liquid: "#c9a27e", accent: "#e8c49c" },
    "v0.3":  { name: "Espresso",   ko: "에스프레소",   kind: "coffee", liquid: "#3a1d0e", accent: "#d08c52" },
    "v0.4":  { name: "Café Mocha", ko: "카페모카",     kind: "coffee", liquid: "#6b3f2a", accent: "#dba07a" },
    "v0.5":  { name: "Affogato",   ko: "아포가토",     kind: "coffee", liquid: "#f3e6c8", accent: "#f3dca8" },
    "v0.6":  { name: "Cafe Latte", ko: "카페라떼",     kind: "coffee", liquid: "#d8b48c", accent: "#ecc99d" },
    "v0.7":  { name: "Cortado",    ko: "코르타도",     kind: "coffee", liquid: "#a8743f", accent: "#e3a866" },
    "v0.8":  { name: "Chamomile",  ko: "캐모마일",     kind: "tea",    liquid: "#f0cf5a", accent: "#f5d96b" },
    "v0.9":  { name: "Cinnamon",   ko: "시나몬",       kind: "tea",    liquid: "#b8582c", accent: "#f09062" },
    "v0.10": { name: "Darjeeling", ko: "다즐링",       kind: "tea",    liquid: "#c9813a", accent: "#f2ab5e" },
    "v0.11": { name: "Earl Grey",  ko: "얼그레이",     kind: "tea",    liquid: "#8a5a33", accent: "#bca8e6" },
    "v0.12": { name: "Ginger",     ko: "진저",         kind: "tea",    liquid: "#e2a33a", accent: "#f4c552" },
    "v0.13": { name: "Hibiscus",   ko: "히비스커스",   kind: "tea",    liquid: "#c2264f", accent: "#ff7a9a" },
  },

  // Open conferences, from the community homepage (cloud-barista.github.io/blog).
  conferences: [
    { n: 1,  year: 2019, label: "1st Open Seminar · Americano" },
    { n: 2,  year: 2020, label: "2nd Open Conference · Cappuccino" },
    { n: 3,  year: 2020, label: "3rd Open Conference · Espresso" },
    { n: 4,  year: 2021, label: "4th Open Conference · Café Mocha" },
    { n: 5,  year: 2021, label: "5th Open Conference · Affogato" },
    { n: 6,  year: 2022, label: "6th Open Conference · Cafe Latte" },
    { n: 7,  year: 2022, label: "7th Open Conference · Cortado" },
    { n: 8,  year: 2023, label: "8th Open Conference · Chamomile" },
    { n: 9,  year: 2024, label: "9th Open Conference · Cinnamon" },
    { n: 10, year: 2024, label: "10th Open Conference · Darjeeling" },
    { n: 11, year: 2025, label: "11th Open Conference · Earl Grey" },
  ],

  // One short story per year (title + one line).
  years: {
    2019: { title: "첫 원두를 고르다", line: "GitHub 조직을 만들고 PoC로 시작해, CB-Spider와 CB-Tumblebug이 태어난 해" },
    2020: { title: "추출을 시작하다", line: "Cappuccino와 Espresso — 쿠버네티스, 운영 도구, 지도 UI까지 프레임워크가 늘어나다" },
    2021: { title: "커뮤니티가 모이다", line: "가장 많은 기여자가 합류한 해 — Coffeehouse와 CI/CD, 국내 CSP SDK" },
    2022: { title: "깊어지는 맛", line: "Cafe Latte와 Cortado — NHN Cloud·KT Cloud VPC 연동으로 더 넓은 클라우드로" },
    2023: { title: "커피에서 차로, 새로운 블렌드", line: "릴리스 코드네임이 차(Tea)로 — 클라우드 마이그레이션 Cloud-Migrator 출범" },
    2024: { title: "이전을 넘어 확장으로", line: "Cinnamon과 Darjeeling — 데이터 마이그레이션, 공통 모델, API 허브" },
    2025: { title: "한 잔 더 진하게", line: "Earl Grey와 Ginger — 플랫폼을 다듬고 서비스로 확장하다" },
    2026: { title: "AI를 위한 멀티클라우드", line: "Hibiscus, 그리고 이기종 AI 가속기를 아우르는 AI-MCMP의 시작" },
  },

  // Project families shown as "프로젝트별" scenes, in order.
  families: [
    {
      id: "core", short: "Core", kicker: "CLOUD-BARISTA CORE", title: "멀티클라우드 공통 플랫폼",
      line: "모든 클라우드를 하나의 인터페이스로 연결하고, 하나의 클라우드처럼 관리합니다",
      color: "#e9b872",
      repos: ["cb-spider", "cb-tumblebug", "cb-mapui", "cloud-barista", "cb-log", "cb-store", "cb-client", "cb-fw-template"],
    },
    {
      id: "pioneers", short: "Pioneers", kicker: "PIONEERS", title: "함께 길을 연 프레임워크",
      line: "지금은 쉬고 있지만, Cloud-Barista의 가능성을 넓혀 준 프레임워크들",
      color: "#e8763c",
      repos: ["cb-ladybug", "cb-dragonfly", "cb-larva", "cb-webtool", "cb-operator", "cb-milkyway"],
    },
    {
      id: "migrator", short: "Cloud-Migrator", kicker: "CLOUD-MIGRATOR", title: "클라우드 마이그레이션 통합 플랫폼",
      line: "인프라·소프트웨어·데이터를 한 번에 스캔하고, 멀티클라우드로 옮깁니다",
      color: "#7cc4ff",
      repos: ["cloud-migrator", "cm-honeybee", "cm-beetle", "cm-grasshopper", "cm-centipede", "cm-damselfly", "cm-cicada", "cm-ant", "cm-butterfly", "cm-mayfly", "cm-model", "cm-data-mold"],
    },
    {
      id: "ecosystem", short: "Ecosystem", kicker: "MULTI-CLOUD ECOSYSTEM", title: "확장과 연동",
      line: "OpenTofu 기반 인프라 확장, 데이터 관리, 그리고 국내 클라우드 SDK",
      color: "#62d49b",
      repos: ["mc-terrarium", "mc-data-manager", "mc-meta-365", "ktcloud-sdk-go", "ktcloudvpc-sdk-go", "nhncloud-sdk-go"],
    },
    {
      id: "ai", short: "AI-MCMP", kicker: "AI-MCMP · NEW IN 2026", title: "AI 멀티클라우드 관리 플랫폼",
      line: "GPU·NPU·ASIC 등 이기종 AI 가속기를 여러 클라우드에 걸쳐 하나로",
      color: "#ff7a9a",
      repos: ["ai-mcmp", "ai-ui", "ai-ops", "ai-app", "ai-ha", "ai-o11y", "ai-adm"],
    },
    {
      id: "community", short: "Community", kicker: "COMMUNITY", title: "함께 나누는 공간",
      line: "문서, 홈페이지, API 허브, 그리고 지식을 나누는 Coffeehouse",
      color: "#f5d96b",
      repos: ["cloud-barista.github.io", "docs", "cb-coffeehouse", "api", "cb-tumblebug-api-web", "cb-ladybug-api-web", "archive"],
    },
    {
      id: "poc", short: "PoC", kicker: "PROOF OF CONCEPT", title: "실험과 검증",
      line: "모든 프레임워크는 작은 PoC에서 시작했습니다",
      color: "#ad8cf5",
      repos: ["poc-farmoni", "poc-cb-spider", "poc-mcism", "poc-specialized_services", "poc-cb-ladybug", "poc-cicd-spider", "poc-cicd-tumblebug", "poc-cicd-ladybug", "poc-cicd-dashboard", "poc-cicd-mcks-dashboard"],
    },
  ],

  // Deep-dive scenes with a top-contributor chart.
  spotlights: ["cb-spider", "cb-tumblebug", "cm-beetle"],

  // Display names for the cloud drivers found in CB-Spider (cloud-control-manager/cloud-driver/drivers).
  cloudNames: {
    aws: "AWS", azure: "Microsoft Azure", gcp: "Google Cloud", alibaba: "Alibaba Cloud", tencent: "Tencent Cloud",
    ibm: "IBM Cloud", oracle: "Oracle Cloud", openstack: "OpenStack", ncp: "NAVER Cloud", nhn: "NHN Cloud",
    kt: "KT Cloud", ktclassic: "KT Cloud Classic",
  },

  // People to feature in the "Head Baristas" scene (shown with their Korean name), alongside the
  // most active and longest-serving contributors. Order doesn't matter: cards sort by first contribution.
  honored: [
    { login: "powerkimhub", ko: "김병섭" },
    { login: "seokho-son", ko: "손석호" },
    { login: "innodreamer", ko: "오병택" },
    { login: "dongjae", ko: "강동재" },
    { login: "Youngwoo-Jung", ko: "정영우" },
    { login: "yunkon-kim", ko: "김윤곤" },
    { login: "iworkist", ko: "박재홍" },
    { login: "hanizang77", ko: "장한이" },
  ],

  // Never shown (forks of unrelated projects / org plumbing).
  hiddenRepos: [".github", "cb-tumblebug-dashboard", "cloud-barista.github.com"],

  // Display title + Korean one-liner per repo.
  repos: {
    "cb-spider":            { title: "CB-Spider",        ko: "모든 클라우드를 하나의 인터페이스로 연결하는 멀티클라우드 연동 프레임워크" },
    "cb-tumblebug":         { title: "CB-Tumblebug",     ko: "이종 멀티클라우드 인프라를 하나의 클라우드처럼 관리하는 오케스트레이터" },
    "cb-mapui":             { title: "CB-MapUI",         ko: "지도 기반으로 멀티클라우드 인프라를 보고 제어하는 시각화 콘솔" },
    "cloud-barista":        { title: "Cloud-Barista",    ko: "멀티클라우드 서비스 공통 플랫폼 — 릴리스 통합 저장소" },
    "cb-log":               { title: "CB-Log",           ko: "Cloud-Barista 공통 로깅 라이브러리 (CB-Bridge)" },
    "cb-store":             { title: "CB-Store",         ko: "메타 정보를 위한 통합 저장소 인터페이스 (CB-Bridge)" },
    "cb-client":            { title: "CB-Client",        ko: "Cloud-Barista 클라이언트 라이브러리와 CLI" },
    "cb-fw-template":       { title: "CB-FW-Template",   ko: "새 Cloud-Barista 프레임워크를 위한 템플릿" },
    "cb-ladybug":           { title: "CB-Ladybug",       ko: "멀티클라우드 쿠버네티스 서비스를 지원하는 애플리케이션 런타임" },
    "cb-dragonfly":         { title: "CB-Dragonfly",     ko: "멀티클라우드 통합 모니터링 프레임워크" },
    "cb-larva":             { title: "CB-Larva",         ko: "멀티클라우드 핵심 기술을 연구하는 인큐베이터" },
    "cb-webtool":           { title: "CB-Webtool",       ko: "Cloud-Barista 웹 기반 관리 도구" },
    "cb-operator":          { title: "CB-Operator",      ko: "Cloud-Barista 시스템 운영 도구" },
    "cb-milkyway":          { title: "CB-Milkyway",      ko: "CSP별 IaaS 사양을 벤치마크하는 에이전트" },
    "cloud-migrator":       { title: "Cloud-Migrator",   ko: "클라우드 마이그레이션 통합 플랫폼 — 통합 저장소" },
    "cm-honeybee":          { title: "CM-Honeybee",      ko: "소스 환경의 인프라·SW·데이터 정보를 수집하고 집계" },
    "cm-beetle":            { title: "CM-Beetle",        ko: "최적의 목표 인프라를 추천하고 컴퓨팅 인프라 마이그레이션을 실행" },
    "cm-grasshopper":       { title: "CM-Grasshopper",   ko: "패키지·컨테이너 이미지 등 소프트웨어 마이그레이션" },
    "cm-centipede":         { title: "CM-Centipede",     ko: "데이터 마이그레이션 실행과 성능·안정성 관리" },
    "cm-damselfly":         { title: "CM-Damselfly",     ko: "마이그레이션 모델 명세·버전·사용자 모델 관리" },
    "cm-cicada":            { title: "CM-Cicada",        ko: "Airflow 기반 마이그레이션 워크플로 관리" },
    "cm-ant":               { title: "CM-Ant",           ko: "마이그레이션 전후의 성능과 비용을 평가·예측" },
    "cm-butterfly":         { title: "CM-Butterfly",     ko: "웹 GUI 포털과 REST 기반 개방형 인터페이스" },
    "cm-mayfly":            { title: "CM-Mayfly",        ko: "Cloud-Migrator 시스템 운영 도구" },
    "cm-model":             { title: "CM-Model",         ko: "마이그레이션 소스·타깃 공통 모델 라이브러리" },
    "cm-data-mold":         { title: "CM-Data-Mold",     ko: "데이터 마이그레이션 검증 환경과 테스트 데이터 생성" },
    "mc-terrarium":         { title: "MC-Terrarium",     ko: "OpenTofu로 멀티클라우드 인프라를 확장하는 인프라 테라리움" },
    "mc-data-manager":      { title: "MC-Data-Manager",  ko: "데이터 마이그레이션 검증과 테스트 데이터 관리" },
    "mc-meta-365":          { title: "MC-Meta 365",      ko: "MC-Meta의 온라인 서비스 버전" },
    "ktcloud-sdk-go":       { title: "KT Cloud SDK",     ko: "KT Cloud G1/G2 Open API용 Go SDK" },
    "ktcloudvpc-sdk-go":    { title: "KT Cloud VPC SDK", ko: "KT Cloud VPC 연동 드라이버용 Go SDK" },
    "nhncloud-sdk-go":      { title: "NHN Cloud SDK",    ko: "NHN Cloud 연동 드라이버용 Go SDK" },
    "ai-mcmp":              { title: "AI-MCMP",          ko: "이기종 AI 가속기를 아우르는 AI 멀티클라우드 관리 플랫폼" },
    "ai-ui":                { title: "AI-UI",            ko: "AI-MCMP 웹 콘솔" },
    "ai-ops":               { title: "AI-Ops",           ko: "운영과 워크플로 관리" },
    "ai-app":               { title: "AI-App",           ko: "AI 애플리케이션 관리" },
    "ai-ha":                { title: "AI-HA",            ko: "고가용성 관리" },
    "ai-o11y":              { title: "AI-O11y",          ko: "관측성과 모니터링" },
    "ai-adm":               { title: "AI-Adm",           ko: "관리자 CLI" },
    "cloud-barista.github.io": { title: "Homepage",      ko: "Cloud-Barista 커뮤니티 홈페이지" },
    "docs":                 { title: "Docs",             ko: "Cloud-Barista 커뮤니티 자료 저장소" },
    "cb-coffeehouse":       { title: "CB-Coffeehouse",   ko: "기술 지식을 나누고 토론하는 열린 공간" },
    "api":                  { title: "API Hub",          ko: "Cloud-Barista API 문서 허브 (Swagger UI)" },
    "cb-tumblebug-api-web": { title: "Tumblebug API Web", ko: "CB-Tumblebug 개발자 API 문서 사이트" },
    "cb-ladybug-api-web":   { title: "Ladybug API Web",  ko: "CB-Ladybug 개발자 API 문서 사이트" },
    "archive":              { title: "Archive",          ko: "Cloud-Barista 릴리스 보관소" },
    "poc-farmoni":          { title: "PoC Farmoni",      ko: "Cloud-Barista의 첫 번째 개념 검증" },
    "poc-cb-spider":        { title: "PoC CB-Spider",    ko: "멀티클라우드 연동의 첫 실험" },
    "poc-mcism":            { title: "PoC MCISM",        ko: "멀티클라우드 인프라 서비스(MCIS) 관리 검증" },
    "poc-specialized_services": { title: "PoC Specialized Services", ko: "MCIS 기반 특화 서비스 검증" },
    "poc-cb-ladybug":       { title: "PoC CB-Ladybug",   ko: "CB-Ladybug 개념 검증" },
    "poc-cicd-spider":      { title: "PoC CI/CD Spider", ko: "CB-Spider CI/CD 파이프라인 검증" },
    "poc-cicd-tumblebug":   { title: "PoC CI/CD Tumblebug", ko: "CB-Tumblebug CI/CD 파이프라인 검증" },
    "poc-cicd-ladybug":     { title: "PoC CI/CD Ladybug", ko: "CB-Ladybug CI/CD 파이프라인 검증" },
    "poc-cicd-dashboard":   { title: "PoC CI/CD Dashboard", ko: "CI/CD 결과 대시보드" },
    "poc-cicd-mcks-dashboard": { title: "PoC MCKS Dashboard", ko: "멀티클라우드 쿠버네티스 CI/CD 대시보드" },
  },
};
