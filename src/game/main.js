const Lobby = require("./core/lobby")
//test
const playerInfos = [
    { pseudo: "A", id: 1 },
    { pseudo: "B", id: 2 },
    { pseudo: "C", id: 3 }
]

const LobbyManager = new Lobby.Lobby_manager()
const lobby1 = LobbyManager.createLobby("TestLobby", 4)

playerInfos.map((info) => LobbyManager.joinLobby("TestLobby", info))

LobbyManager.startGame(LobbyManager.getLobby("TestLobby").players)

module.exports = {LobbyManager}