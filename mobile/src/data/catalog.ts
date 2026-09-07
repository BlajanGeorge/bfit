// The exercise catalog (seeded from assets) plus static asset maps for RN.
import type { ImageSourcePropType } from 'react-native'

import type { Exercise, MuscleGroup } from '@/domain/types'

// eslint-disable-next-line @typescript-eslint/no-var-requires
import raw from '@/assets/data/exercises.json'

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
  'Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Abs', 'Forearms',
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
  Forearms: require('@/assets/muscles/forearms.png'),
}
