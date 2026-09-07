# B-Fit — Spec & Flows

Personal fitness app, **local-only** on the phone (no account, no server, all
data stored on the device). Business logic and flows, feature by feature. No
tech stack yet.

## Principles

- **Local-first**: everything works offline; data lives on the device.
- **Single user**: just me — no auth, no sharing, no social.
- **Simple**: fast to log a workout, minimal taps.
- **Units**: weights in **KG**.

---

## Core concepts (data model, conceptual)

- **Profile** — set once on first launch, editable later:
  - `displayName` (how the app addresses you)
  - `sex` (male / female)
  - `heightCm`
  - `weightKg` (current; also the first entry of bodyweight history)
  - `dateOfBirth` (date)
- **MuscleGroup** — a fixed list of the popular gym groups (see below).
- **Exercise** — a predefined exercise:
  - `name`
  - `muscleGroup`
  - `image` (a figure performing it — static)
  - `animation` (how it's executed) + `description` (text)  *(assets added later)*
- **Set** — one set of an exercise: `reps`, `weightKg`.
- **WorkoutExercise** — an exercise inside a workout + its `sets: Set[]`.
- **Workout** — what was done on a given day: `date`, `exercises: WorkoutExercise[]`.
- **SavedWorkout (template)** — a reusable workout the user builds from exercises:
  `name`, `exercises` (with default sets/reps optional). Used to quickly add a
  workout to a day.
- **BodyweightEntry** — `date`, `weightKg` (logged ~weekly) for the weight chart.

### Muscle groups (proposed)

Chest, Back, Shoulders, Biceps, Triceps, Legs (Quads), Hamstrings, Glutes,
Calves, Abs/Core, Forearms. *(tunable)*

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

### 6. Metrics (dashboards)

All computed from local workout history:

- **Workouts count** — e.g. how many workouts in the last week.
- **Weekly volume** — total **sets** per week (evolution chart); selectable
  **per muscle group** to see sets done for that group.
- **Average weight** — avg KG overall, and **per muscle group**.
- **Max weight** — overall, and **per muscle group**.
- **Bodyweight evolution** — chart over time; you log bodyweight ~weekly.

---

## Open questions / assumptions

- Onboarding: single screen vs short multi-step? (assume single screen for now)
- Editing/deleting sets & exercises after logging — assume yes (tap to edit).
- Bodyweight logging: prompt weekly, or manual entry from Metrics? (assume manual
  entry, with a gentle weekly reminder — TBD)
- Muscle group list above is a starting set; adjust as needed.
- Assets (exercise images + animations) sourced later.
