# B-Fit — handoff summary (2026-09-09)

Written for the next assistant (GLM / OpenCode). Read this whole file before touching anything.
George works in Romanian; talk to him in Romanian, keep answers short, never spend SpriteCook
credits or regenerate an asset he approved without being asked.

## 1. What the app is

B-Fit is a personal gym-logging iOS app for one user (George). Local-only: no account, no
server, all data in SQLite on the device. Dark theme, weights in kg, body measurements in cm.
Spec: `SPEC.md` (flows, data model), assets spec: `ASSETS.md`, catalog: `data/exercises.json`
(mirrored in `mobile/assets/data/exercises.json`, the one the app loads).

Main flows: onboarding profile → home with the week bar → pick muscle group → exercise list →
exercise detail (looping animation) → build/log workout (sets, reps, kg) → saved workout
templates → metrics screen (body stats + workout charts) → profile.

Catalog: 80 exercises across 11 groups (Chest 12, Back 10, Shoulders 9, Biceps 7, Triceps 6,
Quadriceps 8, Hamstrings 6, Glutes 5, Calves 4, Abs 8, Forearms 5). Removed today by George's
decision: `ez-bar-curl`, `db-kickback`. `seedCatalog()` in `mobile/src/data/db.ts` now also
deletes rows that are no longer in the JSON, so removals propagate to already-installed devices.

## 2. Stack

- Expo SDK 57 (`expo ~57.0.20`), React Native 0.86, React 19.2, TypeScript. `mobile/AGENTS.md`
  says: read the versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing code.
- Routing: `expo-router` (file routes in `mobile/src/app/*.tsx`), app scheme `bfit://`
  (`mobile/app.json`, bundle id `com.georgeblajan.bfit`).
- Data: `expo-sqlite` (`mobile/src/data/db.ts` schema + seed, `repo.ts` queries,
  `catalog.ts` = exercise list + `EXERCISE_ANIMATIONS` / `EXERCISE_THUMBS` require maps).
- Domain logic (pure): `mobile/src/domain/{types,metrics,week}.ts`.
- UI: `mobile/src/components/*` (Drawer, WeekBar, ExerciseThumb, ui/*), theme in
  `mobile/constants/theme.ts`, `hooks/use-theme.ts`. Charts: `react-native-gifted-charts`.
  Animations rendered with `expo-image` (`<Image source={anim} contentFit="contain" autoplay />`
  in `mobile/src/app/exercise-detail.tsx`, 280pt tall card).
- Reanimated 4.5 + worklets (splash), gesture-handler, safe-area, screens, svg.
- E2E: Maestro flows in `mobile/.maestro/*.yaml` (smoke, onboarding, add-workout, drawer).

## 3. How to run it in the iOS simulator

```bash
cd ~/Work/bfit/mobile
npm install
npx expo start            # Metro dev server on :8081 (George usually has it running)
npx expo run:ios          # builds the dev client and installs it on the booted simulator
```

Useful simulator commands (device used today: "iPhone 17", iOS 26.5):

```bash
xcrun simctl list devices booted
xcrun simctl terminate booted com.georgeblajan.bfit; xcrun simctl launch booted com.georgeblajan.bfit   # reload the JS bundle + assets
xcrun simctl openurl booted "bfit://exercise-detail?exerciseId=preacher-curl"       # deep-link straight to a screen
xcrun simctl io booted screenshot shot.png                                           # screenshot to inspect
./scripts/ios-shot.sh shot.png                                                       # boots the sim if needed + screenshot
```

Metro caches assets by content hash, but after replacing an animation file you must relaunch the
app (terminate + launch) to see the new file. Type-check with `npx tsc --noEmit -p .`.

Git: the repo is on `main`; today's work is NOT committed (animations, thumbs, scripts,
manifest, catalog edits, SPEC/README tweaks are untracked/modified). George decides when to commit.

## 4. Exercise animations — state

Each exercise can have a thumb (`mobile/assets/exercise-thumbs/<id>.png`, the start pose) and a
looping animation (`mobile/assets/animations/<id>.webp`, 16 frames @ 8 fps, transparent,
lossless WebP). Both are registered in `mobile/src/data/catalog.ts` and the SpriteCook asset ids
are recorded in `mobile/spritecook-assets.json` (start / mid / animation per exercise, with
notes on how each was made and which attempts were rejected).

Coverage now: 43 animations, 44 thumbs.

- Chest 12/12, Back 10/10, Shoulders 9/9, Biceps 7/7 — all approved by George.
- Triceps: only `triceps-dip` is good. `close-grip-bench`, `triceps-pushdown`, `skull-crusher`,
  `overhead-triceps-ext` are installed but George rejected them ("praf") — treat them as
  placeholders to be redone by him. `rope-pushdown` has no animation (asset `715a09fe` had
  good motion but no background removal).
- Quadriceps, Hamstrings, Glutes, Calves, Abs, Forearms: nothing yet (36 exercises).

## 5. How the animations are made (the process that works)

Tool: SpriteCook (spritecook.ai). George runs the generations HIMSELF in the SpriteCook web UI
and pastes asset ids back; the assistant writes the prompts, downloads by asset id, checks the
result, and installs. Prompts used so far are in `prompts/spritecook-prompts.md`.

Style rules (George rejects anything that breaks them):
- Figure: white/light-grey anatomical mannequin, COMPLETELY BALD, target muscle in bright red,
  anatomy-chart style, transparent background, no text. Put "completely bald with a smooth
  hairless head" in every prompt.
- Equipment black/dark grey; NO weight stacks or machine towers (the animator mangles them).
- Full, correct range of motion (bar to upper chest on curls, chin over bar on chin-ups, etc.).
- Background removal must be **Pro**, never Basic.
- Consistent style reference: the db-bench-press start `53661d71-822e-42b2-a87f-0cfb05f4c7f0`
  or a same-type start (standing: db-curl start `432debd6-…`).

Per exercise, the recipe that gives good results:

1. **MID image first** (peak of the movement) with Gemini `gemini-3.1-flash-image`,
   transparent, smart crop OFF, 1K, style reference = an approved start image.
   Prompt template: "A clean flat medical/fitness illustration of a single muscular male figure
   performing X, shown at the TOP position … THREE-QUARTER FRONT/SIDE VIEW … Figure & style: …
   COMPLETELY BALD … Equipment: … no weight stack … Pose: … Framing: whole figure inside the
   frame, nothing cropped, centered, small margin above the head."
2. **START image** generated with the MID as the reference image: "Recreate the reference image
   with ONE change only: the arms are at the START position … Everything else must match the
   reference exactly: same camera, same position and size in the canvas, head at the same
   height, feet at the same spot …". Verify on pixels that start and mid share the alpha bbox,
   head centre x and feet span (the assistant does this with a few lines of PIL/numpy). If Gemini
   ignores the pose change, use **edit mode** on the mid ("Edit this image. Make exactly ONE
   change: …") — that worked for hammer curl and pushdown; it refused for dip-bottom and
   overhead-extension-straight.
3. **Animate in the SpriteCook UI with 3 custom keyframes**: frame 1 = START, frame 8 = MID,
   frame 16 = START. 16 frames, "Custom frames (experimental)". Model pixel-engine-v1.1 (accepts a
   negative prompt) or v1.5 for big-range moves. **Turn prompt auto-enhance OFF** — it rewrote
   every prompt into a 40-word summary and killed the amplitude. Background removal Pro.
   The animation prompt describes the motion frame by frame: "frame 1 is the START image …,
   frames 2-7 carry the bar from … to …, frame 8 is the MID image …, frames 9-15 lower it …,
   frame 16 one small step before frame 1 so the loop plays without a jump; constant speed, no
   held frames; the camera is LOCKED, the figure never rotates; everything except the forearms,
   hands and bar is frozen …" (see the biceps prompts in `prompts/spritecook-prompts.md`).
   The UI job overwrites nothing; each run is a new asset id.
4. **Download + check**: `get_asset_metadata` (MCP) or the UI gives a signed
   `signed-content/pixel` URL → curl it → build a 4x4 contact sheet with
   `mobile/scripts/anim-sheet.py in.webp sheet.png` and look at it: bald, black plates, full ROM,
   loop closes, frames ≥ 30 % transparent (otherwise removal failed).
5. **Stabilize only if it drifts**: the engine often shifts the whole figure 50–120 px between
   keyframes. `python3 mobile/scripts/anim-stabilize.py in.webp out.webp` aligns every frame by
   the feet (and normalises scale — do NOT use the scale step on lying exercises where the bar
   is the topmost pixel; the older shift-only version is what you want there). Optional third
   argument "6,12" drops broken frames. George explicitly wants animations installed **as
   downloaded**; run stabilize only on the exercise he names, and never the freeze filter unless
   he asks (it was used only on `preacher-curl`).
6. **Install**: `python3 mobile/scripts/anim-install.py anim <exercise-id> <file.webp> --asset <id>`
   (crops all frames to their union bbox + 8 px, saves lossless WebP, registers in catalog.ts and
   the manifest; refuses files with < 30 % transparency). Thumbs:
   `anim-install.py thumb <exercise-id> <png> --asset <id>`. Overhead moves: build a headroom
   canvas first with `anim-install.py headroom <id> --top 0.30` (writes to ~/Downloads) and
   animate from that upload, otherwise the object is clipped at the canvas top.
7. Relaunch the app on the simulator and deep-link to the exercise so George can judge it.

Lessons that cost credits today:
- Lossy WebP (quality 90) made static pixels shimmer in the app; the installer is now lossless
  (files ~500–800 KB each).
- The MCP `animate_game_art` has no keyframe support; animating from a single pose on v1.5 gave
  results George rejected for 4 of 5 triceps moves. Use the UI with 3 keyframes.
- Gemini copies the reference instead of changing the pose ~half the time; check every start/mid
  pair visually before animating.
- `remove_background` via MCP is Basic only; Pro removal is done in the UI (it replaces the
  asset in place, same id).
- Credits: ~12 per still image, 20 per v1.1 animation, 58 per v1.5 animation (+Pro). Balance
  was 124 at the end of the day.

## 6. Where things are

- `mobile/scripts/anim-install.py`, `anim-stabilize.py`, `anim-freeze.py`, `anim-sheet.py`
- `mobile/spritecook-assets.json` — asset ids + notes per exercise
- `prompts/spritecook-prompts.md` — every prompt that was used, per exercise
- `mobile/assets/animations/*.webp`, `mobile/assets/exercise-thumbs/*.png`
- `mobile/src/data/catalog.ts` — `EXERCISE_ANIMATIONS`, `EXERCISE_THUMBS` require maps

## 7. Next steps George wants

1. He redoes the 4 bad triceps animations and rope-pushdown himself in the UI (ask him for the
   asset ids, then check + install as in section 5).
2. Then legs (Quadriceps 8, Hamstrings 6, Glutes 5, Calves 4), Abs 8, Forearms 5 — same recipe,
   mid first, start from mid, 3 keyframes, install as downloaded.
3. Commit when he says so (nothing from today is committed yet).
