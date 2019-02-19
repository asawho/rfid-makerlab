module.exports = {
    serverHost: 'dolgudur',                            //Server host name
    serverPort: 80,                                     //Server port
    serverLogPath: '/collect',                          //Path to post logs to http winston transport
    accessListServer: 'http://dolgudur/access-list',   //Path to poll for the access sheet
    accessListPollInterval: 1000*60,                    //How frequently to poll

    serverBasicAuthUser: 'admin',
    serverBasicAuthPassword: 'password',

    devices : [
        {
            hostName: 'rfid-entrance',
            deviceType: 'DoorID12LA',
            options: { }
        },
        {
            hostName: 'rfid-laser1',
            deviceType: 'PlugPhidget',
            options: { }
        },        
        {
            hostName: 'rfid-laser2',
            deviceType: 'PlugID12LA',
            options: { }
        },
        {
            hostName: 'dolgudur',
            deviceType: 'PlugPhidget',
            options: { }
        }
    ]
}
