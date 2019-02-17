var SerialPort = require('serialport');
var rpio = require('rpio');
var _ = require('lodash');
module.exports = class PlugID12LA {
    constructor(machineId, accessList, logger, rfidPort) {
        this.machineId = machineId;
        this.accessList = accessList;
        this.logger = logger;
        this.rfidPort = rfidPort || '/dev/ttyUSB0';
        this.blnPlugOn = false;
        this.plugUser = undefined;
        this.ledPin = 29;
        this.optoPin = 37;
        this.plugPin = 32;
        this.intervalTimer = undefined;
        this.serialport = undefined;
    }
    destroy() {
        if (this.intervalTimer)
            clearInterval(this.intervalTimer);
        this.intervalTimer = undefined;
        if (this.serialport)
            this.serialport.close();
        this.serialport = undefined;
        rpio.write(this.plugPin, 0);
        rpio.write(this.ledPin, 0);
        this.blnPlugOn = false;
        this.plugUser = undefined;
        rpio.destroy();
    }
    setup() {
        rpio.init({ gpiomem: true, mapping: 'physical' });
        rpio.open(this.ledPin, rpio.OUTPUT, rpio.LOW);
        rpio.open(this.plugPin, rpio.OUTPUT, rpio.LOW);
        rpio.open(this.optoPin, rpio.INPUT, rpio.PULL_OFF);
        this.intervalTimer = setInterval(() => {
            if (!this.blnPlugOn) {
                rpio.write(this.ledPin, 1);
                setTimeout(() => {
                    if (!this.blnPlugOn) {
                        rpio.write(this.ledPin, 0);
                    }
                }, 500);
            }
        }, 10 * 1000);
        rpio.poll(this.optoPin, () => {
            var val = rpio.read(this.optoPin);
            if (val && this.blnPlugOn) {
                this.logger.info({ machineId: this.machineId, user: this.plugUser.name, rfid: this.plugUser.rfid, message: 'disabled' });
                rpio.write(this.ledPin, 0);
                rpio.write(this.plugPin, 0);
                this.blnPlugOn = false;
            }
        });
        this.serialport = new SerialPort(this.rfidPort, { baudRate: 9600 });
        var parser = new SerialPort.parsers.Readline('\n');
        this.serialport.pipe(parser);
        parser.on('data', (data) => {
            data = (data || "").replace(/[\n\r\s ]/g, "").substring(1);
            if (data.length > 12) {
                data = data.substring(1);
            }
            var access = this.accessList.authorize(data);
            if (!access.authorized) {
                this.logger.info({ machineId: this.machineId, user: access.user ? access.user.name : 'Unknown', rfid: access.rfid, message: 'denied' });
                rpio.write(this.ledPin, 1);
                setTimeout(() => {
                    rpio.write(this.ledPin, 0);
                    setTimeout(() => {
                        rpio.write(this.ledPin, 1);
                        setTimeout(() => {
                            rpio.write(this.ledPin, 0);
                        }, 500);
                    }, 500);
                }, 500);
            }
            else {
                setTimeout(() => {
                    var val = rpio.read(this.optoPin);
                    if (!val) {
                        this.logger.info({ machineId: this.machineId, user: access.user.name, rfid: access.rfid, message: 'enabled' });
                        rpio.write(this.ledPin, 1);
                        rpio.write(this.plugPin, 1);
                        this.blnPlugOn = true;
                        this.plugUser = access.user;
                    }
                }, 250);
            }
        });
        new Promise(function (resolve, reject) { reslove(''); });
    }
};
//# sourceMappingURL=plug-id12la.js.map