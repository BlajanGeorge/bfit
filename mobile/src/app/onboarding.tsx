// First-launch profile setup (single screen). Saves profile + first bodyweight.
import { useRouter } from 'expo-router'
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
import { DateField } from '@/components/ui/DateField'
import { Icon } from '@/components/ui/Icon'
import { Spacing } from '@/constants/theme'
import { addBodyweight, saveProfile } from '@/data/repo'
import type { Sex } from '@/domain/types'
import { todayKey } from '@/domain/week'
import { useTheme } from '@/hooks/use-theme'

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
      await addBodyweight(todayKey(), weightN)
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
        <View style={[styles.logo, { backgroundColor: c.primary }]}>
          <Icon name="bolt.fill" color={c.onPrimary} size={30} />
        </View>
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

        <View style={{ height: Spacing.five }} />
        <Button label={saving ? 'Saving…' : 'Get started'} onPress={onSave} disabled={!valid || saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  logo: { width: 60, height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.three },
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
})
