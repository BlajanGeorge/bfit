// Metrics: Grafana-style panels for workouts, volume, avg/max weight, bodyweight.
import { useFocusEffect } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { BarChart, LineChart } from 'react-native-gifted-charts'

import { Card } from '@/components/ui/Button'
import { Screen } from '@/components/ui/Screen'
import { Spacing } from '@/constants/theme'
import { MUSCLE_GROUPS, groupOf } from '@/data/catalog'
import { getAllWorkouts, getBodyweightEntries } from '@/data/repo'
import type { BodyweightEntry, MuscleGroup, Workout } from '@/domain/types'
import {
  averageWeight,
  bodyweightSeries,
  maxWeight,
  totalSets,
  weeklySetsSeries,
  workoutsInLastDays,
} from '@/domain/metrics'
import { useTheme } from '@/hooks/use-theme'

type Filter = 'All' | MuscleGroup
const CHART_W = Dimensions.get('window').width - Spacing.three * 2 - Spacing.three * 2 - 20

export default function Metrics() {
  const c = useTheme()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [bw, setBw] = useState<BodyweightEntry[]>([])
  const [filter, setFilter] = useState<Filter>('All')

  useFocusEffect(
    useCallback(() => {
      getAllWorkouts().then(setWorkouts)
      getBodyweightEntries().then(setBw)
    }, []),
  )

  const group = filter === 'All' ? undefined : filter

  const lastWeekCount = useMemo(() => workoutsInLastDays(workouts, 7), [workouts])
  const totalWorkouts = workouts.length
  const volume = useMemo(() => weeklySetsSeries(workouts, groupOf, 8, group), [workouts, group])
  const avg = useMemo(() => averageWeight(workouts, groupOf, group), [workouts, group])
  const max = useMemo(() => maxWeight(workouts, groupOf, group), [workouts, group])
  const setsTotal = useMemo(() => totalSets(workouts, groupOf, group), [workouts, group])
  const weightSeries = useMemo(() => bodyweightSeries(bw), [bw])

  const barData = volume.map((p) => ({
    value: p.value,
    label: p.label,
    frontColor: c.primary,
  }))
  const barSpacing = Math.max(6, (CHART_W - 22 * barData.length) / Math.max(1, barData.length))

  const lineData = weightSeries.map((p) => ({ value: p.value, label: p.label }))
  const lineSpacing =
    lineData.length > 1 ? Math.max(24, CHART_W / (lineData.length - 1) - 4) : 40

  const axisText = { color: c.textSecondary, fontSize: 9 }

  return (
    <Screen title="Metrics" scroll={false}>
      <ScrollView contentContainerStyle={{ padding: Spacing.three, paddingBottom: Spacing.six }}>
        {/* Headline stat tiles */}
        <View style={styles.tiles}>
          <StatTile label="Workouts (7d)" value={String(lastWeekCount)} sub="last 7 days" c={c} />
          <StatTile label="Total workouts" value={String(totalWorkouts)} sub="all time" c={c} />
        </View>

        {/* Group filter */}
        <Text style={[styles.filterLabel, { color: c.textSecondary }]}>Filter by muscle group</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.three }}>
          {(['All', ...MUSCLE_GROUPS] as Filter[]).map((g) => {
            const on = filter === g
            return (
              <TouchableOpacity
                key={g}
                onPress={() => setFilter(g)}
                style={[styles.chip, { backgroundColor: on ? c.primary : c.backgroundElement, borderColor: c.border }]}>
                <Text style={{ color: on ? c.onPrimary : c.text, fontWeight: '600', fontSize: 13 }}>{g}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* Avg / Max tiles (respond to filter) */}
        <View style={styles.tiles}>
          <StatTile label="Avg weight" value={`${avg.toFixed(1)}`} sub={`kg · ${filter}`} c={c} />
          <StatTile label="Max weight" value={`${max}`} sub={`kg · ${filter}`} c={c} />
        </View>

        {/* Weekly volume */}
        <Card style={{ marginTop: Spacing.three }}>
          <Text style={[styles.panelTitle, { color: c.text }]}>Weekly volume</Text>
          <Text style={{ color: c.textSecondary, fontSize: 13 }}>
            {setsTotal} sets total · {filter}
          </Text>
          <View style={{ height: Spacing.three }} />
          {setsTotal === 0 ? (
            <Empty c={c} />
          ) : (
            <BarChart
              data={barData}
              barWidth={22}
              spacing={barSpacing}
              initialSpacing={10}
              roundedTop
              noOfSections={4}
              height={160}
              yAxisThickness={0}
              xAxisThickness={0}
              xAxisLabelTextStyle={axisText}
              yAxisTextStyle={axisText}
              rulesColor={c.border}
            />
          )}
        </Card>

        {/* Bodyweight evolution */}
        <Card style={{ marginTop: Spacing.three }}>
          <Text style={[styles.panelTitle, { color: c.text }]}>Bodyweight</Text>
          <Text style={{ color: c.textSecondary, fontSize: 13 }}>
            {weightSeries.length ? `${weightSeries[weightSeries.length - 1].value} kg now` : 'No entries yet'}
          </Text>
          <View style={{ height: Spacing.three }} />
          {lineData.length === 0 ? (
            <Empty c={c} />
          ) : (
            <LineChart
              data={lineData}
              height={160}
              spacing={lineSpacing}
              initialSpacing={16}
              thickness={3}
              color={c.primary}
              dataPointsColor={c.primary}
              hideRules={false}
              rulesColor={c.border}
              yAxisThickness={0}
              xAxisThickness={0}
              xAxisLabelTextStyle={axisText}
              yAxisTextStyle={axisText}
              curved
            />
          )}
        </Card>
      </ScrollView>
    </Screen>
  )
}

function StatTile({
  label,
  value,
  sub,
  c,
}: {
  label: string
  value: string
  sub: string
  c: ReturnType<typeof useTheme>
}) {
  return (
    <View style={[styles.tile, { backgroundColor: c.backgroundElement, borderColor: c.border }]}>
      <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600' }}>{label}</Text>
      <Text style={{ color: c.text, fontSize: 30, fontWeight: '800', marginTop: 2 }}>{value}</Text>
      <Text style={{ color: c.textSecondary, fontSize: 11 }}>{sub}</Text>
    </View>
  )
}

function Empty({ c }: { c: ReturnType<typeof useTheme> }) {
  return (
    <View style={styles.empty}>
      <Text style={{ color: c.textSecondary }}>No data yet — log some workouts.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  tiles: { flexDirection: 'row', gap: Spacing.two },
  tile: { flex: 1, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.three },
  filterLabel: { fontSize: 13, fontWeight: '600', marginTop: Spacing.three, marginBottom: Spacing.two },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: Spacing.two,
  },
  panelTitle: { fontSize: 17, fontWeight: '700' },
  empty: { height: 120, alignItems: 'center', justifyContent: 'center' },
})
