> **백업 (2026-10-13)** — 마인크래프트 스타일 버전입니다. 이 폴더의 `index.html`을 열거나 `./start.sh`로 그대로 실행됩니다. 현재 버전은 상위 폴더에 있습니다.

# Cloud-Barista World

Cloud-Barista 오픈소스 컨퍼런스 행사 시작 전에 계속 돌려 두는 마인크래프트 스타일 오프닝 루프(약 4분 30초).
스토리라인과 장면 구성은 [STORYLINE.md](STORYLINE.md)에 있습니다.

## 실행

- `./start.sh` — Chrome 키오스크 전체화면 (macOS는 화면 꺼짐 방지 포함)
- 또는 `index.html`을 Chrome으로 열고 F11. 인터넷 연결이 필요 없습니다.
- 리허설: `index.html?scene=heroes` (그 장면부터), `?only=spider` (한 장면만 반복), `?speed=2`

## 설정

`config.js` — 행사명/일시/장소, 명예의 전당 순서·한글 이름·역할, 렌더링 해상도(`maxPixelRatio`).

## 데이터 갱신

```sh
python3 scripts/collect.py   # GITHUB_TOKEN 또는 gh auth token 사용, 4~5분
```

`data/data.js`(통계·연표·기여자)와 `data/avatars.js`(64px 아바타)를 다시 만듭니다.
GitHub Actions(`.github/workflows/pages.yml`)가 하루 두 번 갱신 후 GitHub Pages에 배포합니다.

## 구성

| 파일 | 역할 |
|---|---|
| `js/pixels.js` | 16×16 블록 텍스처·아이템 아이콘을 코드로 생성 (외부 이미지 없음) |
| `js/world.js` | three.js 복셀 메셔(면 음영 + AO), 하늘/낮밤, 구름, 입자, 인스턴싱된 플레이어 |
| `js/village.js` | 지형, 저장소 건물(생성 순서·커밋 성장), 클라우드 섬, 거미, 기여자 이동 |
| `js/ui.js` | 마인크래프트 UI 위젯(채팅, 발전 과제, 보스바, 스코어보드, 이름표, 로고) |
| `js/scenes.js` | 12개 장면 = 스토리라인 |
| `js/main.js` | 루프, 장면 전환, URL 옵션 |

서드파티: three.js r149 (MIT, `vendor/`), Galmuri11 폰트 (SIL OFL 1.1, `assets/fonts/`).
