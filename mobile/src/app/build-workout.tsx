// Builder for a day's workout or a template: list draft exercises, add, save.
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

import { ExerciseThumb } from '@/components/ExerciseThumb'
import { Button, Card } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Screen } from '@/components/ui/Screen'
import { SupersetBadge } from '@/components/ui/SupersetBadge'
import { Spacing } from '@/constants/theme'
import { exerciseName, groupOf } from '@/data/catalog'
import { getWorkoutByDate, saveSavedWorkout, saveWorkoutForDate } from '@/data/repo'
import { groupExercises } from '@/domain/superset'
import type { WorkoutExercise } from '@/domain/types'
import { dayLabel } from '@/domain/week'
import { useTheme } from '@/hooks/use-theme'
import { useBuilder } from '@/store/builder'

export default function BuildWorkout() {
  const c = useTheme()
  const router = useRouter()
  const params = useLocalSearchParams<{ day?: string }>()

  const mode = useBuilder((s) => s.mode)
  const day = useBuilder((s) => s.day)
  const templateId = useBuilder((s) => s.templateId)
  const name = useBuilder((s) => s.name)
  const exercises = useBuilder((s) => s.exercises)
  const setName = useBuilder((s) => s.setName)
  const removeExercise = useBuilder((s) => s.removeExercise)
  const startDay = useBuilder((s) => s.startDay)
  const clearSupersetDraft = useBuilder((s) => s.clearSupersetDraft)

  const [saving, setSaving] = useState(false)

  // If arrived directly (e.g. Home "Edit") without an initialised draft, hydrate it.
  useEffect(() => {
    if (mode === 'day' && !day && params.day) {
      getWorkoutByDate(params.day).then((w) => startDay(params.day!, w?.exercises ?? []))
    }
  }, [mode, day, params.day, startDay])

  const isTemplate = mode === 'template'
  const canSave = exercises.length > 0 && (!isTemplate || name.trim().length > 0)

  const onSave = async () => {
    if (!canSave || saving) return
    setSaving(true)
    try {
      if (isTemplate) {
        await saveSavedWorkout(name.trim(), exercises, templateId ?? undefined)
        router.back()
      } else {
        const d = day ?? params.day!
        await saveWorkoutForDate(d, exercises)
        router.dismissTo('/home')
      }
    } catch {
      setSaving(false)
    }
  }

  const title = isTemplate ? (templateId ? 'Edit template' : 'New template') : 'Build workout'

  const goAddExercise = () => router.push('/pick-group')
  const goAddSuperset = () => {
    clearSupersetDraft()
    router.push({ pathname: '/pick-group', params: { superset: '1' } })
  }

  const renderRow = (we: WorkoutExercise, i: number) => (
    <View key={i} style={styles.exCard}>
      <TouchableOpacity
        style={styles.exBody}
        onPress={() => router.push({ pathname: '/configure-exercise', params: { exerciseId: we.exerciseId, index: String(i) } })}>
        <ExerciseThumb exerciseId={we.exerciseId} size={48} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.exName, { color: c.text }]}>{exerciseName(we.exerciseId)}</Text>
          <Text style={{ color: c.textSecondary, fontSize: 13, marginTop: 2 }}>
            {groupOf(we.exerciseId)} · {we.sets.length} sets ·{' '}
            {we.sets.map((s) => `${s.reps}×${s.weightKg}kg`).join(', ')}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => removeExercise(i)} style={styles.trash}>
        <Icon name="trash" color={c.danger} size={18} />
      </TouchableOpacity>
    </View>
  )

  return (
    <Screen title={title} leading="back">
      {isTemplate ? (
        <>
          <Text style={[styles.label, { color: c.textSecondary }]}>Template name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Push Day"
            placeholderTextColor={c.textSecondary}
            style={[styles.input, { backgroundColor: c.backgroundElement, borderColor: c.border, color: c.text }]}
          />
          <View style={{ height: Spacing.three }} />
        </>
      ) : (
        <Text style={[styles.sub, { color: c.textSecondary }]}>{dayLabel(day ?? params.day ?? '')}</Text>
      )}

      {exercises.length === 0 ? (
        <Card>
          <Text style={{ color: c.textSecondary }}>No exercises yet. Add your first one below.</Text>
        </Card>
      ) : (
        <View style={{ gap: Spacing.two }}>
          {groupExercises(exercises).map((g) =>
            g.kind === 'single' ? (
              <Card key={g.index}>{renderRow(g.item, g.index)}</Card>
            ) : (
              <Card key={g.indices[0]}>
                <SupersetBadge />
                {renderRow(g.items[0], g.indices[0])}
                <View style={[styles.supersetDivider, { borderColor: c.border }]}>
                  <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '700' }}>+</Text>
                </View>
                {renderRow(g.items[1], g.indices[1])}
              </Card>
            ),
          )}
        </View>
      )}

      <View style={{ height: Spacing.three }} />
      <View style={{ flexDirection: 'row', gap: Spacing.two }}>
        <Button label="＋  Add exercise" variant="secondary" onPress={goAddExercise} style={{ flex: 1 }} />
        <Button label="＋  Add superset" variant="secondary" onPress={goAddSuperset} style={{ flex: 1 }} />
      </View>

      {canSave && (
        <>
          <View style={{ height: Spacing.three }} />
          <Button label={saving ? 'Saving…' : isTemplate ? 'Save template' : 'Save workout'} onPress={onSave} disabled={saving} />
        </>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  sub: { fontSize: 15, marginBottom: Spacing.three },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { minHeight: 50, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.three, fontSize: 16 },
  exCard: { flexDirection: 'row', alignItems: 'center' },
  exBody: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  exName: { fontSize: 16, fontWeight: '700' },
  trash: { padding: Spacing.two, marginLeft: Spacing.two },
  supersetDivider: {
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    marginVertical: -1,
  },
})
