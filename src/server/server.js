import 'dotenv/config'
import express from 'express'
import session from 'express-session'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '../../')

export const app = express()

// Fichiers statiques
app.use('/static', express.static(path.join(rootDir, 'static')))

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
    return done(null, profile)
}))

passport.serializeUser((user, done) => done(null, user))
passport.deserializeUser((user, done) => done(null, user))

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

// Routes protégées
app.get('/lobby', requireAuth, (req, res) => res.sendFile(path.join(rootDir, 'Template/lobby.html')))
app.get('/game', requireAuth, (req, res) => res.sendFile(path.join(rootDir, 'Template/game.html')))
