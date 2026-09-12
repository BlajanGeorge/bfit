// Metrics: Grafana-style dark panels, split into Workouts and Body sections.
import { useFocusEffect } from 'expo-router'
import { useCallback, useMemo, useRef, useState } from 'react'
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native'
import { BarChart, LineChart } from 'react-native-gifted-charts'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Card } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Screen } from '@/components/ui/Screen'
import { Spacing } from '@/constants/theme'
import { MUSCLE_GROUPS, groupOf } from '@/data/catalog'
import { getAllWorkouts, getBodyEntries } from '@/data/repo'
import { BODY_MEASURES, type BodyEntry, type MuscleGroup, type Workout } from '@/domain/types'
import {
  type AxisRange,
  bodyMetricSeries,
  bodyweightSeries,
  niceRange,
  dailyMaxWeightSeries,
  maxWeight,
  repsThisWeek,
  setsThisWeek,
  thisWeekLabel,
  totalReps,
  totalSets,
  weeklyRepsSeries,
  weeklySetsSeries,
  workoutsThisWeek,
  type Point,
} from '@/domain/metrics'
import { useTheme } from '@/hooks/use-theme'

type Filter = 'All' | MuscleGroup
type Section = 'Workouts' | 'Body'
const CHART_W = Dimensions.get('window').width - Spacing.three * 2 - Spacing.three * 2 - 20

type ExpandedChart =
  | { kind: 'line'; title: string; subtitle: string; unit: string; data: Point[] }
  | { kind: 'bar'; title: string; subtitle: string; barData: Point[]; repsData?: Point[] }

export default function Metrics() {
  const c = useTheme()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [bw, setBw] = useState<BodyEntry[]>([])
  const [section, setSection] = useState<Section>('Workouts')
  const [expanded, setExpanded] = useState<ExpandedChart | null>(null)

  useFocusEffect(
    useCallback(() => {
      getAllWorkouts().then(setWorkouts)
      getBodyEntries().then(setBw)
    }, []),
  )

  const axisText = { color: c.textSecondary, fontSize: 9 }

  return (
    <>
      <Screen title="Metrics" scroll={false}>
        <ScrollView contentContainerStyle={{ padding: Spacing.three, paddingBottom: Spacing.six }}>
          {/* Section segmented control */}
          <View style={[styles.segment, { backgroundColor: c.backgroundElement, borderColor: c.border }]}>
            {(['Workouts', 'Body'] as Section[]).map((s) => {
              const on = section === s
              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSection(s)}
                  style={[styles.segItem, on && { backgroundColor: c.primary }]}>
                  <Text style={{ color: on ? c.onPrimary : c.text, fontWeight: '700' }}>{s}</Text>
                </TouchableOpacity>
              )
            })}
          </View>

          <View style={{ height: Spacing.three }} />

          {section === 'Workouts' ? (
            <WorkoutsSection
              workouts={workouts}
              axisText={axisText}
              c={c}
              onExpand={setExpanded}
            />
          ) : (
            <BodySection entries={bw} axisText={axisText} c={c} onExpand={setExpanded} />
          )}
        </ScrollView>
      </Screen>

      <ExpandedChartOverlay chart={expanded} onClose={() => setExpanded(null)} />
    </>
  )
}

function WorkoutsSection({
  workouts,
  axisText,
  c,
  onExpand,
}: {
  workouts: Workout[]
  axisText: { color: string; fontSize: number }
  c: ReturnType<typeof useTheme>
  onExpand: (chart: ExpandedChart) => void
}) {
  const [volumeFilter, setVolumeFilter] = useState<Filter>('All')
  const [intensityFilter, setIntensityFilter] = useState<Filter>('All')

  const volumeGroup = volumeFilter === 'All' ? undefined : volumeFilter
  const intensityGroup = intensityFilter === 'All' ? undefined : intensityFilter

  const weekLabel = useMemo(() => thisWeekLabel(), [])
  const lastWeekCount = useMemo(() => workoutsThisWeek(workouts), [workouts])
  const weekSets = useMemo(() => setsThisWeek(workouts, groupOf), [workouts])
  const weekReps = useMemo(() => repsThisWeek(workouts, groupOf), [workouts])
  const volume = useMemo(() => weeklySetsSeries(workouts, groupOf, 8, volumeGroup), [workouts, volumeGroup])
  const repsVolume = useMemo(() => weeklyRepsSeries(workouts, groupOf, 8, volumeGroup), [workouts, volumeGroup])
  const setsTotal = useMemo(() => totalSets(workouts, groupOf, volumeGroup), [workouts, volumeGroup])
  const repsTotal = useMemo(() => totalReps(workouts, groupOf, volumeGroup), [workouts, volumeGroup])
  const peakWeight = useMemo(() => maxWeight(workouts, groupOf, intensityGroup), [workouts, intensityGroup])
  const dailyMax = useMemo(() => dailyMaxWeightSeries(workouts, groupOf, 10, intensityGroup), [workouts, intensityGroup])
  const lastDaily = dailyMax.length > 0 ? dailyMax[dailyMax.length - 1] : undefined
  const dailySubtitle = lastDaily
    ? `Last: ${lastDaily.label} · ${lastDaily.value} kg · ${intensityFilter}`
    : 'No workouts yet'

  const barData = volume.map((p) => ({ value: p.value, label: p.label, frontColor: c.primary }))
  const barSpacing = Math.max(6, (CHART_W - 22 * barData.length) / Math.max(1, barData.length))
  const repsLineData = repsVolume.map((p) => ({ value: p.value }))
  const maxReps = Math.max(0, ...repsVolume.map((p) => p.value))
  const repsAxisMax = Math.max(10, Math.ceil(maxReps / 40) * 40)

  return (
    <>
      <Text style={[styles.filterLabel, { color: c.textSecondary }]}>This week</Text>
      <View style={styles.tiles}>
        <StatTile label={`Workouts (${weekLabel})`} value={String(lastWeekCount)} sub="this week" c={c} />
      </View>

      <View style={[styles.tiles, { marginTop: Spacing.three }]}>
        <StatTile label={`Sets (${weekLabel})`} value={String(weekSets)} sub="this week" c={c} />
        <StatTile label={`Reps (${weekLabel})`} value={String(weekReps)} sub="this week" c={c} />
      </View>

      <Text style={[styles.filterLabel, { color: c.textSecondary }]}>Training volume</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.three }}>
        {(['All', ...MUSCLE_GROUPS] as Filter[]).map((g) => {
          const on = volumeFilter === g
          return (
            <TouchableOpacity
              key={`vol-${g}`}
              onPress={() => setVolumeFilter(g)}
              style={[styles.chip, { backgroundColor: on ? c.primary : c.backgroundElement, borderColor: c.border }]}>
              <Text style={{ color: on ? c.onPrimary : c.text, fontWeight: '600', fontSize: 13 }}>{g}</Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      <Card style={{ marginTop: Spacing.three }}>
        <View style={styles.panelHeader}>
          <Text style={[styles.panelTitle, { color: c.text }]}>Weekly volume</Text>
          <TouchableOpacity
            onPress={() =>
              onExpand({
                kind: 'bar',
                title: 'Weekly volume',
                subtitle: `${setsTotal} sets · ${repsTotal} reps total · ${volumeFilter}`,
                barData: volume,
                repsData: repsVolume,
              })
            }
            accessibilityLabel="Expand Weekly volume"
            hitSlop={10}>
            <Icon name="arrow.up.left.and.arrow.down.right" color={c.textSecondary} size={16} />
          </TouchableOpacity>
        </View>
        <Text style={{ color: c.textSecondary, fontSize: 13 }}>
          {setsTotal} sets · {repsTotal} reps total · {volumeFilter}
        </Text>
        <View style={styles.legendRow}>
          <LegendDot color={c.primary} label="Sets" c={c} />
          <LegendDot color={c.success} label="Reps" c={c} />
        </View>
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
            renderTooltip={(item: { label?: string; value: number }, index: number) => (
              <ChartTip
                lines={[item.label ?? '', `${item.value} sets`, `${repsVolume[index]?.value ?? 0} reps`]}
                c={c}
              />
            )}
            autoCenterTooltip
            leftShiftForLastIndexTooltip={48}
            showLine
            lineData={repsLineData}
            lineConfig={{
              isSecondary: true,
              color: c.success,
              thickness: 2,
              dataPointsColor: c.success,
              dataPointsRadius: 3,
            }}
            secondaryYAxis={{
              maxValue: repsAxisMax,
              noOfSections: 4,
              yAxisColor: 'transparent',
              yAxisTextStyle: axisText,
            }}
          />
        )}
      </Card>

      <Text style={[styles.filterLabel, { color: c.textSecondary }]}>Training intensity</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.three }}>
        {(['All', ...MUSCLE_GROUPS] as Filter[]).map((g) => {
          const on = intensityFilter === g
          return (
            <TouchableOpacity
              key={`int-${g}`}
              onPress={() => setIntensityFilter(g)}
              style={[styles.chip, { backgroundColor: on ? c.primary : c.backgroundElement, borderColor: c.border }]}>
              <Text style={{ color: on ? c.onPrimary : c.text, fontWeight: '600', fontSize: 13 }}>{g}</Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      <Card style={{ alignItems: 'center' }}>
        <Text style={{ color: c.textSecondary, fontSize: 13, fontWeight: '600' }}>
          Max weight · all time
        </Text>
        <Text style={{ color: c.text, fontSize: 44, fontWeight: '800', marginTop: 2 }}>
          {peakWeight > 0 ? `${peakWeight} kg` : '–'}
        </Text>
        <Text style={{ color: c.textSecondary, fontSize: 12 }}>{intensityFilter}</Text>
      </Card>

      <Card style={{ marginTop: Spacing.three }}>
        <View style={styles.panelHeader}>
          <Text style={[styles.panelTitle, { color: c.text }]}>Daily max weight</Text>
          <TouchableOpacity
            onPress={() =>
              onExpand({
                kind: 'bar',
                title: 'Daily max weight',
                subtitle: dailySubtitle,
                barData: dailyMax,
              })
            }
            accessibilityLabel="Expand Daily max weight"
            hitSlop={10}>
            <Icon name="arrow.up.left.and.arrow.down.right" color={c.textSecondary} size={16} />
          </TouchableOpacity>
        </View>
        <Text style={{ color: c.textSecondary, fontSize: 13 }}>{dailySubtitle}</Text>
        <View style={styles.legendRow}>
          <LegendDot color={c.primary} label="Max weight (kg)" c={c} />
        </View>
        <View style={{ height: Spacing.three }} />
        {dailyMax.length === 0 ? (
          <Empty c={c} />
        ) : (
          <BarChart
            data={dailyMax.map((p) => ({ value: p.value, label: p.label, frontColor: c.primary }))}
            barWidth={22}
            spacing={Math.max(6, (CHART_W - 22 * dailyMax.length) / Math.max(1, dailyMax.length))}
            initialSpacing={10}
            roundedTop
            noOfSections={4}
            height={160}
            yAxisThickness={0}
            xAxisThickness={0}
            xAxisLabelTextStyle={axisText}
            yAxisTextStyle={axisText}
            rulesColor={c.border}
            renderTooltip={(item: { label?: string; value: number }) => (
              <ChartTip lines={[item.label ?? '', `${item.value} kg`]} c={c} />
            )}
            autoCenterTooltip
            leftShiftForLastIndexTooltip={48}
          />
        )}
      </Card>
    </>
  )
}

function BodySection({
  entries,
  axisText,
  c,
  onExpand,
}: {
  entries: BodyEntry[]
  axisText: { color: string; fontSize: number }
  c: ReturnType<typeof useTheme>
  onExpand: (chart: ExpandedChart) => void
}) {
  // Body dashboards plot the full stored history on a fixed ~7-day viewport;
  // the chart scrolls left through older data and stops at the oldest entry.
  const weight = useMemo(() => bodyweightSeries(entries), [entries])
  const bodyFat = useMemo(() => bodyMetricSeries(entries, 'bodyFatPct'), [entries])
  const measures = useMemo(
    () => BODY_MEASURES.map((m) => ({ ...m, series: bodyMetricSeries(entries, m.key) })),
    [entries],
  )

  const anyMeasure = measures.some((m) => m.series.length > 0)
  const expand = (title: string, unit: string, series: Point[]) => {
    const last = series.length ? series[series.length - 1].value : null
    onExpand({ kind: 'line', title, subtitle: last != null ? `${last} ${unit}` : 'No entries yet', unit, data: series })
  }

  return (
    <>
      <LinePanel
        title="Bodyweight"
        unit="kg"
        series={weight}
        axisText={axisText}
        c={c}
        onExpand={() => expand('Bodyweight', 'kg', weight)}
      />
      {bodyFat.length > 0 && (
        <LinePanel
          title="Body fat"
          unit="%"
          series={bodyFat}
          axisText={axisText}
          c={c}
          onExpand={() => expand('Body fat', '%', bodyFat)}
        />
      )}
      {measures.map((m) =>
        m.series.length > 0 ? (
          <LinePanel
            key={m.key}
            title={`${m.label} circumference`}
            unit={m.unit}
            series={m.series}
            axisText={axisText}
            c={c}
            onExpand={() => expand(`${m.label} circumference`, m.unit, m.series)}
          />
        ) : null,
      )}
      {!anyMeasure && bodyFat.length === 0 && (
        <Text style={{ color: c.textSecondary, fontSize: 13, marginTop: Spacing.two, textAlign: 'center' }}>
          Add body fat % and measurements in Profile to see more charts here.
        </Text>
      )}
    </>
  )
}

function LinePanel({
  title,
  unit,
  series,
  axisText,
  c,
  onExpand,
}: {
  title: string
  unit: string
  series: Point[]
  axisText: { color: string; fontSize: number }
  c: ReturnType<typeof useTheme>
  onExpand: () => void
}) {
  const [tip, pickTip] = useTip()
  const range = useMemo(() => niceRange(series.map((p) => p.value)), [series])
  const data = tipData(series, tip, unit, c, range)
  // Fixed 7-day viewport: spread points across 7 slots, leaving room
  // (initialSpacing + endSpacing) so the last label is never truncated.
  const slots = 7
  const initialSpacing = 16
  const endSpacing = 32
  const spacing =
    data.length > 1
      ? Math.max(18, (CHART_W - initialSpacing - endSpacing) / (slots - 1))
      : 40
  const latest = series.length ? series[series.length - 1].value : null

  return (
    <Card style={{ marginTop: Spacing.three }}>
      <View style={styles.panelHeader}>
        <Text style={[styles.panelTitle, { color: c.text }]}>{title}</Text>
        <TouchableOpacity onPress={onExpand} accessibilityLabel={`Expand ${title}`} hitSlop={10}>
          <Icon name="arrow.up.left.and.arrow.down.right" color={c.textSecondary} size={16} />
        </TouchableOpacity>
      </View>
      <Text style={{ color: c.textSecondary, fontSize: 13 }}>
        {latest != null ? `${latest} ${unit} now` : 'No entries yet'}
      </Text>
      <View style={{ height: Spacing.three }} />
      {data.length === 0 ? (
        <Empty c={c} />
      ) : (
        <LineChart
          data={data}
          width={CHART_W}
          height={160}
          spacing={spacing}
          initialSpacing={initialSpacing}
          endSpacing={endSpacing}
          scrollToEnd
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
          yAxisOffset={range.min}
          maxValue={range.max - range.min}
          noOfSections={range.sections}
          yAxisLabelTexts={range.labels}
          {...tipTargets(series, pickTip)}
        />
      )}
    </Card>
  )
}

// Tooltip pill shared by every chart: first line is the x label, the rest are values.
function ChartTip({ lines, c }: { lines: string[]; c: ReturnType<typeof useTheme> }) {
  return (
    <View style={[styles.tip, { backgroundColor: c.backgroundElement, borderColor: c.border }]}>
      {lines.map((l, i) => (
        <Text
          key={i}
          style={{
            color: i === 0 ? c.textSecondary : c.text,
            fontSize: i === 0 ? 11 : 13,
            fontWeight: i === 0 ? '500' : '700',
          }}>
          {l}
        </Text>
      ))}
    </View>
  )
}

// Tap-only tooltips for the line charts. Each data point is a Pressable, and a
// Pressable only fires on a clean tap: any drag is claimed by the chart's own
// horizontal scroll or by the page, so neither kind of scrolling is affected.
function useTip(): [number | null, (i: number) => void] {
  const [tip, setTip] = useState<number | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pick = useCallback((i: number) => {
    if (timer.current) clearTimeout(timer.current)
    setTip((cur) => (cur === i ? null : i))
    timer.current = setTimeout(() => setTip(null), 2000)
  }, [])
  return [tip, pick]
}

const TIP_W = 120
// The tip is drawn by the chart itself (dataPointLabelComponent) so it scrolls with
// the line. It is clipped at the chart's edges, so it goes below the point for high
// values (the usual case, the y axis starts at 0), above it for low ones, and is
// nudged inwards on the first and last points.
const tipData = (series: Point[], tip: number | null, unit: string, c: ReturnType<typeof useTheme>, range: AxisRange) => {
  const last = series.length - 1
  return series.map((p, i) => ({
    value: p.value,
    label: p.label,
    dataPointLabelShiftY: (p.value - range.min) / (range.max - range.min) < 0.35 ? -58 : 14,
    dataPointLabelShiftX: i === 0 ? 40 : i === last ? -40 : 0,
    dataPointLabelComponent: () =>
      tip === i ? <ChartTip lines={[p.label, `${p.value} ${unit}`]} c={c} /> : null,
  }))
}

// Touch targets: a second, invisible copy of the line whose data points are big
// transparent circles. SVG circles only fire onPress on a clean tap, so both the
// chart's horizontal scroll and the page scroll keep working.
const tipTargets = (series: Point[], pick: (i: number) => void) => ({
  onPress: (_item: unknown, index: number) => pick(index),
  dataPointLabelWidth: TIP_W,
  data2: series.map((p) => ({ value: p.value })),
  color2: 'transparent',
  thickness2: 0,
  dataPointsColor2: 'transparent',
  dataPointsRadius2: 18,
})

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

function LegendDot({
  color,
  label,
  c,
}: {
  color: string
  label: string
  c: ReturnType<typeof useTheme>
}) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color }]} />
      <Text style={{ color: c.textSecondary, fontSize: 12 }}>{label}</Text>
    </View>
  )
}

function Empty({ c }: { c: ReturnType<typeof useTheme> }) {
  return (
    <View style={styles.empty}>
      <Text style={{ color: c.textSecondary }}>No data yet.</Text>
    </View>
  )
}

function ExpandedChartOverlay({
  chart,
  onClose,
}: {
  chart: ExpandedChart | null
  onClose: () => void
}) {
  const c = useTheme()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const [tip, pickTip] = useTip()
  const lineRange = useMemo(
    () => niceRange(chart?.kind === 'line' ? chart.data.map((p) => p.value) : []),
    [chart],
  )

  const chartW = width - Spacing.three * 2
  const axisText = { color: c.textSecondary, fontSize: 11 }
  const initialSpacing = 24
  const endSpacing = 40
  // Fixed ~7-slot viewport so the fullscreen chart scrolls left through history
  // exactly like the on-screen panel.
  const lineSpacing = (dataLen: number) =>
    dataLen > 1 ? Math.max(20, (chartW - initialSpacing - endSpacing) / 6) : 50

  return (
    <Modal
      visible={chart != null}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={false}>
      <View style={{ flex: 1, backgroundColor: c.background, paddingTop: insets.top }}>
        <View style={[styles.expandedBar, { borderBottomColor: c.border }]}>
          <Text style={[styles.panelTitle, { color: c.text }]} numberOfLines={1}>
            {chart?.title}
          </Text>
          <TouchableOpacity onPress={onClose} accessibilityLabel="Close fullscreen" hitSlop={10}>
            <Icon name="xmark" color={c.text} size={22} />
          </TouchableOpacity>
        </View>

        {chart?.kind === 'line' && (
          <View style={{ padding: Spacing.three, flex: 1 }}>
            <Text style={{ color: c.textSecondary, fontSize: 14 }}>
              {chart.data.length ? chart.subtitle : 'No entries yet'}
            </Text>
            <View style={{ height: Spacing.three }} />
            {chart.data.length === 0 ? (
              <Empty c={c} />
            ) : (
              <LineChart
                data={tipData(chart.data, tip, chart.unit, c, lineRange)}
                width={chartW}
                height={360}
                spacing={lineSpacing(chart.data.length)}
                initialSpacing={initialSpacing}
                endSpacing={endSpacing}
                scrollToEnd
                thickness={4}
                color={c.primary}
                dataPointsColor={c.primary}
                hideRules={false}
                rulesColor={c.border}
                yAxisThickness={0}
                xAxisThickness={0}
                xAxisLabelTextStyle={axisText}
                yAxisTextStyle={axisText}
                curved
                yAxisOffset={lineRange.min}
                maxValue={lineRange.max - lineRange.min}
                noOfSections={lineRange.sections}
                yAxisLabelTexts={lineRange.labels}
                {...tipTargets(chart.data, pickTip)}
              />
            )}
          </View>
        )}

        {chart?.kind === 'bar' && (
          <View style={{ padding: Spacing.three, flex: 1 }}>
            <Text style={{ color: c.textSecondary, fontSize: 14 }}>{chart.subtitle}</Text>
            {chart.repsData ? (
              <View style={styles.legendRow}>
                <LegendDot color={c.primary} label="Sets" c={c} />
                <LegendDot color={c.success} label="Reps" c={c} />
              </View>
            ) : (
              <View style={styles.legendRow}>
                <LegendDot color={c.primary} label="Max weight (kg)" c={c} />
              </View>
            )}
            <View style={{ height: Spacing.three }} />
            {chart.barData.length === 0 ? (
              <Empty c={c} />
            ) : (
              <BarChart
                data={chart.barData.map((p) => ({ value: p.value, label: p.label, frontColor: c.primary }))}
                barWidth={44}
                spacing={(chartW - 44 * chart.barData.length) / Math.max(1, chart.barData.length)}
                initialSpacing={24}
                roundedTop
                noOfSections={4}
                height={360}
                yAxisThickness={0}
                xAxisThickness={0}
                xAxisLabelTextStyle={axisText}
                yAxisTextStyle={axisText}
                rulesColor={c.border}
                renderTooltip={(item: { label?: string; value: number }, index: number) => (
                  <ChartTip
                    lines={
                      chart.repsData
                        ? [item.label ?? '', `${item.value} sets`, `${chart.repsData[index]?.value ?? 0} reps`]
                        : [item.label ?? '', `${item.value} kg`]
                    }
                    c={c}
                  />
                )}
                autoCenterTooltip
                leftShiftForLastIndexTooltip={60}
                showLine={!!chart.repsData}
                lineData={chart.repsData?.map((p) => ({ value: p.value }))}
                lineConfig={{
                  isSecondary: true,
                  color: c.success,
                  thickness: 2,
                  dataPointsColor: c.success,
                  dataPointsRadius: 3,
                }}
                secondaryYAxis={
                  chart.repsData
                    ? {
                        maxValue: Math.max(10, Math.ceil(Math.max(0, ...chart.repsData.map((p) => p.value)) / 40) * 40),
                        noOfSections: 4,
                        yAxisColor: 'transparent',
                        yAxisTextStyle: axisText,
                      }
                    : undefined
                }
              />
            )}
          </View>
        )}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  segment: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 4,
    gap: 4,
  },
  segItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 9 },
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
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  tip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  expandedBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  legendRow: { flexDirection: 'row', gap: Spacing.three, marginTop: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendSwatch: { width: 10, height: 10, borderRadius: 3 },
  empty: { height: 120, alignItems: 'center', justifyContent: 'center' },
})
