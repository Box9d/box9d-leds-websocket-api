var express = require('express');
var bodyParser = require('body-parser');
var Stopwatch = require("node-stopwatch").Stopwatch;
var WebSocket = require('ws');
var moment = require('moment');
var Client = require('node-rest-client').Client;

const config = {
    port: 8003,
    fadecandyPort: 7890
}

var frames = [];
var stopwatch = Stopwatch.create();
var isConnectionOpen = false;
var cancel = false;
var ws = {};

loadFrames = function(req, res) {
    frames = req.body.frames;

    ws = new WebSocket('ws://localhost:' + config.fadecandyPort);
    ws.on('open', function open() {
        isConnectionOpen = true;
    });
    ws.on('close', function close() {
         isConnectionOpen = false;
    });
    res.setHeader('Content-Type', 'application/json');
    res.sendStatus(200);
}

checkConnection = function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send({isConnectionOpen});
}

getFrames = function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send({frames});
}

play = function(req, res) {
    var frameRate = req.body.frameRate;
    var playAt = req.body.playAt;
    var timeReferenceUrl = req.body.timeReferenceUrl;
    cancel = false;

    if (!frameRate) {
        throw 'Framerate not provided';
    }

    if (!playAt) {
        throw 'Could not find a start time for playing the video';
    }

    if (!timeReferenceUrl) {
        throw 'Could not find URL for server time reference';
    }

    var client = new Client();
    client.get(timeReferenceUrl, function (data, response) {
        if (!data.Successful || !data.Result) {
            throw 'Error whilst retrieving server time';
        }

        var serverTime = moment(data.Result);
        var startTime = moment(playAt);
        console.log('Starting video at ' + playAt);

        var delay = startTime.diff(serverTime);

        setTimeout(function() {
            var totalSeconds = frames.length / frameRate;
        
            console.log('Starting playback');
            stopwatch.reset();
            stopwatch.start();

            while (stopwatch.elapsedMilliseconds < totalSeconds * 1000 && !cancel) {

                if (!isConnectionOpen) {
                    throw 'Connection to Fadecandy is closed';
                }

                var frameNumber = Math.round((stopwatch.elapsedMilliseconds / 1000) * frameRate);

                var frame = frames[frameNumber];

                if (frame) {
                    ws.send(frame);
                    console.log('sending frame ' + frameNumber);
                }
            }
            console.log('Finished playback');

            stopwatch.stop();
            stopwatch.reset();
            ws.close();
            ws = {};
            console.log('Connection closed');

            res.setHeader('Content-Type', 'application/json');
            res.sendStatus(201);
        }, delay);
    });
}

stop = function(req, res) {
    cancel = true;
}

app = express();
app.use(bodyParser({limit: '1000mb'}));
app.setHeader
app.get('/api/frames', getFrames);
app.post('/api/load', loadFrames);
app.get('/api/checkConnection', checkConnection);
app.post('/api/play', play);
app.post('/api/stop', stop);

app.listen(8003, function () {
});