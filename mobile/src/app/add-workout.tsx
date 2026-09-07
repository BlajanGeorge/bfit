// Add a workout to a day: build from scratch, or start from a saved template.
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { Card } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Screen } from '@/components/ui/Screen'
import { Spacing } from '@/constants/theme'
import { getSavedWorkouts, getWorkoutByDate } from '@/data/repo'
import type { SavedWorkout } from '@/domain/types'
import { dayLabel } from '@/domain/week'
import { useTheme } from '@/hooks/use-theme'
import { useBuilder } from '@/store/builder'

export default function AddWorkout() {
  const c = useTheme()
  const router = useRouter()
  const { day } = useLocalSearchParams<{ day: string }>()
  const startDay = useBuilder((s) => s.startDay)
  const [templates, setTemplates] = useState<SavedWorkout[]>([])

  useFocusEffect(
    useCallback(() => {
      getSavedWorkouts().then(setTemplates)
    }, []),
  )

  const buildScratch = async () => {
    const existing = await getWorkoutByDate(day)
    startDay(day, existing?.exercises ?? [])
    router.push('/build-workout')
  }

  const useTemplate = async (t: SavedWorkout) => {
    const existing = await getWorkoutByDate(day)
    startDay(day, [...(existing?.exercises ?? []), ...t.exercises])
    router.push('/build-workout')
  }

  return (
    <Screen title="Add workout" leading="back">
      <Text style={[styles.sub, { color: c.textSecondary }]}>{dayLabel(day)}</Text>

      <TouchableOpacity onPress={buildScratch} activeOpacity={0.9}>
        <Card style={styles.option}>
          <View style={[styles.iconBox, { backgroundColor: c.primary }]}>
            <Icon name="plus" color={c.onPrimary} size={24} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.optTitle, { color: c.text }]}>Build from exercises</Text>
            <Text style={{ color: c.textSecondary, fontSize: 13 }}>Add exercises one by one</Text>
          </View>
          <Icon name="chevron.right" color={c.textSecondary} size={16} />
        </Card>
      </TouchableOpacity>

      <Text style={[styles.section, { color: c.textSecondary }]}>Saved workouts</Text>
      {templates.length === 0 ? (
        <Card>
          <Text style={{ color: c.textSecondary }}>
            No saved workouts yet. Create one from the “My Workouts” drawer section.
          </Text>
        </Card>
      ) : (
        <View style={{ gap: Spacing.two }}>
          {templates.map((t) => (
            <TouchableOpacity key={t.id} onPress={() => useTemplate(t)} activeOpacity={0.9}>
              <Card style={styles.option}>
                <View style={[styles.iconBox, { backgroundColor: c.backgroundSelected }]}>
                  <Icon name="square.stack.3d.up.fill" color={c.primary} size={22} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optTitle, { color: c.text }]}>{t.name}</Text>
                  <Text style={{ color: c.textSecondary, fontSize: 13 }}>
                    {t.exercises.length} {t.exercises.length === 1 ? 'exercise' : 'exercises'}
                  </Text>
                </View>
                <Icon name="chevron.right" color={c.textSecondary} size={16} />
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  sub: { fontSize: 15, marginBottom: Spacing.three },
  option: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, marginBottom: Spacing.two },
  iconBox: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  optTitle: { fontSize: 16, fontWeight: '700' },
  section: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', marginTop: Spacing.four, marginBottom: Spacing.two, letterSpacing: 0.5 },
})
