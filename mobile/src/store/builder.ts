// Draft builder shared across the add-exercise sub-flow (group -> exercise -> sets).
// Used both for a day's workout and for a saved template.
import { create } from 'zustand'

import type { WorkoutExercise } from '@/domain/types'

type Mode = 'day' | 'template'

interface BuilderState {
  mode: Mode
  day: string | null
  templateId: string | null
  name: string
  exercises: WorkoutExercise[]
  startDay: (day: string, exercises?: WorkoutExercise[]) => void
  startTemplate: (id?: string, name?: string, exercises?: WorkoutExercise[]) => void
  setName: (name: string) => void
  addExercise: (we: WorkoutExercise) => void
  updateExercise: (index: number, we: WorkoutExercise) => void
  removeExercise: (index: number) => void
  addAll: (list: WorkoutExercise[]) => void
  reset: () => void
}

export const useBuilder = create<BuilderState>((set) => ({
  mode: 'day',
  day: null,
  templateId: null,
  name: '',
  exercises: [],
  startDay: (day, exercises = []) =>
    set({ mode: 'day', day, templateId: null, name: '', exercises }),
  startTemplate: (id, name = '', exercises = []) =>
    set({ mode: 'template', day: null, templateId: id ?? null, name, exercises }),
  setName: (name) => set({ name }),
  addExercise: (we) => set((s) => ({ exercises: [...s.exercises, we] })),
  updateExercise: (index, we) =>
    set((s) => ({ exercises: s.exercises.map((e, i) => (i === index ? we : e)) })),
  removeExercise: (index) =>
    set((s) => ({ exercises: s.exercises.filter((_, i) => i !== index) })),
  addAll: (list) => set((s) => ({ exercises: [...s.exercises, ...list] })),
  reset: () => set({ mode: 'day', day: null, templateId: null, name: '', exercises: [] }),
}))
