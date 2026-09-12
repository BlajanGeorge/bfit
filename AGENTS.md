# B-Fit — for agents

Personal, **local-only** iOS fitness app. The product spec (source of truth) is
[SPEC.md](SPEC.md); asset spec is [ASSETS.md](ASSETS.md). Build the flows exactly
as SPEC describes.

## Repo layout

- `SPEC.md` — business logic & flows (authoritative).
- `ASSETS.md` — asset spec; muscle-group cards status.
- `data/exercises.json` — canonical exercise catalog (84 exercises, 11 groups).
- `assets/muscles/<group>.png` — 11 muscle-group card images (source copies).
- `mobile/` — the Expo app (all implementation goes here).
  - `mobile/assets/data/exercises.json` + `mobile/assets/muscles/*.png` — app copies.
  - `mobile/src/domain/types.ts` — domain types from SPEC.

## Stack

- **Expo (React Native) + TypeScript**, **Expo Router** (file-based).
- **expo-sqlite** for all local data (profile, workouts, sets, saved workouts,
  bodyweight). Seed exercises from `assets/data/exercises.json` on first run.
- **react-native-gifted-charts** (+ react-native-svg) for the Grafana-style
  metrics dashboards.
- **zustand** for light state, **date-fns** for the week/calendar bar.
- `@expo/vector-icons` for icons.

## Environment (already set up on this Mac)

- Node **20** (via nvm; `nvm use 20`). Node 16 is too old — always use 20.
- Xcode + **iOS 26.5 Simulator** runtime installed (iPhone 17 devices available).
- **Maestro** installed at `~/.maestro/bin` (Java 17 present).
- iOS bundle id: **com.georgeblajan.bfit**.

## Run

```bash
cd mobile
nvm use 20
npx expo start            # Metro; press i for the iOS Simulator
# or a full native build installed on the simulator:
npx expo run:ios
```

## Test in the Simulator (headless-ish, for agents)

Screenshot the running app and read the PNG to verify UI:

```bash
cd mobile
./scripts/ios-shot.sh /tmp/bfit.png       # boots a sim + screenshots
```

Drive taps and assertions with Maestro (uses appId com.georgeblajan.bfit):

```bash
~/.maestro/bin/maestro test .maestro/smoke.yaml
```

Typical agent loop: `expo run:ios` (build+install) → run a Maestro flow →
`ios-shot.sh` (or Maestro `takeScreenshot`) → read the screenshot → verify.

## Conventions

- Keep pure business logic (metrics/volume calcs, tier/threshold logic) in
  `src/domain/` as testable pure functions, separate from screens.
- Everything works offline; no network, no accounts.
- Weights in KG.
