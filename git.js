var platform = require('git-node-platform');
var memDb = require('git-memdb');
var jsGit = require('js-git')(platform);
var gitRemote = require('git-net')(platform);

exports.repo = createRepo;
function createRepo(callback) {
  var db = memDb();
  db.init(function () {
    var repo = jsGit(db);

    callback (null, repo);
  })
}

exports.remote = createRemote;
function createRemote(url) {
  return gitRemote(url);
}
