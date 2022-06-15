const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
var rpio = require('rpio');
var _ = require('lodash');

module.exports = class PlugID12LA {
    constructor (machineId, accessList, logger, rfidPort) {
        this.machineId = machineId;
        this.accessList = accessList;
        this.logger = logger;
        this.rfidPort = rfidPort || '/dev/ttyUSB0';

        this.doorPin = 36;	//Physical

        this.openTimer = undefined;
        this.serialport=undefined;        
    }

    destroy() {
        //Disconnect and turn off
        if (this.openTimer) clearTimeout(this.openTimer);
        this.openTimer = undefined;
        if (this.serialport) this.serialport.close();
        this.serialport=undefined;
        rpio.write(this.doorPin, 0);    
        rpio.destroy();
    }

    setup() {
        // Setup the hardware for this device
        rpio.init({gpiomem: true, mapping: 'physical'});
        rpio.open(this.doorPin, rpio.OUTPUT, rpio.LOW);  //Start locked

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
                if (this.openTimer) { clearTimeout(this.openTimer); }
                //Close the door in 5 seconds
                this.openTimer = setTimeout(() => { 
                    this.openTimer=undefined;
                    rpio.write(this.doorPin, 0); 
                }, 3500);
                
                //Open the door now
                rpio.write(this.doorPin, 1); 
                this.logger.info({ machineId : this.machineId, user: access.user.name, rfid: access.rfid, message: 'unlocked' });
            }
        });
    }
}
