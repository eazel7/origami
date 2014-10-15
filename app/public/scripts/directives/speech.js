angular
.module('speech', ['ng'])
.service("SpeechService", function ($window) {
  if (!$window.webkitSpeechRecognition) {
    return {
      subscribe: angular.noop
    };
  }
  
  var recognition = new $window.webkitSpeechRecognition();
  
  var phrases = {};
  function unsubscriberFactory(phrase) {
    return function () {
      delete phrases[phrase];
    };
  }
  
  recognition.onresult = function (event) {
    var result = event.results[event.resultIndex],
        alternatives = [];
    
    for (var i = 0; i < result.length; i++) {
      alternatives.push(result[i]);
    }
    
    alternatives.sort(function (a, b) {
      return a.confidence - b.confidence;
    });
    
    for (var i = 0; i < alternatives.length; i++) {
      console.log(alternatives[i]);
      var spoken = alternatives[i].transcript.trim().toLowerCase();
      (phrases[spoken] || angular.noop)();
    }
    
  };
  
  var started;

  return {
    setLanguage: function (lang) {
      recognition.lang = lang;
    },
    subscribe: function (phrase, callback) {
      if (!started) {
        recognition.continuous = true;
        recognition.start();
        started = true;
      }
      
      phrase = phrase.trim().toLowerCase();
      
      phrases[phrase] = callback;
    
      return unsubscriberFactory(phrase);
    }
  };
})
.directive("speechCommand", function (SpeechService) {
  return {
    restrict: "E",
    scope: {
      phrase: '='
    },
    link: function (scope, elem, attrs) {
      if (attrs.lang) SpeechService.setLanguage(attrs.lang);
      
      scope.$on('$destroy', SpeechService.subscribe(scope.phrase, function (params) {
        var evalScope = angular.extend(scope.$parent.$new(), params);
        
        evalScope.$eval(attrs.then);
        
        evalScope.$destroy();
      }));
    }
  };
});
