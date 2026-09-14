// Groups a flat exercise list into standalone exercises and superset pairs,
// for display. Supersets are always stored as two consecutive entries sharing
// the same supersetId (see store/builder.ts), so a simple adjacency scan is
// enough — no need to search the whole list for a matching id.
import type { WorkoutExercise } from './types'

export type ExerciseGroup =
  | { kind: 'single'; item: WorkoutExercise; index: number }
  | { kind: 'superset'; items: [WorkoutExercise, WorkoutExercise]; indices: [number, number] }

export function groupExercises(list: WorkoutExercise[]): ExerciseGroup[] {
  const out: ExerciseGroup[] = []
  for (let i = 0; i < list.length; i++) {
    const cur = list[i]
    const next = list[i + 1]
    if (cur.supersetId && next && next.supersetId === cur.supersetId) {
      out.push({ kind: 'superset', items: [cur, next], indices: [i, i + 1] })
      i++
    } else {
      out.push({ kind: 'single', item: cur, index: i })
    }
  }
  return out
}
