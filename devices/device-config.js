module.exports = {
    serverHost: 'rfserver.local',                           //Server host name
    serverPort: 80,                                         //Server port
    serverLogPath: '/collect',                              //Path to post logs to http winston transport
    accessListServer: 'http://rfserver.local/access-list',  //Path to poll for the access sheet
    accessListPollInterval: 1000*60,                        //How frequently to poll

    devices : [
        {
            hostName: 'rfserver',
            deviceType: 'PlugPhidget',
            options: { }
        },
        {
            hostName: 'rfentrance',
            deviceType: 'DoorID12LA',
            options: { }
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
        }        
    ]
}
