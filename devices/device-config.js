module.exports = {
    serverHost: 'rfserver',                            //Server host name
    serverPort: 80,                                     //Server port
    serverLogPath: '/collect',                          //Path to post logs to http winston transport
    accessListServer: 'http://rfserver.local/access-list',   //Path to poll for the access sheet
    accessListPollInterval: 1000*60,                    //How frequently to poll

    devices : [
        {
            hostName: 'rfentrance',
            deviceType: 'DoorID12LA',
            options: { }
        },
        {
            hostName: 'rflaser1',
            deviceType: 'PlugID12LA',
            options: { }
        },        
        {
            hostName: 'rflaser2',
            deviceType: 'PlugPhidget',
            options: { }
        }
    ]
}
