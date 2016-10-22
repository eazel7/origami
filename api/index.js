/* eslint-disable semi */

var events = require('events');
var async = require('async');
var debug = require('debug')('origami:init');

module.exports = function (config, callback) {
  async.auto({
    'config': [
      function (callback) {
        debug('config');

        callback(null, config);
      }
    ],
    'connect': [
      function (callback) {
        debug('connect');

        callback(null, require('./connect'));
      }
    ],
    'db': [
      'connect',
      'config',
      function (callback, results) {
        debug('db');

        results.connect(results.config.mongo, callback);
      }
    ],
    'eventBus': [
      function (callback) {
        debug('eventBus');

        var eventBus = new events.EventEmitter();
        eventBus.setMaxListeners(0);

        callback(null, eventBus);
      }
    ],
    'wrapper': [
      function (callback) {
        debug('wrapper');

        var APIWrapper = require('./api-wrapper');

        callback(null, new APIWrapper());
      }
    ],
    'settings': [
      'db',
      function (callback, results) {
        debug('settings');

        var Settings = require('./settings');

        return callback(
          null,
          new Settings(
            results.db));
      }
    ],
    'users': [
      'db',
      'settings',
      function (callback, results) {
        debug('users');

        var Users = require('./users');

        callback(
          null,
          new Users(
            results.db,
            results.settings));
      }
    ],
    'collectionRouter': [
      'db',
      function (callback, results) {
        debug('collectionRouter');

        var CollectionRouter = require('./collection-router');

        callback(
          null,
          new CollectionRouter(
            results.db,
            results.config.collectionsDbName
          ));
      }
    ],
    'syncWrapper': [
      'db',
      'collectionRouter',
      'eventBus',
      function (callback, results) {
        debug('syncWrapper');

        var SyncWrapper = require('./sync-wrapper');

        callback(
          null,
          new SyncWrapper(
            results.db,
            results.collectionRouter,
            results.eventBus));
      }
    ],
    'collections': [
      'db',
      'syncWrapper',
      'collectionRouter',
      function (callback, results) {
        debug('collections');

        var Collections = require('./collections');

        callback(
          null,
          new Collections(
            results.db,
            results.syncWrapper,
            results.collectionRouter
          ));
      }
    ],
    'permissions': [
      'collections',
      'users',
      function (callback, results) {
        debug('permissions');

        var Permissions = require('./permissions');

        callback(
          null,
          new Permissions(
            results.collections,
            results.users));
      }
    ],
    'views': [
      'collections',
      function (callback, results) {
        debug('views');

        var Views = require('./views');

        callback(
          null,
          new Views(
            results.collections
          )
        );
      }
    ],
    'boxes': [
      'config',
      'db',
      'users',
      'collections',
      'eventBus',
      function (callback, results) {
        debug('boxes');

        var Boxes = require('./boxes');

        callback(
          null,
          new Boxes(
            results.db,
            results.users,
            results.collections,
            results.eventBus)
        );
      }
    ],
    'packages': [
      'db',
      'eventBus',
      'users',
      function (callback, results) {
        debug('packages');

        var Packages = require('./packages');
        var packages = new Packages(
          results.db,
          results.eventBus,
          results.users
        );

        callback(
          null,
          packages
        );
      }
    ],
    'stats': [
      'collections',
      'syncWrapper',
      function (callback, results) {
        debug('stats');

        var Stats = require('./stats');

        debug('stats');

        callback(
          null,
          new Stats(
            results.collections,
            results.syncWrapper))
      }
    ],
    'remoteDbs': [
      'db',
      'connect',
      function (callback, results) {
        debug('remoteDbs');

        var RemoteDBs = require('./remote-dbs');

        callback(
          null,
          new RemoteDBs(
            results.db,
            results.connect)
        )
      }
    ],
    'workflows': [
      'remoteDbs',
      'collections',
      'users',
      'permissions',
      'packages',
      'boxes',
      'eventBus',
      function (callback, results) {
        debug('workflows');

        var Workflows = require('./workflows');

        callback(
          null,
          new Workflows(
            results.remoteDbs,
            results.collections,
            results.users,
            results.permissions,
            results.packages,
            results.boxes,
            results.eventBus
          ));
      }
    ],
    'schedules': [
      'boxes',
      'collections',
      'workflows',
      function (callback, results) {
        debug('schedules');

        var Schedules = require('./schedules');

        callback(
          null,
          new Schedules(
            results.boxes,
            results.collections,
            results.workflows
          )
        )
      }
    ]
  },
  function (err, results) {
    if (err) return callback(err);

    callback(null, results);
    // todo: workflows
    // todo: stats
    // todo: schedules
  });
};
