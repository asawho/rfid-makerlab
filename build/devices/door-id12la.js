var SerialPort = require('serialport');
var rpio = require('rpio');
var _ = require('lodash');
module.exports = class PlugID12LA {
    constructor(machineId, accessList, logger, rfidPort) {
        this.machineId = machineId;
        this.accessList = accessList;
        this.logger = logger;
        this.rfidPort = rfidPort || '/dev/ttyUSB0';
        this.doorPin = 36;
        this.openTimer = undefined;
        this.serialport = undefined;
    }
    destroy() {
        if (this.openTimer)
            clearTimeout(this.openTimer);
        this.openTimer = undefined;
        if (this.serialport)
            this.serialport.close();
        this.serialport = undefined;
        rpio.write(this.doorPin, 0);
        rpio.destroy();
    }
    setup() {
        rpio.init({ gpiomem: true, mapping: 'physical' });
        rpio.open(this.doorPin, rpio.OUTPUT, rpio.LOW);
        this.serialport = new SerialPort(this.rfidPort, { baudRate: 9600 });
        var parser = new SerialPort.parsers.Readline('\n');
        this.serialport.pipe(parser);
        parser.on('data', (data) => {
            data = this.accessList.normalize(data, 'ID12LA');
            var access = this.accessList.authorize(data);
            if (!access.authorized) {
                this.logger.info({ machineId: this.machineId, user: access.user ? access.user.name : 'Unknown', rfid: access.rfid, message: 'denied' });
            }
            else {
                if (this.openTimer) {
                    clearTimeout(this.openTimer);
                }
                this.openTimer = setTimeout(() => {
                    this.openTimer = undefined;
                    rpio.write(this.doorPin, 0);
                }, 3500);
                rpio.write(this.doorPin, 1);
                this.logger.info({ machineId: this.machineId, user: access.user.name, rfid: access.rfid, message: 'unlocked' });
            }
        });
    }
};
//# sourceMappingURL=door-id12la.js.map