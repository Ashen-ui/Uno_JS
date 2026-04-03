function Card(color, value) {
  this.color = color
  this.value = value

  this.use = function(chosenColor) {
      if (this.value === "wild" || this.value === "+4") {
          this.color = chosenColor
      }
      
      return {
        color: this.color,
        value: this.value
      }
  }
}
module.exports = Card