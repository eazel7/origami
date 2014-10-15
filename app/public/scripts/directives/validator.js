'use strict';

angular.module('box.directive.validator', ['ng'])
.directive('validator', ["$rootScope", function ($rootScope) {
  return {
    restrict: 'E',
    scope: {
      ngModel: '=',
      to: '@'
    },
    controller: function ($scope) {
      $scope.$watch('ngModel', function (m) {
        $scope.$broadcast('validate', m);
      }, true);
      $scope.$on('field-validated', function (event, field, result) {
        event.stopPropagation();
        if (!$scope.$parent[$scope.to]) {
          $scope.$parent[$scope.to] = {};
        }
        
        $scope.$parent[$scope.to][field] = result;
      });
    },
    link: function (scope, elem, attrs) {
      elem.css('display', 'none');
    } 
  };
}])
.directive('required', ["$rootScope", function ($rootScope) {
  return {
    restrict: 'E',
    require: '^validator'
    scope: {
      field: '@'
    },
    controller: function ($scope) {
      $scope.$on('validate', function (event, m) {
        var evalScope = $scope.$new(true);
        
        angular.extend(evalScope, m);
        
        $scope.$emit('field-validated', (!evalScope.$eval($scope.field)));
        
        evalScope.$destroy();
      });
    }
    link: function (scope, elem, attrs) {
      elem.css('display', 'none');
    } 
  };
}]);
