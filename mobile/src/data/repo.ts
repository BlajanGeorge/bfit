// Data access for profile, workouts, templates and bodyweight.
import type {
  BodyEntry,
  Profile,
  SavedWorkout,
  Sex,
  Workout,
  WorkoutExercise,
} from '@/domain/types'

import { getDb, uid } from './db'

// ---- Profile ----------------------------------------------------------------

interface ProfileRow {
  display_name: string
  sex: string
  height_cm: number
  dob: string
}

export async function getProfile(): Promise<Profile | null> {
  const db = await getDb()
  const r = await db.getFirstAsync<ProfileRow>('SELECT * FROM profile WHERE id = 1')
  if (!r) return null
  return {
    displayName: r.display_name,
    sex: r.sex as Sex,
    heightCm: r.height_cm,
    dateOfBirth: r.dob,
  }
}

export async function saveProfile(p: Profile): Promise<void> {
  const db = await getDb()
  await db.runAsync(
    `INSERT INTO profile (id, display_name, sex, height_cm, dob)
     VALUES (1, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       display_name = excluded.display_name,
       sex = excluded.sex,
       height_cm = excluded.height_cm,
       dob = excluded.dob`,
    [p.displayName, p.sex, p.heightCm, p.dateOfBirth],
  )
}

// ---- Body entries -----------------------------------------------------------

interface BodyRow {
  day: string
  weight_kg: number
  body_fat_pct: number | null
  arm_cm: number | null
  chest_cm: number | null
  shoulders_cm: number | null
  waist_cm: number | null
  glutes_cm: number | null
  quads_cm: number | null
}

const BODY_COLS =
  'day, weight_kg, body_fat_pct, arm_cm, chest_cm, shoulders_cm, waist_cm, glutes_cm, quads_cm'

function toBodyEntry(r: BodyRow): BodyEntry {
  return {
    date: r.day,
    weightKg: r.weight_kg,
    bodyFatPct: r.body_fat_pct,
    armCm: r.arm_cm,
    chestCm: r.chest_cm,
    shouldersCm: r.shoulders_cm,
    waistCm: r.waist_cm,
    glutesCm: r.glutes_cm,
    quadsCm: r.quads_cm,
  }
}

/** Advanced (all optional) stats recorded alongside a bodyweight entry. */
export type BodyStats = Omit<BodyEntry, 'date' | 'weightKg'>

export async function addBodyEntry(
  day: string,
  weightKg: number,
  stats: BodyStats = {},
): Promise<void> {
  const db = await getDb()
  await db.runAsync(
    `INSERT INTO bodyweight_entries
       (id, day, weight_kg, body_fat_pct, arm_cm, chest_cm, shoulders_cm, waist_cm, glutes_cm, quads_cm)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(day) DO UPDATE SET
       weight_kg = excluded.weight_kg,
       body_fat_pct = excluded.body_fat_pct,
       arm_cm = excluded.arm_cm,
       chest_cm = excluded.chest_cm,
       shoulders_cm = excluded.shoulders_cm,
       waist_cm = excluded.waist_cm,
       glutes_cm = excluded.glutes_cm,
       quads_cm = excluded.quads_cm`,
    [
      uid(),
      day,
      weightKg,
      stats.bodyFatPct ?? null,
      stats.armCm ?? null,
      stats.chestCm ?? null,
      stats.shouldersCm ?? null,
      stats.waistCm ?? null,
      stats.glutesCm ?? null,
      stats.quadsCm ?? null,
    ],
  )
}

/** @deprecated use addBodyEntry — kept for callers that only log weight. */
export async function addBodyweight(day: string, weightKg: number): Promise<void> {
  await addBodyEntry(day, weightKg)
}

export async function getBodyEntries(): Promise<BodyEntry[]> {
  const db = await getDb()
  const rows = await db.getAllAsync<BodyRow>(
    `SELECT ${BODY_COLS} FROM bodyweight_entries ORDER BY day ASC, rowid ASC`,
  )
  return rows.map(toBodyEntry)
}

/** @deprecated use getBodyEntries. */
export const getBodyweightEntries = getBodyEntries

export async function getLatestBodyEntry(): Promise<BodyEntry | null> {
  const db = await getDb()
  const r = await db.getFirstAsync<BodyRow>(
    `SELECT ${BODY_COLS} FROM bodyweight_entries ORDER BY day DESC, rowid DESC LIMIT 1`,
  )
  return r ? toBodyEntry(r) : null
}

/** @deprecated use getLatestBodyEntry. */
export const getLatestBodyweight = getLatestBodyEntry

// ---- Workouts ---------------------------------------------------------------

async function loadExercises(
  db: Awaited<ReturnType<typeof getDb>>,
  parentTable: 'workout_exercises' | 'saved_workout_exercises',
  parentCol: 'workout_id' | 'saved_workout_id',
  setsTable: 'workout_sets' | 'saved_workout_sets',
  setsCol: 'workout_exercise_id' | 'saved_workout_exercise_id',
  parentId: string,
): Promise<WorkoutExercise[]> {
  const exRows = await db.getAllAsync<{ id: string; exercise_id: string; superset_id: string | null }>(
    `SELECT id, exercise_id, superset_id FROM ${parentTable} WHERE ${parentCol} = ? ORDER BY position ASC`,
    [parentId],
  )
  const out: WorkoutExercise[] = []
  for (const ex of exRows) {
    const setRows = await db.getAllAsync<{ reps: number; weight_kg: number }>(
      `SELECT reps, weight_kg FROM ${setsTable} WHERE ${setsCol} = ? ORDER BY position ASC`,
      [ex.id],
    )
    out.push({
      exerciseId: ex.exercise_id,
      sets: setRows.map((s) => ({ reps: s.reps, weightKg: s.weight_kg })),
      supersetId: ex.superset_id ?? undefined,
    })
  }
  return out
}

export async function getWorkoutByDate(day: string): Promise<Workout | null> {
  const db = await getDb()
  const w = await db.getFirstAsync<{ id: string; day: string }>(
    'SELECT id, day FROM workouts WHERE day = ?',
    [day],
  )
  if (!w) return null
  const exercises = await loadExercises(
    db, 'workout_exercises', 'workout_id', 'workout_sets', 'workout_exercise_id', w.id,
  )
  return { id: w.id, date: w.day, exercises }
}

export async function getAllWorkouts(): Promise<Workout[]> {
  const db = await getDb()
  const ws = await db.getAllAsync<{ id: string; day: string }>(
    'SELECT id, day FROM workouts ORDER BY day ASC',
  )
  const out: Workout[] = []
  for (const w of ws) {
    const exercises = await loadExercises(
      db, 'workout_exercises', 'workout_id', 'workout_sets', 'workout_exercise_id', w.id,
    )
    out.push({ id: w.id, date: w.day, exercises })
  }
  return out
}

/** Dates (yyyy-MM-dd) that have a workout with at least one exercise. */
export async function getWorkoutDays(): Promise<Set<string>> {
  const db = await getDb()
  const rows = await db.getAllAsync<{ day: string }>(
    `SELECT DISTINCT w.day AS day FROM workouts w
     JOIN workout_exercises we ON we.workout_id = w.id`,
  )
  return new Set(rows.map((r) => r.day))
}

/** Replace (upsert) the workout for a given day with the provided exercises. */
export async function saveWorkoutForDate(
  day: string,
  exercises: WorkoutExercise[],
): Promise<void> {
  const db = await getDb()
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM workouts WHERE day = ?', [day])
    if (exercises.length === 0) return
    const wid = uid()
    await db.runAsync('INSERT INTO workouts (id, day) VALUES (?, ?)', [wid, day])
    for (let i = 0; i < exercises.length; i++) {
      const we = exercises[i]
      const weId = uid()
      await db.runAsync(
        'INSERT INTO workout_exercises (id, workout_id, exercise_id, position, superset_id) VALUES (?, ?, ?, ?, ?)',
        [weId, wid, we.exerciseId, i, we.supersetId ?? null],
      )
      for (let j = 0; j < we.sets.length; j++) {
        await db.runAsync(
          'INSERT INTO workout_sets (id, workout_exercise_id, reps, weight_kg, position) VALUES (?, ?, ?, ?, ?)',
          [uid(), weId, we.sets[j].reps, we.sets[j].weightKg, j],
        )
      }
    }
  })
}

export async function deleteWorkout(day: string): Promise<void> {
  const db = await getDb()
  await db.runAsync('DELETE FROM workouts WHERE day = ?', [day])
}

// ---- Saved workouts (templates) --------------------------------------------

export async function getSavedWorkouts(): Promise<SavedWorkout[]> {
  const db = await getDb()
  const rows = await db.getAllAsync<{ id: string; name: string }>(
    'SELECT id, name FROM saved_workouts ORDER BY name ASC',
  )
  const out: SavedWorkout[] = []
  for (const r of rows) {
    const exercises = await loadExercises(
      db, 'saved_workout_exercises', 'saved_workout_id',
      'saved_workout_sets', 'saved_workout_exercise_id', r.id,
    )
    out.push({ id: r.id, name: r.name, exercises })
  }
  return out
}

export async function getSavedWorkout(id: string): Promise<SavedWorkout | null> {
  const db = await getDb()
  const r = await db.getFirstAsync<{ id: string; name: string }>(
    'SELECT id, name FROM saved_workouts WHERE id = ?',
    [id],
  )
  if (!r) return null
  const exercises = await loadExercises(
    db, 'saved_workout_exercises', 'saved_workout_id',
    'saved_workout_sets', 'saved_workout_exercise_id', r.id,
  )
  return { id: r.id, name: r.name, exercises }
}

export async function saveSavedWorkout(
  name: string,
  exercises: WorkoutExercise[],
  id?: string,
): Promise<void> {
  const db = await getDb()
  const swId = id ?? uid()
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM saved_workouts WHERE id = ?', [swId])
    await db.runAsync('INSERT INTO saved_workouts (id, name) VALUES (?, ?)', [swId, name])
    for (let i = 0; i < exercises.length; i++) {
      const we = exercises[i]
      const weId = uid()
      await db.runAsync(
        'INSERT INTO saved_workout_exercises (id, saved_workout_id, exercise_id, position, superset_id) VALUES (?, ?, ?, ?, ?)',
        [weId, swId, we.exerciseId, i, we.supersetId ?? null],
      )
      for (let j = 0; j < we.sets.length; j++) {
        await db.runAsync(
          'INSERT INTO saved_workout_sets (id, saved_workout_exercise_id, reps, weight_kg, position) VALUES (?, ?, ?, ?, ?)',
          [uid(), weId, we.sets[j].reps, we.sets[j].weightKg, j],
        )
      }
    }
  })
}

export async function deleteSavedWorkout(id: string): Promise<void> {
  const db = await getDb()
  await db.runAsync('DELETE FROM saved_workouts WHERE id = ?', [id])
}
