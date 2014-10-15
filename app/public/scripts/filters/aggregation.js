angular
.module('box.filters.aggregation', ['ng'])
.filter('sum', function () {
  return function (input, param) {
    if (!input) return undefined;

    var result = 0;

    if (!param) {
      angular.forEach(input, function (e) {
        result += e;
      });
    } else {
      angular.forEach(input, function (e) {
        result += e[param];
      });
    }

    return result;
  };
})
.filter('max', function () {
  return function (input, param) {
    if (!input) return undefined;

    var result;

    if (!param) {
      angular.forEach(input, function (e) {
        if (result === undefined || result < e) {
          result = e;
        }
      });
    } else {
      angular.forEach(input, function (e) {
        if (result === undefined || result < e[param]) {
          result = e[param];
        }
      });
    }

    return result;
  };
});
