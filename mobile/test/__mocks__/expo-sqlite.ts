// Jest mock for expo-sqlite, backed by better-sqlite3 (real SQLite in Node).
// Mirrors the async API surface that src/data/db.ts + repo.ts use.
//
// Databases are cached by name on globalThis so that jest.resetModules() +
// re-import (used to re-run open(), e.g. migration tests) reuses the same
// underlying SQLite database instead of silently opening a fresh one.
import Database from 'better-sqlite3'

type Row = Record<string, unknown> | null

function cache(): Map<string, MockSQLiteDatabase> {
  const g = globalThis as { __mockSqlite?: Map<string, MockSQLiteDatabase> }
  if (!g.__mockSqlite) g.__mockSqlite = new Map()
  return g.__mockSqlite
}

export function __resetSqliteCache(): void {
  for (const mock of cache().values()) mock.db.close()
  cache().clear()
}

class MockSQLiteDatabase {
  readonly db: Database.Database

  constructor() {
    this.db = new Database(':memory:')
    this.db.pragma('foreign_keys = ON')
  }

  async execAsync(sql: string): Promise<void> {
    this.db.exec(sql)
  }

  async runAsync(sql: string, ...params: unknown[]): Promise<{ lastInsertRowid: number | bigint }> {
    const stmt = this.db.prepare(sql)
    const info = stmt.run(...params)
    return { lastInsertRowid: info.lastInsertRowid }
  }

  async getFirstAsync<T extends Row>(sql: string, ...params: unknown[]): Promise<T> {
    const stmt = this.db.prepare(sql)
    return (stmt.get(...params) ?? null) as T
  }

  async getAllAsync<T = Row>(sql: string, ...params: unknown[]): Promise<T[]> {
    const stmt = this.db.prepare(sql)
    return stmt.all(...params) as T[]
  }

  async withTransactionAsync(fn: () => Promise<void>): Promise<void> {
    this.db.exec('BEGIN')
    try {
      await fn()
      this.db.exec('COMMIT')
    } catch (err) {
      this.db.exec('ROLLBACK')
      throw err
    }
  }
}

export function openDatabaseAsync(name: string): Promise<MockSQLiteDatabase> {
  const map = cache()
  if (!map.has(name)) map.set(name, new MockSQLiteDatabase())
  return Promise.resolve(map.get(name)!)
}