angular
.module("bs3-typeahead", [])
.directive("bsTypeahead", function () {
  return {
    restrict: "A",
    scope: {
      options: "=bsTypeahead"
    },
    link: function (scope, elem, attrs) {
      angular.element(elem).typeahead(scope.options);
    }
  };
});
