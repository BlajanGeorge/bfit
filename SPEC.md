# B-Fit — Spec & Flows

Personal fitness app, **local-only** on the phone (no account, no server, all
data stored on the device). Business logic and flows, feature by feature. No
tech stack yet.

## Principles

- **Local-first**: everything works offline; data lives on the device.
- **Single user**: just me — no auth, no sharing, no social.
- **Simple**: fast to log a workout, minimal taps.
- **Units**: weights in **KG**, body measurements in **cm**, body fat in **%**.
- **Dark mode**: the whole app uses a dark theme.

---

## Core concepts (data model, conceptual)

- **Profile** — set once on first launch, editable later from a Profile screen:
  - `displayName` (how the app addresses you)
  - `sex` (male / female)
  - `heightCm`
  - `dateOfBirth` (date)
  - current bodyweight is shown here; updating it (and the advanced stats below)
    records a **BodyEntry** — only these manual updates feed the body metrics.
- **BodyEntry** — a dated snapshot of body stats, all optional except weight:
  - `date`, `weightKg`
  - **advanced (optional)**: `bodyFatPct`, and measurements in cm —
    `armCm`, `chestCm`, `shouldersCm`, `waistCm`, `glutesCm`, `quadsCm`.
  - Advanced stats are never required; the user can fill any subset.
- **MuscleGroup** — a fixed list of the popular gym groups (see below).
- **Exercise** — a predefined exercise:
  - `name`
  - `muscleGroup` (main group)
  - `subGroup` (optional finer part — e.g. shoulders → front/lateral/rear delt;
    chest → upper/lower; back → lats/traps/lower-back). v1 browses by main group;
    sub-groups let us split a group later.
  - `image` (a figure performing it — static)
  - `animation` (how it's executed) + `description` (text)  *(assets added later)*
- **Set** — one set of an exercise: `reps`, `weightKg`.
- **WorkoutExercise** — an exercise inside a workout + its `sets: Set[]`.
- **Workout** — what was done on a given day: `date`, `exercises: WorkoutExercise[]`.
- **SavedWorkout (template)** — a reusable workout the user builds from exercises:
  `name`, `exercises` (with default sets/reps optional). Used to quickly add a
  workout to a day.
  (BodyEntry, defined above, is what powers the body charts.)

### Muscle groups

Chest, Back, Shoulders, Biceps, Triceps, Quadriceps, Hamstrings, Glutes,
Calves, Abs/Core, Forearms.

Selecting a group goes **straight to its exercise list** — no sub-group screen.
Exercises still carry an optional `subGroup` tag (metadata only, e.g. lateral/rear
delt) but it is **not** used for navigation or cards in the app.

### Exercise catalog

The full exercise list is **finite and hardcoded** — see
[`data/exercises.json`](data/exercises.json) (84 exercises across the 11 groups,
each with `id`, `name`, `group`, `subGroup`). The app seeds this locally on first
run. Add exercises by editing that file. Images/animations/descriptions get
attached per `id` when assets arrive.

---

## Flows

### 1. First launch — onboarding / profile setup

- On the very first open, if the profile is not yet defined, show a welcome
  screen: e.g. *"Hello! Who are you?"* / *"Let's set up your profile"*.
- Ask for, on one screen (or a short sequence):
  - **name** the app should address you by,
  - **sex** (male / female),
  - **height** (cm),
  - **weight** (kg),
  - **date of birth** (calendar / date picker).
  - **Advanced (optional, skippable)**: body fat %, and measurements (cm) for
    arm, chest, shoulders, waist, glutes, quads — recorded as the first BodyEntry.
- On save → profile stored locally; this screen never shows again.
- After the profile exists, **every launch goes straight to Home**.

### 2. Home page

- **Top bar = current week**, showing the days of the week with the **day-of-month
  number**. Defaults to **today** (highlighted/selected).
- You can **select another day** from the bar to view/edit that day's workout.
- The bar **scrolls** to reach earlier days (past weeks).
- Below the bar, the selected day's content:
  - **No workout** on that day → message *"No workout today — add your workout"*
    with a **＋ button** to add one.
  - **Has a workout** → show it; each entry can be **expanded** to see the
    exercises done (and their sets/reps/weight).

### 3. Add a workout to a day

Tapping ＋ offers two ways:

1. **From a predefined / saved workout** — pick one of your saved workouts
   (templates) and it's added to the day (its exercises come with it).
2. **Build on the fly from exercises** — add exercises one by one to the day.

### 4. Add an exercise (used in build-on-the-fly and when composing templates)

- Choose a **muscle group** (from the popular list).
- Get the **list of exercises** for that muscle, each with an **image of a person
  performing it** *(assets later)*.
- Select an exercise, then set:
  - number of **sets**,
  - **reps** per set,
  - **weight in KG** per set.
- The exercise (with its sets) is added to the workout.

### 5. Left drawer (swipe from the left)

A panel with sections:

- **My Workouts** — build your own workouts from exercises and **save** them to
  reuse (templates). List, create, edit, delete.
- **Exercises** — browse exercises **per muscle group**. Tapping an exercise
  shows an **animation of how it's performed** + a **text explanation**.
- **Metrics** — dashboards & stats (below).
- **Profile** — view/edit profile (name, sex, height, date of birth), current
  **bodyweight**, and the optional **advanced stats** (body fat %, and arm /
  chest / shoulders / waist / glutes / quads in cm). Saving here records a new
  **BodyEntry**, which is what feeds the Body metrics. (No weight-reminder banner.)

### 6. Metrics (dashboards)

Metrics are split into **two sections** (tabs/segments): **Workouts** and **Body**.

**Workouts** (from workout history):
- **Workouts count** — e.g. how many workouts in the last week.
- **Weekly volume** — total **sets** per week (evolution chart); selectable
  **per muscle group**.
- **Average weight** — avg KG overall, and **per muscle group**.
- **Max weight** — overall, and **per muscle group**.

**Body** (from BodyEntry history, made in Profile):
- **Bodyweight** evolution over time.
- **Body fat %** evolution (when logged).
- **Measurements** evolution — arm, chest, shoulders, waist, glutes, quads
  (each a chart; only show ones that have data).

Charts are **dashboard / Grafana-style** — clean dark panels with line and bar
charts, a value + trend per panel, easy to scan.

---

## Decisions

- **Onboarding**: a single screen.
- **Editing**: sets and exercises can be edited/deleted after logging.
- **Bodyweight**: entered/updated in the **Profile** screen (not auto-prompted);
  a weekly reminder nudges you; only these updates affect the weight metrics.
- **Legs** are split into Quadriceps / Hamstrings / Calves (+ Glutes).
- **Sub-groups**: NOT used in the UI — selecting a group lists its exercises
  directly. `subGroup` stays only as optional metadata on exercises; no
  sub-group screens and no sub-group card images.

## Still open

- Muscle-group card images are done (11/11). **Exercise animations come later**,
  after the flows are built.
- Exact metric ranges/periods (last 7 days vs 4 weeks, etc.) — tune when building.
