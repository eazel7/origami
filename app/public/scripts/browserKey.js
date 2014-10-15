angular.module("box.browserKey", ["ng"])
.run(function ($rootScope, $window) {
  // set a browser key if undefined

  if (!$window.localStorage.browserKey) {
    $window.localStorage.browserKey = 'browser_' + Date.now();
  }
})
.factory("BrowserKey", function ($window) {
  return function () {
    return $window.localStorage.browserKey;
  }
});
