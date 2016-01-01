/* eslint-disable semi */

var fs = require('fs');
var path = require('path');
var nouns = fs.readFileSync(path.join(__dirname, 'nouns.txt')).toString().split('\n');
var adjectives = fs.readFileSync(path.join(__dirname, 'adjectives.txt')).toString().split('\n');

module.exports = function () {
  var randomInt = function (max) {
    return Math.floor((Math.random() * max));
  }

  var adjective = adjectives[randomInt(adjectives.length)];
  var noun = nouns[randomInt(nouns.length)];

  return adjective + '-' + noun;
};
