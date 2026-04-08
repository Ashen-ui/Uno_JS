import 'dotenv/config'
import express from 'express'
import session from 'express-session'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { fileURLToPath } from 'url'
import path from 'path'
import { upsertUser, getUserByGoogleId, createLocalUser, verifyLocalUser } from '../Databozi/db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '../../')

export const app = express()

// Fichiers statiques
app.use('/static', express.static(path.join(rootDir, 'static')))
app.use(express.urlencoded({ extended: false }))

// Session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}))

// Passport
app.use(passport.initialize())
app.use(passport.session())

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
    const user = upsertUser({
        google_id: profile.id,
        name: profile.displayName,
        email: profile.emails?.[0]?.value ?? null,
        avatar: profile.photos?.[0]?.value ?? null
    })
    return done(null, user)
}))

passport.serializeUser((user, done) => done(null, user.google_id))
passport.deserializeUser((google_id, done) => {
    const user = getUserByGoogleId(google_id)
    done(null, user ?? false)
})

// Middleware de protection des routes
function requireAuth(req, res, next) {
    if (req.isAuthenticated()) return next()
    res.redirect('/connexion')
}

// Routes publiques
app.get('/', (req, res) => res.redirect('/index'))
app.get('/index', (req, res) => res.sendFile(path.join(rootDir, 'Template/index.html')))
app.get('/connexion', (req, res) => res.sendFile(path.join(rootDir, 'Template/connection.html')))
app.get('/inscription', (req, res) => res.sendFile(path.join(rootDir, 'Template/registration.html')))
app.post('/registration', (req, res) => {
    const { email, username, password } = req.body
    const result = createLocalUser({ email, username, password })

    if (!result.ok) {
        if (result.reason === 'username_exists' || result.reason === 'email_exists') {
            return res.status(409).send('Utilisateur déjà existant')
        }
        return res.status(400).send('Données d\'inscription invalides')
    }

    res.redirect('/connexion')
})

app.post('/connexion', (req, res, next) => {
    const { username, password } = req.body
    const user = verifyLocalUser({ username, password })
    if (!user) return res.status(401).send('Identifiants invalides')

    req.login(user, (err) => {
        if (err) return next(err)
        res.redirect('/lobby')
    })
})

// Google OAuth
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/connexion' }),
    (req, res) => res.redirect('/lobby')
)

// Déconnexion
app.get('/logout', (req, res) => {
    req.logout(() => res.redirect('/connexion'))
})

// Stockage des salles en mémoire
const rooms = new Map()

// API
app.get('/api/me', requireAuth, (req, res) => {
    const { name, email, avatar, games_played, games_won, xp_total, level } = req.user
    res.json({ name, email, avatar, games_played, games_won, xp_total, level })
})

app.get('/api/rooms', requireAuth, (req, res) => {
    res.json([...rooms.values()])
})

app.post('/api/rooms', requireAuth, express.json(), (req, res) => {
    const { name } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Nom requis' })
    const id = Date.now().toString()
    const room = {
        id,
        name: name.trim(),
        host: req.user.name,
        players: [req.user.name],
        maxPlayers: 4,
        status: 'waiting'
    }
    rooms.set(id, room)
    res.json(room)
})

app.post('/api/rooms/:id/join', requireAuth, (req, res) => {
    const room = rooms.get(req.params.id)
    if (!room) return res.status(404).json({ error: 'Salle introuvable' })
    if (room.players.length >= room.maxPlayers) return res.status(400).json({ error: 'Salle pleine' })
    if (!room.players.includes(req.user.name)) {
        room.players.push(req.user.name)
    }
    res.json(room)
})

// Routes protégées
app.get('/lobby', requireAuth, (req, res) => res.sendFile(path.join(rootDir, 'Template/lobby.html')))
app.get('/game', requireAuth, (req, res) => res.sendFile(path.join(rootDir, 'Template/game.html')))
