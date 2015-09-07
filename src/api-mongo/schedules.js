var nodeSched = require('node-schedule'), async = require('async');

module.exports = function (boxes, collections, workflows, callback) {
  var jobsBySched = {}, nextStarters = {};
  var self = {
    ensureSchedules: function (callback) {
      boxes.listBoxes(function (err, boxes) {
        if (err) return callback(err);
        
        var boxesToCheck = [];
        
        for (var i = 0; i < boxes.length; i++) {
          if (boxes[i].info && boxes[i].info.status) {
            boxesToCheck.push(boxes[i].name);
          }
        }
        
        async.eachSeries(boxesToCheck, function(boxName, callback) {
          collections.find(boxName, "_schedules", {running: true}, function (err, docs) {
            if(err) return callback(err);
            
            async.eachSeries(docs, function (doc, callback) {
              self.startSchedule(boxName, doc._id, function (err) {
                if (err) console.error(err);
                else console.log('Schedule ' + doc._id + ' for ' + boxName + ' restarted with server');
              });
            }, callback);
          });
        }, callback);
      });
    },
    stopSchedule: function (boxName, id, callback) {
      var j = jobsBySched[boxName + ':' + id], t = nextStarters[boxName + ':' + id];
      
      if (j) {
        j.cancel();
        jobsBySched[boxName + ':' + id] = null;
      }
      if (t) {
        clearTimeout(t);
        nextStarters[boxName + ':' + id] = null;
      }
      
      collections.update(boxName, "_schedules", { _id: id }, { $set: { running: false } }, callback);
    },
    startSchedule: function (boxName, id, callback) {
      if (jobsBySched[boxName + ':' + id]) return callback();
    
      collections.findOne(boxName, "_schedules", {_id: id}, function (err, sched) {
        if(err) return callback(err);
        
        if (!sched) return callback(new Error('Schedule not found'));
        if (!sched.running) return callback(new Error('Schedule isn\'t running'));
        
        var nextRun; freqInMillis = sched.frequency.amount * {'minutes': 60000, 'hours': 3600000}[sched.frequency.unit];
        if (!sched.lastRun) nextRun = 1000 + new Date().valueOf();
        else nextRun = sched.lastRun + (freqInMillis);
        
        if (nextRun < new Date().valueOf()) {
          nextRun = 1000 + new Date().valueOf();
        }
        
        console.log('next run at ' + new Date(nextRun) + ' which is in ' + String((nextRun - new Date().valueOf()) / 60000) + ' minutes');
        
        j = jobsBySched[boxName + ':' + id] = nodeSched.scheduleJob(new Date(nextRun), function(){
          var runningToday = sched.days[['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()]];
        
          collections.update(boxName, "_schedules", { _id: id }, { $set: { running: true, lastRun: new Date().valueOf() } }, function (err) {
            if (err) console.error(err);

            if (runningToday) {
              workflows.startWorkflow(boxName, sched.graph, {}, function (err, workflowId) {
                if (err) console.error(err);
                console.log('Workflow ' + workflowId + ' was scheduled by ' + id + ' for ' + boxName);
              });
            }
            
            console.log('preparing half-life starter of ' + id + ' for ' + boxName + ' in ' + String((freqInMillis / 2000)) + ' seconds');
            nextStarters[boxName + ':' + id] = setTimeout(function () {
              console.log('triggered half-life starter of ' + id + ' for ' + boxName);
              self.startSchedule(boxName, id, function (err) {
                if (err) {
                  console.error(err);
                  console.log('Seems that a scheduled job failed to re-enqueue itself');
                }
              });
            }, freqInMillis / 2);
            
            jobsBySched[boxName + ':' + id] = null;
          });
        });
        
        callback();
      });
    }
  };

  callback(null, self);
};
