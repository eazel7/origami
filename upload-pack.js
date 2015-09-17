var config = require('./config.js');
var api = require('./api')(config, function (err, api) {
  if (err) {
    console.error(err);
    return process.exit();
  }
  var content = new Buffer([]);

  process.stdin.on('data', function(buf) {
    content = Buffer.concat([content, buf]);
  });
  process.stdin.on('end', function() {
    api.packages.importPackage(content, function (err) {
      if (err) console.error(err);
      else console.log('Done!');

      process.exit();
    });
  });
  process.stdin.resume();
});
