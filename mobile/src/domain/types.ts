// B-Fit domain types (see ../../../SPEC.md). Local-only, single user, weights in KG.

export type Sex = 'male' | 'female'

export type MuscleGroup =
  | 'Chest' | 'Back' | 'Shoulders' | 'Biceps' | 'Triceps'
  | 'Quadriceps' | 'Hamstrings' | 'Glutes' | 'Calves' | 'Abs'

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
  howto?: string[]
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

/** A dated snapshot of body stats. Only weight is required; the advanced
 *  measurements (cm) and body fat (%) are all optional. Feeds the Body metrics. */
export interface BodyEntry {
  date: string // ISO date
  weightKg: number
  bodyFatPct?: number | null
  armCm?: number | null
  chestCm?: number | null
  shouldersCm?: number | null
  waistCm?: number | null
  glutesCm?: number | null
  quadsCm?: number | null
}

/** @deprecated use BodyEntry — kept as an alias for existing imports. */
export type BodyweightEntry = BodyEntry

/** The optional advanced measurement fields on a BodyEntry, in display order. */
export const BODY_MEASURES = [
  { key: 'armCm', label: 'Arm', unit: 'cm' },
  { key: 'chestCm', label: 'Chest', unit: 'cm' },
  { key: 'shouldersCm', label: 'Shoulders', unit: 'cm' },
  { key: 'waistCm', label: 'Waist', unit: 'cm' },
  { key: 'glutesCm', label: 'Glutes', unit: 'cm' },
  { key: 'quadsCm', label: 'Quads', unit: 'cm' },
] as const

export type BodyMeasureKey = (typeof BODY_MEASURES)[number]['key']
