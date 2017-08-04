var path = require('path');
var express = require('express');
var request = require('request-promise-native');
var bodyParser = require('body-parser');
var _ = require('lodash');
var wemo = require('./services/wemo-wrapper');
var config = require('./config/serverConfig');
var machines = config.machines;
wemo.setup();
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/static', express.static(path.join(__dirname, 'client')));
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/client/index.html'));
});
app.get('/machine-status', function (req, res) {
    res.status(200).json(machines.map((a) => a.toClientVM()));
});
app.get('/client-request-scan/:machineid', function (req, res) {
    var chosen = _.find(machines, (a) => a.id === req.params.machineid);
    if (chosen) {
        var timer, listener;
        chosen.isScanning = true;
        if (chosen.inUse) {
            chosen.isScanning = false;
            chosen.disable('Greg');
            chosen.addClientMessage('Disabled');
        }
        else {
            var action = _.random(0, 2);
            if (action == 0 || chosen.name == 'Ultimaker') {
                chosen.isScanning = false;
                chosen.enable('Greg');
                chosen.addClientMessage('Enabled');
            }
            else if (action == 1) {
                chosen.isScanning = false;
                chosen.addClientMessage('Not Authorized');
            }
            else {
                timer = setTimeout(() => {
                    chosen.isScanning = false;
                    chosen.addClientMessage('No Scan Detected');
                }, 15000);
            }
        }
        res.status(200).json({ msg: 'Scanning...' });
    }
    else {
        res.status(500).json({ msg: 'Unknown machine ' + req.params.machineid });
    }
});
app.get('/rfid-scan/:rfid/:machineid/:enabled', function (req, res) {
    console.log('Request rfidscan: ' + req.params.rfid + ' ' + req.params.machineid + ' ' + req.params.enabled);
    var chosen = _.find(machines, (a) => a.id === req.params.machineid);
    if (req.params.rfid && chosen) {
        var authorized = true;
        if (authorized) {
            chosen.flip('Sam', (req.params.enabled || '').toLowerCase() == 'true');
            res.status(200).json({ authorized: true });
        }
        else {
            res.status(200).json({ authorized: false });
        }
    }
    else {
        res.status(500).json({ msg: 'Unknown machine ' + req.params.machineid });
    }
});
app.listen(8082);
console.log('Listening on port: 8082');
//# sourceMappingURL=server.js.map