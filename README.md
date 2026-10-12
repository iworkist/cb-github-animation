# Cloud-Barista Journey — 오프닝 루프 애니메이션

Cloud-Barista 컨퍼런스 본 행사 전, 행사장 스크린에 계속 반복 재생하는 애니메이션입니다.
[github.com/cloud-barista](https://github.com/cloud-barista)의 실제 데이터(레포지토리, 기여자 사진, 릴리스, 커밋 기록)로
"7년 동안 커뮤니티가 함께 내린 한 잔의 커피"라는 하나의 이야기를, 레트로 게임처럼 들려줍니다 —
STAGE 2019부터 2026까지, 레포지토리는 건물이 되고 기여자는 마을 주민(캐릭터)이 되어 레벨업합니다.

- 1920×1080 무대를 어떤 화면에도 비율 유지하며 맞춤 (16:9 권장)
- **완전 오프라인 동작**: 기여자 사진·폰트·데이터가 모두 로컬에 있음 (인터넷 불필요)
- 한 바퀴 약 **6분 30초**, 끝나면 처음부터 자동 반복. 장면 사이는 커피가 차오르는 듯한 물결 전환

## 웹으로 보기

**https://iworkist.github.io/cb-github-animation/**

- GitHub Pages로 배포되며, 브라우저로 열고 **F** 키를 누르면 전체화면입니다
- GitHub Actions가 매일 03시, 15시(KST)에 데이터를 다시 수집해서 바뀐 내용이 있으면 커밋하고 사이트에 반영합니다
  (Actions 탭 → *Refresh data & deploy* → *Run workflow*로 즉시 갱신 가능)
- 행사장에서는 네트워크 문제에 대비해 로컬 실행(`./start.sh`)을 권장합니다

## 로컬 실행

```bash
./start.sh            # Chrome 키오스크(전체화면) 모드로 실행
./start.sh --window   # 리허설용 일반 창
```

또는 `index.html`을 브라우저로 바로 열고 **F** 키로 전체화면 (서버 없이도 동작).

### 키보드

| 키 | 동작 |
|---|---|
| `→` / `PageDown` | 다음 장면 |
| `←` / `PageUp` | 이전 장면 |
| `Space` | 일시정지 / 재개 |
| `F` | 전체화면 |
| `H` | 하단 바 숨기기 / 보이기 |

마우스를 2초간 움직이지 않으면 커서가 숨겨집니다.

### URL 옵션

| 옵션 | 예시 | 설명 |
|---|---|---|
| `scene` | `?scene=year-2021` | 특정 장면부터 시작 (`prologue`, `cup`, `timeline`, `year-2019`…, `menu`, `shift`, `family-core`…, `spot-cb-spider`…, `constellation`, `wall`, `outro`) |
| `speed` | `?speed=1.5` | 재생 속도 |
| `freeze` | `?scene=wall&freeze=9000` | 장면 시작 후 N ms에서 멈춤 (스크린샷·리허설용) |
| `once` | `?once` | 한 바퀴만 재생 |

## 행사 전에 꼭 할 일 — `config.js`

```js
eventTitle: "Cloud-Barista Open Conference",
edition: "13th",                          // 회차 (예: "13th")
eventDate: "2026.11.20 (금)",
venue: "서울 ○○센터",
startTime: "2026-11-20T13:30:00+09:00",   // 설정하면 하단 바와 마지막 장면에 '오프닝까지 MM:SS' 카운트다운
```

`startTime`을 비워두면 하단 바에 현재 시각이 표시됩니다.

## 장면 구성 (약 6분)

| # | 장면 | 내용 |
|---|---|---|
| 1 | **Prologue** | 원두 한 알이 떨어지고, 조직 생성 · 첫 커밋("Initial commit") · 첫 릴리스가 터미널처럼 타이핑된 뒤 컵이 그려지고 커피가 차오르며 행사명이 뜸 |
| 2 | **한 잔에 담긴 것** | 컵이 차오르는 동안 함께한 시간 · 레포지토리 · 기여자 · 커밋 · 릴리스 · Stars가 하나씩 쏟아져 들어옴 |
| 3 | **7년의 커밋, 13번의 릴리스** | 월별 커밋 그래프가 시간순으로 그려지고 릴리스 코드네임이 나타남 |
| 4 | **연도별 여정 2019 → 2026** | 해마다 릴리스, 오픈 컨퍼런스 회차, 새 레포지토리, *그 해 새로 합류한 기여자 사진*, 누적 숫자 |
| 5 | **릴리스 메뉴판** | Americano부터 Hibiscus까지, 커피 → 차 |
| 6 | **무게중심의 이동** | 해마다 커밋이 어느 프로젝트 묶음(Core → Cloud-Migrator → AI-MCMP)에서 일어났는지 100% 누적 막대로. 옆에는 둘 이상의 프로젝트에 기여한 비율, 지난 1년간 활동한 기여자 수(첫 해 합류자 중 아직 함께하는 수), 평균 릴리스 간격 |
| 7 | **프로젝트별** | Core / Pioneers / Cloud-Migrator / Ecosystem / AI-MCMP / Community / PoC — 레포마다 설명, 기여자 사진, Stars, 커밋 |
| 8 | **Spotlight** | CB-Spider, CB-Tumblebug, CM-Beetle의 첫 커밋과 Top 10 기여자 |
| 9 | **바리스타 마을 (Cloud-Barista World)** | 픽셀 마을이 STAGE 2019 → 2026으로 자라납니다. 프로젝트 묶음은 구역, 레포지토리는 건물(생성되는 순간 "NEW!"와 함께 세워짐), 기여자는 자기 사진을 머리로 단 주민 캐릭터가 되어 처음 커밋한 순간 등장하고 자기가 기여한 건물 사이를 걸어 다닙니다. 릴리스마다 "NEW MENU!" 배너와 폭죽, 기여자 50명·건물 25채·XP 10,000 같은 업적 달성 토스트, 해와 달이 뜨고 지는 낮밤 |
| 10 | **Head Baristas** | `data/curated.js`의 `honored`에 적힌 분들 + 최다 커밋 + 최장 활동 기여자(최대 12명)를 RPG 캐릭터 카드(레벨 · 클래스 · XP 바)로 한 명씩 조명 |
| 11 | **함께 만든 사람들** | 기여자 전원의 사진이 처음 기여한 순서대로 채워지고, 매 바퀴 다른 사람을 한 명씩 소개 |
| 12 | **Outro** | 컵이 완성되고 "이제, 함께 마실 시간입니다" · NEXT STAGE ▶ 행사명 · 카운트다운 · TO BE CONTINUED… |

장면 순서와 포함 여부는 `config.js`의 `scenes`에서 바꿀 수 있습니다. 마을 대신 네트워크 그래프 버전(`constellation`: 레포는 별, 사람은 그 사이를 잇는 선)을 쓸 수도 있습니다.

게임 요소: 연도 장면마다 "CLEAR!" 도장, 프로젝트 장면의 ZONE 번호, 하단 바의 LV(함께한 햇수)·XP(커밋 수), 프롤로그의 PRESS START. 픽셀 글꼴은 [Galmuri](https://galmuri.quiple.dev) (OFL-1.1)입니다.

## 데이터 갱신

행사 직전에 최신 데이터로 다시 받으려면:

```bash
python3 scripts/collect.py      # gh auth 로그인 또는 GITHUB_TOKEN 필요, 2~3분
```

`data/data.js`, `data/github.json`, `assets/avatars/`가 갱신됩니다. 새 기여자의 사진도 자동으로 받습니다.

## 문구 수정 — `data/curated.js`

- `years`: 연도별 제목과 한 줄 이야기
- `repos`: 레포지토리별 표시 이름과 한국어 설명
- `families`: 프로젝트 묶음 (순서, 제목, 소개, 색, 포함 레포) — 별자리 장면의 군집과 색도 여기서 정해짐
- `releases`: 릴리스 코드네임, 한글명, 컵 색
- `conferences`: 연도별 오픈 컨퍼런스 회차
- `spotlights`: 상세 소개할 레포와 순서
- `honored`: Head Baristas 장면에서 꼭 조명할 사람 (GitHub 로그인 + 한글 이름)
- `hiddenRepos`: 표시하지 않을 레포

`data/curated.js`에 없는 새 레포는 GitHub description으로 자동 표시됩니다.

## 데이터 기준

- 기여자 = GitHub 계정과 연결된 커밋 작성자. 자동화 계정(`cb-github-robot`, `cb-spider`, `fossabot`, `*[bot]`)은 제외
- 다른 프로젝트를 fork한 레포(`cloud-barista.github.com`, `cb-tumblebug-dashboard`)와, 조직 생성(2019.02) 이전에 가져온 외부 템플릿 커밋만 있는 사람은 제외
- 월별·연도별 커밋, 처음 기여한 날짜, 각 레포의 첫 커밋은 모두 각 레포 기본 브랜치의 커밋 목록에서 직접 계산하며 머지 커밋은 제외합니다 (GitHub 그래프와 같은 기준). 숫자 장면의 총 커밋 수는 GitHub contributors 기준(머지 커밋 포함)이라 두 값이 다릅니다
- "새로 합류한 기여자"는 그 사람이 Cloud-Barista 레포 어디에든 처음 커밋한 해 기준

## 현장 체크리스트

- [ ] `config.js`에 회차·날짜·장소·시작 시각 입력
- [ ] 행사 전날 `python3 scripts/collect.py`로 데이터 갱신
- [ ] 화면 절전 해제: `caffeinate -d` (macOS)
- [ ] 프로젝터 해상도 16:9 확인 (다른 비율이면 위아래 또는 좌우에 여백)
- [ ] `./start.sh`로 키오스크 실행 (종료: `⌘Q`)

## 구조

```
index.html          진입점
config.js           행사 설정
css/show.css        스타일
js/engine.js        재생 엔진 (무대 스케일, 시계, 물결 전환, 일시정지/건너뛰기, 하단 바, 배경)
js/model.js         GitHub 데이터 + 큐레이션 데이터 결합
js/scenes.js        모든 장면 (별자리 장면은 canvas 위의 force 시뮬레이션)
js/world.js         바리스타 마을 (픽셀 스프라이트, 주민 캐릭터 행동, 업적)
data/curated.js     사람이 쓰는 문구
data/data.js        수집된 GitHub 데이터 (자동 생성)
scripts/collect.py  GitHub 데이터 수집기
assets/             기여자 사진, 조직 로고, Pretendard · Galmuri 폰트 (둘 다 SIL OFL)
start.sh            키오스크 실행 스크립트
.github/workflows/  Pages 배포 + 매일 데이터 갱신
```
