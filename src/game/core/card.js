function Card(color, value) {
  this.color = color
  this.value = value
  // Use absolute web paths that work from browser
  this.skin = `/static/Images/UNO_${color}/${value}_${color}.png`
  this.skin_back = `/static/Images/UNO_Other/Verso_Other.png`
}

module.exports = Card