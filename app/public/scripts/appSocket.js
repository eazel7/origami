angular.module('appSocket', ['btford.socket-io'])
.factory('appSocket', function (socketFactory, boxName) {
  var appSocket = io.connect('/' + boxName);
  return socketFactory({ioSocket: appSocket});
});

