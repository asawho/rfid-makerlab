var _ = require('lodash');
var moment = require('moment');
var wemo = require('./wemo-wrapper');
class Machine {
    constructor(options) {
        this.id = options.id || options.name;
        this.name = options.name;
        this.type = options.type;
        this.url = options.url;
        this.inUse = options.inUse;
        this.inUseBy = options.inUseBy;
        this.inUseStarted = options.inUseStarted;
        this.image = options.image;
        this.isScanning = false;
        this.scanStarted = undefined;
        this.clientMessages = [];
    }
    toClientVM() {
        this.clientMessages = _.filter(this.clientMessages, (a) => a.expires > Date.now());
        return ({
            id: this.id,
            name: this.name,
            inUse: this.inUse,
            inUseBy: this.inUseBy,
            inUseStarted: this.inUseStarted,
            image: this.image,
            isScanning: this.isScanning,
            messages: this.clientMessages.map((a) => a.msg)
        });
    }
    flip(user, enabled) {
        if (this.type === 'piserver') {
            var route = enabled ? 'plug-enable' : 'plug-disable';
            console.log('Calling: ' + this.url + route);
            request.get(this.url + route);
        }
        else if (this.type === 'openhab') {
            var value = enabled ? 'ON' : 'OFF';
            console.log('Calling: ' + this.url + ' ' + value);
            request.post(this.url, { body: value });
        }
        else if (this.type === 'node-wemo-client') {
            wemo.setBinaryState(this.url, enabled);
        }
        else {
        }
        if (enabled && this.inUse && this.inUseBy == user)
            return;
        this.inUse = enabled;
        this.inUseBy = user;
        this.inUseStarted = enabled ? Date.now() : undefined;
    }
    enable(user) {
        this.flip(user, true);
    }
    disable(user) {
        this.flip(user, false);
    }
    addClientMessage(msg) {
        this.clientMessages.push({
            expires: Date.now() + 3000,
            msg: msg
        });
    }
    deviceAvailable() {
    }
}
module.exports = Machine;
//# sourceMappingURL=machine.js.map