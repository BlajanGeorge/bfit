#!/bin/bash
set -e
cd "$(dirname "$0")/.."

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null 2>&1 || true

echo "Caut iPhone-uri conectate..."
IFS=$'\n' read -r -d '' -a LINES < <(xcrun xctrace list devices 2>/dev/null | grep -E "iPhone" | grep -v "Simulator" && printf '\0')

if [ ${#LINES[@]} -eq 0 ]; then
  echo "Nu am găsit niciun iPhone conectat prin cablu. Conectează-l și rulează din nou."
  exit 1
elif [ ${#LINES[@]} -eq 1 ]; then
  CHOICE="${LINES[0]}"
else
  echo "Am găsit mai multe telefoane:"
  for i in "${!LINES[@]}"; do
    echo "  $((i+1))) ${LINES[$i]}"
  done
  read -p "Alege numărul telefonului: " NUM
  CHOICE="${LINES[$((NUM-1))]}"
fi

DEVICE_ID=$(echo "$CHOICE" | grep -oE '\(([0-9A-F-]{25,})\)' | tail -1 | tr -d '()')
echo "Instalez pe: $CHOICE"
echo "Instalez aplicația (build Release - independent, fără Mac/WiFi la pornire)..."
npx expo run:ios --device "$DEVICE_ID" --configuration Release
