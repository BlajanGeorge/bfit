// Pure, testable metric calculations. No I/O — callers pass in the data.
import { format, startOfWeek, subWeeks } from 'date-fns'

import type { BodyEntry, MuscleGroup, Workout } from './types'

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

/** Number of workouts in the current ISO week (Mon–Sun). */
export function workoutsThisWeek(
  workouts: Workout[],
  now: Date = new Date(),
): number {
  const ws = startOfWeek(now, { weekStartsOn: 1 })
  return workouts.filter((w) => {
    const d = dayToDate(w.date)
    return d >= ws && d <= now
  }).length
}

/** Total sets in the current ISO week (Mon–Sun), optionally per muscle group. */
export function setsThisWeek(
  workouts: Workout[],
  groupOf: GroupResolver,
  group?: MuscleGroup,
  now: Date = new Date(),
): number {
  const ws = startOfWeek(now, { weekStartsOn: 1 })
  let n = 0
  for (const w of workouts) {
    const d = dayToDate(w.date)
    if (d >= ws && d <= now) n += setsOf(w, groupOf, group).length
  }
  return n
}

/** Total reps in the current ISO week (Mon–Sun), optionally per muscle group. */
export function repsThisWeek(
  workouts: Workout[],
  groupOf: GroupResolver,
  group?: MuscleGroup,
  now: Date = new Date(),
): number {
  const ws = startOfWeek(now, { weekStartsOn: 1 })
  let n = 0
  for (const w of workouts) {
    const d = dayToDate(w.date)
    if (d >= ws && d <= now) for (const s of setsOf(w, groupOf, group)) n += s.reps
  }
  return n
}

/** Format "this week" range label, e.g. "7–13 Sep". */
export function thisWeekLabel(now: Date = new Date()): string {
  const ws = startOfWeek(now, { weekStartsOn: 1 })
  const we = new Date(ws)
  we.setDate(we.getDate() + 6)
  if (ws.getMonth() === we.getMonth()) {
    return `${ws.getDate()}–${we.getDate()} ${format(ws, 'MMM')}`
  }
  return `${format(ws, 'd MMM')}–${format(we, 'd MMM')}`
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

/** Total reps per ISO week (Mon-start) over the last `weeks` weeks, oldest first.
 *  Optionally restricted to one muscle group. Weeks align with weeklySetsSeries. */
export function weeklyRepsSeries(
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
    for (const s of setsOf(w, groupOf, group)) buckets[idx].value += s.reps
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

/** Max weight (kg) per workout day, oldest first — only days with at least one
 *  qualifying set (so gaps between bars show training frequency). Optionally
 *  restricted to one muscle group; `days` keeps only the most recent N
 *  workout days. 0-weight days are skipped. */
export function dailyMaxWeightSeries(
  workouts: Workout[],
  groupOf: GroupResolver,
  days = 10,
  group?: MuscleGroup,
): Point[] {
  const byDay = new Map<string, number>()
  for (const w of workouts) {
    let max = 0
    for (const s of setsOf(w, groupOf, group)) {
      if (s.weightKg > max) max = s.weightKg
    }
    if (max === 0) continue
    const cur = byDay.get(w.date)
    byDay.set(w.date, cur === undefined ? max : Math.max(cur, max))
  }
  return [...byDay.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .slice(-days)
    .map(([k, v]) => ({ label: format(dayToDate(k), 'd MMM'), value: v }))
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

/** Total reps across all workouts (volume), overall or per group. */
export function totalReps(
  workouts: Workout[],
  groupOf: GroupResolver,
  group?: MuscleGroup,
): number {
  let n = 0
  for (const w of workouts) for (const s of setsOf(w, groupOf, group)) n += s.reps
  return n
}

/** Bodyweight points over time, oldest first. Optionally limited to the last `days` days. */
export function bodyweightSeries(
  entries: BodyEntry[],
  days?: number,
): Point[] {
  return bodyMetricSeries(entries, 'weightKg', days)
}

/** Points over time for any numeric BodyEntry field, oldest first. Optionally
 *  limited to the last `days` days (keeping all stored history). Entries where
 *  the field is null/undefined are skipped. `now` is injectable for tests. */
export function bodyMetricSeries(
  entries: BodyEntry[],
  field: keyof BodyEntry,
  days?: number,
  now: Date = new Date(),
): Point[] {
  let cutoff: Date | null = null
  if (days) {
    cutoff = new Date(now)
    cutoff.setHours(0, 0, 0, 0)
    cutoff.setDate(cutoff.getDate() - (days - 1))
  }
  return [...entries]
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .filter((e) => typeof e[field] === 'number')
    .filter((e) => !cutoff || dayToDate(e.date) >= cutoff)
    .map((e) => ({
      label: format(dayToDate(e.date), 'd MMM'),
      value: e[field] as number,
    }))
}
