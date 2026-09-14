// Set the sets/reps/kg for a chosen exercise, then add it to the draft workout.
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Spacing } from '@/constants/theme'
import { exerciseName, groupOf } from '@/data/catalog'
import { useTheme } from '@/hooks/use-theme'
import { useBuilder } from '@/store/builder'
import { parseDecimal, sanitizeDecimal } from '@/domain/number'
import type { WorkoutExercise } from '@/domain/types'

interface Row {
  reps: string
  weightKg: string
}

export default function ConfigureExercise() {
  const c = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { exerciseId, index, superset } = useLocalSearchParams<{
    exerciseId: string
    index?: string
    superset?: string
  }>()

  const exercises = useBuilder((s) => s.exercises)
  const addExercise = useBuilder((s) => s.addExercise)
  const updateExercise = useBuilder((s) => s.updateExercise)
  const supersetDraft = useBuilder((s) => s.supersetDraft)
  const stashSupersetFirst = useBuilder((s) => s.stashSupersetFirst)
  const completeSuperset = useBuilder((s) => s.completeSuperset)

  const editIndex = index !== undefined ? parseInt(index, 10) : -1
  const existing = editIndex >= 0 ? exercises[editIndex] : undefined
  const isSupersetFlow = superset === '1' && editIndex < 0
  const isSecondOfPair = isSupersetFlow && !!supersetDraft

  const [rows, setRows] = useState<Row[]>(
    existing
      ? existing.sets.map((s) => ({ reps: String(s.reps), weightKg: String(s.weightKg) }))
      : [
          { reps: '10', weightKg: '20' },
          { reps: '10', weightKg: '20' },
          { reps: '10', weightKg: '20' },
        ],
  )

  const setRow = (i: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  const addRow = () =>
    setRows((prev) => [...prev, prev.length ? { ...prev[prev.length - 1] } : { reps: '10', weightKg: '20' }])
  const removeRow = (i: number) => setRows((prev) => prev.filter((_, idx) => idx !== i))

  const parsed = rows.map((r) => ({ reps: parseInt(r.reps, 10), weightKg: parseDecimal(r.weightKg) }))
  const valid =
    parsed.length > 0 &&
    parsed.every((s) => Number.isFinite(s.reps) && s.reps > 0 && Number.isFinite(s.weightKg) && s.weightKg >= 0)

  const onSave = () => {
    if (!valid) return
    const we: WorkoutExercise = {
      exerciseId,
      sets: parsed,
      ...(existing?.supersetId ? { supersetId: existing.supersetId } : {}),
    }
    if (editIndex >= 0) {
      updateExercise(editIndex, we)
      router.dismissTo('/build-workout')
      return
    }
    if (isSupersetFlow) {
      if (isSecondOfPair) {
        completeSuperset(we)
        router.dismissTo('/build-workout')
      } else {
        stashSupersetFirst(we)
        router.push({ pathname: '/pick-group', params: { superset: '1' } })
      }
      return
    }
    addExercise(we)
    router.dismissTo('/build-workout')
  }

  const inputStyle = [styles.input, { backgroundColor: c.background, borderColor: c.border, color: c.text }]

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.background }}>
      <View style={[styles.bar, { borderBottomColor: c.border, paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Icon name="chevron.left" color={c.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: c.text }]} numberOfLines={1}>
          {editIndex >= 0
            ? 'Edit exercise'
            : isSupersetFlow
              ? isSecondOfPair
                ? 'Superset · exercise 2'
                : 'Superset · exercise 1'
              : 'Add exercise'}
        </Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.three, paddingBottom: insets.bottom + Spacing.six }} keyboardShouldPersistTaps="handled">
        <Text style={[styles.exName, { color: c.text }]}>{exerciseName(exerciseId)}</Text>
        <Text style={{ color: c.textSecondary, marginBottom: Spacing.three }}>{groupOf(exerciseId)}</Text>

        <View style={styles.headerRow}>
          <Text style={[styles.colHead, { color: c.textSecondary, width: 50 }]}>SET</Text>
          <Text style={[styles.colHead, { color: c.textSecondary, flex: 1 }]}>REPS</Text>
          <Text style={[styles.colHead, { color: c.textSecondary, flex: 1 }]}>KG</Text>
          <View style={{ width: 40 }} />
        </View>

        {rows.map((r, i) => (
          <View key={i} style={[styles.setRow, { backgroundColor: c.backgroundElement, borderColor: c.border }]}>
            <Text style={[styles.setNum, { color: c.text }]}>{i + 1}</Text>
            <TextInput
              value={r.reps}
              onChangeText={(t) => setRow(i, { reps: t.replace(/[^0-9]/g, '') })}
              keyboardType="number-pad"
              style={[inputStyle, { flex: 1 }]}
            />
            <TextInput
              value={r.weightKg}
              onChangeText={(t) => setRow(i, { weightKg: sanitizeDecimal(t) })}
              keyboardType="decimal-pad"
              style={[inputStyle, { flex: 1 }]}
            />
            <TouchableOpacity onPress={() => removeRow(i)} disabled={rows.length === 1} style={styles.iconBtn}>
              <Icon name="minus.circle.fill" color={rows.length === 1 ? c.border : c.danger} size={22} />
            </TouchableOpacity>
          </View>
        ))}

        <Button label="＋  Add set" variant="secondary" onPress={addRow} style={{ marginTop: Spacing.two }} />
        <View style={{ height: Spacing.four }} />
        <Button
          label={
            editIndex >= 0
              ? 'Save changes'
              : isSupersetFlow
                ? isSecondOfPair
                  ? 'Add superset'
                  : 'Next: pick 2nd exercise'
                : 'Add to workout'
          }
          onPress={onSave}
          disabled={!valid}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.two, borderBottomWidth: StyleSheet.hairlineWidth, height: undefined, paddingBottom: 8 },
  iconBtn: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 20, fontWeight: '700' },
  exName: { fontSize: 22, fontWeight: '800' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: 4, marginBottom: 6 },
  colHead: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.two,
  },
  setNum: { width: 50, textAlign: 'center', fontSize: 16, fontWeight: '700' },
  input: { minHeight: 44, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.two, fontSize: 16, textAlign: 'center' },
})
