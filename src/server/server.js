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
app.use(express.json())

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

const UNO_COLORS = ['red', 'blue', 'green', 'yellow']
const UNO_VALUES = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', '+2']
const UNO_WILDS = ['wild', '+4']

function createDeck() {
    const deck = []
    for (const color of UNO_COLORS) {
        for (const value of UNO_VALUES) {
            deck.push({ color, value })
            if (value !== '0') deck.push({ color, value })
        }
    }
    for (let i = 0; i < 4; i++) {
        deck.push({ color: 'wild', value: 'wild' })
        deck.push({ color: 'wild', value: '+4' })
    }
    return shuffle(deck)
}

function shuffle(cards) {
    const arr = [...cards]
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
}

function drawCard(room) {
    const game = room.game
    if (game.deck.length === 0 && game.discard.length > 1) {
        const top = game.discard.pop()
        game.deck = shuffle(game.discard)
        game.discard = [top]
    }
    return game.deck.pop() ?? null
}

function isPlayable(card, game) {
    const top = game.discard[game.discard.length - 1]
    return card.color === 'wild' || card.color === game.currentColor || card.value === top.value
}

function advanceTurn(game, steps = 1) {
    const count = game.playersOrder.length
    game.currentPlayerIndex = (game.currentPlayerIndex + (steps * game.direction) + count * 10) % count
}

function startGameForRoom(room) {
    const deck = createDeck()
    const playersOrder = [...room.players]
    const hands = {}
    playersOrder.forEach((name) => { hands[name] = [] })

    for (let i = 0; i < 7; i++) {
        for (const playerName of playersOrder) {
            hands[playerName].push(deck.pop())
        }
    }

    let first = deck.pop()
    while (first?.color === 'wild' && deck.length > 0) {
        deck.unshift(first)
        first = deck.pop()
    }

    room.game = {
        status: 'playing',
        playersOrder,
        hands,
        deck,
        discard: [first],
        currentColor: first.color,
        currentPlayerIndex: 0,
        direction: 1,
        winner: null,
        unoCalledBy: null
    }
    room.status = 'playing'
}

function getRoomForUser(req) {
    const roomId = req.session.roomId
    if (!roomId) return null
    const room = rooms.get(roomId)
    if (!room) return null
    if (!room.players.includes(req.user.name)) return null
    return room
}

function serializeGameForPlayer(room, playerName) {
    const game = room.game
    const topCard = game.discard[game.discard.length - 1]
    return {
        room: { id: room.id, name: room.name },
        status: game.status,
        winner: game.winner,
        topCard,
        currentColor: game.currentColor,
        drawCount: game.deck.length,
        turnPlayer: game.playersOrder[game.currentPlayerIndex],
        hand: game.hands[playerName] ?? [],
        players: game.playersOrder.map((name) => ({
            name,
            cardsLeft: game.hands[name]?.length ?? 0
        }))
    }
}

// API
app.get('/api/me', requireAuth, (req, res) => {
    const { name, email, avatar, games_played, games_won, xp_total, level } = req.user
    res.json({ name, email, avatar, games_played, games_won, xp_total, level })
})

app.get('/api/rooms', requireAuth, (req, res) => {
    res.json([...rooms.values()].map((room) => ({
        id: room.id,
        name: room.name,
        host: room.host,
        players: room.players,
        maxPlayers: room.maxPlayers,
        status: room.status
    })))
})

app.post('/api/rooms', requireAuth, (req, res) => {
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
    req.session.roomId = id
    res.json(room)
})

app.post('/api/rooms/:id/join', requireAuth, (req, res) => {
    const room = rooms.get(req.params.id)
    if (!room) return res.status(404).json({ error: 'Salle introuvable' })
    if (room.players.length >= room.maxPlayers) return res.status(400).json({ error: 'Salle pleine' })
    if (!room.players.includes(req.user.name)) {
        room.players.push(req.user.name)
    }
    req.session.roomId = room.id
    res.json(room)
})

app.post('/api/game/start', requireAuth, (req, res) => {
    const room = getRoomForUser(req)
    if (!room) return res.status(404).json({ error: 'Aucune salle active trouvée' })
    if (room.host !== req.user.name) return res.status(403).json({ error: 'Seul l hote peut lancer la partie' })
    if (room.players.length < 2) return res.status(400).json({ error: 'Il faut au moins 2 joueurs' })
    startGameForRoom(room)
    res.json(serializeGameForPlayer(room, req.user.name))
})

app.get('/api/game/state', requireAuth, (req, res) => {
    const room = getRoomForUser(req)
    if (!room) return res.status(404).json({ error: 'Aucune salle active trouvée' })
    if (!room.game) return res.status(400).json({ error: 'Partie non demarree' })
    res.json(serializeGameForPlayer(room, req.user.name))
})

app.post('/api/game/draw', requireAuth, (req, res) => {
    const room = getRoomForUser(req)
    if (!room?.game) return res.status(404).json({ error: 'Partie introuvable' })
    const game = room.game
    const playerName = req.user.name
    if (game.status !== 'playing') return res.status(400).json({ error: 'Partie terminee' })
    if (game.playersOrder[game.currentPlayerIndex] !== playerName) return res.status(400).json({ error: 'Ce n est pas ton tour' })

    const card = drawCard(room)
    if (!card) return res.status(400).json({ error: 'Pioche vide' })
    game.hands[playerName].push(card)
    advanceTurn(game, 1)
    game.unoCalledBy = null
    res.json(serializeGameForPlayer(room, playerName))
})

app.post('/api/game/uno', requireAuth, (req, res) => {
    const room = getRoomForUser(req)
    if (!room?.game) return res.status(404).json({ error: 'Partie introuvable' })
    const handCount = room.game.hands[req.user.name]?.length ?? 0
    if (handCount > 2) return res.status(400).json({ error: 'UNO possible seulement avec 2 cartes ou moins' })
    room.game.unoCalledBy = req.user.name
    res.json({ ok: true })
})

app.post('/api/game/play', requireAuth, (req, res) => {
    const room = getRoomForUser(req)
    if (!room?.game) return res.status(404).json({ error: 'Partie introuvable' })
    const game = room.game
    const playerName = req.user.name
    const { cardIndex, chosenColor } = req.body
    if (game.status !== 'playing') return res.status(400).json({ error: 'Partie terminee' })
    if (game.playersOrder[game.currentPlayerIndex] !== playerName) return res.status(400).json({ error: 'Ce n est pas ton tour' })

    const hand = game.hands[playerName]
    const index = Number(cardIndex)
    if (!Number.isInteger(index) || index < 0 || index >= hand.length) {
        return res.status(400).json({ error: 'Carte invalide' })
    }

    const card = hand[index]
    if (!isPlayable(card, game)) return res.status(400).json({ error: 'Carte non jouable' })

    hand.splice(index, 1)
    game.discard.push(card)

    if (card.color === 'wild') {
        if (!UNO_COLORS.includes(chosenColor)) {
            return res.status(400).json({ error: 'Couleur requise pour cette carte' })
        }
        game.currentColor = chosenColor
    } else {
        game.currentColor = card.color
    }

    if (hand.length === 0) {
        game.status = 'ended'
        game.winner = playerName
        room.status = 'finished'
        return res.json(serializeGameForPlayer(room, playerName))
    }

    if (hand.length === 1 && game.unoCalledBy !== playerName) {
        const p1 = drawCard(room)
        const p2 = drawCard(room)
        if (p1) hand.push(p1)
        if (p2) hand.push(p2)
    }

    let steps = 1
    if (card.value === 'reverse') {
        game.direction *= -1
        if (game.playersOrder.length === 2) steps = 2
    }
    if (card.value === 'skip') steps = 2
    if (card.value === '+2' || card.value === '+4') {
        const penalty = card.value === '+2' ? 2 : 4
        const targetIndex = (game.currentPlayerIndex + game.direction + game.playersOrder.length * 10) % game.playersOrder.length
        const targetName = game.playersOrder[targetIndex]
        for (let i = 0; i < penalty; i++) {
            const drawn = drawCard(room)
            if (drawn) game.hands[targetName].push(drawn)
        }
        steps = 2
    }

    advanceTurn(game, steps)
    game.unoCalledBy = null
    res.json(serializeGameForPlayer(room, playerName))
})

// Routes protégées
app.get('/lobby', requireAuth, (req, res) => res.sendFile(path.join(rootDir, 'Template/lobby.html')))
app.get('/game', requireAuth, (req, res) => res.sendFile(path.join(rootDir, 'Template/game.html')))
