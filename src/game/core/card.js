function Card(color, value) {
  this.color = color
  this.value = value
  this.skin = `../../../static/Images/UNO_${color}/${value}_${color}.png`
  
}

module.exports = Card