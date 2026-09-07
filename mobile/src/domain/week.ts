// Pure week/calendar helpers for the Home week bar. Days are ISO 'yyyy-MM-dd'.
import {
  addDays,
  differenceInCalendarWeeks,
  endOfWeek,
  format,
  startOfWeek,
  subWeeks,
} from 'date-fns'

export const DAY_KEY = 'yyyy-MM-dd'

export function toDayKey(d: Date): string {
  return format(d, DAY_KEY)
}

export function todayKey(now: Date = new Date()): string {
  return toDayKey(now)
}

export interface WeekDay {
  key: string // yyyy-MM-dd
  dayOfMonth: number // 1..31
  weekday: string // Mon, Tue...
  isToday: boolean
}

/** A flat, scrollable list of days from `weeksBack` weeks ago up to the end of
 *  the current week (Mon-start weeks). Oldest first so today sits at the end. */
export function buildDayStrip(weeksBack = 11, now: Date = new Date()): WeekDay[] {
  const start = startOfWeek(subWeeks(now, weeksBack), { weekStartsOn: 1 })
  const end = endOfWeek(now, { weekStartsOn: 1 })
  const todayK = toDayKey(now)
  const days: WeekDay[] = []
  let cursor = start
  while (cursor <= end) {
    days.push({
      key: toDayKey(cursor),
      dayOfMonth: cursor.getDate(),
      weekday: format(cursor, 'EEE'),
      isToday: toDayKey(cursor) === todayK,
    })
    cursor = addDays(cursor, 1)
  }
  return days
}

/** Human label for a selected day, e.g. "Today" or "Wed, 3 Sep". */
export function dayLabel(key: string, now: Date = new Date()): string {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  if (toDayKey(date) === toDayKey(now)) return 'Today'
  return format(date, 'EEE, d MMM')
}

/** Index of the ISO week (Mon-start) relative to `now`, 0 = this week, 1 = last week. */
export function weeksAgo(key: string, now: Date = new Date()): number {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return differenceInCalendarWeeks(now, date, { weekStartsOn: 1 })
}
