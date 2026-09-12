// SQLite bootstrap: open the DB, create the schema, seed the exercise catalog.
import * as SQLite from 'expo-sqlite'

import { CATALOG } from './catalog'

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null

const SCHEMA = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  display_name TEXT NOT NULL,
  sex TEXT NOT NULL,
  height_cm REAL NOT NULL,
  dob TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  sub_group TEXT
);

CREATE TABLE IF NOT EXISTS workouts (
  id TEXT PRIMARY KEY,
  day TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS workout_exercises (
  id TEXT PRIMARY KEY,
  workout_id TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  position INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS workout_sets (
  id TEXT PRIMARY KEY,
  workout_exercise_id TEXT NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
  reps INTEGER NOT NULL,
  weight_kg REAL NOT NULL,
  position INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS saved_workouts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS saved_workout_exercises (
  id TEXT PRIMARY KEY,
  saved_workout_id TEXT NOT NULL REFERENCES saved_workouts(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  position INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS saved_workout_sets (
  id TEXT PRIMARY KEY,
  saved_workout_exercise_id TEXT NOT NULL REFERENCES saved_workout_exercises(id) ON DELETE CASCADE,
  reps INTEGER NOT NULL,
  weight_kg REAL NOT NULL,
  position INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS bodyweight_entries (
  id TEXT PRIMARY KEY,
  day TEXT NOT NULL,
  weight_kg REAL NOT NULL,
  body_fat_pct REAL,
  arm_cm REAL,
  chest_cm REAL,
  shoulders_cm REAL,
  waist_cm REAL,
  glutes_cm REAL,
  quads_cm REAL
);
`

// Additive migrations for the advanced body-stat columns (local dev data is
// disposable, but keep existing installs working without a wipe).
const BODY_COLUMNS = [
  'body_fat_pct',
  'arm_cm',
  'chest_cm',
  'shoulders_cm',
  'waist_cm',
  'glutes_cm',
  'quads_cm',
]

async function migrateBodyColumns(db: SQLite.SQLiteDatabase): Promise<void> {
  const cols = await db.getAllAsync<{ name: string }>(
    'PRAGMA table_info(bodyweight_entries)',
  )
  const existing = new Set(cols.map((c) => c.name))
  for (const col of BODY_COLUMNS) {
    if (!existing.has(col)) {
      await db.execAsync(`ALTER TABLE bodyweight_entries ADD COLUMN ${col} REAL;`)
    }
  }
}

// One body entry per day. Enforced by a UNIQUE index on day (see
// migrateBodyDayUnique): newer entries overwrite older ones of the same day
// via ON CONFLICT(day) DO UPDATE in repo.addBodyEntry.
async function migrateBodyDayUnique(db: SQLite.SQLiteDatabase): Promise<void> {
  const idxs = await db.getAllAsync<{ name: string }>(
    "PRAGMA index_list('bodyweight_entries')",
  )
  if (idxs.some((ix) => ix.name === 'idx_bodyweight_entries_day')) return

  // One-time upgrade of legacy installs: collapse any pre-existing duplicate
  // rows (keep the most recent per day) before locking day down as UNIQUE.
  await db.execAsync(
    `DELETE FROM bodyweight_entries
     WHERE id NOT IN (
       SELECT id FROM (
         SELECT id, ROW_NUMBER() OVER (PARTITION BY day ORDER BY rowid DESC) AS rn
         FROM bodyweight_entries
       ) WHERE rn = 1
     );`,
  )
  await db.execAsync(
    'CREATE UNIQUE INDEX idx_bodyweight_entries_day ON bodyweight_entries(day)',
  )
}

async function seedCatalog(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) AS c FROM exercises')
  if (row && row.c === CATALOG.length) return
  await db.withTransactionAsync(async () => {
    for (const e of CATALOG) {
      await db.runAsync(
        'INSERT OR REPLACE INTO exercises (id, name, muscle_group, sub_group) VALUES (?, ?, ?, ?)',
        [e.id, e.name, e.group, e.subGroup],
      )
    }
    const ids = CATALOG.map((e) => e.id)
    await db.runAsync(
      `DELETE FROM exercises WHERE id NOT IN (${ids.map(() => '?').join(',')})`,
      ids,
    )
  })
}

async function open(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync('bfit.db')
  await db.execAsync('PRAGMA foreign_keys = ON;')
  await db.execAsync(SCHEMA)
  await migrateBodyColumns(db)
  await migrateBodyDayUnique(db)
  await seedCatalog(db)
  return db
}

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) dbPromise = open()
  return dbPromise
}

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
