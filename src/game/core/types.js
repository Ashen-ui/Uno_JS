// Ce Fichier vas nous servire pour stocker les type qui pourons etre utilier pas diferent fichier 
const CARD_COLORS = ["red", "blue", "green", "yellow"]
const NUMBER_CARDS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
const SPECIAL_CARDS = ["skip", "reverse", "+2"]
const WILD_CARDS = ["wild", "+4"]
const DIRECTIONS = {CLOCKWISE: 1,COUNTER_CLOCKWISE: -1}
const GAME_STATUS = {WAITING: "waiting",PLAYING: "playing"}
const ADDRULES = {
    "0&7" : {"Colors" : ["0+", "7+"]}, 
    "Exodia" : {"Wild" : ["Exodia_part"]}, 
    "Cible" : {"Colors" : ["C+2", "C+4"]},
    "Everyone_draw" : {"Colors" : ["E+2", "E+4"]}, 
    "Extreme" : {"Colors" : ["+2", "+4"],"Wild" : ["reverse+4","+6","+10"]}, 
    "Roulette" : {"Wild" : ["roulette"]},//pioche jusqu'a ce que tu trouve une carte de la couleur choisie
    "Stacking" : {"Colors" : ["stack"]}// pose tt les carte de la meme couleur 
  }

module.exports = {
  CARD_COLORS,
  NUMBER_CARDS,
  SPECIAL_CARDS,
  WILD_CARDS,
  DIRECTIONS,
  GAME_STATUS,
  ADDRULES
}