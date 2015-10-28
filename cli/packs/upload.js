module.exports = function (api, args, stdin, stdout, stderr, exit) {
  var content = new Buffer([]);

  stdin.on('data', function(buf) {
    content = Buffer.concat([content, buf]);
  });
  stdin.on('end', function() {
    api.packages.importPackage(content, function (err) {
      if (err) stderr.write(err + '\n');
      else stdout.write('Done!\n');

      exit();
    });
  });
  stdin.resume();
};
