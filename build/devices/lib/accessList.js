var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var _ = require('lodash');
var request = require('request-promise-native');
module.exports = class AccessList {
    constructor(machineId, cachedAccessListLocation, cfg, logger) {
        this.machineId = machineId.toLowerCase();
        this.serverURL = cfg.accessListServer;
        this.cachedAccessListLocation = cachedAccessListLocation;
        this.pollInterval = cfg.accessListPollInterval;
        this.logger = logger;
        this.list = [];
        this.authUser = process.env.BASIC_USER || 'admin';
        this.authPassword = process.env.BASIC_PASSWORD || 'password';
        this.startPolling();
    }
    startPolling() {
        if (fs.existsSync(this.cachedAccessListLocation)) {
            this.list = JSON.parse(fs.readFileSync(this.cachedAccessListLocation));
        }
        else {
            this.list = [];
        }
        var fn = () => {
            request.get(this.serverURL + '/' + this.machineId).auth(this.authUser, this.authPassword).json()
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
    normalize(rfid, readerType) {
        if (readerType == 'ID12LA') {
            rfid = (rfid || "").replace(/[\n\r\s ]/g, "").substring(1);
            if (rfid.length > 12) {
                rfid = rfid.substring(1);
            }
        }
        return ((rfid || "").substring(0, 10).toUpperCase());
    }
    authorize(rfid) {
        var user = rfid ? _.find(this.list, (a) => (a.rfid || "").substring(0, 10).toUpperCase() == rfid) : undefined;
        user = user ? _.clone(user) : undefined;
        if (user) {
            user.rfid = this.normalize(user.rfid);
        }
        return ({
            user: user,
            rfid: rfid,
            authorized: user && (user.enabled == 'x' || (user.enabled || '').toLowerCase() == 'true') && (user[this.machineId] == 'x' || (user[this.machineId] || "").toLowerCase() == 'true')
        });
    }
};
//# sourceMappingURL=accessList.js.map