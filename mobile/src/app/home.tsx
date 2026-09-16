// Home: week strip + the selected day's workout (expandable) or an empty state.
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { ExerciseThumb } from '@/components/ExerciseThumb'
import { WeekBar } from '@/components/WeekBar'
import { Button, Card } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Screen } from '@/components/ui/Screen'
import { SupersetBadge } from '@/components/ui/SupersetBadge'
import { Spacing } from '@/constants/theme'
import { exerciseName, groupOf } from '@/data/catalog'
import { deleteWorkout, getWorkoutByDate, getWorkoutDays } from '@/data/repo'
import { groupExercises } from '@/domain/superset'
import type { Workout, WorkoutExercise } from '@/domain/types'
import { dayLabel, todayKey } from '@/domain/week'
import { useTheme } from '@/hooks/use-theme'
import { useBuilder } from '@/store/builder'

export default function Home() {
  const c = useTheme()
  const router = useRouter()
  const [selected, setSelected] = useState(todayKey())
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [days, setDays] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const startDay = useBuilder((s) => s.startDay)

  const load = useCallback(async () => {
    const [w, d] = await Promise.all([getWorkoutByDate(selected), getWorkoutDays()])
    setWorkout(w)
    setDays(d)
    setExpanded(new Set())
  }, [selected])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load]),
  )

  const toggle = (i: number) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })

  const goAdd = () => router.push({ pathname: '/add-workout', params: { day: selected } })
  const goEdit = () => {
    startDay(selected, workout?.exercises ?? [])
    router.push({ pathname: '/build-workout', params: { day: selected } })
  }
  const goDelete = () => {
    Alert.alert('Delete workout', `Delete the workout for ${dayLabel(selected)}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteWorkout(selected)
          load()
        },
      },
    ])
  }

  const hasWorkout = !!workout && workout.exercises.length > 0

  const goDetail = (exerciseId: string) => router.push({ pathname: '/exercise-detail', params: { exerciseId } })

  const renderRow = (we: WorkoutExercise, i: number) => {
    const open = expanded.has(i)
    const totalSets = we.sets.length
    return (
      <View key={i}>
        <View style={styles.exRow}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => toggle(i)}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
            <ExerciseThumb exerciseId={we.exerciseId} size={48} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.exName, { color: c.text }]}>{exerciseName(we.exerciseId)}</Text>
              <Text style={{ color: c.textSecondary, marginTop: 2, fontSize: 13 }}>
                {groupOf(we.exerciseId)} · {totalSets} {totalSets === 1 ? 'set' : 'sets'}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => goDetail(we.exerciseId)}
            accessibilityLabel={`View ${exerciseName(we.exerciseId)}`}
            style={styles.viewBtn}>
            <Icon name="play.circle" color={c.primary} size={24} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => toggle(i)} style={styles.chevronBtn}>
            <Icon name={open ? 'chevron.up' : 'chevron.down'} color={c.textSecondary} size={16} />
          </TouchableOpacity>
        </View>
        {open && (
          <View style={{ marginTop: Spacing.two, gap: 4 }}>
            {we.sets.map((s, j) => (
              <View key={j} style={[styles.setRow, { borderTopColor: c.border }]}>
                <Text style={{ color: c.textSecondary, width: 60 }}>Set {j + 1}</Text>
                <Text style={{ color: c.text, flex: 1 }}>{s.reps} reps</Text>
                <Text style={{ color: c.text, fontWeight: '600' }}>{s.weightKg} kg</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    )
  }

  return (
    <Screen title="Home" scroll={false}>
      <WeekBar selected={selected} onSelect={setSelected} workoutDays={days} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, padding: Spacing.three }}>
        <View style={styles.dayHeader}>
          <Text style={[styles.dayLabel, { color: c.text }]}>{dayLabel(selected)}</Text>
          {hasWorkout && (
            <View style={{ flexDirection: 'row', gap: 4 }}>
              <TouchableOpacity onPress={goEdit} style={styles.editBtn}>
                <Icon name="square.and.pencil" color={c.primary} size={18} />
                <Text style={{ color: c.primary, fontWeight: '600' }}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={goDelete}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.editBtn}>
                <Icon name="trash" color={c.danger} size={18} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {!hasWorkout ? (
          <View style={styles.empty}>
            <Icon name="figure.strengthtraining.traditional" color={c.textSecondary} size={54} />
            <Text style={[styles.emptyText, { color: c.textSecondary }]}>
              {selected === todayKey() ? 'No workout today' : 'No workout on this day'} — add your workout
            </Text>
            <Button label="＋  Add workout" onPress={goAdd} style={{ marginTop: Spacing.three, alignSelf: 'stretch' }} />
          </View>
        ) : (
          <View style={{ gap: Spacing.two, marginTop: Spacing.two, paddingBottom: Spacing.six }}>
            {groupExercises(workout!.exercises).map((g) =>
              g.kind === 'single' ? (
                <Card key={g.index}>{renderRow(g.item, g.index)}</Card>
              ) : (
                <Card key={g.indices[0]}>
                  <SupersetBadge />
                  {renderRow(g.items[0], g.indices[0])}
                  <View style={{ height: Spacing.three }} />
                  {renderRow(g.items[1], g.indices[1])}
                </Card>
              ),
            )}
            <Button
              label="＋  Add / edit exercises"
              variant="secondary"
              onPress={goEdit}
              style={{ marginTop: Spacing.two }}
            />
          </View>
        )}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayLabel: { fontSize: 22, fontWeight: '800' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, paddingHorizontal: Spacing.four },
  emptyText: { fontSize: 16, textAlign: 'center' },
  exRow: { flexDirection: 'row', alignItems: 'center' },
  exName: { fontSize: 16, fontWeight: '700' },
  viewBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  chevronBtn: { width: 28, height: 40, alignItems: 'center', justifyContent: 'center' },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 6, borderTopWidth: StyleSheet.hairlineWidth },
})
