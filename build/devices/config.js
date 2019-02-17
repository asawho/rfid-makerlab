module.exports = {
    machineId: 'laser-cutter',
    rfidPort: '/dev/ttyUSB0',
    logErrorLocation: '/data/error.log',
    accessListServer: 'http://localhost/access-list',
    accessListPollInterval: 1000 * 60,
    cachedAccessListLocation: '/data/accesslist.json',
    winstonHttpTransport: {
        host: 'localhost',
        port: 80
    }
};
//# sourceMappingURL=config.js.map