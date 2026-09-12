// First-launch profile setup (single screen). Saves profile + first bodyweight.
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  Image,
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
import { DateField } from '@/components/ui/DateField'
import { Icon } from '@/components/ui/Icon'
import { Spacing } from '@/constants/theme'
import { addBodyEntry, saveProfile } from '@/data/repo'
import type { BodyStats } from '@/data/repo'
import { BODY_MEASURES, type Sex } from '@/domain/types'
import { todayKey } from '@/domain/week'
import { useTheme } from '@/hooks/use-theme'

const numOrNull = (s: string): number | null => {
  const n = parseFloat(s)
  return Number.isFinite(n) && n > 0 ? n : null
}

export default function Onboarding() {
  const c = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [name, setName] = useState('')
  const [sex, setSex] = useState<Sex>('male')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [dob, setDob] = useState('1995-01-01')
  const [saving, setSaving] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [bodyFat, setBodyFat] = useState('')
  const [measures, setMeasures] = useState<Record<string, string>>({})

  const setMeasure = (key: string, v: string) =>
    setMeasures((m) => ({ ...m, [key]: v.replace(/[^0-9.]/g, '') }))

  const heightN = parseFloat(height)
  const weightN = parseFloat(weight)
  const valid =
    name.trim().length > 0 &&
    heightN > 0 && heightN < 260 &&
    weightN > 0 && weightN < 400

  const onSave = async () => {
    if (!valid || saving) return
    setSaving(true)
    try {
      await saveProfile({
        displayName: name.trim(),
        sex,
        heightCm: heightN,
        dateOfBirth: dob,
      })
      const stats: BodyStats = {
        bodyFatPct: numOrNull(bodyFat),
        armCm: numOrNull(measures.armCm ?? ''),
        chestCm: numOrNull(measures.chestCm ?? ''),
        shouldersCm: numOrNull(measures.shouldersCm ?? ''),
        waistCm: numOrNull(measures.waistCm ?? ''),
        glutesCm: numOrNull(measures.glutesCm ?? ''),
        quadsCm: numOrNull(measures.quadsCm ?? ''),
      }
      await addBodyEntry(todayKey(), weightN, stats)
      router.replace('/home')
    } catch {
      setSaving(false)
    }
  }

  const input = [styles.input, { backgroundColor: c.backgroundElement, borderColor: c.border, color: c.text }]

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView
        contentContainerStyle={{ padding: Spacing.four, paddingTop: insets.top + Spacing.five, paddingBottom: insets.bottom + Spacing.six }}
        keyboardShouldPersistTaps="handled">
        <Image
          source={require('@/assets/images/logo-mark.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.h1, { color: c.text }]}>Welcome to B-Fit</Text>
        <Text style={[styles.sub, { color: c.textSecondary }]}>
          Let&apos;s set up your profile. This stays on your device.
        </Text>

        <View style={{ height: Spacing.four }} />

        <Text style={[styles.label, { color: c.textSecondary }]}>What should we call you?</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={c.textSecondary}
          style={input}
        />

        <Text style={[styles.label, { color: c.textSecondary }]}>Sex</Text>
        <View style={styles.segment}>
          {(['male', 'female'] as Sex[]).map((s) => {
            const on = sex === s
            return (
              <TouchableOpacity
                key={s}
                onPress={() => setSex(s)}
                style={[
                  styles.segItem,
                  { backgroundColor: on ? c.primary : c.backgroundElement, borderColor: c.border },
                ]}>
                <Text style={{ color: on ? c.onPrimary : c.text, fontWeight: '600', textTransform: 'capitalize' }}>
                  {s}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: c.textSecondary }]}>Height (cm)</Text>
            <TextInput
              value={height}
              onChangeText={setHeight}
              placeholder="175"
              keyboardType="numeric"
              placeholderTextColor={c.textSecondary}
              style={input}
            />
          </View>
          <View style={{ width: Spacing.three }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: c.textSecondary }]}>Weight (kg)</Text>
            <TextInput
              value={weight}
              onChangeText={setWeight}
              placeholder="75"
              keyboardType="numeric"
              placeholderTextColor={c.textSecondary}
              style={input}
            />
          </View>
        </View>

        <View style={{ height: Spacing.three }} />
        <DateField label="Date of birth" value={dob} onChange={setDob} />

        <View style={{ height: Spacing.four }} />
        <TouchableOpacity
          onPress={() => setShowAdvanced((v) => !v)}
          style={[styles.advToggle, { borderColor: c.border, backgroundColor: c.backgroundElement }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontWeight: '700', fontSize: 15 }}>Advanced body stats</Text>
            <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 2 }}>
              Optional — body fat % and measurements. You can skip this.
            </Text>
          </View>
          <Icon name={showAdvanced ? 'chevron.up' : 'chevron.down'} color={c.textSecondary} size={16} />
        </TouchableOpacity>

        {showAdvanced && (
          <View style={{ marginTop: Spacing.three }}>
            <Text style={[styles.label, { color: c.textSecondary }]}>Body fat (%)</Text>
            <TextInput
              value={bodyFat}
              onChangeText={(t) => setBodyFat(t.replace(/[^0-9.]/g, ''))}
              placeholder="e.g. 18"
              keyboardType="decimal-pad"
              placeholderTextColor={c.textSecondary}
              style={input}
            />
            <View style={styles.measureGrid}>
              {BODY_MEASURES.map((m) => (
                <View key={m.key} style={styles.measureCell}>
                  <Text style={[styles.label, { color: c.textSecondary }]}>{m.label} (cm)</Text>
                  <TextInput
                    value={measures[m.key] ?? ''}
                    onChangeText={(t) => setMeasure(m.key, t)}
                    placeholder="cm"
                    keyboardType="decimal-pad"
                    placeholderTextColor={c.textSecondary}
                    style={input}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: Spacing.five }} />
        <Button label={saving ? 'Saving…' : 'Get started'} onPress={onSave} disabled={!valid || saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  logo: { width: 60, height: 60, marginBottom: Spacing.three },
  h1: { fontSize: 28, fontWeight: '800' },
  sub: { fontSize: 15, marginTop: 6 },
  label: { fontSize: 13, fontWeight: '600', marginTop: Spacing.three, marginBottom: 6 },
  input: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  segment: { flexDirection: 'row', gap: Spacing.two },
  segItem: {
    flex: 1,
    minHeight: 50,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row' },
  advToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
  },
  measureGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  measureCell: { width: '48%' },
})
