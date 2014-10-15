function verifyCacheStatus() {
  var appCache = window.applicationCache;

  switch(appCache.status) {
    case appCache.UNCACHED:
      appCache.update();
      break;
    case appCache.UPDATEREADY:
      appCache.swapCache();
      window.location.reload();
      break;
  }
}

function startApp() {
  $.getJSON("styles.json", function(styles) {
    for (var i = 0; i < styles.length; i++) {
      $("head").append($('<link rel="stylesheet" type="text/css" href="' + styles[i] + '">'));
    }

    $.getJSON("scripts.json", function(data) {
      var loaded = 0;
      var pending = data.length;

      function loadNext() {
        if (data.length == 0) {
          $.getJSON("angular-modules.json", function(data) {
            data.push("box");
            angular.bootstrap(document, data);
          });
        } else {
          $script(data[0], function() {
            data = data.splice(1);
            loaded++;
            pending--;

            loadNext();
          });
        }
      }

      loadNext();
    });
  });
}

window.addEventListener('load', function(e) {
  if (window.nwDispatcher) return startApp();

  verifyCacheStatus();

  var appCache = window.applicationCache;
  
  appCache.addEventListener('updateready', function(e) {
    if (appCache.status == appCache.UPDATEREADY) {
      // Browser downloaded a new app cache.
      // Swap it in and reload the page to get the new hotness.
      window.applicationCache.swapCache();
      window.location.reload();
    }
  }, false);

  appCache.addEventListener('error', startApp, false);
  appCache.addEventListener('noupdate', startApp, false);
  appCache.addEventListener('cached', startApp, false);
}, false);


