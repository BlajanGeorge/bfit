// Profile: edit name/sex/height/DOB, and log current bodyweight (adds an entry).
import { differenceInYears } from 'date-fns'
import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import {
  Alert,
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

import { Button, Card } from '@/components/ui/Button'
import { DateField } from '@/components/ui/DateField'
import { Icon } from '@/components/ui/Icon'
import { Screen } from '@/components/ui/Screen'
import { Spacing } from '@/constants/theme'
import { addBodyEntry, getLatestBodyEntry, getProfile, saveProfile } from '@/data/repo'
import type { BodyStats } from '@/data/repo'
import { BODY_MEASURES, type BodyMeasureKey, type Sex } from '@/domain/types'
import { todayKey } from '@/domain/week'
import { useTheme } from '@/hooks/use-theme'

const numOrNull = (s: string): number | null => {
  const n = parseFloat(s)
  return Number.isFinite(n) && n > 0 ? n : null
}
const str = (n: number | null | undefined): string => (n != null ? String(n) : '')

export default function Profile() {
  const c = useTheme()
  const insets = useSafeAreaInsets()

  const [name, setName] = useState('')
  const [sex, setSex] = useState<Sex>('male')
  const [height, setHeight] = useState('')
  const [dob, setDob] = useState('1995-01-01')
  const [weight, setWeight] = useState('')
  const [lastWeight, setLastWeight] = useState<number | null>(null)
  const [bodyFat, setBodyFat] = useState('')
  const [measures, setMeasures] = useState<Record<string, string>>({})

  const setMeasure = (key: string, v: string) =>
    setMeasures((m) => ({ ...m, [key]: v.replace(/[^0-9.]/g, '') }))

  const load = useCallback(async () => {
    const [p, bw] = await Promise.all([getProfile(), getLatestBodyEntry()])
    if (p) {
      setName(p.displayName)
      setSex(p.sex)
      setHeight(String(p.heightCm))
      setDob(p.dateOfBirth)
    }
    if (bw) {
      setLastWeight(bw.weightKg)
      setWeight(String(bw.weightKg))
      setBodyFat(str(bw.bodyFatPct))
      setMeasures(
        Object.fromEntries(BODY_MEASURES.map((m) => [m.key, str(bw[m.key as BodyMeasureKey])])),
      )
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const saveDetails = async () => {
    const h = parseFloat(height)
    if (!name.trim() || !(h > 0)) {
      Alert.alert('Check your details', 'Please enter a name and a valid height.')
      return
    }
    await saveProfile({ displayName: name.trim(), sex, heightCm: h, dateOfBirth: dob })
    Alert.alert('Saved', 'Your profile has been updated.')
  }

  const logBody = async () => {
    const w = parseFloat(weight)
    if (!(w > 0)) {
      Alert.alert('Invalid weight', 'Enter your current weight in kg.')
      return
    }
    const stats: BodyStats = {
      bodyFatPct: numOrNull(bodyFat),
      armCm: numOrNull(measures.armCm ?? ''),
      chestCm: numOrNull(measures.chestCm ?? ''),
      shouldersCm: numOrNull(measures.shouldersCm ?? ''),
      waistCm: numOrNull(measures.waistCm ?? ''),
      glutesCm: numOrNull(measures.glutesCm ?? ''),
      quadsCm: numOrNull(measures.quadsCm ?? ''),
    }
    await addBodyEntry(todayKey(), w, stats)
    setLastWeight(w)
    Alert.alert('Saved', 'A new body entry was recorded for today.')
  }

  const age = (() => {
    const [y, m, d] = dob.split('-').map(Number)
    return differenceInYears(new Date(), new Date(y, m - 1, d))
  })()

  const input = [styles.input, { backgroundColor: c.backgroundElement, borderColor: c.border, color: c.text }]

  return (
    <Screen title="Profile" scroll={false}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: Spacing.three, paddingBottom: insets.bottom + Spacing.six }} keyboardShouldPersistTaps="handled">
          <View style={styles.avatarRow}>
            <View style={[styles.avatar, { backgroundColor: c.primary }]}>
              <Icon name="person.fill" color={c.onPrimary} size={30} />
            </View>
            <View>
              <Text style={[styles.hName, { color: c.text }]}>{name || 'You'}</Text>
              <Text style={{ color: c.textSecondary }}>
                {age} yrs · {height || '–'} cm{lastWeight != null ? ` · ${lastWeight} kg` : ''}
              </Text>
            </View>
          </View>

          <Card>
            <Text style={[styles.section, { color: c.text }]}>Body stats</Text>
            <Text style={{ color: c.textSecondary, fontSize: 13, marginBottom: Spacing.two }}>
              Saving records a new dated entry — this is what feeds the Body metrics.
              Advanced fields are optional.
            </Text>

            <Text style={[styles.label, { color: c.textSecondary }]}>Bodyweight (kg)</Text>
            <TextInput
              value={weight}
              onChangeText={(t) => setWeight(t.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="kg"
              placeholderTextColor={c.textSecondary}
              style={input}
            />

            <Text style={[styles.label, { color: c.textSecondary }]}>Body fat (%)</Text>
            <TextInput
              value={bodyFat}
              onChangeText={(t) => setBodyFat(t.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="optional"
              placeholderTextColor={c.textSecondary}
              style={input}
            />

            <Text style={[styles.subLabel, { color: c.textSecondary }]}>Measurements (cm)</Text>
            <View style={styles.measureGrid}>
              {BODY_MEASURES.map((m) => (
                <View key={m.key} style={styles.measureCell}>
                  <Text style={[styles.label, { color: c.textSecondary }]}>{m.label}</Text>
                  <TextInput
                    value={measures[m.key] ?? ''}
                    onChangeText={(t) => setMeasure(m.key, t)}
                    keyboardType="decimal-pad"
                    placeholder="cm"
                    placeholderTextColor={c.textSecondary}
                    style={input}
                  />
                </View>
              ))}
            </View>

            <View style={{ height: Spacing.three }} />
            <Button label="Save body entry" onPress={logBody} />
          </Card>

          <View style={{ height: Spacing.three }} />

          <Card>
            <Text style={[styles.section, { color: c.text }]}>Details</Text>

            <Text style={[styles.label, { color: c.textSecondary }]}>Name</Text>
            <TextInput value={name} onChangeText={setName} style={input} placeholderTextColor={c.textSecondary} />

            <Text style={[styles.label, { color: c.textSecondary }]}>Sex</Text>
            <View style={styles.segment}>
              {(['male', 'female'] as Sex[]).map((s) => {
                const on = sex === s
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setSex(s)}
                    style={[styles.segItem, { backgroundColor: on ? c.primary : c.background, borderColor: c.border }]}>
                    <Text style={{ color: on ? c.onPrimary : c.text, fontWeight: '600', textTransform: 'capitalize' }}>{s}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            <Text style={[styles.label, { color: c.textSecondary }]}>Height (cm)</Text>
            <TextInput
              value={height}
              onChangeText={(t) => setHeight(t.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              style={input}
            />

            <View style={{ height: Spacing.three }} />
            <DateField label="Date of birth" value={dob} onChange={setDob} />

            <View style={{ height: Spacing.four }} />
            <Button label="Save details" onPress={saveDetails} />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, marginBottom: Spacing.three },
  avatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  hName: { fontSize: 22, fontWeight: '800' },
  section: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '600', marginTop: Spacing.three, marginBottom: 6 },
  subLabel: { fontSize: 13, fontWeight: '700', marginTop: Spacing.three },
  input: { minHeight: 50, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.three, fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  measureGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  measureCell: { width: '48%' },
  segment: { flexDirection: 'row', gap: Spacing.two },
  segItem: { flex: 1, minHeight: 50, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
})
