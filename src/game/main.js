const Lobby = require("./core/lobby")
//test
const playerInfos = [
    { pseudo: "A", id: 1 },
    { pseudo: "B", id: 2 },
    { pseudo: "C", id: 3 }
]
const playerInfos2 = [
    { pseudo: "Lu", id: 1 },
    { pseudo: "Ciel", id: 2 },
    { pseudo: "AD", id: 3 }
]


const LobbyManager = new Lobby.Lobby_manager()
const lobby1 = LobbyManager.createLobby("TestLobby", 4)
const lobby2 = LobbyManager.createLobby("TestLobbyy", 4)

playerInfos.map((info) => LobbyManager.joinLobby("TestLobby", info))
playerInfos2.map((info) => LobbyManager.joinLobby("TestLobbyy", info))

LobbyManager.startGame(LobbyManager.getLobby(lobby1.name).players)
LobbyManager.startGame(LobbyManager.getLobby(lobby2.name).players)

module.exports = {LobbyManager}