#!/usr/bin/env bash
# Opens the opening loop full-screen in Chrome (kiosk mode) and keeps the display awake.
# Works offline: everything is loaded from this folder via file://.
#   ./start.sh            full loop
#   ./start.sh heroes     start at a slide (ids are listed in config.js `scenes`)
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
URL="file://$DIR/index.html"
[ -n "${1:-}" ] && URL="$URL?scene=$1"

FLAGS=(--kiosk --no-first-run --disable-session-crashed-bubble --disable-infobars
       --disable-background-timer-throttling --disable-renderer-backgrounding
       --user-data-dir="$DIR/.chrome-profile")

case "$(uname -s)" in
  Darwin)
    open -na "Google Chrome" --args "${FLAGS[@]}" "$URL"
    caffeinate -d -w $$ &   # no display sleep while this script runs
    echo "Running. Press Cmd+Q in Chrome to quit; Ctrl+C here to stop keeping the display awake."
    wait
    ;;
  Linux)
    exec "$(command -v google-chrome || command -v chromium || command -v chromium-browser)" "${FLAGS[@]}" "$URL"
    ;;
  *)
    echo "Open this in Chrome (F11 for full screen): $URL"
    ;;
esac
