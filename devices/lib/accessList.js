var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var _ = require('lodash');
var request = require('request-promise-native');

module.exports = class AccessList {
    constructor (machineId, cachedAccessListLocation, serverURL, pollInterval, logger) {
        this.machineId = machineId;
        this.serverURL = serverURL;
        this.cachedAccessListLocation = cachedAccessListLocation;
        this.pollInterval = pollInterval;
        this.logger = logger;
        this.list = [];

        this.startPolling();
    }

    startPolling() {
        //Read the tags initially
        if (fs.exists(this.cachedAccessListLocation)) {
            this.list = JSON.parse(fs.readFileSync(this.cachedAccessListLocation));
        } else {
            this.list = [];
        }

        //Start polling/storing updates
        var fn = () => {
            request.get(this.serverURL + '/' + this.machineId).json()
                .then((data) => {
                    this.list = data;
                    mkdirp.sync(path.dirname(this.cachedAccessListLocation));
                    fs.writeFileSync(this.cachedAccessListLocation, JSON.stringify(data, null, 3));
                    setTimeout(fn, this.pollInterval);
                }, (err) => {
                    this.logger.error({machineId: this.machineId, message: 'Unable to get access list from ' + this.serverURL + ' using stored access list.' })
                    setTimeout(fn, this.pollInterval);
                });
        };
        
        //Kick it off
        fn(); 
    }

    //Returns { user: user, rfid: rfid, authorized: boolean } or undefined if no match
    authorize(rawrfid) {
        //Clean it up, for some reason all rfid's after 2nd have an invisible first character
        var rfid = (rawrfid || "").replace(/[\n\r\s ]/g, "").substring(1);
        if (rfid.length>12) { rfid = rfid.substring(1); }    

        var user = _.find(this.list, (a) => a.rfid == rfid);
        return ({            
            user: user ? _.clone(user) : undefined,
            rfid: rfid,
            authorized: user ? user[this.machineId]=='x' : false
        });
    }
}
