module.exports = {
    serverHost: 'localhost',
    serverPort: 80,
    serverLogPath: '/collect',
    accessListServer: 'http://localhost/access-list',
    accessListPollInterval: 1000 * 60,
    serverBasicAuthUser: 'admin',
    serverBasicAuthPassword: 'password',
    devices: [
        {
            hostName: 'rfid-entrance',
            deviceType: 'DoorID12LA',
            options: {}
        },
        {
            hostName: 'rfid-laser1',
            deviceType: 'PlugPhidget',
            options: {}
        },
        {
            hostName: 'rfid-laser2',
            deviceType: 'PlugID12LA',
            options: {}
        },
        {
            hostName: 'dolgudur',
            deviceType: 'PlugPhidget',
            options: {}
        }
    ]
};
//# sourceMappingURL=device-config.js.map