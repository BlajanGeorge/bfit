// Pure, testable metric calculations. No I/O — callers pass in the data.
import { format, startOfWeek, subWeeks } from 'date-fns'

import type { BodyweightEntry, MuscleGroup, Workout } from './types'

/** Maps an exerciseId to its muscle group. */
export type GroupResolver = (exerciseId: string) => MuscleGroup | undefined

export interface Point {
  label: string
  value: number
}

function dayToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** All sets in a workout, optionally filtered to one muscle group. */
function setsOf(
  w: Workout,
  groupOf: GroupResolver,
  group?: MuscleGroup,
): { reps: number; weightKg: number }[] {
  const out: { reps: number; weightKg: number }[] = []
  for (const we of w.exercises) {
    if (group && groupOf(we.exerciseId) !== group) continue
    for (const s of we.sets) out.push(s)
  }
  return out
}

/** Number of workouts logged in the last `days` days (inclusive of today). */
export function workoutsInLastDays(
  workouts: Workout[],
  days = 7,
  now: Date = new Date(),
): number {
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - (days - 1))
  cutoff.setHours(0, 0, 0, 0)
  return workouts.filter((w) => dayToDate(w.date) >= cutoff).length
}

/** Total sets per ISO week (Mon-start) over the last `weeks` weeks, oldest first.
 *  Optionally restricted to one muscle group. */
export function weeklySetsSeries(
  workouts: Workout[],
  groupOf: GroupResolver,
  weeks = 8,
  group?: MuscleGroup,
  now: Date = new Date(),
): Point[] {
  const buckets: Point[] = []
  const keyIndex = new Map<string, number>()
  for (let i = weeks - 1; i >= 0; i--) {
    const ws = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
    const k = format(ws, 'yyyy-MM-dd')
    keyIndex.set(k, buckets.length)
    buckets.push({ label: format(ws, 'd MMM'), value: 0 })
  }
  for (const w of workouts) {
    const ws = startOfWeek(dayToDate(w.date), { weekStartsOn: 1 })
    const k = format(ws, 'yyyy-MM-dd')
    const idx = keyIndex.get(k)
    if (idx === undefined) continue
    buckets[idx].value += setsOf(w, groupOf, group).length
  }
  return buckets
}

/** Average weight (kg) across all sets, overall or per group. 0 if none. */
export function averageWeight(
  workouts: Workout[],
  groupOf: GroupResolver,
  group?: MuscleGroup,
): number {
  let sum = 0
  let n = 0
  for (const w of workouts) {
    for (const s of setsOf(w, groupOf, group)) {
      sum += s.weightKg
      n++
    }
  }
  return n === 0 ? 0 : sum / n
}

/** Max weight (kg) across all sets, overall or per group. 0 if none. */
export function maxWeight(
  workouts: Workout[],
  groupOf: GroupResolver,
  group?: MuscleGroup,
): number {
  let max = 0
  for (const w of workouts) {
    for (const s of setsOf(w, groupOf, group)) {
      if (s.weightKg > max) max = s.weightKg
    }
  }
  return max
}

/** Total sets across all workouts (volume), overall or per group. */
export function totalSets(
  workouts: Workout[],
  groupOf: GroupResolver,
  group?: MuscleGroup,
): number {
  let n = 0
  for (const w of workouts) n += setsOf(w, groupOf, group).length
  return n
}

/** Bodyweight points over time, oldest first. */
export function bodyweightSeries(entries: BodyweightEntry[]): Point[] {
  return [...entries]
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((e) => ({ label: format(dayToDate(e.date), 'd MMM'), value: e.weightKg }))
}
