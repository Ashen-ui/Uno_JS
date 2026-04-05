const Game = require("./game")

function Lobby(name, maxPlayers, players = [], password = null) {
    this.name = name
    this.maxPlayers = maxPlayers
    this.password = password
    this.players = players
    this.game = null
    this.status = "waiting"
}

function Lobby_manager() {
    this.lobbies = []

    this.createLobby = function(name, maxPlayers , password = null) {
        const lobby = new Lobby(name, maxPlayers, [], password)
        this.lobbies.push(lobby)
        return lobby
    }

    this.getLobby = function(name) {
        return this.lobbies.find(lobby => lobby.name === name)
    }

    this.removeLobby = function(name) {
        this.lobbies = this.lobbies.filter(lobby => lobby.name !== name)
    }

    this.listLobbies = function() {
        return this.lobbies.map(lobby => ({ name: lobby.name, playerCount: lobby.players.length, maxPlayers: lobby.maxPlayers }))
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
        return { success: true, message: "Joined lobby successfully" }
    }

    this.leaveLobby = function(name, player) {
        const lobby = this.getLobby(name)
        if (lobby) {
            lobby.players = lobby.players.filter(p => p.id !== player.id)
            if (lobby.players.length === 0) {
                this.removeLobby(name)
            }
        }
        return { success: true, message: "Left lobby successfully" }
    }

    this.startGame = function(playerInfos) {
        const game = new Game(playerInfos)
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
}

module.exports = {Lobby, Lobby_manager}
