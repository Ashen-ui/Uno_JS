function Card(color, value) {
  this.color = color
  this.value = value
  this.skin = `../../../static/Images/UNO_${color}/${value}_${color}.png`
  
}
// card a ADD :
// cible +2
// cible +4
// tt le monde pioche 2 cartes
// 
Cards = {
    "red 0": new Card("red", 0, "red_0.png"),
    "red 1": new Card("red", 1, "red_1.png"),
    "red 2": new Card("red", 2, "red_2.png"),
    "red 3": new Card("red", 3, "red_3.png"),
    "red 4": new Card("red", 4, "red_4.png"),
    "red 5": new Card("red", 5, "red_5.png"),
    "red 6": new Card("red", 6, "red_6.png"),
    "red 7": new Card("red", 7, "red_7.png"),
    "red 8": new Card("red", 8, "red_8.png"),
    "red 9": new Card("red", 9, "red_9.png"),
    "red skip": new Card("red", "skip", "red_skip.png"),
    "red reverse": new Card("red", "reverse", "red_reverse.png"),
    "red +2": new Card("red", "+2", "red_plus2.png"),
    "blue 0": new Card("blue", 0, "blue_0.png"),
    "blue 1": new Card("blue", 1, "blue_1.png"),
    "blue 2": new Card("blue", 2, "blue_2.png"),
    "blue 3": new Card("blue", 3, "blue_3.png"),
    "blue 4": new Card("blue", 4, "blue_4.png"),
    "blue 5": new Card("blue", 5, "blue_5.png"),
    "blue 6": new Card("blue", 6, "blue_6.png"),
    "blue 7": new Card("blue", 7, "blue_7.png"),
    "blue 8": new Card("blue", 8, "blue_8.png"),
    "blue 9": new Card("blue", 9, "blue_9.png"),
    "blue skip": new Card("blue", "skip", "blue_skip.png"),
    "blue reverse": new Card("blue", "reverse", "blue_reverse.png"),
    "blue +2": new Card("blue", "+2", "blue_plus2.png"),
    "green 0": new Card("green", 0, "green_0.png"),
    "green 1": new Card("green", 1, "green_1.png"),
    "green 2": new Card("green", 2, "green_2.png"),
    "green 3": new Card("green", 3, "green_3.png"),
    "green 4": new Card("green", 4, "green_4.png"),
    "green 5": new Card("green", 5, "green_5.png"),
    "green 6": new Card("green", 6, "green_6.png"),
    "green 7": new Card("green", 7, "green_7.png"),
    "green 8": new Card("green", 8, "green_8.png"),
    "green 9": new Card("green", 9, "green_9.png"),
    "green skip": new Card("green", "skip", "green_skip.png"),
    "green reverse": new Card("green", "reverse", "green_reverse.png"),
    "green +2": new Card("green", "+2", "green_plus2.png"),
    "yellow 0": new Card("yellow", 0, "yellow_0.png"),
    "yellow 1": new Card("yellow", 1, "yellow_1.png"),
    "yellow 2": new Card("yellow", 2, "yellow_2.png"),
    "yellow 3": new Card("yellow", 3, "yellow_3.png"),
    "yellow 4": new Card("yellow", 4, "yellow_4.png"),
    "yellow 5": new Card("yellow", 5, "yellow_5.png"),
    "yellow 6": new Card("yellow", 6, "yellow_6.png"),
    "yellow 7": new Card("yellow", 7, "yellow_7.png"),
    "yellow 8": new Card("yellow", 8, "yellow_8.png"),
    "yellow 9": new Card("yellow", 9, "yellow_9.png"),
    "yellow skip": new Card("yellow", "skip", "yellow_skip.png"),
    "yellow reverse": new Card("yellow", "reverse", "yellow_reverse.png"),
    "yellow +2": new Card("yellow", "+2", "yellow_plus2.png"),
    "wild": new Card("wild", "wild", "wild.png"),
    "+4": new Card("wild", "+4", "wild_plus4.png")
}

module.exports = Card