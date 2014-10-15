module.exports = function () {
  var fs = require('fs'), path = require('path');
  var nouns = fs.readFileSync(path.join(__dirname, 'nouns.txt')).toString().split("\n"),
      adjectives = fs.readFileSync(path.join(__dirname, 'adjectives.txt')).toString().split("\n");

  var randomInt = function (max) {
    return Math.floor((Math.random() * max)); 
  }

  var adjective = adjectives[randomInt(adjectives.length)],
      noun = nouns[randomInt(nouns.length)];
      
  return adjective + '-' + noun;
}
