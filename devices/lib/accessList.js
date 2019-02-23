var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var _ = require('lodash');
var request = require('request-promise-native');

module.exports = class AccessList {
    constructor (machineId, cachedAccessListLocation, cfg, logger) {        
        this.machineId = machineId.toLowerCase();
        this.serverURL = cfg.accessListServer;
        this.cachedAccessListLocation = cachedAccessListLocation;
        this.pollInterval = cfg.accessListPollInterval;
        this.logger = logger;
        this.list = [];
        this.authUser = process.env.BASIC_USER || 'admin';
        this.authPassword =  process.env.BASIC_PASSWORD || 'password';

        this.startPolling();
    }

    startPolling() {
        //Read the tags initially
        if (fs.existsSync(this.cachedAccessListLocation)) {
            this.list = JSON.parse(fs.readFileSync(this.cachedAccessListLocation));
        } else {
            this.list = [];
        }

        //Start polling/storing updates
        var fn = () => {
            request.get(this.serverURL + '/' + this.machineId).auth(this.authUser, this.authPassword).json()
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

    normalize(rfid, readerType) {
        if (readerType=='ID12LA') {
            //ID-12LA readers only, clean it up, for some reason all rfid's after 2nd have an invisible first character
            rfid = (rfid || "").replace(/[\n\r\s ]/g, "").substring(1);
            if (rfid.length>12) { rfid = rfid.substring(1); }
        } 

        //Phidget returns only 10bytes while ID12LA returns 12bytes, but the first 10bytes returned by 
        //ID12LA match the 10bytes returned by phidget.  So, only concern ourselves with the first 10 bytes.
        //Also since this is what gets logged, likely that only 10 bytes will be pasted into user list,
        //but just to be sure, upper that and substring it
        return ((rfid || "").substring(0,10).toUpperCase());
    }

    //Returns { user: user, rfid: rfid, authorized: boolean } or undefined if no match
    authorize(rfid) {  
        //Phidget returns only 10bytes while ID12LA returns 12bytes, but the first 10bytes returned by 
        //ID12LA match the 10bytes returned by phidget.  Old access log had 12 byte numbers in it though
        var user = rfid ? _.find(this.list, (a) => (a.rfid || "").substring(0,10).toUpperCase() == rfid) : undefined;
        user = user ? _.clone(user) : undefined;
        //Clean up any legacy rfid's in the access list before we pass them back out
        if (user) { user.rfid = this.normalize(user.rfid); }
        return ({            
            user: user,
            rfid: rfid,
            authorized: user && (user.enabled=='x' || (user.enabled || '').toLowerCase()=='true')  && (user[this.machineId]=='x' || (user[this.machineId] || "").toLowerCase()=='true')
        });
    }
}
