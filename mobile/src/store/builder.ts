// Draft builder shared across the add-exercise sub-flow (group -> exercise -> sets).
// Used both for a day's workout and for a saved template.
import { create } from 'zustand'

import type { WorkoutExercise } from '@/domain/types'

type Mode = 'day' | 'template'

const supersetUid = () => `ss-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

interface BuilderState {
  mode: Mode
  day: string | null
  templateId: string | null
  name: string
  exercises: WorkoutExercise[]
  /** First exercise of a superset being built, held while picking the second. */
  supersetDraft: WorkoutExercise | null
  startDay: (day: string, exercises?: WorkoutExercise[]) => void
  startTemplate: (id?: string, name?: string, exercises?: WorkoutExercise[]) => void
  setName: (name: string) => void
  addExercise: (we: WorkoutExercise) => void
  updateExercise: (index: number, we: WorkoutExercise) => void
  removeExercise: (index: number) => void
  addAll: (list: WorkoutExercise[]) => void
  stashSupersetFirst: (we: WorkoutExercise) => void
  completeSuperset: (second: WorkoutExercise) => void
  clearSupersetDraft: () => void
  reset: () => void
}

export const useBuilder = create<BuilderState>((set) => ({
  mode: 'day',
  day: null,
  templateId: null,
  name: '',
  exercises: [],
  supersetDraft: null,
  startDay: (day, exercises = []) =>
    set({ mode: 'day', day, templateId: null, name: '', exercises, supersetDraft: null }),
  startTemplate: (id, name = '', exercises = []) =>
    set({ mode: 'template', day: null, templateId: id ?? null, name, exercises, supersetDraft: null }),
  setName: (name) => set({ name }),
  addExercise: (we) => set((s) => ({ exercises: [...s.exercises, we] })),
  updateExercise: (index, we) =>
    set((s) => ({ exercises: s.exercises.map((e, i) => (i === index ? we : e)) })),
  removeExercise: (index) =>
    set((s) => {
      const removed = s.exercises[index]
      let next = s.exercises.filter((_, i) => i !== index)
      // if that leaves the removed exercise's superset partner alone, it's
      // no longer a superset — ungroup it back to a standalone exercise
      if (removed?.supersetId) {
        const stillPaired = next.filter((e) => e.supersetId === removed.supersetId)
        if (stillPaired.length === 1) {
          next = next.map((e) =>
            e.supersetId === removed.supersetId ? { ...e, supersetId: undefined } : e,
          )
        }
      }
      return { exercises: next }
    }),
  addAll: (list) => set((s) => ({ exercises: [...s.exercises, ...list] })),
  stashSupersetFirst: (we) => set({ supersetDraft: we }),
  completeSuperset: (second) =>
    set((s) => {
      if (!s.supersetDraft) return { exercises: [...s.exercises, second], supersetDraft: null }
      const gid = supersetUid()
      return {
        exercises: [
          ...s.exercises,
          { ...s.supersetDraft, supersetId: gid },
          { ...second, supersetId: gid },
        ],
        supersetDraft: null,
      }
    }),
  clearSupersetDraft: () => set({ supersetDraft: null }),
  reset: () =>
    set({ mode: 'day', day: null, templateId: null, name: '', exercises: [], supersetDraft: null }),
}))
