module.exports = function (api, args, stdin, stdout, stderr, exit) {
  api.packages.exportPackage(args[0], function (err, buffer) {
    if (err) stderr.write(err + '\n');
    stdout.write(buffer);
    exit(err ? -1 : 0);
  });
};
