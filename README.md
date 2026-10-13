# Cloud-Barista Open Brew

Cloud-Barista 오픈 컨퍼런스 시작 전에 행사장 화면에 계속 돌려 두는 슬라이드형 오프닝 루프(약 4분 50초).
[github.com/cloud-barista](https://github.com/cloud-barista)의 실제 데이터로 2019년부터 지금까지의 발전 과정을 보여 주고,
기여자 모두에게 고마움을 전합니다. 장면 구성은 [STORYLINE.md](STORYLINE.md)에 있습니다.

- 커피 메타포(릴리스 = 커피·차, 클라우드 = 원두) + 마인크래프트풍 16×16 픽셀 아이템(머그, 원두, 물약병, 곤충) + 개발자 감성(터미널, git, punch card)
- 화면 아래에는 모든 기여자의 이름이 `THANK YOU` 띠로 계속 흐르고, 오른쪽 끝에는 현재 시각(또는 오프닝 카운트다운)이 표시됩니다
- 1920×1080 무대를 화면 비율에 맞춰 축소·확대합니다 (16:9 권장)
- **인터넷 없이 동작**: 폰트·사진·데이터가 모두 이 폴더 안에 있고 `file://`로 열립니다

## 실행

```sh
./start.sh            # Chrome 키오스크 전체화면 (macOS는 화면 꺼짐 방지 포함)
./start.sh heroes     # 특정 슬라이드부터
```

또는 `index.html`을 Chrome으로 열고 `F` 키.

| 키 | 동작 |
|---|---|
| `→` / `←` | 다음 / 이전 슬라이드 |
| `Space` | 일시정지 / 재개 |
| `F` | 전체화면 |
| `H` | 위 메뉴 막대와 아래 이름 띠 숨기기 |

리허설용 주소 옵션: `?scene=heroes`(그 슬라이드부터), `?only=years`(그 슬라이드 또는 묶음만 반복), `?speed=2`, `?freeze=6`(슬라이드 시작 6초 뒤 정지, 스크린샷용), `?once`(한 바퀴만).
슬라이드 id: `boot` `title` `numbers` `glance` `years`(`year-2019`…) `blend` `bugs` `menu` `devlife` `heroes` `wall` `join` `outro`

## 행사 전에 채울 것 — `config.js`

- `event`: 행사명, 날짜, 시간, 장소, `startTime`(넣으면 오른쪽 아래와 마지막 화면에 "오프닝까지 MM:SS")
- `heroes`: 핵심 기여자 순서와 한글 이름, 선택적으로 역할 한 줄. 추가된 9명은 아직 한글 이름이 비어 있습니다
- `scenes`: 슬라이드 순서와 포함 여부, `ticker`: 이름 띠 켜고 끄기

문구(연도별 이야기, 릴리스 이름과 색, 버그 도감 설명, 클라우드 이름, 컨퍼런스 회차, QR 주소)는 `data/curated.js`에서 고칩니다.

## 데이터 갱신

```sh
python3 scripts/collect.py   # GITHUB_TOKEN 또는 gh auth token 사용, 4~5분
```

`data/data.js`(통계·월별 연표·커밋 시간대·기여자)와 `data/avatars.js`(사진, GitHub가 주는 최대 크기 460px)를 다시 만듭니다.
GitHub Actions(`.github/workflows/pages.yml`)가 하루 두 번 갱신한 뒤 GitHub Pages에 배포합니다.

## 구성

| 파일 | 역할 |
|---|---|
| `js/engine.js` | 무대 크기 맞춤, 일시정지 가능한 시계, 픽셀 블록 전환, 위 메뉴 막대, THANK YOU 띠, 떠다니는 원두 배경 |
| `js/sprites.js` | 16×16 픽셀 아이템(머그, 컵, 물약병, 원두, 자루, 구름, 하트, 곤충 14종)을 코드로 그림 |
| `js/model.js` | 수집 데이터 + 큐레이션 문구 + 설정을 하나로 합침 (모든 숫자의 출처) |
| `js/scenes.js` | 13개 슬라이드 |
| `js/main.js` | 시작점 |
| `css/show.css` | 디자인 |

백업: `backup/`(커피 A·B 버전), `backup-minecraft/`(마인크래프트 버전, 그 폴더의 `index.html`로 그대로 실행).

서드파티: Pretendard (SIL OFL 1.1), Galmuri11 (SIL OFL 1.1) — `assets/fonts/`.
