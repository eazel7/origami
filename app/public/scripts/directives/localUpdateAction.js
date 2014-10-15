angular
.module('box.directive.localUpdate', ['box.service.localData'])
.directive('localUpdate', function (LocalDataService) {
  return {
    restrict: 'E',
    scope: {
      collection: '=',
      name: '@',
      predicate: '@',
      replacement: '@',
      then: '@'
    },
    link: function (scope, elem, attrs) {
      elem.css('display', 'none');
      
      scope.$on('$destroy', function () {
        scope.$parent[attrs.name] = undefined;
      });
      
      scope.$parent[attrs.name] = function () {
        LocalDataService.getCollection(scope.collection)
        .update(scope.$parent.$eval(attrs.predicate), scope.$parent.$eval(attrs.replacement))
        .then(function() {
          if (attrs.then) {
            scope.$parent.$eval(attrs.then);
          }
        })
      };
    }
  }
});
