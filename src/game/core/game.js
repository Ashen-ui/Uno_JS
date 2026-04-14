const {WILD_CARDS, CARD_COLORS, DIRECTIONS, GAME_STATUS ,ADDRULES} = require('./types')
const Deck = require('./deck')
const Player = require('./player')
const prompt = require("prompt-sync")();

function Game(playerInfos) {
    this.players = []
    this.currentPlayerIndex = 0
    this.direction = DIRECTIONS.CLOCKWISE
    this.status = GAME_STATUS.WAITING
    this.deck = new Deck()
    this.discardPile = []
    this.mutations = {
        "0&7" : false, 
        "Exodia" : false, 
        "Cible" : false,
        "Everyone_draw" : false,
        "Extreme" : false,
        "Roulette" : false,//pioche jusqu'a ce que tu trouve une carte de la couleur choisie
        "Stacking" : false// pose tt les carte de la meme couleur
    }
  
    this.ncard = 7
    this.lastcard = null
    this.Round = 0
    this.stackCount = 0
    this.level = 0
  

    this.initGame = function() {
        // cree et melanger le deck
        this.deck.initDeck(this.mutations)
        this.deck.shuffle()

        // cree les joueurs
        playerInfos.forEach(info => {
            const player = new Player(info.pseudo, info.id)
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
    }

    this.reset = function() {
        this.players = []
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

    this.getNextPlayerIndex = function() {
        let nextIndex = this.currentPlayerIndex + this.direction
        if (nextIndex < 0) return this.players.length - 1
        if (nextIndex >= this.players.length) return 0
        return nextIndex
    }
    
    this.getNextPlayer = function() {
        return this.players[this.getNextPlayerIndex()]
    }

    this.nextPlayer = function() {
        return this.currentPlayerIndex = this.getNextPlayerIndex()
    }

    this.isPlayable = function(card, count = 0) {
        if (count > 0) {
            if (this.lastcard.value === "+2") {
                return true
            }else if (this.lastcard.value === "+4") {
                return true
            }
        }else {
            return card.color === this.lastcard.color || card.value === this.lastcard.value || WILD_CARDS.includes(card.color) 
        }
        return false
    }

    this.applyCardEffect = function(player, card) {
        switch (card.color) {
            case "wild":
                card.color = this.chooseColor()
                break
        }

        if (card.value == "7+" || card.value == "0+") {
            target = this.chooseTargetPlayer(player.id)
        }
        if (card.value == "+2" || card.value == "+4") {
            if (this.deck.cards.length == 0) {
                this.reDeck()
            }
        }

        switch (card.value) {
            case "+2":
                this.stackCount += 2
                break
            case "+4":
                this.stackCount += 4
                break
            case "skip":
                this.nextPlayer()
                break
            case "reverse":
                this.direction *= -1
                break
            case "0+":
                const hands = this.players.map(p => p.hand)
                for (let i = 0; i < this.players.length; i++) {
                    const nextIndex = (i + this.direction + this.players.length) % this.players.length
                    this.players[nextIndex].hand = hands[i]
                }
                break
            case "7+":
                const temp = target.hand
                target.hand = player.hand
                player.hand = temp
                break
            //la règle de cette carte est de faire gagner le joueur s'il possède 4 cartes exodia avec la valeur exodia_part de plus la carte sert de +4 si elle est utilisé seule et choisis une couleur pour la partie.
            case "Exodia_part":
                if (player.hand.filter(card => card.value === "Exodia_part").length == 4) {
                    console.log(`${player.pseudo} a gagné la partie avec la carte Exodia.`)
                    this.status = GAME_STATUS.ENDED
                    return
                }
                else if (player.hand.filter(card => card.value === "Exodia_part").length == 1) {
                    console.log(`${player.pseudo} a utilisé la carte Exodia comme +4 et choisis la couleur ${this.chooseColor()}.`)
                    this.stackCount += 4
                    card.color = this.chooseColor()
                    return
                }
                break
            case "C+2":
                target = this.chooseTargetPlayer(player.id)
                target.stackCount += 2
                break
            case "C+4":
                target = this.chooseTargetPlayer(player.id)
                target.stackCount += 4
                break
        }
        this.nextPlayer()
    }

    this.playCard = function(player, playedCard) {
        
        this.discardPile.push(playedCard)
        this.lastcard = playedCard
        this.applyCardEffect(player, playedCard)
        return 
    }

    this.chooseColor = function() {
        // Web version: color selection will be handled by client UI
        // Return first available color by default if needed
        return CARD_COLORS[0];
    }

    this.chooseTargetPlayer = function(playerId) {
        // Web version: target selection will be handled by client UI
        // Return first other player by default if needed
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].id !== playerId) {
                return this.players[i];
            }
        }
        return null;
    }

    this.chooseCardToPlay = function(player) {
        // Web version: card selection will be handled by client UI
        // This function is kept for interface compatibility but should not be called in web version
        // The client will send API requests to play cards instead
        return;
    }

    this.reDeck = function() {
        this.deck.cards = this.discardPile
        this.deck.shuffle()
        this.discardPile = []
        console.log("la défause a étai mélanger et est redevenu la pioche")
    }
    
    // Commented out: displayCard is not used in web version
    // Cards are rendered via HTML/CSS on the client side
    /*
    function displayCard(color, value, faceUp) {
        const imageUrl = `/static/Images/UNO_${color}/${value}_${color}.png`;
        const image_back = "/static/Images/UNO_Other/Verso_Other.png";

        const img = document.createElement("img");

        img.src = faceUp ? imageUrl : image_back;
        
        img.style.width = "150px";
        img.style.margin = "5px";
        img.style.objectFit = "contain";

        document.getElementById("cards").appendChild(img);
    }
    */

    this.SelectMutations = function() {
        // Web version: mutations are already selected when lobby is created
        // This function is kept for compatibility but does nothing
        // Mutations are applied in server.js before game initialization
        return;
    }
}

module.exports = Game   