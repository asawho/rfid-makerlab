var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var _ = require('lodash');
var request = require('request-promise-native');
module.exports = class AccessList {
    constructor(machineId, cachedAccessListLocation, serverURL, pollInterval, logger) {
        this.machineId = machineId.toLowerCase();
        this.serverURL = serverURL;
        this.cachedAccessListLocation = cachedAccessListLocation;
        this.pollInterval = pollInterval;
        this.logger = logger;
        this.list = [];
        this.startPolling();
    }
    startPolling() {
        if (fs.exists(this.cachedAccessListLocation)) {
            this.list = JSON.parse(fs.readFileSync(this.cachedAccessListLocation));
        }
        else {
            this.list = [];
        }
        var fn = () => {
            request.get(this.serverURL + '/' + this.machineId).auth('admin', 'password').json()
                .then((data) => {
                this.list = data;
                mkdirp.sync(path.dirname(this.cachedAccessListLocation));
                fs.writeFileSync(this.cachedAccessListLocation, JSON.stringify(data, null, 3));
                setTimeout(fn, this.pollInterval);
            }, (err) => {
                this.logger.error({ machineId: this.machineId, message: 'Unable to get access list from ' + this.serverURL + ' using stored access list.' });
                setTimeout(fn, this.pollInterval);
            });
        };
        fn();
    }
    authorize(rfid) {
        rfid = (rfid || "").substring(0, 10).toUpperCase();
        var user = rfid ? _.find(this.list, (a) => (a.rfid || "").substring(0, 10).toUpperCase() == rfid) : undefined;
        return ({
            user: user ? _.clone(user) : undefined,
            rfid: rfid,
            authorized: user && user.enabled == 'x' && user[this.machineId] == 'x'
        });
    }
};
//# sourceMappingURL=accessList.js.map