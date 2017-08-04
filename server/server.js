var path = require('path');
var express = require('express');
var request = require('request-promise-native');
var bodyParser = require('body-parser');
var _ = require('lodash');

var wemo = require('./services/wemo-wrapper');

var config = require('./config/serverConfig');
var machines = config.machines;

//Setup wemo device singleton/scanner
wemo.setup();

//Configure Server
var app = express();

//Middleware -----------------------------------------------------
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use('/static', express.static(path.join(__dirname, 'client')));	//send everything in the static folder straight up

//Default static route--------------------------------------------
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/client/index.html'));
});

//API Routes------------------------------------------------------

//Machine statues
app.get('/machine-status', function (req, res) {
	res.status(200).json(machines.map((a) => a.toClientVM()));
});

//Set timer and machine id for client chosen scan
app.get('/client-request-scan/:machineid', function (req, res) {
	var chosen = _.find(machines,(a) => a.id===req.params.machineid);
	if (chosen) {
		var timer, listener;

		//Set to start scanning, give them 15 seconds to scan before clearing
		chosen.isScanning = true;
		//Start the serial port listener
		/*listener = serialport.on(() => {
			if (timer) { clearTimeout(timer); }
			...
			authorize
			call chosen.flip();
		}));*/
		if (chosen.inUse) {
			chosen.isScanning=false;
			chosen.disable('Greg');	
			chosen.addClientMessage('Disabled');		
		} else {
			//Randomly succeed or fail after 3 seconds
			var action = _.random(0,2);
			if (action==0 || chosen.name=='Ultimaker') {
				//succeed
				chosen.isScanning=false;
				chosen.enable('Greg');
				chosen.addClientMessage('Enabled');
			} else if (action==1) {
				//fail
				chosen.isScanning=false;	
				chosen.addClientMessage('Not Authorized');
			} else {
				//do nothing, timeout
				timer = setTimeout(() => {
					chosen.isScanning = false;
					chosen.addClientMessage('No Scan Detected');
					//listener.off
				}, 15000);
			}
		}
		res.status(200).json({ msg: 'Scanning...'});
	} else {
		res.status(500).json({ msg:'Unknown machine ' + req.params.machineid });
	}
});

//External scan event
app.get('/rfid-scan/:rfid/:machineid/:enabled', function (req, res) {
	console.log('Request rfidscan: ' + req.params.rfid + ' ' + req.params.machineid + ' ' + req.params.enabled);
	var chosen = _.find(machines,(a) => a.id===req.params.machineid);
	if (req.params.rfid && chosen) {
		//Check spreadsheet against rfid and machineid
		var authorized=true;

		//Set machine state
		if (authorized) {
			chosen.flip('Sam', (req.params.enabled || '').toLowerCase()=='true');
			res.status(200).json({ authorized: true });

		} else {
			res.status(200).json({ authorized: false });
		}
	} 
	else {
	    res.status(500).json({ msg:'Unknown machine ' + req.params.machineid });
	}
});

//Initialize server
app.listen(8082);
console.log('Listening on port: 8082');
