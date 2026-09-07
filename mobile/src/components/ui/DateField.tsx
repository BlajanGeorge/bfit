// Self-contained date picker (no native deps): tap opens a 3-wheel modal.
import { format } from 'date-fns'
import { useMemo, useRef, useState } from 'react'
import {
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { Spacing } from '@/constants/theme'
import { useTheme } from '@/hooks/use-theme'

const ITEM_H = 44
const VISIBLE = 5
const PAD = Math.floor(VISIBLE / 2)

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate()
}

function Wheel({
  values,
  index,
  onChange,
}: {
  values: string[]
  index: number
  onChange: (i: number) => void
}) {
  const c = useTheme()
  const ref = useRef<ScrollView>(null)
  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.y / ITEM_H)
    const clamped = Math.max(0, Math.min(values.length - 1, i))
    if (clamped !== index) onChange(clamped)
  }
  return (
    <View style={{ height: ITEM_H * VISIBLE, flex: 1 }}>
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        contentOffset={{ x: 0, y: index * ITEM_H }}
        onMomentumScrollEnd={onEnd}
        contentContainerStyle={{ paddingVertical: ITEM_H * PAD }}>
        {values.map((v, i) => (
          <View key={v + i} style={styles.item}>
            <Text
              style={{
                fontSize: 18,
                color: i === index ? c.text : c.textSecondary,
                fontWeight: i === index ? '700' : '400',
              }}>
              {v}
            </Text>
          </View>
        ))}
      </ScrollView>
      <View
        pointerEvents="none"
        style={[styles.selBand, { top: ITEM_H * PAD, borderColor: c.border }]}
      />
    </View>
  )
}

export function DateField({
  label,
  value,
  onChange,
  minYear = 1940,
}: {
  label: string
  value: string // yyyy-MM-dd
  onChange: (iso: string) => void
  minYear?: number
}) {
  const c = useTheme()
  const [open, setOpen] = useState(false)

  const parsed = useMemo(() => {
    const [y, m, d] = value.split('-').map(Number)
    return { y, m: m - 1, d }
  }, [value])

  const [y, setY] = useState(parsed.y)
  const [m, setM] = useState(parsed.m)
  const [d, setD] = useState(parsed.d)

  const thisYear = new Date().getFullYear()
  const years = useMemo(
    () => Array.from({ length: thisYear - minYear + 1 }, (_, i) => `${minYear + i}`),
    [minYear, thisYear],
  )
  const dim = daysInMonth(y, m)
  const days = useMemo(() => Array.from({ length: dim }, (_, i) => `${i + 1}`), [dim])

  const openModal = () => {
    setY(parsed.y)
    setM(parsed.m)
    setD(parsed.d)
    setOpen(true)
  }

  const confirm = () => {
    const safeDay = Math.min(d, daysInMonth(y, m))
    const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`
    onChange(iso)
    setOpen(false)
  }

  const display = value ? format(new Date(parsed.y, parsed.m, parsed.d), 'd MMM yyyy') : 'Select'

  return (
    <View>
      <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>{label}</Text>
      <TouchableOpacity
        onPress={openModal}
        style={[styles.field, { backgroundColor: c.backgroundElement, borderColor: c.border }]}>
        <Text style={{ color: c.text, fontSize: 16 }}>{display}</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={[styles.sheet, { backgroundColor: c.background }]}>
            <View style={styles.sheetBar}>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Text style={{ color: c.textSecondary, fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <Text style={{ color: c.text, fontSize: 16, fontWeight: '700' }}>{label}</Text>
              <TouchableOpacity onPress={confirm}>
                <Text style={{ color: c.primary, fontSize: 16, fontWeight: '700' }}>Done</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.wheels}>
              <Wheel values={days} index={Math.min(d - 1, days.length - 1)} onChange={(i) => setD(i + 1)} />
              <Wheel values={MONTHS} index={m} onChange={setM} />
              <Wheel values={years} index={y - minYear} onChange={(i) => setY(minYear + i)} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  fieldLabel: { fontSize: 13, marginBottom: 6, fontWeight: '600' },
  field: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    justifyContent: 'center',
  },
  item: { height: ITEM_H, alignItems: 'center', justifyContent: 'center' },
  selBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ITEM_H,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40 },
  sheetBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
  },
  wheels: { flexDirection: 'row', paddingHorizontal: Spacing.three },
})
