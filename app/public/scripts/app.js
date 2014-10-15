'use strict';

angular.module('box', [
  'ngCookies',
  'ngSanitize',
  'ngTouch',
  'ngRoute',
  'ngAnimate',
  'ui.utils',
  'ui.ace',
  'box.snapshots',
  'box.service.workflows',
  'flowChart',
  'appSocket',
  'ng-notify'
])
.value("makeid", function () {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for( var i=0; i < 5; i++ )
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
})
.run(function ($rootScope, appSocket) {
  appSocket.emit('hello');
})
.factory("getLocation", function ($window, $q){
  return function (highAccuracy) {

    var defer = $q.defer();

    if ($window.navigator.geolocation) {
      var watchId = $window.navigator.geolocation.watchPosition(function (pos) {
        defer.resolve(pos);
        $window.navigator.geolocation.clearWatch(watchId);
      }, defer.reject, {
        enableHighAccuracy: highAccuracy,
        timeout: 60000,
        maximumAge: 30000
      });
    } else {
      defer.reject('Geolocation not supported');
    }

    return defer.promise;
  }
})
.run(function ($rootScope, $http, $location, $notify, boxName) {
  
  $rootScope.$on("$routeChangeSuccess", function () {
    angular.element('body').addClass('has-sidebar-left');
  });
  
  $rootScope.boxName = boxName;
  $rootScope.sizeAttributes = function (size) {
	  return {
	    'A4': {
	      width: '747.51288',
	      height: '1060.6602'
	    },
	    'A4-portrait': {
	      width: '1060.6602',
	      height: '747.51288'
	    },
	    'A3': {
	      width: '1060.6602',
	      height: '1495.530882'
	    },
	    'A3-portrait': {
	      width: '1495.530882',
	      height: '1060.6602'
	    }
	  }[size];
	};
  $http.get('/api/identity')
  .success(function (identity) {
    $rootScope.identity = identity;
  });
  $rootScope.now = function () {
    return new Date();
  };

  $rootScope.viewLink = function (viewName, params) {
    if (viewName == 'home' && !params) return '#/';

    var queryString = '';

    if (params) {
      for (var k in params) {
        queryString += encodeURIComponent(k) + '=' + params[k] + '&';
      }
    }

    if (!viewName) return '#/' + queryString;

    return '#/v/' + viewName + (queryString ? '?' + queryString : '');
  };
  $rootScope.openView = function (viewName, params) {
    $location.url($rootScope.viewLink(viewName, params).slice(1));
  };

  $rootScope.$on('$stateChangeSuccess', function (event, param, stateParams) {
    $rootScope.search = $location.search();
  });

  $rootScope.$notify = $notify;
})
.directive('dateInput', function($compile) {
  return {
    restrict: 'E',
    require: 'ngModel',
    scope: {
      value: '=ngModel',
      ngDisabled: '=ngDisabled'
    },
    template: '<div style="display: block" ng-class="{\'btn-group\': allowClear}"><a ng-disabled="ngDisabled" ng-click="openCalendar()" class="btn btn-default" style="width: 10em">{{(value ? (value|date:\'dd-MM-yyyy\') : noValue)}}<a ng-if="allowClear" ng-click="clear()" ng-disabled="ngDisabled" class="btn btn-default" style="max-width: 4em"><i ng-click="value = undefined" class="fa fa-times"></i></a><div>',
    link: function (scope, elem, attrs, ngModelCtrl) {
      if (!attrs.noValue) scope.noValue = 'No date';

      scope.allowClear = attrs.allowClear !== undefined;
      scope.clear = function() {
        ngModelCtrl.$setViewValue(scope.$parent.$eval(attrs.allowClear));
      };

      scope.openCalendar = function () {
        scope.$root.FCCalendarDate = ngModelCtrl.$modelValue;
        scope.$root.FCCalendarDateSelected = function (date) {
          ngModelCtrl.$setViewValue(date);
          scope.$root.toggle('FCCalendarOverlay', 'off');
        };
        scope.$root.toggle('FCCalendarOverlay', 'on');
        angular.element('#FCCalendar').fullCalendar('render');
        angular.element('#FCCalendar').fullCalendar('gotoDate', scope.value || new Date());
      };
    }
  }
})
.controller('FCCalendarOverlayCtrl', function ($scope, $swipe, $window) {
  $scope.events = [[
  ]];

  $window.addEventListener('resize', function () {
    $scope.$apply(function () {
      $scope.calendarConfig.height = angular.element('body').height() - 100;
    });
  });
  $scope.nextMonth = function () {
    angular.element('#FCCalendar').fullCalendar('next');
  };
  $scope.prevMonth = function () {
    angular.element('#FCCalendar').fullCalendar('prev');
  };

  $scope.calendarConfig = {
     height: angular.element('body').height() - 100,
     monthNames: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dic'],
     monthNamesShort: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dic'],
     dayNames: ['S','M','T','W','T','F','S'],
     dayNamesShort: ['S','M','T','W','T','F','S'],
     buttonText: {
      today: 'today',
      month: 'month',
      week: 'week',
      day: 'day'
     },
     titleFormat: {
		   month: 'MMMM/yy',
		   week: "MMM d[ yyyy]{ '&#8212;'[ MMM] d yyyy}",
		   day: 'dddd, MMM d, yyyy'
	   },
     dayRender: function (date, cell) {
       if (!$scope.$root.FCCalendarDate) return;
       if (date.valueOf() == $scope.$root.FCCalendarDate.valueOf()) {
         cell.css("background-color", "#007aff");
         cell.find('.fc-day-number').css('color', 'white');
       }
     },
     dayClick: function(date, jsEvent, view) {
       $scope.$apply(function () {
          ($scope.$root.FCCalendarDateSelected || angular.noop)(date);
          $scope.$root.FCCalendarDate = date;
       });
     }
  };
})
.config(function ($routeProvider, $locationProvider) {
  $routeProvider.when('/', {
    templateUrl: 'views/partials/view.html'
  });

  $routeProvider.when('/e/:view', {
    templateUrl: 'views/partials/editView.html',
    reloadOnSearch: false,
    controller: function ($scope, $routeParams, $location) {
      $scope.routeParams = $routeParams;
      
      if ($location.search().js) $scope.showCode = true;
      $scope.$watch('showCode', function (s) {
        if (s && !$location.search().js) {
          $location.search({js: true});
        } else if (!s && $location.search().js) {
          $location.search({});
        }
      });
      
      $scope.setupAce = function (editor) {
        editor.commands.addCommand({
            name: 'saveFile',
            bindKey: {
            win: 'Ctrl-S',
            mac: 'Command-S',
            sender: 'editor|cli'
          },
          exec: function(env, args, request) {
            $scope.saveView();
          }
        });
        editor.setFontSize(20);
      };
    }
  });

  $routeProvider.when('/v/:view', {
    templateUrl: 'views/partials/view.html',
    controller: function ($scope, $routeParams) {
      $scope.routeParams = $routeParams;
    }
  });

  $routeProvider.otherwise('/');
})
.factory("LocalStorage", function ($window) {
  return $window.localStorage;
})
.directive("leafletLeap", function ($timeout) {
  return {
    restrict: "A",
    require: 'leaflet',
    link: function (scope, elem, attrs, controller) {
      controller.getMap()
      .then(function (map) {
      function isGripped(hand) {
        return hand.grabStrength == 1.0;
      }

      function getHandColor(hand) {
          if(isGripped(hand)) {
              return "rgb(0,119,0)";
          } else {
              var tint = Math.round((1.0 - hand.grabStrength) * 119);
              tint = "rgb(119," + tint + "," + tint + ")";
              return tint;
          }
      }

      function filterGesture(gestureType, callback) {
          return function(frame, gesture) {
              if(gesture.type == gestureType) {
                  callback(frame, gesture);
              }
          }
      }

      function isClockwise(frame, gesture) {
          var clockwise = false;
          var pointableID = gesture.pointableIds[0];
          var direction = frame.pointable(pointableID).direction;
          var dotProduct = Leap.vec3.dot(direction, gesture.normal);

          if (dotProduct  >  0) clockwise = true;

          return clockwise;
      }

      
            var leftHandPrev;
            var separationStart;

            var MAX_ZOOM = 22;
            var SEPARATION_SCALING = 1.25;
            var LEFT_HAND = 0, RIGHT_HAND = 1;
            var X = 0, Y = 1, Z = 2;

            function move(frame) {

            // Look for any circle gestures and process the zoom
            // TODO: filter out multiple circle gestures per frame
            if(frame.valid && frame.gestures.length > 0){
                frame.gestures.forEach(function(gesture){
                    filterGesture("circle", zoom)(frame, gesture);
                });
            }

            markHands(frame);

            // if there is one hand grabbing...
            if(frame.hands.length > 0 && isGripped(frame.hands[LEFT_HAND])) {
              var leftHand = frame.hands[LEFT_HAND];
              var rightHand = frame.hands.length > 1 ? frame.hands[RIGHT_HAND] : undefined;
              var separation;
              
              // If there was no previous closed position, capture it and exit
              if(leftHandPrev == null) {
                leftHandPrev = leftHand;
                return;
              }

              // if there is a right hand and its gripped...
              if(rightHand) {
                if(isGripped(rightHand)) {
                  separation = Math.sqrt(
                                    Math.pow(rightHand.stabilizedPalmPosition[X] - leftHand.stabilizedPalmPosition[X], 2) + 
                                    Math.pow(rightHand.stabilizedPalmPosition[Y] - leftHand.stabilizedPalmPosition[Y], 2)
                                  );
                  // console.log("separation = " + separation + " ("+separationStart+")");

                  // ...and no previous separation, capture and exit
                  if(separationStart == null) {
                    separationStart = separation;
                    return;
                  }

                  // Calculate if we need to change the zoom level
                  var currentZoom = map.getZoom();

                  if(currentZoom > 1 && separation < (separationStart / SEPARATION_SCALING) ) {
                    map.setZoom( currentZoom - 1 );
                    separationStart = separation;
                  } else if( currentZoom < MAX_ZOOM && separation > (SEPARATION_SCALING * separationStart) ) {
                    map.setZoom( currentZoom + 1 );
                    separationStart = separation;
                  }
                // If the right hand is not gripped...
                } else if(separationStart != null) {
                  separationStart = null;
                }

              }

              // Calculate how much the hand moved
              var dX = leftHandPrev.stabilizedPalmPosition[X] - leftHand.stabilizedPalmPosition[X];
              var dY = leftHandPrev.stabilizedPalmPosition[Y] - leftHand.stabilizedPalmPosition[Y];
              // console.log("Movement: " + dX + ","+dY);

              var center = map.getCenter();

              var scaling = 4.0 / Math.pow(2, map.getZoom()-1);

              var newLat = center.lat + dY * scaling;
              var newLng = center.lng + dX * scaling;

              var newCenter = new L.LatLng(newLat, newLng);
              
              // console.log(newCenter)


                controller.getLeafletScope().center.lat = newCenter.lat;
                controller.getLeafletScope().center.lng = newCenter.lng;
                map.panTo(newCenter, {animate: false, noMoveStart: true });

              leftHandPrev = leftHand;

            } else {
              // If the left hand is not in a grab position, clear the last hand position
              if(frame.hands.length > LEFT_HAND && !isGripped(frame.hands[LEFT_HAND]) && leftHandPrev != null) {
                leftHandPrev = null;
              }

              // if the right hand is not in a grab position, clear the separation
              if(frame.hands.length > RIGHT_HAND && !isGripped(frame.hands[RIGHT_HAND]) && separationStart != null) {
                separationStart = null;
              }
               // console.log("Clearing lastHand");
            }
        }

        var handMarkers = [];

        var HEIGHT_OFFSET = 150;
        var BASE_MARKER_SIZE_GRIPPED = 15, BASE_MARKER_SIZE_UNGRIPPED = 20;

        function markHands(frame) {
            var scaling = (4.0 / Math.pow(2, map.getZoom()-1));

              var bounds = map.getBounds();
              // FIXME: Sometimes this gets run too early, just exit if its too early.
              if(!bounds) { return; }
              var origin = new L.LatLng(bounds.getSouthWest().lat, bounds.getCenter().lng);

              var hands = frame.hands;
              
              var inform = [];
              
              for(var i in hands) {
                  if(hands.hasOwnProperty(i)) {

                    // Limit this to 2 hands for now
                    if(i > RIGHT_HAND) {
                      return;
                    }

                    var hand = hands[i];

                    var newCenter = new L.LatLng(origin.lat + ((hand.stabilizedPalmPosition[1] - HEIGHT_OFFSET) * scaling), origin.lng + (hand.stabilizedPalmPosition[0] * scaling));


                    var gripped = isGripped(hand);
                    var baseRadius = gripped ? BASE_MARKER_SIZE_GRIPPED : BASE_MARKER_SIZE_UNGRIPPED;

                    var handColor = getHandColor(hand);

                    var handMarker = handMarkers[i],
                        newRadius = baseRadius;
                    if(!handMarker) {
                      handMarker = new L.circleMarker(newCenter, newRadius).addTo(map);
                      handMarkers[i] = handMarker;
                    }

                    handMarker.color = handColor;
                    handMarker.weight = 2;
                    handMarker.fillColor = handColor;
                    handMarker.fillOpacity = 0.35;
                    handMarker.setRadius(newRadius);
                    handMarker.setLatLng(newCenter);
                    
                    inform.push({
                      lat: newCenter.lat,
                      lng: newCenter.lng,
                      radius: baseRadius
                    });
                  }
              }
              
              if (attrs.leafletLeap) {
                scope.$apply(function () {
                  scope[attrs.leafletLeap] = inform;
                });
              }
        }

        var zoomLevelAtCircleStart;
        var INDEX_FINGER = 1;

        function zoom(frame, circleGesture) {
            // Only zoom based on one index finger
            if(circleGesture.pointableIds.length == 1 &&
                    frame.pointable(circleGesture.pointableIds[0]).type == INDEX_FINGER) {
                switch(circleGesture.state) {
                    case "start":
                        zoomLevelAtCircleStart = map.getZoom();
                    // fall through on purpose...
                    case "update":
                        // figure out if we need to change the zoom level;
                        var zoomChange = Math.floor(circleGesture.progress);
                        var currentZoom = map.getZoom();
                        var zoomDirection = isClockwise(frame, circleGesture) ? zoomChange : -zoomChange;
                        if(zoomLevelAtCircleStart + zoomDirection != currentZoom) {
                            var newZoom = zoomLevelAtCircleStart + zoomDirection;
                            if(newZoom >= 0 && newZoom <= MAX_ZOOM) {
                                map.setZoom(newZoom);
                            }
                        }
                        break;
                    case "stop":
                        zoomLevelAtCircleStart = null;
                        break;
                }
            }
        }
      
        // listen to Leap Motion
        Leap.loop({enableGestures: true}, move);
      });
    }
  };
})
.directive('ngHtmlCompile', function($compile) {
	return {
	    restrict: 'A',
	    link: function(scope, element, attrs) {
		    scope.$watch(attrs.ngHtmlCompile, function(newValue, oldValue) {
		        element.html(newValue);
		        $compile(element.contents())(scope);
		    });
	    }
	}
})
.factory("page", function ($rootScope) {
  return function () {
    return $rootScope.page;
  };
})
.run(function ($rootScope) {  
  if (!$rootScope.page) $rootScope.page = $rootScope.$new(true);

  $rootScope.$on("$routeChangeSuccess", function () {
    if ($rootScope.page) $rootScope.page.$destroy();
    
    $rootScope.page = $rootScope.$new();
  });
})
//.config(function ($provide, viewScope) {
//  $provide.decorator('scriptDirective', function($delegate){
//    //$delegate is an array, and index '0' is the Angular directive
//    
//    var scriptDirective = $delegate[0],
//    originalCompile = scriptDirective.compile;
//    
//    scriptDirective.compile = function(element, attr, transclude){
//      if(attr.type === 'application/javascript' && attr.fn !== undefined && attr.as !== undefined){
//        var source = element[0].text,
//            fn = Function.constructor(attrs.args || '', source),
//            fnArguments = attrs.args ? attrs.args.split(',') : [];
//            
//        viewScope[attrs.as] = function () {
//          locals = {};
//          
//          for (var i = 0; i < arguments.length; i++) {
//            locals[fnArguments[i]] = arguments[i];
//          };
//          
//          locals["$scope"] = scope;
//          locals["angular"] = angular;
//        
//          element.replaceWith("");
//        
//          return $injector.invoke(fn, self, locals);
//        };
//      } else {
//        originalCompile(element, attr, transclude);
//      }
//    };

//    return $delegate;
//  });
//});
