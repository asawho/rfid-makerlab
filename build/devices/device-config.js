module.exports = {
    serverHost: 'rfentrance.local',
    serverPort: 3000,
    serverLogPath: '/collect',
    accessListServer: 'http://rfentrance.local:3000/access-list',
    accessListPollInterval: 1000 * 60,
    devices: [
        {
            hostName: 'rfentrance',
            deviceType: 'DoorID12LAWyzeLock',
            options: {
                rfidPort: '/dev/ttyUSB0',
                email: process.env.WYZELOCK_EMAIL,
                password: process.env.WYZELOCK_PASSWORD,
                mac: process.env.WYZELOCK_MAC
            }
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