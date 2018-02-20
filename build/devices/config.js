module.exports = {
    machineId: 'laser-cutter',                          //The machine's unique id
    //rfidPort : '/dev/tty.usbserial-AH02LSBB'          //on the mac 
    rfidPort : '/dev/ttyUSB0',                          //on the pi    
    logErrorLocation: '/data/error.log',         //Log errors locally anyway    
    accessListServer: 'http://localhost/access-list',   //Server to poll for the access sheet
    accessListPollInterval: 1000*60,                            //How frequently to poll
    cachedAccessListLocation: '/data/accesslist.json',   //Cached access list location
    winstonHttpTransport : {                                    //See winston docs for details, but essentiall the server name/port
        host:'localhost',
        port:8081
    }
}