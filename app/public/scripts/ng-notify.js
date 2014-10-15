angular
.module('ng-notify', [])
.service('$notify', function (appSocket) {
  var audio = $('<audio preload="auto" style="display: none"><source type="audio/mpeg" src="notify.mp3" /></audio>');
  angular.element('body').append(audio);
  audio[0].load();
  
  var service = {
    isSupported: function () {
      return notify.isSupported;
    },
    permissionLevel: function() {
      return notify.permissionLevel();
    },
    requestPermission: function () {
      return notify.requestPermission();
    },
    create: function (title, tag) {
      if (!notify.isSupported) return;
      
      audio[0].play();
      
      return notify.createNotification(title, { tag: tag || Date.now(), icon: 'favicon.ico' });
    }
  };
  
  appSocket.on('desktop-notification', function (message) {
    service.create(message);
  });
  
  return service;
})

