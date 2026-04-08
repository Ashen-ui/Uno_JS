

function Player(pseudo, id, hand) {
    this.pseudo = pseudo
    this.id = id
    this.score = 0
    this.hand = hand || []
    this.isUno = false
    this.isReady = false
    this.level = 0


    this.draw = function(deck) {
        const card = deck.draw()
        this.hand.push(card)
        return card
    }
}
module.exports = Player