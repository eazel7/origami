var SandboxedModule = require('sandboxed-module');

var user = SandboxedModule.require('./user', {
  requires: {'mysql': {fake: 'mysql module'}},
  globals: {myGlobal: 'variable'},
  locals: {myLocal: 'other variable'},
});

