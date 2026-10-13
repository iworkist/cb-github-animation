# Cloud-Barista World — 오프닝 루프 스토리라인

행사 시작 전 대기 화면에 계속 돌려 놓는 **약 4분 30초짜리 무한 루프** 애니메이션입니다.
마인크래프트의 화면 문법(타이틀 화면, 월드 생성, 채팅, 발전 과제, 인벤토리, 양조기, 통계, 플레이어 목록)을 빌려
**"Cloud-Barista는 2019년부터 124명이 함께 지어 올린 하나의 월드"**라는 이야기를 들려줍니다.

> 모든 숫자는 GitHub(`github.com/cloud-barista`) 공개 저장소에서 자동으로 수집합니다 (`scripts/collect.py`).
> 아래 숫자는 2026-10-13 수집 기준입니다.

---

## 1. 컨셉: 무엇을 무엇으로 바꿨나

| 오픈소스 | 마인크래프트 월드 |
|---|---|
| 조직 생성일 (2019-02-01) | 월드 생성일, "Day 1" |
| 저장소 59개 | 마을의 건물 59채 (생성 순서대로 광장에서 바깥으로) |
| 커밋 | 쌓아 올린 블록 — 커밋이 쌓인 만큼 건물이 자란다 |
| 기여자 124명 | 플레이어 124명 (GitHub 아바타가 얼굴) |
| 첫 기여 | "OOO 님이 게임에 참가했습니다" |
| 정식 릴리스 13번 | 양조기에서 내린 커피와 차 (Americano → Hibiscus) |
| CB-Spider | 거미가 실을 뽑아 12개의 클라우드 섬을 하나로 잇는다 |
| CB-Tumblebug | 명령어 한 줄로 여러 섬에 동시에 서버 블록(VM)을 세운다 |
| 저장소 목록 | 인벤토리 (곤충 이름 저장소는 곤충 아이템, 아이템 개수 = 기여자 수) |
| Cloud-Barista 로고 | 광장 바닥 모자이크 (노란 원 4개 + 갈색 화살표) |

- **톤**: 밝고 경쾌하게. 숫자는 크게, 문장은 짧게. 게임 패러디는 하되 오픈소스에 대한 존중을 잃지 않는다.
- **글꼴**: 한글 픽셀 폰트 Galmuri11 (OFL). 마인크래프트식 그림자 글씨.
- **건물 양식**: 시대와 프로젝트군이 보이도록 재료를 나눴습니다.
  - cb-* 핵심 프레임워크: 석재 벽돌 + 참나무 / CB-Spider: 검은 벽돌 + 붉은 띠 + 거미줄 / CB-Tumblebug: 테라코타 + 금 블록
  - cloud-barista(메인): 석영 + 로고색(노랑·갈색) / 문서·홈페이지: 책장 도서관 / PoC: 조약돌 오두막
  - cm-*(Cloud-Migrator): 자작나무 + 하늘색 / mc-*: 프리즈머린 / ai-*(AI-MCMP): 흰 콘크리트 + 자수정
  - 보관(Archived)된 저장소: 이끼 낀 돌 — "은퇴했지만 남아 있는 유산"

---

## 2. 루프 구성 (약 4분 30초)

| # | 장면 | 길이 | 한 줄 메시지 |
|---|---|---|---|
| 1 | 타이틀 화면 | 16초 | CLOUD-BARISTA · MULTI-CLOUD EDITION |
| 2 | 월드 생성 | 7초 | 시드: cloud-barista · 2019년 2월 1일 |
| 3 | 연대기 타임랩스 | 64초 | 2019 → 지금, 마을이 자라는 7년 8개월 |
| 4 | CB-Spider | 20초 | 하나의 인터페이스로, 여러 클라우드를 (12개) |
| 5 | CB-Tumblebug | 18초 | 명령 한 번으로, 여러 클라우드에 하나의 인프라를 |
| 6 | 인벤토리 | 18초 | 저장소 59개 |
| 7 | 양조기 | 18초 | 13번의 정식 릴리스, 커피에서 차까지 |
| 8 | 통계 | 15초 | 커밋 15,260 · 머지된 PR 6,403 · 이슈 1,780 |
| 9 | 명예의 전당 | 약 54초 | 핵심 기여자 17명 |
| 10 | 플레이어 목록 | 14초 | 함께 만든 사람들 124명 |
| 11 | 고맙습니다! | 16초 | 124명이 함께 만든 Cloud-Barista |
| 12 | 서버 접속 | 11초 | 행사명 · 잠시 후 시작합니다 → 다시 1번으로 |

장면 사이는 0.5초 검은 화면으로 이어집니다.

---

## 3. 장면별 상세

### 1) 타이틀 화면 — "이건 하나의 게임 월드다"
- 배경: 완성된 마을과 하늘에 떠 있는 12개의 클라우드 섬을 천천히 도는 파노라마.
- 돌 질감의 블록 로고 **CLOUD-BARISTA**, 그 아래 **MULTI-CLOUD EDITION** 명판.
- 노란 스플래시 문구가 3초마다 바뀌며 통통 튑니다: `2019년부터!` `기여자 124명!` `커밋 15,260개!` `12개의 클라우드!` `머지된 PR 6,403개!` `Hibiscus 출시!` `오픈소스는 함께!` `커피 한 잔 하실래요?` …
- 메뉴 버튼: ~~싱글클라우드~~(비활성) / **멀티클라우드** / (행사명) / 설정… / 커뮤니티
- 마우스 커서가 들어와 **멀티클라우드**를 누르면 → 다음 장면.
- 하단: `Cloud-Barista v0.13.0 (Hibiscus)` / `Copyright Cloud-Barista Community. 마음껏 배포하세요! (Apache-2.0)`

### 2) 월드 생성
- 흙 블록 배경, "월드 생성 중 → 지형 생성 중 37%" → "Cloud-Barista 월드 불러오는 중", 가운데에서 바깥으로 채워지는 청크 로딩 사각형.
- `시드: cloud-barista · 2019년 2월 1일`

### 3) 연대기 타임랩스 — 2019년 2월부터 지금까지 (이야기의 중심)
- 빈 초원과 로고 광장에서 시작: **Day 1 · 2019년 2월 1일 · 월드가 열렸습니다**.
- 93개월이 약 54초 동안 흐르며 해가 7번 뜨고 집니다 (밤에는 발광석 창문이 빛남).
- **건물**: 저장소가 생기는 달에 기초가 놓이고, 그 저장소의 월별 커밋만큼 층이 올라갑니다. 공사 중인 꼭대기에 블록 놓는 불꽃.
- **사람**: 첫 기여 시점에 광장에서 플레이어가 생겨나 자기 주 저장소 건물까지 길을 따라 걸어갑니다.
- **HUD**
  - 상단 보스바: `Cloud-Barista 연대기 · 2021년 6월` + 진행 막대
  - 우측 스코어보드: 기여자 / 저장소 / 커밋 / 머지된 PR / 정식 릴리스 — 시간에 따라 누적 증가
  - 좌하단 채팅: `cb-spider 저장소가 세워졌습니다`, `OOO 님이 게임에 참가했습니다`, `[Cloud-Barista] v0.4.0 Café Mocha 릴리스!`
  - 우상단 발전 과제 토스트: `발전 과제 달성! Americano · v0.1.0` (릴리스마다, 메인 건물 위 불꽃놀이)
  - 해가 바뀔 때 큰 제목: 연도 + 그해의 사건 (데이터에서 자동 생성)
    - 2019 첫 커밋 · Americano / 2020 Cappuccino · Espresso / 2021 Café Mocha · Affogato / 2022 Cafe Latte · Cortado
    - 2023 Cloud-Migrator 시작 · Chamomile / 2024 Cinnamon · Darjeeling / 2025 Earl Grey · Ginger / 2026 AI-MCMP 시작 · Hibiscus
- 마지막: 카메라가 높이 올라 완성된 마을 전경 + **지금 · 저장소 59 · 기여자 124 · 커밋 15,260**.

### 4) CB-Spider — 12개의 클라우드를 잇다
- 카메라가 마을에서 하늘로 올라가면 구름 아래에서 클라우드 섬 12개가 차례로 떠오릅니다.
- 가운데 섬의 거미(CB-Spider)가 몸을 돌려 섬마다 실을 쏘고, 연결될 때마다 이름표와 채팅 `[CB-Spider] AWS 드라이버 연결 완료`.
- 액션바 카운터: `연결된 클라우드 3 / 12` → `12 / 12 · AWS부터 국내 클라우드까지, 하나의 API로`
- 연결 후 실을 따라 데이터 패킷(작은 빛 입자)이 오갑니다.
- 섬: AWS, Azure, GCP, Alibaba, Tencent, IBM, OpenStack, NCP, NHN, KT Cloud, KT Classic, Oracle — CB-Spider 저장소의 드라이버 목록에서 자동 수집.

### 5) CB-Tumblebug — 명령어 한 줄, 멀티클라우드 인프라
- 채팅창에 명령어가 타이핑됩니다: `/mci create cb-conference --clouds 12`
- 12개 섬 위에 서버 블록(VM)이 차례로 "퐁" 하고 세워지고 `vm-01 … vm-12` 표시.
- 채팅: `MCI 'cb-conference' 생성 시작` → `VM 12대 생성 완료 (12/12) · 상태: Running` → `/mci status` 결과.
- 액션바: `MCI cb-conference · VM 12/12 · Running`

### 6) 인벤토리 — 저장소 59개
- 어두워진 월드 위에 마인크래프트 대형 상자 GUI. 생성 순서대로 아이템이 채워집니다.
- 곤충 이름 저장소는 곤충 아이템(거미, 쇠똥구리, 무당벌레, 잠자리, 꿀벌, 개미, 매미, 메뚜기, 나비, 하루살이, 실잠자리, 지네, 애벌레), PoC는 묘목, SDK는 곡괭이, 문서는 책, cb-log는 통나무, cb-store는 상자, ai-o11y는 망원경, ai-ha는 불사의 토템 …
- **아이템 개수 = 그 저장소의 기여자 수**.
- 커서가 cb-spider, cb-tumblebug, cloud-barista, cm-beetle, cm-honeybee, mc-terrarium, cb-mapui, ai-mcmp 위에 머물며 툴팁: 설명 · 생성일 · `+3,795 커밋` · `+1,156 머지된 PR` · `43명의 기여자` (cb-spider 예) · ★스타.

### 7) 양조기 — 13번의 정식 릴리스
- 왼쪽 양조기에 원두(커피) 또는 찻잎(차)이 들어가고, 화살표가 차오르면 결과물이 나옵니다.
- 오른쪽 선반에 순서대로 진열: Americano → Cappuccino → Espresso → Café Mocha → Affogato → Cafe Latte → Cortado (커피, 컵) → Chamomile → Cinnamon → Darjeeling → Earl Grey → Ginger → Hibiscus (차, 물약병).
- 각 아이템에 버전과 날짜 (v0.1.0 · 2019.12 … v0.13.0 · 2026.08). 최신 Hibiscus는 반짝임.

### 8) 통계
- 마인크래프트 "통계" 화면. 왼쪽 목록이 한 줄씩 들어오며 숫자가 올라갑니다:
  월드 생성일 2019년 2월 1일 / 함께한 시간 7년 8개월 / 참가한 플레이어 124명 / 쌓아 올린 커밋 15,260 / 머지된 PR 6,403 / 등록된 이슈 1,780 / 저장소 59 / 정식 릴리스 13 / 릴리스 태그 1,113 / 연결된 클라우드 12 / 스타 315 / 포크 336
- 오른쪽: **연도별 커밋**을 블록 기둥으로 (블록 1개 = 커밋 250개)
  2019: 780 · 2020: 1,698 · 2021: 2,636 · 2022: 1,769 · 2023: 922 · 2024: 3,328 · 2025: 2,040 · 2026: 2,087 (10월 13일까지)

### 9) 명예의 전당 — 핵심 기여자 17명
- 광장 로고 둘레에 금 블록 받침대 17개, 그 위에 아바타 얼굴의 플레이어.
- 위에서 내려다보는 인트로(`명예의 전당 · Cloud-Barista를 만들어 온 핵심 기여자`) 후, 카메라가 원 안쪽에서 한 명씩 바라봅니다 (1인당 약 2.9초).
- 주인공은 손을 흔들고, 뒤 하늘에 불꽃놀이. 머리 위 이름표는 한글 이름.
- 왼쪽 카드: 아바타 · **이름** · @GitHub 아이디 · (선택) 역할 한 줄 · 첫 기여 연월 · 주요 저장소 3개 · `핵심 기여자 4 / 17`
- 카드에는 커밋 수를 넣지 않습니다. 리더 역할은 커밋으로 드러나지 않기 때문입니다.

### 10) 플레이어 목록 — 함께 만든 사람들
- 마인크래프트 멀티플레이 Tab 목록. `Cloud-Barista 오픈소스 서버 · 함께 만든 사람들 · 124명 · 참가 순서`
- 124명 전원이 아바타와 아이디로, 첫 기여 순서대로 채워집니다. 하단: `모든 기여자 여러분, 고맙습니다!`

### 11) 고맙습니다!
- 해 질 녘. 모든 플레이어가 자기 건물에서 나와 길을 따라 광장으로 모여들고, 핵심 기여자는 받침대 위에.
- 로고의 노란 원 네 곳에서 신호기 빛기둥이 솟고, 모두가 뛰고 손을 흔들며 불꽃놀이.
- `고맙습니다! · 124명이 함께 만든 Cloud-Barista`

### 12) 서버 접속 — 행사로 연결
- 흙 배경 `서버에 연결하는 중...` → 행사명 · 일시 · 장소 · **잠시 후 시작합니다** (깜빡임)
- `github.com/cloud-barista · cloud-barista.github.io` → 다시 타이틀 화면으로.

---

## 4. 핵심 기여자 선정

**지정 8명** (요청 명단, 순서 유지) + **분석으로 추가한 9명**.

추가 기준: 모든 공개 저장소의 **커밋 + 머지된 PR 합계** 상위자. 봇(dependabot, github-actions, cb-github-robot, fossabot), AI 계정(claude), 삭제된 계정(ghost), 회사·팀 공용 계정(MZC-CSC, inno-cloudbarista, dev-secloudit)은 제외했습니다. 공용 계정은 플레이어 목록에는 그대로 나옵니다.

| 순서 | 이름 | GitHub | 전체 순위 | 커밋 | 머지 PR | 첫 기여 | 주요 저장소 |
|---|---|---|---|---|---|---|---|
| 1 | 강동재 | dongjae | 45 | 42 | 0 | 2019-11 | cloud-barista.github.io, docs |
| 2 | 김병섭 | powerkimhub | 3 | 1,889 | 151 | 2019-05 | cb-spider, cb-store, cb-log |
| 3 | 정영우 | Youngwoo-Jung | 94 | 2 | 0 | 2020-01 | cloud-barista.github.io |
| 4 | 손석호 | seokho-son | 1 | 2,927 | 1,668 | 2019-02 | cb-tumblebug, cb-mapui, cloud-barista |
| 5 | 김윤곤 | yunkon-kim | 2 | 1,553 | 1,064 | 2020-09 | cm-beetle, cb-tumblebug, cb-larva |
| 6 | 오병택 | innodreamer | 4 | 1,376 | 506 | 2019-10 | cloud-barista.github.io, cb-spider, docs |
| 7 | 장한이 | hanizang77 | 17 | 127 | 76 | 2025-01 | cb-spider, cb-tumblebug, cm-beetle |
| 8 | 박재홍 | iworkist | 26 | 84 | 20 | 2020-08 | cb-spider, cloud-barista |
| 9 | (ish) | ish-hcc | 5 | 1,621 | 126 | 2023-09 | cm-honeybee, cm-grasshopper, cm-cicada |
| 10 | (Jihoon Seo) | jihoon-seo | 6 | 683 | 518 | 2019-05 | cb-tumblebug, cb-operator, cb-spider |
| 11 | (Yoo Jae-Sung) | dev4unet | 7 | 626 | 258 | 2019-08 | cm-mayfly, cb-spider, cm-ant |
| 12 | (dogfootman) | dogfootman | 8 | 483 | 19 | 2021-04 | cb-webtool, cb-spider, cm-butterfly |
| 13 | (Dennis Jun) | jazmandorf | 9 | 301 | 87 | 2019-10 | cb-webtool, cb-spider |
| 14 | (Sooyoung Kim) | sykim-etri | 11 | 228 | 142 | 2020-08 | cb-tumblebug, poc-cb-ladybug, cb-spider |
| 15 | (Sehyeong An) | hippo-an | 12 | 281 | 36 | 2023-12 | cm-ant, cm-butterfly, cb-spider |
| 16 | (yh-noh) | yh-noh | 13 | 289 | 0 | 2021-03 | cb-webtool, cb-spider, cb-tumblebug |
| 17 | (jmleefree) | jmleefree | 14 | 192 | 85 | 2020-06 | poc-cicd-spider, cb-spider, cm-centipede |

- 괄호 안 이름은 GitHub 프로필 이름(없으면 아이디)이며, **한글 이름을 확인해 `config.js`의 `name`에 넣어 주세요.**
- 다음 순위(참고): jaesung-yoo (커밋 242, 2019–2020 CB-Spider 초기), choryang / Okhee Lee (204).
  jaesung-yoo가 dev4unet(Yoo Jae-Sung)와 같은 분인지 확인되면 한 사람으로 합칠 수 있습니다.

---

## 5. 데이터와 숫자의 기준

- **기여자**: 공개 저장소에 커밋했거나 PR이 머지된 GitHub 계정. 봇·AI·삭제 계정 제외.
- **커밋**: GitHub 통계 API 기준(기본 브랜치). 포크 저장소는 포크 이후만, 홈페이지 템플릿처럼 조직 생성(2019-02-01) 이전에 들어온 외부 이력은 제외.
- **머지된 PR**: 모든 공개 저장소의 PR 중 merged 상태.
- **정식 릴리스**: `cloud-barista` 저장소의 정식(비 pre-release) 릴리스 13개.
- **클라우드 12개**: CB-Spider `cloud-driver/drivers` 디렉터리 (mock 제외).
- 갱신: `python3 scripts/collect.py` (GitHub Actions에서 하루 두 번 자동 실행 후 GitHub Pages에 배포).

## 6. 운영

- 실행: `./start.sh` (Chrome 키오스크 전체화면, 화면 꺼짐 방지) 또는 `index.html`을 Chrome에서 열고 F11. **인터넷 없이 동작**합니다.
- 리허설용 URL 옵션: `?scene=heroes` (해당 장면부터), `?only=spider` (한 장면 반복), `?speed=2`.
- 설정: `config.js` — 행사명·일시·장소, 핵심 기여자 순서·한글 이름·역할, 렌더링 해상도.

## 7. 확정이 필요한 것

1. 행사명(회차), 일시, 장소 → `config.js`의 `event`
2. 추가 핵심 기여자 9명의 한글 이름 (그리고 원하면 17명 모두의 역할 한 줄)
3. 추가 9명 명단 자체 — 기준(커밋+PR)으로 뽑았으므로 조정 가능
