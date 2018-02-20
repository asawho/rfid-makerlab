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
var blnPlugOn = false;
var plugUser = undefined;
var ledPin = 29;	//Physical
var optoPin = 37;   //Physical
var plugPin = 32;   //Physical
rpio.init({gpiomem: true, mapping: 'physical'});
rpio.open(ledPin, rpio.OUTPUT, rpio.LOW);
rpio.open(plugPin, rpio.OUTPUT, rpio.LOW);
rpio.open(optoPin, rpio.INPUT, rpio.PULL_OFF);

//Start the heartbeat pulse
setInterval(() => {
    if (!blnPlugOn) {
        rpio.write(ledPin, 1); 
        setTimeout(() => { 
            if (!blnPlugOn) {
                rpio.write(ledPin, 0); 
            }
        }, 500);
    }
}, 10*1000);

//Start polling the opto switch to watch for card removal
rpio.poll(optoPin, ()=>{
    var val = rpio.read(optoPin);
    //No card, turn it off
    if (val && blnPlugOn) {
        logger.info({ machineId : cfg.machineId, user: plugUser.name, rfid: plugUser.rfid, message: 'disabled' });
        rpio.write(ledPin, 0);
        rpio.write(plugPin, 0);    
        blnPlugOn=false;
    } 
});

//Start polling the RFID to watch for card scans
var port = new SerialPort(cfg.rfidPort, { baudRate: 9600 });
var parser = new SerialPort.parsers.Readline('\n');

port.pipe(parser);
parser.on('data', function(data) {
    //If the user is not authorized, blink the led twice and log it
    var access = accessList.authorize(data);
    if (!access.authorized) {
        logger.info({ machineId : cfg.machineId, user: access.user ? access.user.name : 'Unknown', rfid: access.rfid, message: 'denied' });
        rpio.write(ledPin, 1); 
        setTimeout(() => { 
            rpio.write(ledPin, 0); 
            setTimeout(() => { 
                rpio.write(ledPin, 1); 
                setTimeout(() => { 
                    rpio.write(ledPin, 0); 
                }, 500);
            }, 500);
        }, 500);
    } 
    else {
        //Authorized user, now wait 250ms and check to see if the optoPin is also enabled
        setTimeout(() => {
            var val = rpio.read(optoPin);
            if (!val) {                
                logger.info({ machineId : cfg.machineId, user: access.user.name, rfid: access.rfid, message: 'enabled' });
                rpio.write(ledPin, 1);
                rpio.write(plugPin, 1); 
                blnPlugOn=true;                   
                plugUser = access.user;
            }
        }, 250);
    }
});
