# Cloud-Barista Open Brew

Cloud-Barista 오픈 컨퍼런스가 시작되기 전, 행사장 화면에 계속 돌려 두는 오프닝 루프(약 4분 50초)입니다.

## 목적

- **지금까지의 길을 보여 줍니다** — 2019년부터 지금까지 Cloud-Barista가 어떻게 자라 왔는지를
  [github.com/cloud-barista](https://github.com/cloud-barista) 공개 저장소의 실제 데이터(저장소, 커밋, PR, 릴리스, 기여자)로 보여 줍니다.
- **함께 만든 사람들에게 고마움을 전합니다** — 핵심 기여자는 한 명씩 이름을 부르고, 모든 기여자의 이름과 사진을 화면에 담습니다.
- **다음 참여자를 초대합니다** — 처음 온 분들에게 프로젝트를 소개하고 함께하자고 권합니다.

장면별 내용은 [STORYLINE.md](STORYLINE.md)에 있습니다.

## 사용법

### 실행

```sh
./start.sh            # Chrome 키오스크 전체화면 (macOS는 화면 꺼짐 방지 포함)
./start.sh heroes     # 특정 슬라이드부터
```

또는 `index.html`을 Chrome으로 열고 `F` 키. 인터넷 없이 이 폴더만으로 동작하며, 16:9 화면을 권장합니다.

| 키 | 동작 |
|---|---|
| `→` / `←` | 다음 / 이전 슬라이드 |
| `Space` | 일시정지 / 재개 |
| `F` | 전체화면 |
| `H` | 위 메뉴 막대와 아래 이름 띠 숨기기 |

리허설용 주소 옵션: `?scene=heroes`(그 슬라이드부터), `?only=years`(그 슬라이드 또는 묶음만 반복), `?speed=2`, `?freeze=6`(슬라이드 시작 6초 뒤 정지, 스크린샷용), `?once`(한 바퀴만).
슬라이드 id: `boot` `title` `numbers` `glance` `years`(`year-2019`…) `blend` `bugs` `menu` `devlife` `heroes` `wall` `join` `outro`

### 행사 전에 채울 것 — `config.js`

- `event`: 행사명, 날짜, 시간, 장소, `startTime`(넣으면 오른쪽 아래와 마지막 화면에 "오프닝까지 MM:SS")
- `heroes`: 핵심 기여자 순서와 한글 이름, 선택적으로 역할 한 줄. 추가된 9명은 아직 한글 이름이 비어 있습니다(비어 있으면 GitHub 프로필 이름 사용)
- `scenes`: 슬라이드 순서와 포함 여부, `ticker`: 아래 이름 띠 켜고 끄기

화면 문구(연도별 이야기, 릴리스 이름, 버그 도감 설명, 클라우드 이름, 컨퍼런스 회차, QR 주소)는 `data/curated.js`에서 고칩니다.

### 데이터 갱신

```sh
python3 scripts/collect.py   # GITHUB_TOKEN 또는 gh auth token 사용, 4~5분
```

`data/data.js`(통계, 연표, 기여자)와 `data/avatars.js`(기여자 사진)를 다시 만듭니다.
GitHub Actions(`.github/workflows/pages.yml`)가 하루 한 번(03:17 KST) 갱신한 뒤 GitHub Pages에 배포합니다.
