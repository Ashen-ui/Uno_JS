import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import path from 'path'

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
        games_played INTEGER DEFAULT 0,
        games_won    INTEGER DEFAULT 0,
        created_at  TEXT DEFAULT (datetime('now'))
    )
`)

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

export function getAllUsers() {
    return db.prepare('SELECT id, name, email, avatar, games_played, games_won, created_at FROM users').all()
}

export default db
