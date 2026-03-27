const Game = require('./core/game')  
//test
const playerInfos = [
    { pseudo: "Alice", id: 1 },
    { pseudo: "Bob", id: 2 },
    { pseudo: "Charlie", id: 3 }
]


const game = new Game(playerInfos)
game.initGame()

console.log("=== Début de la partie UNO ===")
console.log("Joueurs :", game.players.map(p => p.pseudo))
console.log("Carte de départ :", game.lastcard)
game.players.forEach(p => {
    console.log(`${p.pseudo} a dans sa main :`, p.hand)
})

// Simuler un tour 
const currentPlayer = game.getCurrentPlayer()
const firstCard = currentPlayer.hand[0]
console.log(`\n${currentPlayer.pseudo} joue :`, firstCard)

const success = game.playCard(currentPlayer.id, firstCard)
if (success) {
    console.log("Carte jouée avec succès !")
} else {
    console.log("Carte non jouable.")
}

console.log("Carte sur la défausse :", game.lastcard)
console.log("Main des joueurs après le tour :")
game.players.forEach(p => console.log(`${p.pseudo} :`, p.hand))