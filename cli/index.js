var args = process.argv.slice(2);

require('../api')(require('../config'), function (err, api) {
if (err) {
  console.error(err);
  process.exit(-1);
}

var commands = {
  'packs': require('./packs'),
  'boxes': require('./boxes')
};

function findCommand(commands, args) {
  var command = args[0];

  if (!commands[command]) {
    console.error('Invalid command');
    console.error('Options: ' + Object.keys(commands).join(', '));
    process.exit(-1);
  } else if (typeof(commands[command]) === 'object') {
    findCommand(commands[command], args.splice(1));
  } else if (typeof(commands[command]) === 'function') {
    commands[command](api, args.slice(1), process.stdin, process.stdout, process.stderr, process.exit);
  }
}

findCommand(commands, args);
});
