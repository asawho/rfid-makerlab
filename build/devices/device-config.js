module.exports = {
    serverHost: 'rfserver.local',
    serverPort: 80,
    serverLogPath: '/collect',
    accessListServer: 'http://rfserver.local/access-list',
    accessListPollInterval: 1000 * 60,
    devices: [
        {
            hostName: 'rfentrance',
            deviceType: 'DoorID12LA',
            options: {}
        },
        {
            hostName: 'rflaser1',
            deviceType: 'PlugID12LA',
            options: {}
        },
        {
            hostName: 'rflaser2',
            deviceType: 'PlugPhidget',
            options: {}
        },
        {
            hostName: 'rfserver',
            deviceType: 'PlugPhidget',
            options: {}
        }
    ]
};
//# sourceMappingURL=device-config.js.map