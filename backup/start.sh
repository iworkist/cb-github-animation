#!/usr/bin/env bash
# Launch the opening loop full-screen in Chrome (kiosk mode).
#   ./start.sh              version chooser first (auto-starts after 30 s)
#   ./start.sh a|b|ab       play that version right away (A, B, or both alternating)
#   ./start.sh b --window   open in a normal window (for rehearsal)
set -euo pipefail
cd "$(dirname "$0")"

VERSION=""
WINDOW=0
for arg in "$@"; do
  case "$arg" in
    --window) WINDOW=1 ;;
    a|b|ab) VERSION="$arg" ;;
    *) echo "unknown option: $arg (use a, b, ab, --window)"; exit 1 ;;
  esac
done

PORT="${PORT:-8765}"
URL="http://localhost:${PORT}/index.html${VERSION:+?v=$VERSION}"

if ! lsof -i ":${PORT}" >/dev/null 2>&1; then
  python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
  SERVER_PID=$!
  trap 'kill $SERVER_PID 2>/dev/null || true' EXIT
  sleep 0.6
fi

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PROFILE="$(mktemp -d)"
FLAGS=(--user-data-dir="$PROFILE" --no-first-run --disable-session-crashed-bubble --disable-infobars --autoplay-policy=no-user-gesture-required)
[[ "$WINDOW" == 1 ]] || FLAGS+=(--kiosk)

if [[ -x "$CHROME" ]]; then
  "$CHROME" "${FLAGS[@]}" "$URL"
else
  echo "Chrome not found. Open ${URL} in any browser and press F for full screen."
  wait
fi
