//Complete code
console.log('Server file loaded');
const express = require('express');
const path = require('path');
const { Lobby_manager } = require('../game/core/lobby');
const Game = require('../game/core/game');
const { ADDRULES } = require('../game/core/types');
const { registerUser, loginUser, getUserById } = require('../Databozi/users');
const app = express();
const PORT = 3000;
let lobbyManager;
try {
    lobbyManager = new Lobby_manager();
    console.log('Lobby manager initialized successfully');
} catch (error) {
    console.error('Error initializing lobby manager:', error);
    process.exit(1);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// Logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// ===== AUTHENTICATION ROUTES =====

// Register
app.post('/api/register', (req, res) => {
    const { username, email, password, passwordConfirm } = req.body;

    if (!username || !email || !password || !passwordConfirm) {
        return res.status(400).json({ success: false, message: 'Tous les champs sont requis.' });
    }

    if (password !== passwordConfirm) {
        return res.status(400).json({ success: false, message: 'Les mots de passe ne correspondent pas.' });
    }

    if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Le mot de passe doit contenir au moins 6 caractères.' });
    }

    const result = registerUser(username, email, password);
    
    if (result.success) {
        return res.json({ success: true, message: 'Compte créé avec succès. Veuillez vous connecter.' });
    } else {
        return res.status(409).json(result);
    }
});

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Nom d\'utilisateur et mot de passe requis.' });
    }

    const result = loginUser(username, password);

    if (result.success) {
        return res.json(result);
    } else {
        return res.status(401).json(result);
    }
});

// Get user info
app.get('/api/users/:userId', (req, res) => {
    const { userId } = req.params;
    const user = getUserById(userId);

    if (user) {
        return res.json({ success: true, user });
    } else {
        return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
    }
});

app.delete('/api/test', (req, res) => {
    console.log('DELETE test route called at', new Date().toISOString());
    res.json({ success: true, message: 'DELETE works' });
});

// API routes
app.get('/api/mutations', (req, res) => {
    res.json(ADDRULES);
});

app.get('/api/lobbies', (req, res) => {
    res.json(lobbyManager.listLobbies());
});

app.post('/api/lobbies', (req, res) => {
    const { name, maxPlayers, password, mutations, creatorId } = req.body;
    const lobbyName = name?.trim();
    const max = Number(maxPlayers);
    const selectedMutations = Array.isArray(mutations) ? mutations : [];

    if (!lobbyName || Number.isNaN(max)) {
        return res.status(400).json({ success: false, message: 'Nom de salle et nombre de joueurs requis.' });
    }
    if (max < 2 || max > 8) {
        return res.status(400).json({ success: false, message: 'Le nombre de joueurs doit être entre 2 et 8.' });
    }
    if (lobbyManager.getLobby(lobbyName)) {
        return res.status(409).json({ success: false, message: 'Une salle existe déjà avec ce nom.' });
    }
    const validMutations = selectedMutations.filter(m => Object.prototype.hasOwnProperty.call(ADDRULES, m));

    const lobby = lobbyManager.createLobby(lobbyName, max, password?.trim() || null, validMutations, creatorId);
    
    // Auto-add creator to the lobby
    if (creatorId) {
        const creator = getUserById(creatorId);
        const creatorName = creator ? creator.username : 'Créateur';
        const creatorPlayer = { id: creatorId, pseudo: creatorName };
        lobby.players.push(creatorPlayer);
    }
    
    return res.json({ success: true, lobby: { name: lobby.name, playerCount: lobby.players.length, maxPlayers: lobby.maxPlayers, passwordProtected: !!lobby.password, mutations: lobby.mutations, creatorId: lobby.creatorId } });
});

app.get('/api/lobbies/:name', (req, res) => {
    const { name } = req.params;
    const lobby = lobbyManager.getLobby(name);
    
    if (!lobby) {
        return res.status(404).json({ success: false, message: 'Salle non trouvée' });
    }
    
    return res.json({ 
        success: true, 
        lobby: { 
            name: lobby.name, 
            playerCount: lobby.players.length, 
            maxPlayers: lobby.maxPlayers, 
            passwordProtected: !!lobby.password, 
            mutations: lobby.mutations, 
            creatorId: lobby.creatorId,
            players: lobby.players,
            status: lobby.status,
            createdAt: lobby.createdAt
        } 
    });
});

app.post('/api/lobbies/:name/join', (req, res) => {
    const { name } = req.params;
    const { playerId, playerName, password } = req.body;

    if (!playerId || !playerName) {
        return res.status(400).json({ success: false, message: 'ID et nom du joueur requis.' });
    }

    const lobby = lobbyManager.getLobby(name);
    if (!lobby) {
        return res.status(404).json({ success: false, message: 'Salle non trouvée' });
    }

    // Check if player is already in the lobby
    if (lobby.players.some(p => p.id === playerId)) {
        return res.json({ success: true, message: 'Vous êtes déjà dans cette salle' });
    }

    const player = { id: playerId, pseudo: playerName };
    const result = lobbyManager.joinLobby(name, player, password || null);

    if (result.success) {
        return res.json(result);
    } else {
        return res.status(409).json(result);
    }
});

app.post('/api/lobbies/:name/start', (req, res) => {
    const { name } = req.params;
    const { creatorId } = req.body;

    if (!creatorId) {
        return res.status(400).json({ success: false, message: 'ID du créateur requis.' });
    }

    const lobby = lobbyManager.getLobby(name);
    if (!lobby) {
        return res.status(404).json({ success: false, message: 'Salle non trouvée' });
    }

    if (lobby.creatorId !== creatorId) {
        return res.status(403).json({ success: false, message: 'Vous n\'êtes pas le créateur de cette salle' });
    }

    if (lobby.players.length !== lobby.maxPlayers) {
        return res.status(400).json({ success: false, message: `Il faut exactement ${lobby.maxPlayers} joueurs pour commencer (actuellement ${lobby.players.length})` });
    }

    // Initialize the game
    try {
        const playerInfos = lobby.players.map(player => ({ 
            pseudo: player.pseudo || player.name || 'Player', 
            id: player.id 
        }));
        const game = new Game(playerInfos);

        // Apply mutations
        if (Array.isArray(lobby.mutations) && lobby.mutations.length > 0) {
            lobby.mutations.forEach(mutation => {
                if (Object.prototype.hasOwnProperty.call(game.mutations, mutation)) {
                    game.mutations[mutation] = true;
                }
            });
        } else {
            game.SelectMutations();
        }

        // Initialize the game
        game.initGame();
        game.status = 'playing';

        // Store the game in the lobby
        lobby.game = game;

        // Mark the lobby as playing
        lobby.status = 'playing';
        lobbyManager.saveLobbies();

        return res.json({ 
            success: true, 
            message: 'Partie lancée avec succès', 
            lobby: { 
                name: lobby.name, 
                status: lobby.status,
                game: {
                    status: game.status,
                    currentPlayerIndex: game.currentPlayerIndex,
                    direction: game.direction,
                    Round: game.Round,
                    lastcard: game.lastcard,
                    players: game.players.map(p => ({ pseudo: p.pseudo, id: p.id, hand: p.hand.length }))
                }
            } 
        });
    } catch (error) {
        console.error('Error initializing game:', error);
        return res.status(500).json({ success: false, message: 'Erreur lors de l\'initialisation du jeu' });
    }
});

app.get('/api/lobbies/:name/game', (req, res) => {
    const { name } = req.params;
    const lobby = lobbyManager.getLobby(name);

    if (!lobby) {
        return res.status(404).json({ success: false, message: 'Salle non trouvée' });
    }

    if (!lobby.game) {
        return res.status(400).json({ success: false, message: 'Pas de jeu en cours dans cette salle' });
    }

    const game = lobby.game;
    return res.json({
        success: true,
        game: {
            status: game.status,
            currentPlayerIndex: game.currentPlayerIndex,
            direction: game.direction,
            Round: game.Round,
            lastcard: game.lastcard,
            deck: {
                cardsLeft: game.deck.cards.length
            },
            discardPile: {
                cardsCount: game.discardPile.length
            },
            players: game.players.map(p => ({
                pseudo: p.pseudo,
                id: p.id,
                handSize: p.hand.length,
                hand: p.hand
            })),
            mutations: game.mutations
        }
    });
});

app.delete('/api/lobbies/:name', (req, res) => {
    console.log('DELETE route called for room:', req.params.name, 'with body:', req.body);
    const { name } = req.params;
    const { creatorId } = req.body;

    if (!creatorId) {
        return res.status(400).json({ success: false, message: 'ID du créateur requis.' });
    }

    const result = lobbyManager.removeLobbyByCreator(name, creatorId);
    if (result.success) {
        return res.json(result);
    } else {
        return res.status(403).json(result);
    }
});

// ===== GAME ACTIONS =====

// Play a card
app.post('/api/lobbies/:name/game/play', (req, res) => {
    const { name } = req.params;
    const { playerId, cardIndex } = req.body;

    const lobby = lobbyManager.getLobby(name);
    if (!lobby || !lobby.game) {
        return res.status(404).json({ success: false, message: 'Jeu non trouvé' });
    }

    const game = lobby.game;
    const player = game.players.find(p => p.id === playerId);
    
    if (!player) {
        return res.status(400).json({ success: false, message: 'Joueur non trouvé' });
    }

    if (game.currentPlayerIndex !== game.players.indexOf(player)) {
        return res.status(400).json({ success: false, message: 'Ce n\'est pas ton tour' });
    }

    if (cardIndex < 0 || cardIndex >= player.hand.length) {
        return res.status(400).json({ success: false, message: 'Indice de carte invalide' });
    }

    const card = player.hand[cardIndex];
    
    // Check if card is playable
    if (!game.isPlayable(card)) {
        return res.status(400).json({ success: false, message: 'Cette carte n\'est pas jouable' });
    }

    // Remove card from hand
    player.hand.splice(cardIndex, 1);
    
    // Play the card
    game.playCard(player, card);
    
    // Save the updated lobbies
    lobbyManager.saveLobbies();

    return res.json({ 
        success: true, 
        message: 'Carte jouée avec succès',
        game: {
            status: game.status,
            currentPlayerIndex: game.currentPlayerIndex,
            lastcard: game.lastcard,
            players: game.players.map(p => ({ pseudo: p.pseudo, id: p.id, handSize: p.hand.length }))
        }
    });
});

// Draw a card
app.post('/api/lobbies/:name/game/draw', (req, res) => {
    const { name } = req.params;
    const { playerId } = req.body;

    const lobby = lobbyManager.getLobby(name);
    if (!lobby || !lobby.game) {
        return res.status(404).json({ success: false, message: 'Jeu non trouvé' });
    }

    const game = lobby.game;
    const player = game.players.find(p => p.id === playerId);
    
    if (!player) {
        return res.status(400).json({ success: false, message: 'Joueur non trouvé' });
    }

    if (game.currentPlayerIndex !== game.players.indexOf(player)) {
        return res.status(400).json({ success: false, message: 'Ce n\'est pas ton tour' });
    }

    // Check if deck needs reshuffling
    if (game.deck.cards.length === 0) {
        game.reDeck();
    }

    // Draw a card
    player.draw(game.deck);

    // Next player's turn
    game.nextPlayer();
    
    // Save the updated lobbies
    lobbyManager.saveLobbies();

    return res.json({ 
        success: true, 
        message: 'Carte piochée',
        game: {
            status: game.status,
            currentPlayerIndex: game.currentPlayerIndex,
            lastcard: game.lastcard,
            deck: {
                cardsLeft: game.deck.cards.length
            },
            players: game.players.map(p => ({ pseudo: p.pseudo, id: p.id, handSize: p.hand.length }))
        }
    });
});

// Declare UNO
app.post('/api/lobbies/:name/game/uno', (req, res) => {
    const { name } = req.params;
    const { playerId } = req.body;

    const lobby = lobbyManager.getLobby(name);
    if (!lobby || !lobby.game) {
        return res.status(404).json({ success: false, message: 'Jeu non trouvé' });
    }

    const game = lobby.game;
    const player = game.players.find(p => p.id === playerId);
    
    if (!player) {
        return res.status(400).json({ success: false, message: 'Joueur non trouvé' });
    }

    // Check if player has exactly 1 card
    if (player.hand.length !== 1) {
        return res.status(400).json({ success: false, message: 'Tu dois avoir exactement 1 carte pour déclarer UNO' });
    }

    player.isUno = true;
    lobbyManager.saveLobbies();

    return res.json({ 
        success: true, 
        message: 'UNO déclaré!'
    });
});

// Contra UNO
app.post('/api/lobbies/:name/game/contrauno', (req, res) => {
    const { name } = req.params;
    const { playerId, targetPlayerId } = req.body;

    const lobby = lobbyManager.getLobby(name);
    if (!lobby || !lobby.game) {
        return res.status(404).json({ success: false, message: 'Jeu non trouvé' });
    }

    const game = lobby.game;
    const player = game.players.find(p => p.id === playerId);
    const targetPlayer = game.players.find(p => p.id === targetPlayerId);
    
    if (!player || !targetPlayer) {
        return res.status(400).json({ success: false, message: 'Joueur non trouvé' });
    }

    // Check if target player has UNO declared with 1 card
    if (targetPlayer.isUno && targetPlayer.hand.length === 1) {
        // Target player gets penalty (draw 2 cards)
        for (let i = 0; i < 2; i++) {
            if (game.deck.cards.length === 0) {
                game.reDeck();
            }
            targetPlayer.draw(game.deck);
        }
        targetPlayer.isUno = false;
    }

    lobbyManager.saveLobbies();

    return res.json({ 
        success: true, 
        message: 'Contre UNO appliqué!'
    });
});

app.use('/static', express.static(path.join(__dirname, '../../static')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../Template/index.html'));
});

app.get('/connexion', (req, res) => {
    res.sendFile(path.join(__dirname, '../../Template/connection.html'));
});

app.get('/inscription', (req, res) => {
    res.sendFile(path.join(__dirname, '../../Template/registration.html'));
});

app.get('/lobby', (req, res) => {
    res.sendFile(path.join(__dirname, '../../Template/lobby.html'));
});

app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, '../../Template/game.html'));
});

app.get('/gameWait', (req, res) => {
    res.sendFile(path.join(__dirname, '../../Template/gameWait.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Catch-all route for debuggings
app.use((req, res) => {
    console.log(`Unhandled request: ${req.method} ${req.url}`);
    res.status(404).send('Route not found');
});