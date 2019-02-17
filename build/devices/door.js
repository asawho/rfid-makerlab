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
var openTimer = undefined;
var doorPin = 36;
rpio.open(doorPin, rpio.OUTPUT, rpio.LOW);
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
        }
        else {
            if (openTimer) {
                clearTimeout(openTimer);
            }
            openTimer = setTimeout(() => {
                openTimer = undefined;
                rpio.write(doorPin, 0);
            }, 3500);
            rpio.write(doorPin, 1);
            logger.info({ machineId: cfg.machineId, user: access.user.name, rfid: access.rfid, message: 'unlocked' });
        }
    }
});
//# sourceMappingURL=door.js.map