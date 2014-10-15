angular
.module('box.directive.localInsert', ['box.service.localData'])
.directive('localInsert', function (LocalDataService) {
  return {
    restrict: 'E',
    scope: {
      collection: '=',
      name: '@',
      what: '@',
      then: '@'
    },
    link: function (scope, elem, attrs) {
      elem.css('display', 'none');
      
      scope.$on('$destroy', function () {
        scope.$parent[attrs.name] = undefined;
      });
      
      scope.$parent[attrs.name] = function () {
        LocalDataService.getCollection(scope.collection)
        .insert(scope.$parent.$eval(attrs.what))
        .then(function(newObject) {
          if (attrs.then) {
            var oldNew = scope.$parent.$new;
            
            scope.$parent.$new = newObject;
            
            scope.$parent.$eval(attrs.then);
            
            scope.$parent.$new = oldNew;
          }
        });
      };
    }
  }
});
