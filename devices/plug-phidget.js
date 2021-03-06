var rpio = require('rpio');
var phidget22 = require('phidget22');
var _ = require('lodash');

module.exports = class PlugPhidget {
    constructor (machineId, accessList, logger) {
        this.machineId = machineId;
        this.accessList = accessList;
        this.logger = logger;

        this.blnPlugOn = false;
        this.plugUser = undefined;
        this.plugPin = 11;              //Physical

        this.phidgetConnection = undefined;
        this.SERVER_PORT = 5661;
        this.SERVER_HOST = 'localhost';
    }

    destroy() {
        rpio.write(this.plugPin, 0);    
        //Disconnect and turn off
        if (this.phidgetConnection) {
            this.phidgetConnection.close();
        }
        this.blnPlugOn = false;
        this.plugUser = undefined;
    }

    setup() {
        // Setup the gpio for this device
        rpio.init({gpiomem: true, mapping: 'physical'});
        rpio.open(this.plugPin, rpio.OUTPUT, rpio.LOW);

        // Setup the rfid reader for this device
        var conn = new phidget22.Connection(this.SERVER_PORT, this.SERVER_HOST, { name: 'Server Connection', passwd: '' });
        this.phidgetConnection = conn;
        return (conn.connect()
            .then(() => {
                console.log('Connected to Phidget Network Server');
                var ch = new phidget22.RFID();
                ch.onTag = (tag, protocol) => {
                    var protocolStr;
                    switch (protocol) {
                        case phidget22.RFIDProtocol.EM4100:
                            protocolStr = 'EM4100';
                            break;
                        case phidget22.RFIDProtocol.ISO11785_FDX_B:
                            protocolStr = 'ISO11785_FDX_B';
                            break;
                        case phidget22.RFIDProtocol.PHIDGET_TAG:
                            protocolStr = 'PHIDGET_TAG';
                            break;
                    }
                    //console.log('Tag: ' + tag + "\tProtocol: " + protocolStr);
                    tag = this.accessList.normalize(tag);                    
                    var access = this.accessList.authorize(tag);
                    if (!access.authorized) {
                        //console.log('Denied');
                        this.logger.info({ machineId : this.machineId, user: access.user ? access.user.name : 'Unknown', rfid: access.rfid, message: 'denied' });
                    } 
                    else {
                        //console.log('Plug On');
                        this.logger.info({ machineId : this.machineId, user: access.user.name, rfid: access.rfid, message: 'enabled' });
                        rpio.write(this.plugPin, 1); 
                        this.blnPlugOn=true;                   
                        this.plugUser = access.user;
                    }
                };    
                ch.onTagLost = (tag, protocol) => {
                    //console.log('TagLost: ' + tag);
                    //console.log('Plug Off');
                    tag = this.accessList.normalize(tag);
                    if (this.blnPlugOn) {
                        this.logger.info({ machineId : this.machineId, user: this.plugUser.name, rfid: this.plugUser.rfid, message: 'disabled' });
                        rpio.write(this.plugPin, 0);    
                        this.blnPlugOn=false;
                    } 
                };

                return (ch.open(3000).then(function (ch) {
                    console.log('Connected to Phidget RFID');
                    //console.log('Antenna On: ' + ch.getAntennaEnabled());
                    //ch.setAntennaEnabled(true);
                }));
            }));
    }
}