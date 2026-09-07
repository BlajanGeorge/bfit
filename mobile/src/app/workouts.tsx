// My Workouts: create, list, edit and delete reusable templates.
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { Button, Card } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Screen } from '@/components/ui/Screen'
import { Spacing } from '@/constants/theme'
import { exerciseName } from '@/data/catalog'
import { deleteSavedWorkout, getSavedWorkouts } from '@/data/repo'
import type { SavedWorkout } from '@/domain/types'
import { useTheme } from '@/hooks/use-theme'
import { useBuilder } from '@/store/builder'

export default function Workouts() {
  const c = useTheme()
  const router = useRouter()
  const [items, setItems] = useState<SavedWorkout[]>([])
  const startTemplate = useBuilder((s) => s.startTemplate)

  const load = useCallback(() => {
    getSavedWorkouts().then(setItems)
  }, [])

  useFocusEffect(useCallback(() => load(), [load]))

  const create = () => {
    startTemplate()
    router.push('/build-workout')
  }
  const edit = (t: SavedWorkout) => {
    startTemplate(t.id, t.name, t.exercises)
    router.push('/build-workout')
  }
  const remove = (t: SavedWorkout) => {
    Alert.alert('Delete template', `Delete “${t.name}”?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteSavedWorkout(t.id)
          load()
        },
      },
    ])
  }

  return (
    <Screen title="My Workouts">
      <Button label="＋  New template" onPress={create} />
      <View style={{ height: Spacing.three }} />

      {items.length === 0 ? (
        <Card>
          <Text style={{ color: c.textSecondary }}>
            No templates yet. Build a reusable workout and save it to quickly add it to any day.
          </Text>
        </Card>
      ) : (
        <View style={{ gap: Spacing.two }}>
          {items.map((t) => (
            <Card key={t.id}>
              <View style={styles.head}>
                <Text style={[styles.name, { color: c.text }]}>{t.name}</Text>
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => edit(t)} style={styles.act}>
                    <Icon name="square.and.pencil" color={c.primary} size={18} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => remove(t)} style={styles.act}>
                    <Icon name="trash" color={c.danger} size={18} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={{ color: c.textSecondary, fontSize: 13, marginTop: 4 }}>
                {t.exercises.map((e) => exerciseName(e.exerciseId)).join(' · ') || 'No exercises'}
              </Text>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 17, fontWeight: '700', flex: 1 },
  actions: { flexDirection: 'row', gap: Spacing.one },
  act: { padding: Spacing.one },
})
