angular
.module('box.directive.localFind', ['box.service.localData'])
.directive('localFind', function (LocalDataService) {
  return {
    restrict: 'E',
    scope: {
      collection: '=',
      to: '@',
      predicate: '=',
      once: '@',
      refreshWith: '@',
      then: '@'
    },
    link: function (scope, elem, attrs) {
      var conditionsWatch = '{to: to, collection: collection, predicate: predicate || {}}',
          refresh = function (conditions) {
            if (!conditions.collection) return;
            LocalDataService
            .getCollection(scope.collection)
            .find(scope.predicate)
            .then(function (result) {
              scope.$parent[conditions.to] = result;
            })
            .then(function () {
              if (scope.then) {
                scope.$parent.$eval(scope.then);
              }
            });
          };
      elem.css('display', 'none');
      if (!scope.once) {
        scope.$watch(conditionsWatch, refresh, true);

        scope.$on('collection-changed', function (event, collectionName) {
          if (collectionName == scope.collection) {
            var conditions = scope.$eval(conditionsWatch);

            refresh(conditions);
          }
        });
      } else {
        refresh(scope.$eval(conditionsWatch));
      }

      if (scope.refreshWith) {
        scope.$parent[scope.refreshWith] = function() {
          refresh(scope.$eval(conditionsWatch));
        }

        scope.$on('$destroy', function () {
          delete scope.$parent[scope.refreshWith];
        });
      }
    }
  };
})
.directive('localFindOne', function (LocalDataService) {
  return {
    restrict: 'E',
    scope: {
      collection: '=',
      to: '@',
      predicate: '=',
      onNewVersion: '@'
    },
    link: function (scope, elem, attrs) {
      var lastResult,
          firstTime = true;
      var refresh = function (conditions) {
        LocalDataService
        .getCollection(scope.collection)
        .findOne(scope.predicate)
        .then(function (result) {
          if (angular.equals(result, lastResult)) {
            return;
          }

          if (firstTime || scope.onNewVersion === undefined) {
            firstTime = false;
            scope.$parent[conditions.to] = lastResult = result;
          } else {
            var evalScope = scope.$parent.$new();

            evalScope.$newVersion = result;

            if (evalScope.$eval(scope.onNewVersion)) {
              scope.$parent[conditions.to] = lastResult = result;
            }

            evalScope.$destroy();
          }
        });
      };
      var conditionsWatch = '{to: to, collection: collection, predicate: predicate || {}}';

      scope.$watch(conditionsWatch, refresh, true);
      scope.$on('collection-changed', function (event, collectionName) {
        if (collectionName == scope.collection) {
          var conditions = scope.$eval(conditionsWatch);

          refresh(conditions);
        }
      });
    }
  };
});
