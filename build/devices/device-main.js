var os = require('os');
var path = require('path');
var winston = require('winston');
var _ = require('lodash');
var cfg = require('./device-config');
var AccessList = require('./lib/accessList');
var DoorID12LA = require('./door-id12la');
var PlugID12LA = require('./plug-id12la');
var PlugPhidget = require('./plug-phidget');
var hostName = os.hostname().toLowerCase();
console.log('Device Host: ' + hostName);
var logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: __dirname + '/data/error.log', level: 'error' }),
        new winston.transports.Http({ host: cfg.serverHost, port: cfg.serverPort, path: cfg.serverLogPath,
            auth: { username: process.env.BASIC_USER || 'admin', password: process.env.BASIC_PASSWORD || 'password' } })
    ]
});
var accessList = new AccessList(hostName, __dirname + '/data/accesslist.json', cfg, logger);
var device;
var devcfg = _.find(cfg.devices, (q) => q.hostName == hostName);
if (devcfg) {
    if (devcfg.deviceType == 'DoorID12LA') {
        device = new DoorID12LA(hostName, accessList, logger);
    }
    if (devcfg.deviceType == 'PlugID12LA') {
        device = new PlugID12LA(hostName, accessList, logger);
    }
    else if (devcfg.deviceType == 'PlugPhidget') {
        device = new PlugPhidget(hostName, accessList, logger);
    }
    if (device) {
        device.setup().catch((err) => {
            logger.error({ machineId: hostName, msg: 'Error during hardware setup:' + err.message });
            process.exit(1);
        });
    }
    else {
        console.log('Invalid device type: ' + devcfg.deviceType);
    }
}
else {
    console.log('No device configuration found in device-config.js for host: ' + hostName);
}
function fnExit() {
    if (device) {
        device.destroy();
    }
    process.exit();
}
process.on('exit', fnExit);
process.on('SIGINT', fnExit);
process.on('uncaughtException', fnExit);
//# sourceMappingURL=device-main.js.map