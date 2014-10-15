angular
.module('box.directive.remoteFind', ['box.service.remoteData'])
.directive('remoteFind', function (RemoteDataService) {
  return {
    restrict: 'E',
    scope: {
      collection: '=',
      to: '@',
      predicate: '='
    },
    link: function (scope, elem, attrs) {
      elem.css('display', 'none');
      
      scope.$watch('{to: to, collection: collection, predicate: predicate || {}}', function (conditions) {
        RemoteDataService
        .getCollection(scope.collection)
        .find(scope.predicate)
        .then(function (result) {
          scope.$parent[conditions.to] = result;
        });
      }, true);
    }
  }
});
