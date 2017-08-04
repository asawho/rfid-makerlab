var Machine = require('../services/machine');
var openhab = {
    server: 'localhost'
};
var machines = [
    new Machine({
        name: 'Laser Cutter',
        url: 'http://localhost:8080/rest/items/WemoDevice'
    }),
    new Machine({
        name: 'Laguna CNC',
        url: 'http://localhost:8081/'
    }),
    new Machine({
        name: 'Mill'
    }),
    new Machine({
        name: 'Ultimaker',
        url: '149182B39D50',
        type: 'node-wemo-client'
    }),
    new Machine({ name: 'TAZ' }),
    new Machine({ name: 'Roboprint' }),
];
module.exports = {
    openhab: openhab,
    machines: machines
};
//# sourceMappingURL=serverConfig.js.map