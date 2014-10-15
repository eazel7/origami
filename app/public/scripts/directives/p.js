angular
.module('box')
.directive('pDb', function (LocalDataService) {
  return {
    restrict: 'E',
    scope: false,
    link: function (scope, elem, attrs) {
      elem.css('display', 'none');
      
      scope[attrs.as] = LocalDataService.getCollection(attrs.collection);
    }
  }
})
.directive('pRun', function () {
  return {
    restrict: 'E',
    link: function (scope, elem, attrs, boxView) {
      scope.$on('$run', function(event) {
        scope.$eval(attrs.do);
      });
    }
  };
})
.directive('pFn', function ($q,LocalDataService, $injector) {
  return {
    restrict: 'E',
    scope: false,
    link: function (scope, elem, attrs) {
      elem.css('display', 'none');
      var self = {},
          source = elem.html(),
          fn = Function.constructor(attrs.args || '', source),
          fnArguments = attrs.args ? attrs.args.split(',') : [];
        
      scope[attrs.as] = function () {
        locals = {};
        
        for (var i = 0; i < arguments.length; i++) {
          locals[fnArguments[i]] = arguments[i];
        };
        
        locals["$scope"] = scope;
        locals["angular"] = angular;
        
        return $injector.invoke(fn, self, locals);
      };
    }
  };
});
