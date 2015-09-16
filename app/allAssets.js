function bootScripts() {
  return require('./bootScripts');
}

function allStyles() {
  return require('./styles');
}

function extraAssets() {
  return require('./extraAssets');
}
          
function allViews() {
  return require('./views');
}

function angularModules() {
  return require('./angular-modules');
}

function allScripts() {
  require('./scripts');
}

module.exports = []
.concat(bootScripts())
.concat(allScripts())
.concat(allStyles())
.concat(allViews())
.concat(extraAssets());

