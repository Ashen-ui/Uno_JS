const Game = require('./core/game')  
const prompt = require("prompt-sync")();
//test
const playerInfos = [
    { pseudo: "A", id: 1 },
    { pseudo: "B", id: 2 },
    { pseudo: "C", id: 3 }
]

const game = new Game(playerInfos)
game.initGame()

// -- definition d un tour de jeu
while (game.status === "playing") {
    game.Round++
    const currentPlayer = game.getCurrentPlayer()
    console.log(`===== Tour ${game.Round} Joueur : ${currentPlayer.pseudo} =====`)
    console.log(`La derniere carte jouer est : ${game.lastcard.color} ${game.lastcard.value}`)
    console.log(`Le prochain joueur est : ${game.getNextPlayer().pseudo} `)
    game.chooseCardToPlay(currentPlayer)
}
module.exports = game