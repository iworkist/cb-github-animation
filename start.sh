#!/usr/bin/env bash
# Launch the opening loop full-screen in Chrome (kiosk mode).
#   ./start.sh            serve locally and open in kiosk mode
#   ./start.sh --window   open in a normal window (for rehearsal)
set -euo pipefail
cd "$(dirname "$0")"

PORT="${PORT:-8765}"
URL="http://localhost:${PORT}/index.html"

if ! lsof -i ":${PORT}" >/dev/null 2>&1; then
  python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
  SERVER_PID=$!
  trap 'kill $SERVER_PID 2>/dev/null || true' EXIT
  sleep 0.6
fi

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PROFILE="$(mktemp -d)"
FLAGS=(--user-data-dir="$PROFILE" --no-first-run --disable-session-crashed-bubble --disable-infobars --autoplay-policy=no-user-gesture-required)
[[ "${1:-}" == "--window" ]] || FLAGS+=(--kiosk)

if [[ -x "$CHROME" ]]; then
  "$CHROME" "${FLAGS[@]}" "$URL"
else
  echo "Chrome not found. Open ${URL} in any browser and press F for full screen."
  wait
fi
