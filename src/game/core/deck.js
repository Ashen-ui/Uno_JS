const { CARD_COLORS, NUMBER_CARDS, SPECIAL_CARDS, WILD_CARDS } = require("./types")

function Deck(cards,bonusCards) {
    this.cards = cards || []
    this.bonusCards = bonusCards || []


    this.initDeck = function() {
        for (const color of CARD_COLORS) {
            for (const value of NUMBER_CARDS) {
                this.addCard(color, value)
                if (value !== 0) this.addCard(color, value) 
            }
            for (const value of SPECIAL_CARDS) {
                this.addCard(color, value)
                this.addCard(color, value) 
            }
            for (const value of WILD_CARDS) {
                this.addCard("wild", value) 
            }
        }
        this.shuffle()
    }

    this.addCard = function(color, value) {
        this.cards.push({ color, value })
    }

    this.draw = function() {
        return this.cards.pop()
    }   

    this.shuffle = function() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1))
            let temp = this.cards[i]
            this.cards[i] = this.cards[j]
            this.cards[j] = temp
        }
    }

    this.getDeck = function() {
        return { cards: this.cards, bonusCards: this.bonusCards }
    }
}
module.exports = Deck