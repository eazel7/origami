'use strict';

angular.module('boxes3.manager')
    .filter('skip', function () {
        return function (input, param) {
            if (angular.isArray(input)) {
                return input.splice(Number(param));
            } else if (input === null || input === undefined) {
                // input null -> output null
                // input undefined -> output undefined
                return input;
            } else {
                throw new Error('skip filter only supports arrays');
            }
        };
    });
