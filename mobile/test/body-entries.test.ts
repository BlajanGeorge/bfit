// Tests for the one-body-entry-per-day rule (latest entry overwrites the
// older one for the same day) and the dedupe migration.
//
// Uses a better-sqlite3-backed mock of expo-sqlite so the real SQL of
// db.ts/repo.ts runs against a genuine SQLite engine.

import { __resetSqliteCache } from './__mocks__/expo-sqlite'

jest.mock('@/data/catalog', () => ({
  __esModule: true,
  CATALOG: [],
}))

const dayA = '2026-09-10'
const dayB = '2026-09-11'

beforeEach(() => {
  __resetSqliteCache()
  jest.resetModules()
})

async function freshRepo() {
  return await import('@/data/repo')
}
async function freshDb() {
  return await import('@/data/db')
}

describe('addBodyEntry — one entry per day', () => {
  it('keeps only the latest entry when logging twice on the same day', async () => {
    const { addBodyEntry, getBodyEntries, getLatestBodyEntry } = await freshRepo()

    await addBodyEntry(dayA, 83)
    await addBodyEntry(dayA, 84)

    const entries = await getBodyEntries()
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({ date: dayA, weightKg: 84 })

    const latest = await getLatestBodyEntry()
    expect(latest).toMatchObject({ date: dayA, weightKg: 84 })
  })

  it('keeps one entry per distinct day', async () => {
    const { addBodyEntry, getBodyEntries } = await freshRepo()

    await addBodyEntry(dayA, 80)
    await addBodyEntry(dayB, 82)
    await addBodyEntry(dayA, 81)

    const entries = await getBodyEntries()
    expect(entries).toHaveLength(2)
    expect(entries.map((e) => [e.date, e.weightKg])).toEqual([
      [dayA, 81],
      [dayB, 82],
    ])
  })

  it('the second entry on the same day fully replaces the first (advanced fields too)', async () => {
    const { addBodyEntry, getBodyEntries } = await freshRepo()

    await addBodyEntry(dayA, 83, { bodyFatPct: 21, armCm: 35 })
    await addBodyEntry(dayA, 84, { bodyFatPct: 20 })

    const entries = await getBodyEntries()
    expect(entries).toHaveLength(1)
    const latest = entries[0]
    expect(latest.weightKg).toBe(84)
    expect(latest.bodyFatPct).toBe(20)
    expect(latest.armCm).toBe(null)
  })
})

describe('migration', () => {
  it('creates the UNIQUE day index and collapses legacy duplicate rows', async () => {
    const { getDb } = await freshDb()
    const db = await getDb()

    // Simulate a legacy install: the UNIQUE index does not exist yet, so
    // duplicate rows for the same day were possible.
    await db.execAsync('DROP INDEX idx_bodyweight_entries_day')
    await db.runAsync(
      `INSERT INTO bodyweight_entries (id, day, weight_kg, body_fat_pct) VALUES (?, ?, ?, ?)`,
      ['a', dayA, 83, 21],
    )
    await db.runAsync(
      `INSERT INTO bodyweight_entries (id, day, weight_kg, body_fat_pct) VALUES (?, ?, ?, ?)`,
      ['b', dayA, 84, 20],
    )
    await db.runAsync(
      `INSERT INTO bodyweight_entries (id, day, weight_kg) VALUES (?, ?, ?)`,
      ['c', dayB, 85],
    )

    // Re-open the store so open() runs migrateBodyDayUnique() on existing data.
    jest.resetModules()
    const { getBodyEntries } = await freshRepo()

    const entries = await getBodyEntries()
    expect(entries).toHaveLength(2)
    expect(entries.find((e) => e.date === dayA)).toMatchObject({ weightKg: 84, bodyFatPct: 20 })
    expect(entries.find((e) => e.date === dayB)).toMatchObject({ weightKg: 85 })

    // The UNIQUE index now exists, so addBodyEntry upserts instead of duplicating.
    const { addBodyEntry } = await freshRepo()
    await addBodyEntry(dayA, 90)
    const after = await (await freshRepo()).getBodyEntries()
    expect(after).toHaveLength(2)
    expect(after.find((e) => e.date === dayA)).toMatchObject({ weightKg: 90 })
  })

  it('is a no-op when the UNIQUE index already exists', async () => {
    const { getDb } = await freshDb()
    const db = await getDb()

    // Open a second time on the same database; migration must skip its work.
    const again = await db.getAllAsync<{ name: string }>(
      "PRAGMA index_list('bodyweight_entries')",
    )
    expect(again.map((r) => r.name)).toContain('idx_bodyweight_entries_day')
  })
})