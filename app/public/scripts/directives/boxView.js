angular
.module('box.directive.boxView', ['box.service.views', 'ng'])
.directive('boxView', function (LocalStorage, ViewsService, $compile, $rootScope, $window, $timeout, boxName, $injector) {
  return {
    restrict: 'E',
    scope: true,
    link: function (scope, elem, attrs) {
      var viewElement = $compile('<span></span>')(scope),
          currentTemplate,
          currentController,
          currentScope;
      
      elem.append(viewElement); 
      
      function updateWith(view) {
        if (!view) return;
        if (view.template === currentTemplate && view.controller === currentController) return;
        
        currentTemplate = view.template;
        currentController = view.controller;
        
        if (currentScope) currentScope.$destroy();
        
        currentScope = scope.$new();
        
        if (view.controller) {
          var args = /\(([^)]+)/.exec(view.controller),
              a = view.controller.indexOf('{'),
              b = view.controller.lastIndexOf('}'),
              source = view.controller.substr(a + 1, b - a - 1);
          
          if (args[1]) {
              fnArguments = args[1].split(/\s*,\s*/);
          } else {
            fnArguments = '';
          }
              
          var fn = Function.constructor(fnArguments, source);

          var locals = {};
          
          for (var i = 0; i < arguments.length; i++) {
            locals[fnArguments[i]] = arguments[i];
          };
          
          locals['angular'] = angular;
          locals['$scope'] = currentScope;
          
          $injector.invoke(fn, fn, locals)
        }
        
        var newViewElement = $compile(view.template)(currentScope);
        
        viewElement.replaceWith(newViewElement);
        viewElement = newViewElement;
      };
  
      $rootScope.$on('collection-changed', function (event, collectionName) {
        if (collectionName === '_views') {
          ViewsService
          .getView(attrs.name)
          .then(function (view) {
            updateWith(view);
          });
        }
      });
      
      attrs.$observe('name', function (viewName) {
        ViewsService
        .getView(attrs.name)
        .then(function (view) {
          updateWith(view);
        });
      });
    }
  }
});
