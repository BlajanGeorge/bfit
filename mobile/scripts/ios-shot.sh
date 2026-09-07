#!/usr/bin/env bash
# Boot an iOS simulator (if needed) and capture a screenshot the agent can read.
# Usage: ./scripts/ios-shot.sh [output.png] [device-name]
set -euo pipefail
OUT="${1:-shot.png}"
DEVICE="${2:-iPhone 17}"

xcrun simctl boot "$DEVICE" 2>/dev/null || true
open -a Simulator
for _ in $(seq 1 30); do
  xcrun simctl list devices | grep "$DEVICE" | grep -q Booted && break
  sleep 1
done
xcrun simctl io booted screenshot "$OUT"
echo "saved $OUT"
