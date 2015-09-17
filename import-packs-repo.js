var git = require('./git');
var basename = require('path').basename;

// Create a remote repo
var url = process.argv[2] || "git://github.com/eazel7/origami-packs.git";

var api = require('./api')(require('./config'), function (err, api) {
  if (err) {
    console.error(err);
    process.exit(-1);
  }


  git.repo(function (err, repo) {
    var remote = git.remote(url);
    // Create a local repo
    var path = process.argv[3] || basename(remote.pathname);

    var opts = {
      onProgress: function (progress) {
        process.stderr.write(progress);
      }
    };

    if (process.env.DEPTH) {
      opts.depth = parseInt(process.env.DEPTH, 10);
    }

    repo.fetch(remote, opts, function (err) {
      if (err) throw err;

      repo.loadAs("commit", "HEAD", function (err, result) {
        repo.loadAs("tree", result.tree, function (err, tree) {
          require('async').eachSeries(tree, function (entry, callback) {
            if (entry.name.indexOf(".pack") === -1) return callback ();

            repo.loadAs("blob", entry.hash, function (err, blob) {
              api.packages.importPackage(blob, function (err) {
                callback (err);
              });
            });
          }, function (err) {
            if (err) console.error(err);

            process.exit(err ? -1 : 0);
          })
        });
      });
    });
  });
});
