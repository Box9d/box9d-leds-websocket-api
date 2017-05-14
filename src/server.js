var express = require('express');
var bodyParser = require('body-parser');
var Stopwatch = require("node-stopwatch").Stopwatch;
var WebSocket = require('ws');

const config = {
    port: 8003,
    fadecandyPort: 7890
}

var frames = [];
var stopwatch = Stopwatch.create();
var isConnectionOpen = false;
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

    if (!frameRate) {
        throw 'Framerate not provided';
    }

    var totalSeconds = frames.length / frameRate;
    
    console.log('Starting playback');
    stopwatch.reset();
    stopwatch.start();

    while (stopwatch.elapsedMilliseconds < totalSeconds * 1000) {

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
}

app = express();
app.use(bodyParser());
app.setHeader
app.get('/api/frames', getFrames);
app.post('/api/load', loadFrames);
app.get('/api/checkConnection', checkConnection);
app.post('/api/play', play);

app.listen(8003, function () {
});