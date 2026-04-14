const fs = require('fs');
const path = require('path');
const Game = require("./game")
const ADDRULES = require("./types").ADDRULES

function Lobby(name, maxPlayers, players = [], password = null, mutations = [], creatorId = null) {
    this.name = name
    this.maxPlayers = maxPlayers
    this.password = password
    this.players = players
    this.mutations = Array.isArray(mutations) ? mutations : []
    this.game = null
    this.status = "waiting"
    this.createdAt = new Date().toISOString()
    this.creatorId = creatorId
}

function Lobby_manager() {
    this.lobbies = []
    this.dataFile = path.join(__dirname, '../../../src/Databozi/lobby.json')

    this.ensureDataDirectory = function() {
        const dataDir = path.dirname(this.dataFile)
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true })
        }
    }

    this.loadLobbies = function() {
        try {
            this.ensureDataDirectory()
            if (fs.existsSync(this.dataFile)) {
                const data = fs.readFileSync(this.dataFile, 'utf8')
                const lobbiesData = JSON.parse(data)
                this.lobbies = lobbiesData.map(lobbyData => {
                    const lobby = new Lobby(
                        lobbyData.name,
                        lobbyData.maxPlayers,
                        lobbyData.players || [],
                        lobbyData.password,
                        lobbyData.mutations || [],
                        lobbyData.creatorId
                    )
                    lobby.status = lobbyData.status || "waiting"
                    lobby.createdAt = lobbyData.createdAt
                    return lobby
                })
                console.log(`Loaded ${this.lobbies.length} lobbies from storage`)
            }
        } catch (error) {
            console.error('Error loading lobbies:', error)
            this.lobbies = []
        }
    }

    this.saveLobbies = function() {
        try {
            this.ensureDataDirectory()
            const lobbiesData = this.lobbies.map(lobby => ({
                name: lobby.name,
                maxPlayers: lobby.maxPlayers,
                players: lobby.players,
                password: lobby.password,
                mutations: lobby.mutations,
                status: lobby.status,
                createdAt: lobby.createdAt,
                creatorId: lobby.creatorId
            }))
            fs.writeFileSync(this.dataFile, JSON.stringify(lobbiesData, null, 2))
            console.log(`Saved ${this.lobbies.length} lobbies to storage`)
        } catch (error) {
            console.error('Error saving lobbies:', error)
        }
    }

    this.createLobby = function(name, maxPlayers , password = null, mutations = [], creatorId = null) {
        const lobby = new Lobby(name, maxPlayers, [], password, mutations, creatorId)
        this.lobbies.push(lobby)
        this.saveLobbies() // Save after creating
        return lobby
    }

    this.getLobby = function(name) {
        return this.lobbies.find(lobby => lobby.name === name)
    }

    this.removeLobby = function(name) {
        this.lobbies = this.lobbies.filter(lobby => lobby.name !== name)
        this.saveLobbies() // Save after removing
    }

    this.removeLobbyByCreator = function(name, creatorId) {
        const lobby = this.getLobby(name)
        if (!lobby) {
            return { success: false, message: "Salle introuvable" }
        }
        if (lobby.creatorId !== creatorId) {
            return { success: false, message: "Vous n'êtes pas le créateur de cette salle" }
        }
        if (lobby.players.length > 0) {
            return { success: false, message: "Impossible de supprimer une salle avec des joueurs" }
        }
        this.removeLobby(name)
        return { success: true, message: "Salle supprimée avec succès" }
    }

    this.listLobbies = function() {
        return this.lobbies.map(lobby => ({
            name: lobby.name,
            playerCount: lobby.players.length,
            maxPlayers: lobby.maxPlayers,
            passwordProtected: !!lobby.password,
            mutations: lobby.mutations,
            creatorId: lobby.creatorId
        }))
    }

    this.joinLobby = function(name, player, password = null) {
        const lobby = this.getLobby(name)
        if (!lobby) {
            return { success: false, message: "Lobby not found" }
        }
        if (lobby.password && lobby.password !== password) {
            return { success: false, message: "Incorrect password" }
        }
        if (lobby.players.length >= lobby.maxPlayers) {
            return { success: false, message: "Lobby is full" }
        }
        lobby.players.push(player)
        this.saveLobbies() // Save after joining
        return { success: true, message: "Joined lobby successfully" }
    }

    this.leaveLobby = function(name, player) {
        const lobby = this.getLobby(name)
        if (lobby) {
            lobby.players = lobby.players.filter(p => p.id !== player.id)
            if (lobby.players.length === 0) {
                this.removeLobby(name)
            } else {
                this.saveLobbies() // Save after leaving
            }
        }
        return { success: true, message: "Left lobby successfully" }
    }

    this.startGame = function(lobbyName) {
        const lobby = this.getLobby(lobbyName)
        if (!lobby) {
            console.log("Lobby not found")
            return
        }
        if (lobby.players.length < 2) {
            console.log("Not enough players to start the game.")
            return
        }

        const playerInfos = lobby.players.map(player => ({ pseudo: player.pseudo || player.name || 'Player', id: player.id }))
        const game = new Game(playerInfos)

        if (Array.isArray(lobby.mutations) && lobby.mutations.length > 0) {
            lobby.mutations.forEach(mutation => {
                if (Object.prototype.hasOwnProperty.call(game.mutations, mutation)) {
                    game.mutations[mutation] = true
                }
            })
        } else {
            game.SelectMutations()
        }

        game.initGame()
        game.status = "playing"
        while (game.status === "playing") {
            game.Round++
            const currentPlayer = game.getCurrentPlayer()
            console.log(`===== Tour ${game.Round} Joueur : ${currentPlayer.pseudo} =====`)
            console.log(`La derniere carte jouer est : ${game.lastcard.color} ${game.lastcard.value}`)
            console.log(`Le prochain joueur est : ${game.getNextPlayer().pseudo} `)
            game.chooseCardToPlay(currentPlayer)
        }
    }

    // Don't load lobbies from file on startup - start with empty lobbies each time
    // this.loadLobbies()
}

module.exports = {Lobby, Lobby_manager}
