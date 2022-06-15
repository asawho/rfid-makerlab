const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { exec } = require("child_process");

var _ = require('lodash');

module.exports = class DoorID12LAWyzeLock {
    constructor (machineId, accessList, logger, options) {
        options=options || {};

        this.machineId = machineId;
        this.accessList = accessList;
        this.logger = logger;
        this.rfidPort = options.rfidPort || '/dev/ttyUSB0';
        this.email = options.email;
        this.password = options.password;
        this.mac = options.mac;
        if (!this.email) throw new Error ('Email address must be set for Wyze Lock');
        if (!this.password) throw new Error ('Password must be set for Wyze Lock');
        if (!this.mac) throw new Error ('Mac must be set for Wyze Lock');

        this.serialport=undefined;        
    }

    destroy() {
        //Disconnect and turn off
        if (this.serialport) this.serialport.close();
        this.serialport=undefined;
    }

    setup() {
        //Start polling the RFID to watch for card scans
        this.serialport = new SerialPort({ path: this.rfidPort, baudRate: 9600 });
        const parser = this.serialport.pipe(new ReadlineParser({ delimiter: '\n' }))
        parser.on('data', (data) => {
            data = this.accessList.normalize(data, 'ID12LA');
            
            //If the user is not authorized don't open the door
            var access = this.accessList.authorize(data);
            if (!access.authorized) {
                this.logger.info({ machineId : this.machineId, user: access.user ? access.user.name : 'Unknown', rfid: access.rfid, message: 'denied' });
            } 
            //Open the door
            else {
                //Open the door now
                exec("/home/pi/rfid-makerlab/devices/wyze-open-lock.py \"" + this.email + "\" \"" + this.password + "\" \"" + this.mac + "\"", (error, stdout, stderr) => {
                    if (error) {
                        this.logger.error({ machineId : this.machineId, user: access.user.name, rfid: access.rfid, message: 'failed to unlocked: ' + error.message });
                        return;
                    }
                    if (stderr) {
                        this.logger.error({ machineId : this.machineId, user: access.user.name, rfid: access.rfid, message: 'failed to unlocked: ' + stderr });
                        return;
                    }                    
                    this.logger.info({ machineId : this.machineId, user: access.user.name, rfid: access.rfid, message: 'unlocked' });
                });                
            }
        });
    }
}
