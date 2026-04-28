const IMAGE_VALUES_BY_COLOR = {
  red: new Set(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "skip", "reverse", "+2"]),
  blue: new Set(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "skip", "reverse", "+2"]),
  green: new Set(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "skip", "reverse", "+2"]),
  yellow: new Set(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "skip", "reverse", "+2"]),
  wild: new Set(["wild", "+4"])
}

function Card(color, value) {
  this.color = color
  this.value = value

  const availableValues = IMAGE_VALUES_BY_COLOR[color]
  const hasDedicatedImage = availableValues ? availableValues.has(String(value)) : false

  // Only expose a skin path when we know the image exists.
  this.skin = hasDedicatedImage ? `/static/Images/UNO_${color}/${value}_${color}.png` : null
  this.skin_back = "/static/Images/UNO_Other/Verso_Other.png"
}

module.exports = Card