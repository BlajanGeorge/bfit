// Horizontal, scrollable day strip for Home. Defaults scrolled to today (end).
import { useMemo, useRef } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { Spacing } from '@/constants/theme'
import { buildDayStrip } from '@/domain/week'
import { useTheme } from '@/hooks/use-theme'

const ITEM_W = 52
const GAP = 8

export function WeekBar({
  selected,
  onSelect,
  workoutDays,
}: {
  selected: string
  onSelect: (key: string) => void
  workoutDays: Set<string>
}) {
  const c = useTheme()
  const days = useMemo(() => buildDayStrip(11), [])
  const ref = useRef<ScrollView>(null)

  return (
    <View style={[styles.wrap, { borderBottomColor: c.border }]}>
      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
        onContentSizeChange={(w) => ref.current?.scrollTo({ x: w, animated: false })}>
        {days.map((d) => {
          const isSel = d.key === selected
          const has = workoutDays.has(d.key)
          return (
            <TouchableOpacity
              key={d.key}
              onPress={() => onSelect(d.key)}
              style={[
                styles.day,
                { backgroundColor: isSel ? c.primary : c.backgroundElement, borderColor: c.border },
              ]}>
              <Text style={[styles.weekday, { color: isSel ? c.onPrimary : c.textSecondary }]}>
                {d.weekday}
              </Text>
              <Text style={[styles.num, { color: isSel ? c.onPrimary : c.text }]}>
                {d.dayOfMonth}
              </Text>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: has ? (isSel ? c.onPrimary : c.primary) : 'transparent' },
                ]}
              />
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { borderBottomWidth: StyleSheet.hairlineWidth },
  content: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, gap: GAP },
  day: {
    width: ITEM_W,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  weekday: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  num: { fontSize: 18, fontWeight: '700' },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 5 },
})
