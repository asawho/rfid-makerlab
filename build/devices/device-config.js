module.exports = {
    serverHost: 'rfserver',
    serverPort: 80,
    serverLogPath: '/collect',
    accessListServer: 'http://rfserver/access-list',
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
        }
    ]
};
//# sourceMappingURL=device-config.js.map