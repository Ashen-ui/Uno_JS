const { CARD_COLORS, NUMBER_CARDS, SPECIAL_CARDS, WILD_CARDS , ADDRULES} = require("./types")

function Deck(cards = [],bonusCards = [],Mutations = {}) {
    this.cards = cards 
    this.bonusCards = bonusCards
    this.mutations = Mutations

    this.initDeck = function(mutations) {
        this.mutations = mutations
        const ActiveMutation = Object.keys(ADDRULES).filter(mutation => this.mutations[mutation])
        for (const mutation of ActiveMutation) {
            for (const type in ADDRULES[mutation]) {
                if (type === "Colors") {
                    for (const color of CARD_COLORS) {
                        ADDRULES[mutation][type].forEach((val) => {
                            for (let i = 0; i < 4; i++) {
                                this.addCard(color, val)
                            }
                        })
                    }
                }else if (type === "Wild") {
                    ADDRULES[mutation][type].forEach((val) => {
                        for (let i = 0; i < 4; i++) {
                            this.addCard("wild", val)
                        }
                    })
                }
            }
        }
        for (const color of CARD_COLORS) {
            for (const value of NUMBER_CARDS) {
                if (this.mutations["0&7"] && (value === "0" || value === "7")) {
                    continue
                } else {
                    this.addCard(color, value)
                    if (value !== 0) this.addCard(color, value)
                }
            }
            for (const value of SPECIAL_CARDS) {
                this.addCard(color, value)
                this.addCard(color, value) 
            }
            for (const value of WILD_CARDS) {
                for (let i = 0; i < 4; i++) {this.addCard("wild", value)}
            }
        }
        this.shuffle()
    }

    this.addCard = function(color, value) {
        this.cards.push({ color, value , skin: `../../../static/Images/UNO_${color}/${value} ${color}.png` , skin_back: "../../../static/Images/UNO_Other/Verso_Other.png"   })
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