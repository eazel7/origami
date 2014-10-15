angular
.module('box.directive.localRemove', ['box.service.localData'])
.directive('localRemove', function (LocalDataService) {
  return {
    restrict: 'E',
    scope: {
      collection: '=',
      name: '@',
      predicate: '@',
      then: '@'
    },
    link: function (scope, elem, attrs) {
      elem.css('display', 'none');
      
      scope.$on('$destroy', function () {
        scope.$parent[attrs.name] = undefined;
      });
      
      scope.$parent[attrs.name] = function () {
        LocalDataService.getCollection(scope.collection)
        .remove(scope.$parent.$eval(attrs.predicate))
        .then(function() {
          if (attrs.then) {
            scope.$parent.$eval(attrs.then);
          }
        })
      };
    }
  }
});
