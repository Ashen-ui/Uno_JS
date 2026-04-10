import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import path from 'path'
import crypto from 'crypto'
import { computeLevelFromXp } from '../game/level.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const db = new Database(path.join(__dirname, 'Users.db'))

// Création de la table si elle n'existe pas
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        google_id   TEXT UNIQUE NOT NULL,
        name        TEXT NOT NULL,
        email       TEXT,
        avatar      TEXT,
        password_hash TEXT,
        games_played INTEGER DEFAULT 0,
        games_won    INTEGER DEFAULT 0,
        xp_total     INTEGER DEFAULT 0,
        level        INTEGER DEFAULT 1,
        created_at  TEXT DEFAULT (datetime('now'))
    )
`)
try { db.exec("ALTER TABLE users ADD COLUMN xp_total INTEGER DEFAULT 0") } catch {}
try { db.exec("ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1") } catch {}
try { db.exec("ALTER TABLE users ADD COLUMN password_hash TEXT") } catch {}

export function upsertUser({ google_id, name, email, avatar }) {
    const existing = db.prepare('SELECT * FROM users WHERE google_id = ?').get(google_id)
    if (existing) {
        db.prepare(`
            UPDATE users SET name = ?, email = ?, avatar = ? WHERE google_id = ?
        `).run(name, email, avatar, google_id)
        return db.prepare('SELECT * FROM users WHERE google_id = ?').get(google_id)
    } else {
        db.prepare(`
            INSERT INTO users (google_id, name, email, avatar) VALUES (?, ?, ?, ?)
        `).run(google_id, name, email, avatar)
        return db.prepare('SELECT * FROM users WHERE google_id = ?').get(google_id)
    }
}

export function getUserByGoogleId(google_id) {
    return db.prepare('SELECT * FROM users WHERE google_id = ?').get(google_id)
}

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex')
}

export function createLocalUser({ username, email, password }) {
    const normalizedUsername = username?.trim()
    const normalizedEmail = email?.trim().toLowerCase()
    if (!normalizedUsername || !normalizedEmail || !password) {
        return { ok: false, reason: 'missing_fields' }
    }

    const existingByName = db.prepare('SELECT id FROM users WHERE name = ?').get(normalizedUsername)
    if (existingByName) return { ok: false, reason: 'username_exists' }

    const existingByEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail)
    if (existingByEmail) return { ok: false, reason: 'email_exists' }

    const localId = `local:${normalizedUsername}`
    const passwordHash = hashPassword(password)

    db.prepare(`
        INSERT INTO users (google_id, name, email, password_hash, avatar)
        VALUES (?, ?, ?, ?, ?)
    `).run(localId, normalizedUsername, normalizedEmail, passwordHash, null)

    const user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(localId)
    return { ok: true, user }
}

export function verifyLocalUser({ username, password }) {
    const normalizedUsername = username?.trim()
    if (!normalizedUsername || !password) return null

    const user = db.prepare('SELECT * FROM users WHERE name = ?').get(normalizedUsername)
    if (!user?.password_hash) return null

    const inputHash = hashPassword(password)
    if (user.password_hash !== inputHash) return null
    return user
}

export function getAllUsers() {
    return db.prepare('SELECT id, name, email, avatar, games_played, games_won, created_at FROM users').all()
}

export default db

export function grantXpByGoogleId(google_id, amount) {
  const user = getUserByGoogleId(google_id)
  if (!user) return null

  const nextXp = (user.xp_total ?? 0) + amount
  const nextLevel = computeLevelFromXp(nextXp)

  db.prepare(`
    UPDATE users
    SET xp_total = ?, level = ?
    WHERE google_id = ?
  `).run(nextXp, nextLevel, google_id)

  return getUserByGoogleId(google_id)
}