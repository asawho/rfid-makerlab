var cfg = require('./server-config');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var winston = require('winston');
var express = require('express');
var fileUpload = require('express-fileupload');
var bodyParser = require('body-parser');
var basicAuth = require('express-basic-auth');
var _ = require('lodash');
var csvtojson = require('csvtojson');
function setupLoggingServer() {
    var logger = winston.createLogger({
        level: 'info',
        format: winston.format.json(),
        transports: [
            new winston.transports.File({ filename: __dirname + '/data/error.log', level: 'error' }),
            new winston.transports.File({ filename: __dirname + '/data/activity.log' }),
            new winston.transports.Console()
        ]
    });
    let fn = () => {
        var regex = /^[^{]/gim;
        if (fs.existsSync(__dirname + '/data/activity.log')) {
            var data = fs.readFileSync(__dirname + '/data/activity.log', 'utf-8');
            if (regex.test(data)) {
                var lines = data.replace(/\r\n/g, '\n').split('\n');
                var newlines = [];
                for (var i = 0; i < lines.length; i++) {
                    if (lines[i].length && lines[i][0] == "{") {
                        newlines.push(lines[i]);
                    }
                }
                var newValue = newlines.join('\n');
                fs.writeFileSync(__dirname + '/data/activity.log', newValue, 'utf-8');
            }
        }
        setTimeout(fn, 1000 * 60 * 10);
    };
    fn();
    return (logger);
}
function nocache(req, res, next) {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
}
function setupAppServer(logger) {
    var app = express();
    app.use(basicAuth({
        users: cfg.users,
        challenge: true,
        realm: 'MakerLab'
    }));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(fileUpload());
    app.use('/static', express.static(path.join(__dirname, '../client')));
    app.get('/', function (req, res) {
        res.sendFile(path.join(__dirname, '../client/index.html'));
    });
    app.post('/collect', nocache, function (req, res) {
        logger.log(req.body.level, req.body);
        res.status(200).json({ msg: "Ok" });
    });
    app.get('/device-up-list', nocache, function (req, res) {
        res.status(200).json(deviceUpList);
    });
    app.get('/access-list/:device?', nocache, function (req, res) {
        if (req.params.device) {
            device = req.params.device;
            deviceUpList[device] = new Date();
        }
        if (!fs.existsSync(path.join(__dirname + '/data/accesslist.json'))) {
            res.status(200).json([]);
        }
        else {
            res.sendFile(path.join(__dirname + '/data/accesslist.json'));
        }
    });
    app.post('/access-list', function (req, res) {
        if (!req.files)
            return res.status(400).send('No files were uploaded.');
        var newlist = [], err;
        csvtojson()
            .fromString(req.files.accesslist.data.toString())
            .subscribe((obj) => {
            obj = _.transform(obj, function (result, val, key) {
                if (!_.startsWith(key, "*")) {
                    result[key.toLowerCase()] = val;
                }
            });
            newlist.push(obj);
        })
            .on('done', (error) => {
            if (error) {
                res.status(500).send('Unable to parse csv file: ' + error);
            }
            else {
                mkdirp.sync(path.dirname(path.join(__dirname + '/data/accesslist.json')));
                fs.writeFileSync(path.join(__dirname + '/data/accesslist.json'), JSON.stringify(newlist, null, 3));
                res.status(200).json({});
            }
        });
    });
    app.get('/query/:days?', nocache, function (req, res) {
        let days = 7;
        if (req.params.days && _.isNumber(req.params.days * 1)) {
            days = req.params.days * 1;
        }
        const options = {
            from: new Date() - (days * 24 * 60 * 60 * 1000),
            until: new Date(),
            limit: 100000,
            start: 0,
            order: 'desc'
        };
        logger.query(options, function (err, results) {
            if (err) {
                res.status(500).json(err);
            }
            else {
                res.status(200).json(results.activity);
            }
        });
    });
    app.listen(80);
    console.log('Application server Listening');
}
var deviceUpList = {};
var logger = setupLoggingServer();
setupAppServer(logger);
//# sourceMappingURL=server.js.map