// A saved template, full page: its exercises with their sets, and a way to edit it.
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { ExerciseThumb } from '@/components/ExerciseThumb'
import { Card } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Screen } from '@/components/ui/Screen'
import { SupersetBadge } from '@/components/ui/SupersetBadge'
import { Spacing } from '@/constants/theme'
import { exerciseName, groupOf } from '@/data/catalog'
import { getSavedWorkout } from '@/data/repo'
import { groupExercises } from '@/domain/superset'
import type { SavedWorkout, WorkoutExercise } from '@/domain/types'
import { useTheme } from '@/hooks/use-theme'
import { useBuilder } from '@/store/builder'

export default function WorkoutTemplate() {
  const c = useTheme()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [t, setT] = useState<SavedWorkout | null>(null)
  const startTemplate = useBuilder((s) => s.startTemplate)

  useFocusEffect(
    useCallback(() => {
      getSavedWorkout(id).then(setT)
    }, [id]),
  )

  const edit = () => {
    if (!t) return
    startTemplate(t.id, t.name, t.exercises)
    router.push('/build-workout')
  }

  const setCount = t?.exercises.reduce((n, e) => n + e.sets.length, 0) ?? 0

  const renderRow = (we: WorkoutExercise) => (
    <>
      <TouchableOpacity
        style={styles.row}
        onPress={() => router.push({ pathname: '/exercise-detail', params: { exerciseId: we.exerciseId } })}>
        <ExerciseThumb exerciseId={we.exerciseId} size={56} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: c.text }]}>{exerciseName(we.exerciseId)}</Text>
          <Text style={{ color: c.textSecondary, fontSize: 13, marginTop: 2 }}>
            {groupOf(we.exerciseId)} · {we.sets.length} sets
          </Text>
        </View>
        <Icon name="chevron.right" color={c.textSecondary} size={16} />
      </TouchableOpacity>
      <View style={styles.sets}>
        {we.sets.map((s, j) => (
          <View key={j} style={[styles.set, { backgroundColor: c.background, borderColor: c.border }]}>
            <Text style={{ color: c.textSecondary, fontSize: 11 }}>SET {j + 1}</Text>
            <Text style={{ color: c.text, fontWeight: '700', fontSize: 14 }}>
              {s.weightKg > 0 ? `${s.reps} × ${s.weightKg} kg` : `${s.reps} reps`}
            </Text>
          </View>
        ))}
      </View>
    </>
  )

  return (
    <Screen
      title={t?.name ?? 'Template'}
      leading="back"
      rightAction={
        <TouchableOpacity onPress={edit} accessibilityLabel="Edit template" style={styles.iconBtn}>
          <Icon name="square.and.pencil" color={c.primary} size={20} />
        </TouchableOpacity>
      }>
      {t && (
        <>
          <Text style={{ color: c.textSecondary, fontSize: 15 }}>
            {t.exercises.length} exercises · {setCount} sets
          </Text>
          <View style={{ height: Spacing.three }} />

          {t.exercises.length === 0 ? (
            <Card>
              <Text style={{ color: c.textSecondary }}>No exercises yet — tap the pencil to add some.</Text>
            </Card>
          ) : (
            <View style={{ gap: Spacing.two }}>
              {groupExercises(t.exercises).map((g) =>
                g.kind === 'single' ? (
                  <Card key={`${g.item.exerciseId}-${g.index}`}>{renderRow(g.item)}</Card>
                ) : (
                  <Card key={`${g.items[0].exerciseId}-${g.indices[0]}`}>
                    <SupersetBadge />
                    {renderRow(g.items[0])}
                    <View style={{ height: Spacing.three }} />
                    {renderRow(g.items[1])}
                  </Card>
                ),
              )}
            </View>
          )}
        </>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  name: { fontSize: 16, fontWeight: '700' },
  sets: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one, marginTop: Spacing.two },
  set: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
})
