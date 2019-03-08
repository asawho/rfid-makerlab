module.exports = {
    serverHost: 'rfserver.local',
    serverPort: 80,
    serverLogPath: '/collect',
    accessListServer: 'http://rfserver.local/access-list',
    accessListPollInterval: 1000 * 60,
    devices: [
        {
            hostName: 'rfserver',
            deviceType: 'PlugPhidget',
            options: {}
        },
        {
            hostName: 'rfentrance',
            deviceType: 'DoorID12LA',
            options: {}
        },
        {
            hostName: 'rflaserchina',
            deviceType: 'PlugID12LA',
            options: {}
        },
        {
            hostName: 'rflaserhurricane',
            deviceType: 'PlugPhidget',
            options: {}
        },
        {
            hostName: 'rfzortrax',
            deviceType: 'PlugPhidget',
            options: {}
        }
    ]
};
//# sourceMappingURL=device-config.js.map