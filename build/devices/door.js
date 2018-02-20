var cfg = require('./config');
var path = require('path');
var winston = require('winston');
var SerialPort = require('serialport');

var rpio = require('rpio');
var _ = require('lodash');

var AccessList = require('./lib/accessList');

//Configure winston to log to the logging server
var logger = new (winston.Logger)({
    level: 'info',
    transports: [
        //This will log all activity to the server
        new (winston.transports.Http)(cfg.winstonHttpTransport),  
        //Log errors locally as well just in case we can't contact the server
        new (winston.transports.File)({
            filename: __dirname + cfg.logErrorLocation,
            level: 'error'
        }),  
        //Debug for now
        new (winston.transports.Console)()
    ]
});

// Start polling the server for authorization updates
var fname = __dirname + cfg.cachedAccessListLocation;
var accessList = new AccessList(cfg.machineId, fname, cfg.accessListServer, cfg.accessListPollInterval, logger);

// Setup the hardware for this device
var openTimer=undefined;
var doorPin = 36;	//Physical
rpio.open(doorPin, rpio.OUTPUT, rpio.LOW);  //Start locked

//Start polling the RFID to watch for card scans
var port = new SerialPort(cfg.rfidPort, { baudRate: 9600 });
var parser = new SerialPort.parsers.Readline('\n');

port.pipe(parser);
parser.on('data', function(data) {
    //If the user is not authorized don't open the door
    var access = accessList.authorize(data);
    if (!access.authorized) {
        logger.info({ machineId : cfg.machineId, user: access.user ? access.user.name : 'Unknown', rfid: access.rfid, message: 'denied' });
    } 
    //Open the door
    else {
        if (openTimer) { clearTimeout(openTimer); }
        //Close the door in 5 seconds
        openTimer = setTimeout(() => { 
            openTimer=undefined;
            rpio.write(doorPin, 0); 
        }, 5000);
        
        //Open the door now
        rpio.write(doorPin, 1); 
        logger.info({ machineId : cfg.machineId, user: access.user.name, rfid: access.rfid, message: 'unlocked' });
    }
});
