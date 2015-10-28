module.exports = function (api, args, stdin, stdout, stderr, exit) {
  api.boxes.listBoxes(function (err, boxes) {
    if (err) stderr.write(err + '\n');
    else {
      for (var i = 0; i < boxes.length; i++) {
        stdout.write('\u001b[3' +
        (boxes[i].info.status ? '2' : '1') +
        ';1m' + boxes[i].name + ': ' + (boxes[i].info.status ? 'active' : 'offline') +
        '\u001b[0m\n');

        if (boxes[i].info.description) stdout.write(boxes[i].info.description + '\n\n');
      }
    }

    exit(err ? -1 : 0);
  });
};
