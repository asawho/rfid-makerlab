module.exports = {
    serverHost: 'rfentrance.local',                           //Server host name
    serverPort: 3000,                                         //Server port
    serverLogPath: '/collect',                              //Path to post logs to http winston transport
    accessListServer: 'http://rfentrance.local:3000/access-list',  //Path to poll for the access sheet
    accessListPollInterval: 1000*60,                        //How frequently to poll

    devices : [
        {
            hostName: 'rfentrance',
            deviceType: 'DoorID12LAWyzeLock',
            options: { 
                rfidPort : '/dev/ttyUSB0',
                email : process.env.WYZELOCK_EMAIL,
                password : process.env.WYZELOCK_PASSWORD,
                mac : process.env.WYZELOCK_MAC
            }
        },
        {
            hostName: 'rflaserchina',
            deviceType: 'PlugID12LA',
            options: { }
        },        
        {
            hostName: 'rflaserhurricane',
            deviceType: 'PlugPhidget',
            options: { }
        },
        {
            hostName: 'rfzortrax',
            deviceType: 'PlugPhidget',
            options: { }
        }        
    ]
}
