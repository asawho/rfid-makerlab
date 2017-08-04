
var _ = require('lodash');
var Wemo = require('wemo-client');

class WemoWrapper {
    constructor() {
        this.wemo=undefined;
        this.isSetup=false;
        this.discoveryTimer=undefined;

        this.devices=[];
    }

    setup () {
        var discoverFn = (err, deviceInfo) => {
            //console.log(deviceInfo);
            console.log('Wemo Device Found: %j', JSON.stringify(deviceInfo, null, 3));
            
            // Get the client for the found device
            var client = this.wemo.client(deviceInfo);

            // You definitely want to listen to error events (e.g. device went offline),
            // Node will throw them as an exception if they are left unhandled  
            client.on('error', function(err) {
                console.log('Error: %s', err.code);
            });

            // Handle BinaryState events
            client.on('binaryState', function(value) {
                console.log('Binary State changed to: %s', value);
            });

            this.devices.push(client);
        };
       
        this.wemo = new Wemo();
        this.discoveryTimer= setInterval(() => {
            this.wemo.discover(discoverFn);
        }, 30000);
        this.wemo.discover(discoverFn);
        this.isSetup = true;
    }

    destroy() {
        if (this.discoveryTimer) clearInterval(this.discoveryTimer);
    }

    setBinaryState(macAddress, enabled) {
        //console.log("Yo: " + JSON.stringify(this.devices, null, 3))
       var cm =  _.find(this.devices, (a) => a.device.macAddress==macAddress);
       if (cm) {
           cm.setBinaryState(enabled ? 1 : 0);
       } else {
           console.log('Unable to find wemo device: ' + macAddress);
       }
    }
}

module.exports = new WemoWrapper();


