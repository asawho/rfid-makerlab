var SerialPort = require('serialport');
var rpio = require('rpio');
var _ = require('lodash');

module.exports = class PlugID12LA {
    constructor (machineId, accessList, logger, rfidPort) {
        this.machineId = machineId;
        this.accessList = accessList;
        this.logger = logger;
        this.rfidPort = rfidPort || '/dev/ttyUSB0';

        this.blnPlugOn = false;
        this.plugUser = undefined;
        this.ledPin = 29;	//Physical
        this.optoPin = 37;   //Physical
        this.plugPin = 32;   //Physical

        this.intervalTimer = undefined;
        this.serialport=undefined;
    }

    destroy() {
        //Disconnect and turn off
        if (this.intervalTimer) clearInterval(this.intervalTimer);
        this.intervalTimer = undefined;
        if (this.serialport) this.serialport.close();
        this.serialport=undefined;
        rpio.write(this.plugPin, 0);    
        rpio.write(this.ledPin, 0);    
        this.blnPlugOn = false;
        this.plugUser = undefined;
        rpio.destroy();
    }

    setup() {
        // Setup the hardware for this device
        rpio.init({gpiomem: true, mapping: 'physical'});
        rpio.open(this.ledPin, rpio.OUTPUT, rpio.LOW);
        rpio.open(this.plugPin, rpio.OUTPUT, rpio.LOW);
        rpio.open(this.optoPin, rpio.INPUT, rpio.PULL_OFF);

        //Start the heartbeat pulse
        this.intervalTimer = setInterval(() => {
            if (!this.blnPlugOn) {
                rpio.write(this.ledPin, 1); 
                setTimeout(() => { 
                    if (!this.blnPlugOn) {
                        rpio.write(this.ledPin, 0); 
                    }
                }, 500);
            }
        }, 10*1000);

        //Start polling the opto switch to watch for card removal
        rpio.poll(this.optoPin, ()=>{
            var val = rpio.read(this.optoPin);
            //No card, turn it off
            if (val && this.blnPlugOn) {
                this.logger.info({ machineId : this.machineId, user: this.plugUser.name, rfid: this.plugUser.rfid, message: 'disabled' });
                rpio.write(this.ledPin, 0);
                rpio.write(this.plugPin, 0);    
                this.blnPlugOn=false;
            } 
        });

        //Start polling the RFID to watch for card scans
        this.serialport = new SerialPort(this.rfidPort, { baudRate: 9600 });
        var parser = new SerialPort.parsers.Readline('\n');

        this.serialport.pipe(parser);
        parser.on('data', (data) => {
            data = this.accessList.normalize(data, 'ID12LA');

            //If the user is not authorized, blink the led twice and log it
            var access = this.accessList.authorize(data);
            if (!access.authorized) {
                this.logger.info({ machineId : this.machineId, user: access.user ? access.user.name : 'Unknown', rfid: access.rfid, message: 'denied' });
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
                //Authorized user, now wait 250ms and check to see if the optoPin is also enabled
                setTimeout(() => {
                    var val = rpio.read(this.optoPin);
                    if (!val) {                
                        this.logger.info({ machineId : this.machineId, user: access.user.name, rfid: access.rfid, message: 'enabled' });
                        rpio.write(this.ledPin, 1);
                        rpio.write(this.plugPin, 1); 
                        this.blnPlugOn=true;                   
                        this.plugUser = access.user;
                    }
                }, 250);
            }
        });

        //Setup returns a promise that may throw an error (but not in this case), so lets make one
        new Promise(function(resolve, reject) { reslove(''); });
    }
}
