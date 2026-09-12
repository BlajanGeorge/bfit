// Tests for body metric series helpers used by the Body dashboard.
import { format, subDays } from 'date-fns'

import {
  bodyMetricSeries,
  bodyweightSeries,
  dailyMaxWeightSeries,
  maxWeight,
  repsThisWeek,
  setsThisWeek,
  thisWeekLabel,
  workoutsThisWeek,
} from '@/domain/metrics'
import type { BodyEntry, MuscleGroup, Workout } from '@/domain/types'

const NOW = new Date(2026, 8, 11) // 2026-09-11, injectable "today"
const key = (d: Date): string => format(d, 'yyyy-MM-dd')

const entry = (daysAgo: number, weightKg: number): BodyEntry => ({
  date: key(subDays(NOW, daysAgo)),
  weightKg,
})

describe('bodyMetricSeries', () => {
  it('keeps the whole history, oldest first', () => {
    const entries = [entry(600, 80), entry(30, 81), entry(1, 82)]
    const series = bodyMetricSeries(entries, 'weightKg')
    expect(series.map((p) => p.value)).toEqual([80, 81, 82])
  })

  it('limits to the last `days` days without dropping stored data', () => {
    const entries = [entry(600, 80), entry(30, 81), entry(1, 82), entry(0, 83)]
    const series = bodyMetricSeries(entries, 'weightKg', 7, NOW)
    expect(series.map((p) => p.value)).toEqual([82, 83])
  })

  it('includes today as the 1st day of the window', () => {
    const entries = [entry(7, 79), entry(6, 80), entry(0, 83)]
    const series = bodyMetricSeries(entries, 'weightKg', 7, NOW)
    expect(series.map((p) => p.value)).toEqual([80, 83])
  })

  it('skips entries where the measured field is missing', () => {
    const e = entry(1, 82)
    const noFat: BodyEntry = { ...e, bodyFatPct: null }
    const series = bodyMetricSeries([noFat], 'bodyFatPct', 7, NOW)
    expect(series).toEqual([])
  })
})

describe('bodyweightSeries', () => {
  it('defaults to the full history', () => {
    const series = bodyweightSeries([entry(100, 80), entry(1, 82)])
    expect(series.map((p) => p.value)).toEqual([80, 82])
  })

  it('passes through a day window', () => {
    const series = bodyweightSeries([entry(100, 80), entry(3, 82), entry(0, 83)], 7)
    expect(series.map((p) => p.value)).toEqual([82, 83])
  })
})

const workout = (date: string, repsTotal: number, sets = 3): Workout => ({
  id: `w-${date}-${repsTotal}`,
  date,
  exercises: [
    {
      exerciseId: 'ex1',
      sets: Array.from({ length: sets }, (_, i) => ({
        reps: Math.round(repsTotal / sets),
        weightKg: 50,
      })),
    },
  ],
})

describe('current ISO week counters', () => {
  // NOW = 2026-09-11 (Friday). This week runs Mon 2026-09-07 → Sun 2026-09-13.
  it('counts workouts starting Monday, not the rolling week', () => {
    const workouts = [
      workout('2026-09-09', 30), // this week (Wed)
      workout('2026-09-05', 30), // previous Saturday — excluded
      workout('2026-09-07', 30), // this week (Mon)
    ]
    expect(workoutsThisWeek(workouts, NOW)).toBe(2)
  })

  it('totals sets and reps only within the current week', () => {
    const groupOf = () => 'Chest' as const
    const workouts = [
      workout('2026-09-09', 30), // 3 sets, 30 reps
      workout('2026-09-05', 12, 4), // out of window
    ]
    expect(setsThisWeek(workouts, groupOf, undefined, NOW)).toBe(3)
    expect(repsThisWeek(workouts, groupOf, undefined, NOW)).toBe(30)
  })

  it('renders the week range label', () => {
    expect(thisWeekLabel(NOW)).toBe('7–13 Sep')
    expect(thisWeekLabel(new Date(2026, 1, 1))).toBe('26 Jan–1 Feb') // month boundary
  })
})

describe('typed Workout usage', () => {
  it('satisfies the Workout type', () => {
    const w: Workout[] = [workout('2026-09-09', 30)]
    expect(w.length).toBe(1)
  })
})

describe('maxWeight', () => {
  const groupOf = (id: string) => (id === 'chest1' ? 'Chest' : 'Back') as MuscleGroup

  const wo = (date: string, weightKg: number): Workout => ({
    id: `w-${date}-${weightKg}`, date,
    exercises: [{ exerciseId: 'ex1', sets: [{ reps: 10, weightKg }] }],
  })

  it('returns the highest weight across all workouts', () => {
    expect(maxWeight([wo('2026-08-03', 40), wo('2026-09-09', 90)], groupOf)).toBe(90)
  })

  it('respects muscle filter', () => {
    const ws: Workout[] = [
      { id: 'a', date: '2026-09-09', exercises: [
        { exerciseId: 'chest1', sets: [{ reps: 5, weightKg: 100 }] },
        { exerciseId: 'back1',  sets: [{ reps: 5, weightKg: 50 }] },
      ]},
    ]
    expect(maxWeight(ws, groupOf, 'Chest')).toBe(100)
    expect(maxWeight(ws, groupOf, 'Back')).toBe(50)
  })
})

describe('dailyMaxWeightSeries', () => {
  const groupOf = (id: string) => (id === 'chest1' ? 'Chest' : 'Back') as MuscleGroup

  const wo = (date: string, weightKg: number): Workout => ({
    id: `w-${date}-${weightKg}`, date,
    exercises: [{ exerciseId: 'chest1', sets: [{ reps: 10, weightKg }] }],
  })

  it('keeps one bar per workout day with that day’s max, oldest first', () => {
    const ws = [wo('2026-09-01', 40), wo('2026-09-01', 60), wo('2026-09-05', 50)]
    expect(dailyMaxWeightSeries(ws, groupOf)).toEqual([
      { label: '1 Sep', value: 60 },
      { label: '5 Sep', value: 50 },
    ])
  })

  it('respects the muscle filter, skipping days without qualifying sets', () => {
    const ws: Workout[] = [
      { id: 'a', date: '2026-09-01', exercises: [
        { exerciseId: 'chest1', sets: [{ reps: 5, weightKg: 100 }] },
      ]},
      { id: 'b', date: '2026-09-02', exercises: [
        { exerciseId: 'back1', sets: [{ reps: 5, weightKg: 50 }] },
      ]},
    ]
    expect(dailyMaxWeightSeries(ws, groupOf, 10, 'Back')).toEqual([
      { label: '2 Sep', value: 50 },
    ])
  })

  it('keeps only the most recent N workout days', () => {
    const ws = [
      wo('2026-08-20', 10), wo('2026-08-25', 20), wo('2026-08-30', 30),
      wo('2026-09-04', 40), wo('2026-09-08', 50),
    ]
    const out = dailyMaxWeightSeries(ws, groupOf, 3)
    expect(out.map((p) => p.value)).toEqual([30, 40, 50])
  })

  it('returns [] when there are no workouts', () => {
    expect(dailyMaxWeightSeries([], groupOf)).toEqual([])
  })
})
import { niceRange } from '../src/domain/metrics'

describe('niceRange', () => {
  it('frames a narrow bodyweight series instead of starting at 0', () => {
    const r = niceRange([84.6, 84.1, 83.3, 82.5])
    expect(r.min).toBeLessThan(82.5)
    expect(r.min).toBeGreaterThan(70)
    expect(r.max).toBeGreaterThan(84.6)
    expect(r.labels[0]).toBe(String(r.min))
    expect(r.labels).toHaveLength(r.sections + 1)
  })
  it('gives a single value some room', () => {
    const r = niceRange([80])
    expect(r.min).toBeLessThan(80)
    expect(r.max).toBeGreaterThan(80)
  })
  it('keeps a big jump readable without going below zero', () => {
    const r = niceRange([10, 12, 80])
    expect(r.min).toBe(0)
    expect(r.max).toBeGreaterThanOrEqual(80)
    expect(r.sections).toBeGreaterThanOrEqual(3)
    expect(r.sections).toBeLessThanOrEqual(8)
    expect(r.labels).toHaveLength(r.sections + 1)
  })
  it('uses fractional steps when the values are close together', () => {
    const r = niceRange([16.9, 17.1])
    expect(r.labels.some((l) => l.includes('.'))).toBe(true)
    expect(r.max - r.min).toBeLessThan(2)
  })
})
