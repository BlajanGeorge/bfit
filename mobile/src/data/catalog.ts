// The exercise catalog (seeded from assets) plus static asset maps for RN.
import type { ImageSourcePropType } from 'react-native'

import type { Exercise, MuscleGroup } from '@/domain/types'

// eslint-disable-next-line @typescript-eslint/no-var-requires
import raw from '@/assets/data/exercises.json'

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
  'Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Abs',
]

export const CATALOG: Exercise[] = (raw as any).exercises as Exercise[]

const byId = new Map<string, Exercise>()
for (const e of CATALOG) byId.set(e.id, e)

export function getExercise(id: string): Exercise | undefined {
  return byId.get(id)
}

export function exerciseName(id: string): string {
  return byId.get(id)?.name ?? id
}

export function groupOf(id: string): MuscleGroup | undefined {
  return byId.get(id)?.group
}

export function exercisesForGroup(group: MuscleGroup): Exercise[] {
  return CATALOG.filter((e) => e.group === group)
}

// Static requires — React Native needs literal paths.
export const MUSCLE_IMAGES: Record<MuscleGroup, ImageSourcePropType> = {
  Chest: require('@/assets/muscles/chest.png'),
  Back: require('@/assets/muscles/back.png'),
  Shoulders: require('@/assets/muscles/shoulders.png'),
  Biceps: require('@/assets/muscles/biceps.png'),
  Triceps: require('@/assets/muscles/triceps.png'),
  Quadriceps: require('@/assets/muscles/quadriceps.png'),
  Hamstrings: require('@/assets/muscles/hamstrings.png'),
  Glutes: require('@/assets/muscles/glutes.png'),
  Calves: require('@/assets/muscles/calves.png'),
  Abs: require('@/assets/muscles/abs.png'),
}

// Per-exercise looping animations (keyed by exercise id). Added as assets arrive.
export const EXERCISE_ANIMATIONS: Partial<Record<string, ImageSourcePropType>> = {
  'bench-press': require('@/assets/animations/bench-press.webp'),
  'incline-bench-press': require('@/assets/animations/incline-bench-press.webp'),
  'decline-bench-press': require('@/assets/animations/decline-bench-press.webp'),
  'incline-db-press': require('@/assets/animations/incline-db-press.webp'),
  'db-bench-press': require('@/assets/animations/db-bench-press.webp'),
  'db-fly': require('@/assets/animations/db-fly.webp'),
  'incline-db-fly': require('@/assets/animations/incline-db-fly.webp'),
  'cable-crossover': require('@/assets/animations/cable-crossover.webp'),
  'pec-deck': require('@/assets/animations/pec-deck.webp'),
  'machine-chest-press': require('@/assets/animations/machine-chest-press.webp'),
  'push-up': require('@/assets/animations/push-up.webp'),
  'chest-dip': require('@/assets/animations/chest-dip.webp'),
  'deadlift': require('@/assets/animations/deadlift.webp'),
  'pull-up': require('@/assets/animations/pull-up.webp'),
  'lat-pulldown': require('@/assets/animations/lat-pulldown.webp'),
  'chin-up': require('@/assets/animations/chin-up.webp'),
  'bent-over-row': require('@/assets/animations/bent-over-row.webp'),
  'db-row': require('@/assets/animations/db-row.webp'),
  'seated-cable-row': require('@/assets/animations/seated-cable-row.webp'),
  'straight-arm-pulldown': require('@/assets/animations/straight-arm-pulldown.webp'),
  'shrug': require('@/assets/animations/shrug.webp'),
  'back-extension': require('@/assets/animations/back-extension.webp'),
  'overhead-press': require('@/assets/animations/overhead-press.webp'),
  'lateral-raise': require('@/assets/animations/lateral-raise.webp'),
  'db-shoulder-press': require('@/assets/animations/db-shoulder-press.webp'),
  'front-raise': require('@/assets/animations/front-raise.webp'),
  'cable-lateral-raise': require('@/assets/animations/cable-lateral-raise.webp'),
  'rear-delt-fly': require('@/assets/animations/rear-delt-fly.webp'),
  'face-pull': require('@/assets/animations/face-pull.webp'),
  'machine-shoulder-press': require('@/assets/animations/machine-shoulder-press.webp'),
  'db-curl': require('@/assets/animations/db-curl.webp'),
  'upright-row': require('@/assets/animations/upright-row.webp'),
  'barbell-curl': require('@/assets/animations/barbell-curl.webp'),
  'hammer-curl': require('@/assets/animations/hammer-curl.webp'),
  'preacher-curl': require('@/assets/animations/preacher-curl.webp'),
  'incline-db-curl': require('@/assets/animations/incline-db-curl.webp'),
  'concentration-curl': require('@/assets/animations/concentration-curl.webp'),
  'cable-curl': require('@/assets/animations/cable-curl.webp'),
  'triceps-pushdown': require('@/assets/animations/triceps-pushdown.webp'),
  'skull-crusher': require('@/assets/animations/skull-crusher.webp'),
  'triceps-dip': require('@/assets/animations/triceps-dip.webp'),
  'overhead-triceps-ext': require('@/assets/animations/overhead-triceps-ext.webp'),
  'rope-pushdown': require('@/assets/animations/rope-pushdown.webp'),
  'close-grip-bench': require('@/assets/animations/close-grip-bench.webp'),
  'leg-press': require('@/assets/animations/leg-press.webp'),
  'back-squat': require('@/assets/animations/back-squat.webp'),
  'hack-squat': require('@/assets/animations/hack-squat.webp'),
  'leg-extension': require('@/assets/animations/leg-extension.webp'),
  'bulgarian-split-squat': require('@/assets/animations/bulgarian-split-squat.webp'),
  'seated-leg-curl': require('@/assets/animations/seated-leg-curl.webp'),
  'romanian-deadlift': require('@/assets/animations/romanian-deadlift.webp'),
  'lying-leg-curl': require('@/assets/animations/lying-leg-curl.webp'),
  'sumo-deadlift': require('@/assets/animations/sumo-deadlift.webp'),
  'machine-kickback': require('@/assets/animations/machine-kickback.webp'),
  'seated-calf-raise': require('@/assets/animations/seated-calf-raise.webp'),
  'leg-press-calf-raise': require('@/assets/animations/leg-press-calf-raise.webp'),
  'standing-calf-raise': require('@/assets/animations/standing-calf-raise.webp'),
  'hip-thrust': require('@/assets/animations/hip-thrust.webp'),
  'hanging-leg-raise': require('@/assets/animations/hanging-leg-raise.webp'),
  'crunch': require('@/assets/animations/crunch.webp'),
  'plank': require('@/assets/animations/plank.webp'),
  'russian-twist': require('@/assets/animations/russian-twist.webp'),
  'reverse-pec-deck': require('@/assets/animations/reverse-pec-deck.webp'),
  'dumbbell-shrug': require('@/assets/animations/dumbbell-shrug.webp'),
  'hip-abductor': require('@/assets/animations/hip-abductor.webp'),
  'leg-press-machine': require('@/assets/animations/leg-press-machine.webp'),
}

export function getExerciseAnimation(id: string): ImageSourcePropType | undefined {
  return EXERCISE_ANIMATIONS[id]
}

// Small still thumbnails (the animation's start pose) shown in the exercise list.
export const EXERCISE_THUMBS: Partial<Record<string, ImageSourcePropType>> = {
  'bench-press': require('@/assets/exercise-thumbs/bench-press.png'),
  'incline-bench-press': require('@/assets/exercise-thumbs/incline-bench-press.png'),
  'decline-bench-press': require('@/assets/exercise-thumbs/decline-bench-press.png'),
  'incline-db-press': require('@/assets/exercise-thumbs/incline-db-press.png'),
  'db-bench-press': require('@/assets/exercise-thumbs/db-bench-press.png'),
  'db-fly': require('@/assets/exercise-thumbs/db-fly.png'),
  'incline-db-fly': require('@/assets/exercise-thumbs/incline-db-fly.png'),
  'cable-crossover': require('@/assets/exercise-thumbs/cable-crossover.png'),
  'pec-deck': require('@/assets/exercise-thumbs/pec-deck.png'),
  'machine-chest-press': require('@/assets/exercise-thumbs/machine-chest-press.png'),
  'push-up': require('@/assets/exercise-thumbs/push-up.png'),
  'chest-dip': require('@/assets/exercise-thumbs/chest-dip.png'),
  'deadlift': require('@/assets/exercise-thumbs/deadlift.png'),
  'pull-up': require('@/assets/exercise-thumbs/pull-up.png'),
  'chin-up': require('@/assets/exercise-thumbs/chin-up.png'),
  'lat-pulldown': require('@/assets/exercise-thumbs/lat-pulldown.png'),
  'bent-over-row': require('@/assets/exercise-thumbs/bent-over-row.png'),
  'db-row': require('@/assets/exercise-thumbs/db-row.png'),
  'seated-cable-row': require('@/assets/exercise-thumbs/seated-cable-row.png'),
  'straight-arm-pulldown': require('@/assets/exercise-thumbs/straight-arm-pulldown.png'),
  'shrug': require('@/assets/exercise-thumbs/shrug.png'),
  'back-extension': require('@/assets/exercise-thumbs/back-extension.png'),
  'overhead-press': require('@/assets/exercise-thumbs/overhead-press.png'),
  'db-shoulder-press': require('@/assets/exercise-thumbs/db-shoulder-press.png'),
  'lateral-raise': require('@/assets/exercise-thumbs/lateral-raise.png'),
  'front-raise': require('@/assets/exercise-thumbs/front-raise.png'),
  'cable-lateral-raise': require('@/assets/exercise-thumbs/cable-lateral-raise.png'),
  'rear-delt-fly': require('@/assets/exercise-thumbs/rear-delt-fly.png'),
  'face-pull': require('@/assets/exercise-thumbs/face-pull.png'),
  'machine-shoulder-press': require('@/assets/exercise-thumbs/machine-shoulder-press.png'),
  'upright-row': require('@/assets/exercise-thumbs/upright-row.png'),
  'db-curl': require('@/assets/exercise-thumbs/db-curl.png'),
  'barbell-curl': require('@/assets/exercise-thumbs/barbell-curl.png'),
  'hammer-curl': require('@/assets/exercise-thumbs/hammer-curl.png'),
  'preacher-curl': require('@/assets/exercise-thumbs/preacher-curl.png'),
  'incline-db-curl': require('@/assets/exercise-thumbs/incline-db-curl.png'),
  'concentration-curl': require('@/assets/exercise-thumbs/concentration-curl.png'),
  'cable-curl': require('@/assets/exercise-thumbs/cable-curl.png'),
  'triceps-pushdown': require('@/assets/exercise-thumbs/triceps-pushdown.png'),
  'rope-pushdown': require('@/assets/exercise-thumbs/rope-pushdown.png'),
  'skull-crusher': require('@/assets/exercise-thumbs/skull-crusher.png'),
  'close-grip-bench': require('@/assets/exercise-thumbs/close-grip-bench.png'),
  'triceps-dip': require('@/assets/exercise-thumbs/triceps-dip.png'),
  'overhead-triceps-ext': require('@/assets/exercise-thumbs/overhead-triceps-ext.png'),
  'leg-press': require('@/assets/exercise-thumbs/leg-press.png'),
  'back-squat': require('@/assets/exercise-thumbs/back-squat.png'),
  'hack-squat': require('@/assets/exercise-thumbs/hack-squat.png'),
  'leg-extension': require('@/assets/exercise-thumbs/leg-extension.png'),
  'bulgarian-split-squat': require('@/assets/exercise-thumbs/bulgarian-split-squat.png'),
  'seated-leg-curl': require('@/assets/exercise-thumbs/seated-leg-curl.png'),
  'romanian-deadlift': require('@/assets/exercise-thumbs/romanian-deadlift.png'),
  'hip-thrust': require('@/assets/exercise-thumbs/hip-thrust.png'),
  'lying-leg-curl': require('@/assets/exercise-thumbs/lying-leg-curl.png'),
  'machine-kickback': require('@/assets/exercise-thumbs/machine-kickback.png'),
  'sumo-deadlift': require('@/assets/exercise-thumbs/sumo-deadlift.png'),
  'leg-press-calf-raise': require('@/assets/exercise-thumbs/leg-press-calf-raise.png'),
  'seated-calf-raise': require('@/assets/exercise-thumbs/seated-calf-raise.png'),
  'standing-calf-raise': require('@/assets/exercise-thumbs/standing-calf-raise.png'),
  'russian-twist': require('@/assets/exercise-thumbs/russian-twist.png'),
  'plank': require('@/assets/exercise-thumbs/plank.png'),
  'crunch': require('@/assets/exercise-thumbs/crunch.png'),
  'hanging-leg-raise': require('@/assets/exercise-thumbs/hanging-leg-raise.png'),
  'reverse-pec-deck': require('@/assets/exercise-thumbs/reverse-pec-deck.png'),
  'dumbbell-shrug': require('@/assets/exercise-thumbs/dumbbell-shrug.png'),
  'hip-abductor': require('@/assets/exercise-thumbs/hip-abductor.png'),
  'leg-press-machine': require('@/assets/exercise-thumbs/leg-press-machine.png'),
}

export function getExerciseThumb(id: string): ImageSourcePropType | undefined {
  return EXERCISE_THUMBS[id]
}
