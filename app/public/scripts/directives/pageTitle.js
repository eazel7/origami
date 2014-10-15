'use strict';

angular.module('box.directive.pageTitle', ['ng'])
.directive('pageTitle', ["$rootScope", function ($rootScope) {
  return {
    restrict: 'E',
    scope: {
      title: '@'
    },
    link: function (scope, elem, attrs) {
      elem.css('display', 'none');
      scope.$watch('title', function (t) {
          $rootScope.pageTitle = t;
      });
    } 
  };
}]);
