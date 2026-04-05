const { NUMBER_CARDS, SPECIAL_CARDS, WILD_CARDS, CARD_COLORS, DIRECTIONS, GAME_STATUS } = require('./types')
const Deck = require('./deck')
const Player = require('./player')
const prompt = require("prompt-sync")();

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
    this.Round = 0

    this.initGame = function() {
        // cree et melanger le deck
        this.deck.initDeck()
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

    this.isPlayable = function(card) {
        return card.color === this.lastcard.color ||
            card.value === this.lastcard.value ||
            WILD_CARDS.includes(card.color) 
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
                for (let i = 0; i < 2; i++) this.getNextPlayer().draw(this.deck)
                this.nextPlayer()
                break
            case "+4":
                for (let i = 0; i < 4; i++) this.getNextPlayer().draw(this.deck)
                this.nextPlayer()
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
        while (true) {
            console.log("\nCouleur :")
            CARD_COLORS.forEach(function(color, index) {console.log(`${index + 1}. ${color}`)})
            const color = prompt("Choisissez une couleur : 1-4 : ")
            if (color < 1 || color > 4) {
                console.log("Choix invalide.")
            }else {
                return CARD_COLORS[parseInt(color) - 1]
            }
        }
    }

    this.chooseTargetPlayer = function(playerId) {
        while (true) {
            console.log("\nJoueurs :")
            this.players.forEach(function(player, index) {console.log(`${index + 1}. ${player.pseudo}`)})
            const targetIndex = parseInt(prompt("Choisissez un joueur : ")) - 1
            if (targetIndex < 0 || targetIndex >= this.players.length) {
                console.log("Choix invalide.")
            } else if (targetIndex == playerId) {
                console.log("Vous ne pouvez pas choisir vous-même.")
            } else {
                return this.players[targetIndex]
            }
        }
    }

    this.chooseCardToPlay = function(player) {
        console.log("\nMain :")
        player.hand.forEach(function(card, index) {console.log(`${index + 1}. ${card.color} ${card.value}`)})
        while (true) {
            let cardIndex = prompt("Choisissez une carte (d pour piocher): ")
            if (cardIndex == "") {
                console.log("Vous n'avez pas choisi de carte.")
            }else if (cardIndex == "d" || cardIndex == "D"  || (cardIndex >= 0 && cardIndex <= player.hand.length)) {
                if (cardIndex == "d") {
                    console.log("\nVous avez choisi de piocher.")
                    if (this.deck.cards.length == 0) {
                        this.reDeck()
                    }
                    player.draw(this.deck)
                    this.nextPlayer()
                    return 
                }
                cardIndex = parseInt(cardIndex) - 1
                if (cardIndex < 0 || cardIndex > player.hand.length) {
                    console.log("Choix invalide.")
                }else {
                    if (!this.isPlayable(player.hand[cardIndex])) {
                        console.log("Carte non jouable.")
                    }else {
                        this.playCard(player, player.hand[cardIndex])
                        player.hand.splice(cardIndex, 1)
                        return
                    }
                }
            }else {
                console.log("Character invalide")
            }
        }
    }

    this.reDeck = function() {
        this.deck.cards = this.discardPile
        this.deck.shuffle()
        this.discardPile = []
        console.log("la défause a étai mélanger et est redevenu la pioche")
    }
// test de l'affichage d'une carte
    function displayCard(color, value, faceUp) {
        const imageUrl = `/static/Images/UNO_${color}/${value}_${color}.png`;
        const image_back = "/static/Images/UNO_Other/Verso_Other.png";

        const img = document.createElement("img");

        img.src = faceUp ? imageUrl : image_back;
        
        img.style.width = "150px";
        img.style.margin = "5px";
        img.style.objectFit = "contain";

        document.getElementById("cards").appendChild(img);

        // TEST : affiche quelques cartes
        displayCard("red", "5", true);
        displayCard("yellow", "reverse", false);
        displayCard("blue", "+2", true);
        displayCard("green", "0", false);
        displayCard("wild", "wild", true);
        displayCard("Other", "Verso", false);
    }
}

module.exports = Game   