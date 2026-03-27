function Player(pseudo, id, hand) {
    this.pseudo = pseudo
    this.id = id
    this.hand = hand || []

    this.draw = function(deck) {
        const card = deck.draw()
        this.hand.push(card)
        return card
    }

    this.playCard = function(index, chosenColor) {
        if (index < 0 || index >= this.hand.length) return null
        const card = this.hand.splice(index, 1)[0]
        return card.use ? card.use(chosenColor) : card
    }

    this.showHand = function() {
        return this.hand.map((card) => `${card.color} ${card.value}`)
    }
}