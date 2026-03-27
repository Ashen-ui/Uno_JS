function Game(playerInfos, options) {
    this.players = []
    this.currentPlayerIndex = 0
    this.direction = DIRECTIONS.CLOCKWISE
    this.status = GAME_STATUS.WAITING
    this.deck = new Deck()
    this.discardPile = []
    this.options = options || {}
    this.ncard = 7
    this.lastcard = null

    this.initGame = function() {
        // cree et melanger le deck
        this.deck.initDeck()
        this.deck.shuffle()

        // cree les joueurs
        playerInfos.forEach(info => {
            const player = new Player(info.pseudo, info.id, this.deck)
            this.players.push(player)
        })

        // distribue les mains
        this.players.forEach(player => {
            for (let i = 0; i < this.ncard; i++) {
                player.draw(this.deck)
            }
        })

        // mettre la première carte dans la pile de defausse
        this.lastcard = this.deck.draw()
        while (WILD_CARDS.includes(this.lastcard.value)) {
            this.lastcard = this.deck.draw()
        }
        this.discardPile.push(this.lastcard)
        this.status = GAME_STATUS.PLAYING
    }

    this.reset = function() {
        this.players.forEach(player => player.hand = [])
        this.deck = new Deck()
        this.discardPile = []
        this.currentPlayerIndex = 0
        this.direction = DIRECTIONS.CLOCKWISE
        this.lastcard = null
        this.status = GAME_STATUS.WAITING
        this.initGame()
    }

    this.getCurrentPlayer = function() {
        return this.players[this.currentPlayerIndex]
    }

    this.nextPlayer = function() {
        const playerCount = this.players.length
        this.currentPlayerIndex = (this.currentPlayerIndex + this.direction + playerCount) % playerCount
    }

        
    this.isPlayable = function(card) {
        return card.color === this.lastcard.color ||
            card.value === this.lastcard.value ||
            WILD_CARDS.includes(card.value)
    }

    
    this.applyCardEffect = function(player, card, chosenColor = null, targetPlayerId = null) {
        switch (card.value) {
            case "+2":
                this.nextPlayer()
                this.getCurrentPlayer().draw(this.deck)
                this.getCurrentPlayer().draw(this.deck)
                break
            case "+4":
                this.nextPlayer()
                for (let i = 0; i < 4; i++) this.getCurrentPlayer().draw(this.deck)
                if (chosenColor) card.color = chosenColor
                break
            case "skip":
                this.nextPlayer()
                break
            case "reverse":
                this.direction *= -1
                break
            case 0:
                const hands = this.players.map(p => p.hand)
                for (let i = 0; i < this.players.length; i++) {
                    const nextIndex = (i + this.direction + this.players.length) % this.players.length
                    this.players[nextIndex].hand = hands[i]
                }
                break
            case 7:
                if (targetPlayerId) {
                    const target = this.players.find(p => p.id === targetPlayerId)
                    if (target) {
                        const temp = target.hand
                        target.hand = player.hand
                        player.hand = temp
                    }
                }
                break
            case "wild":
                if (chosenColor) card.color = chosenColor
                break
        }
    }

    this.playCard = function(playerId, card, chosenColor = null, targetPlayerId = null) {
        const player = this.players.find(p => p.id === playerId)
        if (!player) return false

        const cardIndex = player.hand.findIndex(c => c.color === card.color && c.value === card.value)
        if (cardIndex === -1) return false
        const playedCard = player.hand.splice(cardIndex, 1)[0]

        if (!this.isPlayable(playedCard)) return false

        this.discardPile.push(playedCard)
        this.lastcard = playedCard

        this.applyCardEffect(player, playedCard, chosenColor, targetPlayerId)

        this.nextPlayer()
        return true
    }
}