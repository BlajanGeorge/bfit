// Day strip for Home. The current week (7 days) fills the width with no clipping;
// earlier weeks remain reachable by scrolling left.
import { useMemo, useRef } from 'react'
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { useTheme } from '@/hooks/use-theme'
import { buildDayStrip } from '@/domain/week'

const PAD_H = 10
const GAP = 6
const SCREEN_W = Dimensions.get('window').width
// Size cells so exactly 7 fit within the screen width (no horizontal scroll needed
// to see the current week, and today is never clipped).
const ITEM_W = Math.floor((SCREEN_W - PAD_H * 2 - GAP * 6) / 7)

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
                {
                  width: ITEM_W,
                  backgroundColor: isSel ? c.primary : c.backgroundElement,
                  borderColor: d.isToday ? (isSel ? c.onPrimary : c.primary) : c.border,
                  borderWidth: d.isToday ? 2 : StyleSheet.hairlineWidth,
                },
              ]}>
              <Text
                style={[
                  styles.weekday,
                  { color: isSel ? c.onPrimary : d.isToday ? c.primary : c.textSecondary },
                ]}>
                {d.isToday ? 'Today' : d.weekday}
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
  content: { paddingHorizontal: PAD_H, paddingVertical: 10, gap: GAP },
  day: {
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  weekday: { fontSize: 11, fontWeight: '600', marginBottom: 3 },
  num: { fontSize: 17, fontWeight: '700' },
  dot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 4 },
})
