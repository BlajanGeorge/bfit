// Home: week strip + the selected day's workout (expandable) or an empty state.
import { differenceInCalendarDays } from 'date-fns'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { WeekBar } from '@/components/WeekBar'
import { Button, Card } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Screen } from '@/components/ui/Screen'
import { Spacing } from '@/constants/theme'
import { exerciseName, groupOf } from '@/data/catalog'
import {
  getLatestBodyweight,
  getWorkoutByDate,
  getWorkoutDays,
} from '@/data/repo'
import type { Workout } from '@/domain/types'
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
  const [staleWeight, setStaleWeight] = useState(false)
  const startDay = useBuilder((s) => s.startDay)

  const load = useCallback(async () => {
    const [w, d, bw] = await Promise.all([
      getWorkoutByDate(selected),
      getWorkoutDays(),
      getLatestBodyweight(),
    ])
    setWorkout(w)
    setDays(d)
    setExpanded(new Set())
    if (bw) {
      const [y, m, dd] = bw.date.split('-').map(Number)
      setStaleWeight(differenceInCalendarDays(new Date(), new Date(y, m - 1, dd)) >= 7)
    } else {
      setStaleWeight(true)
    }
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

  const hasWorkout = !!workout && workout.exercises.length > 0

  return (
    <Screen title="B-Fit" scroll={false}>
      <WeekBar selected={selected} onSelect={setSelected} workoutDays={days} />

      <View style={{ flex: 1, padding: Spacing.three }}>
        <View style={styles.dayHeader}>
          <Text style={[styles.dayLabel, { color: c.text }]}>{dayLabel(selected)}</Text>
          {hasWorkout && (
            <TouchableOpacity onPress={goEdit} style={styles.editBtn}>
              <Icon name="square.and.pencil" color={c.primary} size={18} />
              <Text style={{ color: c.primary, fontWeight: '600' }}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {staleWeight && (
          <TouchableOpacity onPress={() => router.push('/profile')}>
            <Card style={[styles.nudge, { borderColor: c.primary }]}>
              <Icon name="scalemass.fill" color={c.primary} size={20} />
              <Text style={{ color: c.text, flex: 1 }}>Time to log your weight this week.</Text>
              <Icon name="chevron.right" color={c.textSecondary} size={16} />
            </Card>
          </TouchableOpacity>
        )}

        {!hasWorkout ? (
          <View style={styles.empty}>
            <Icon name="figure.strengthtraining.traditional" color={c.textSecondary} size={54} />
            <Text style={[styles.emptyText, { color: c.textSecondary }]}>
              No workout today — add your workout
            </Text>
            <Button label="＋  Add workout" onPress={goAdd} style={{ marginTop: Spacing.three, alignSelf: 'stretch' }} />
          </View>
        ) : (
          <View style={{ gap: Spacing.two, marginTop: Spacing.two }}>
            {workout!.exercises.map((we, i) => {
              const open = expanded.has(i)
              const totalSets = we.sets.length
              return (
                <TouchableOpacity key={i} activeOpacity={0.9} onPress={() => toggle(i)}>
                  <Card>
                    <View style={styles.exRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.exName, { color: c.text }]}>{exerciseName(we.exerciseId)}</Text>
                        <Text style={{ color: c.textSecondary, marginTop: 2, fontSize: 13 }}>
                          {groupOf(we.exerciseId)} · {totalSets} {totalSets === 1 ? 'set' : 'sets'}
                        </Text>
                      </View>
                      <Icon name={open ? 'chevron.up' : 'chevron.down'} color={c.textSecondary} size={16} />
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
                  </Card>
                </TouchableOpacity>
              )
            })}
            <Button
              label="＋  Add / edit exercises"
              variant="secondary"
              onPress={goEdit}
              style={{ marginTop: Spacing.two }}
            />
          </View>
        )}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayLabel: { fontSize: 22, fontWeight: '800' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  nudge: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.three },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, paddingHorizontal: Spacing.four },
  emptyText: { fontSize: 16, textAlign: 'center' },
  exRow: { flexDirection: 'row', alignItems: 'center' },
  exName: { fontSize: 16, fontWeight: '700' },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 6, borderTopWidth: StyleSheet.hairlineWidth },
})
