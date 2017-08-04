var path = require('path');
var express = require('express');
var SmartPlug = require('./services/smartplug');
var plug = new SmartPlug(16);
var app = express();
app.get('/plug-enable', function (req, res) {
    plug.enable();
    res.status(200).json({ msg: 'Plug enabled.' });
});
app.get('/plug-disable', function (req, res) {
    plug.disable();
    res.status(200).json({ msg: 'Plug disabled.' });
});
app.get('/plug-status', function (req, res) {
    var status = plug.status();
    res.status(200).json(status);
});
app.listen(8081);
//# sourceMappingURL=plugd.js.map