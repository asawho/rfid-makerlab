var cfg = require('./config');
var path = require('path');
var winston = require('winston');
var SerialPort = require('serialport');
var rpio = require('rpio');
var _ = require('lodash');
var AccessList = require('./lib/accessList');
var logger = new (winston.Logger)({
    level: 'info',
    transports: [
        new (winston.transports.Http)(cfg.winstonHttpTransport),
        new (winston.transports.File)({
            filename: __dirname + cfg.logErrorLocation,
            level: 'error'
        }),
        new (winston.transports.Console)()
    ]
});
var fname = __dirname + cfg.cachedAccessListLocation;
var accessList = new AccessList(cfg.machineId, fname, cfg.accessListServer, cfg.accessListPollInterval, logger);
var blnPlugOn = false;
var plugUser = undefined;
var ledPin = 29;
var optoPin = 37;
var plugPin = 32;
rpio.init({ gpiomem: true, mapping: 'physical' });
rpio.open(ledPin, rpio.OUTPUT, rpio.LOW);
rpio.open(plugPin, rpio.OUTPUT, rpio.LOW);
rpio.open(optoPin, rpio.INPUT, rpio.PULL_OFF);
setInterval(() => {
    if (!blnPlugOn) {
        rpio.write(ledPin, 1);
        setTimeout(() => {
            if (!blnPlugOn) {
                rpio.write(ledPin, 0);
            }
        }, 500);
    }
}, 10 * 1000);
rpio.poll(optoPin, () => {
    var val = rpio.read(optoPin);
    if (val && blnPlugOn) {
        logger.info({ machineId: cfg.machineId, user: plugUser.name, rfid: plugUser.rfid, message: 'disabled' });
        rpio.write(ledPin, 0);
        rpio.write(plugPin, 0);
        blnPlugOn = false;
    }
});
var port = new SerialPort(cfg.rfidPort, { baudRate: 9600 });
var parser = new SerialPort.parsers.Readline('\n');
port.pipe(parser);
parser.on('data', function (data) {
    data = (data || "").replace(/[\n\r\s ]/g, "").substring(1);
    if (data.length > 12) {
        data = data.substring(1);
        var access = accessList.authorize(data);
        if (!access.authorized) {
            logger.info({ machineId: cfg.machineId, user: access.user ? access.user.name : 'Unknown', rfid: access.rfid, message: 'denied' });
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
            setTimeout(() => {
                var val = rpio.read(optoPin);
                if (!val) {
                    logger.info({ machineId: cfg.machineId, user: access.user.name, rfid: access.rfid, message: 'enabled' });
                    rpio.write(ledPin, 1);
                    rpio.write(plugPin, 1);
                    blnPlugOn = true;
                    plugUser = access.user;
                }
            }, 250);
        }
    }
});
//# sourceMappingURL=plug.js.map