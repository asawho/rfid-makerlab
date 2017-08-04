var path = require('path');
var express = require('express');
var SmartPlug = require('./services/smartplug');

//Configure the plug
var plug = new SmartPlug(16);

//Configure Server
var app = express();

//API Routes------------------------------------------------------
app.get('/plug-enable', function (req, res) {
	plug.enable();
    res.status(200).json({ msg:'Plug enabled.'});
});
app.get('/plug-disable', function (req, res) {
    plug.disable();
	res.status(200).json({ msg:'Plug disabled.'});
});
app.get('/plug-status', function (req, res) {
	var status = plug.status();
	res.status(200).json(status);
});

//Initialize server
app.listen(8081);

// Doesn't seem to work
// process.on('SIGINT', function () {
// 	plug.destroy();
// });
