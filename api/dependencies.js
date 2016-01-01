/* eslint-disable semi */

var async = require('async');

module.exports = function (base, resolver, callback) {
  var deps = [];
  var unresolved = [base];

  async.whilst(function () {
    return unresolved.length > 0;
  },
  function (callback) {
    resolver(unresolved[0], function (err, deps2) {
      if (err) return callback(err);

      if (!deps2) deps2 = [];
      deps2.unshift(unresolved[0]);

      for (var i = 0; i < deps2.length; i++) {
        if (deps.indexOf(deps2[i]) > -1) {
          deps.splice(deps.indexOf(deps2[i]), 1);
        } else {
          unresolved.push(deps2[i]);
        }

        deps.unshift(deps2[i]);
      }

      unresolved.shift();
      callback();
    });
  }, function (err) {
    callback(err, deps);
  });
};
