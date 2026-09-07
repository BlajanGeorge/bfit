// B-Fit domain types (see ../../../SPEC.md). Local-only, single user, weights in KG.

export type Sex = 'male' | 'female'

export type MuscleGroup =
  | 'Chest' | 'Back' | 'Shoulders' | 'Biceps' | 'Triceps'
  | 'Quadriceps' | 'Hamstrings' | 'Glutes' | 'Calves' | 'Abs' | 'Forearms'

export interface Profile {
  displayName: string
  sex: Sex
  heightCm: number
  dateOfBirth: string // ISO date
}

/** Seeded from assets/data/exercises.json. subGroup is metadata only (no UI). */
export interface Exercise {
  id: string
  name: string
  group: MuscleGroup
  subGroup: string | null
}

export interface WorkoutSet {
  reps: number
  weightKg: number
}

export interface WorkoutExercise {
  exerciseId: string
  sets: WorkoutSet[]
}

/** A logged workout on a given day. */
export interface Workout {
  id: string
  date: string // ISO date (day)
  exercises: WorkoutExercise[]
}

/** A reusable template the user builds and saves. */
export interface SavedWorkout {
  id: string
  name: string
  exercises: WorkoutExercise[]
}

export interface BodyweightEntry {
  date: string // ISO date
  weightKg: number
}
