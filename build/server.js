var cfg = require('./config');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var winstond = require('winstond');

var express = require('express');
var fileUpload = require('express-fileupload');
var bodyParser = require('body-parser');
var _ = require('lodash');
var csvtojson = require('csvtojson');

function setupLoggingServer() {
    //Start up the winstond http log endpoint, tell it to collect, query and stream over it
    var http = winstond.http.createServer({
        services: ['collect', 'query', 'stream'],
        port: 8081
    });

    http.add(winstond.transports.File, {
        name: 'activity',
        filename: __dirname + cfg.logActivityLocation,
        level: 'info'
    });
    http.add(winstond.transports.File, {
        name: 'error',
        filename: __dirname + cfg.logErrorLocation,
        level: 'error'
    });
    http.add(winstond.transports.Console, {});

    http.listen();
    console.log('Winston Log server Listening on port: 8081');

    return (http);
}

function nocache(req, res, next) {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
  }

function setupAppServer(logger) {
    //Configure Server
    var app = express();

    //Middleware -----------------------------------------------------
    app.use(bodyParser.json()); // support json encoded bodies
    app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
    app.use(fileUpload());

    //Default static routes--------------------------------------------
    app.use('/static', express.static(path.join(__dirname, 'client')));	//send everything in the static folder straight up
    app.get('/', function(req, res) {
        res.sendFile(path.join(__dirname + '/client/index.html'));
    });

    //Access list get
    app.get('/access-list', nocache, function (req, res) {
        if (!fs.existsSync(path.join(__dirname + '/data/accesslist.json'))) {
            res.status(200).json([]);
        } else {
            res.sendFile(path.join(__dirname + '/data/accesslist.json'));
        }        
    });

    //Access list upload
    app.post('/access-list', function (req, res) {
        if (!req.files) return res.status(400).send('No files were uploaded.');
        var newlist = [], err;
        csvtojson()
            .fromString(req.files.accesslist.data.toString())
            .on('json',(obj) => { 
                //Normalize the properties to lower case
                obj = _.transform(obj, function (result, val, key) {
                    result[key.toLowerCase()] = val;
                });
                newlist.push(obj); 
            })
            .on('done',(error)=> { 
                if (error) {
                    res.status(500).send('Unable to parse csv file: ' + error);
                } else {
                    mkdirp.sync(path.dirname(path.join(__dirname + '/data/accesslist.json')));
                    fs.writeFileSync(path.join(__dirname + '/data/accesslist.json'), JSON.stringify(newlist, null, 3));
                    res.status(200).json({});
                }
            });
    });
    
    //Activity Query
    app.get('/query', nocache, function (req, res) {
        //Hard coded last 7 days for now
        const options = {
            from: new Date() - (7 * 24 * 60 * 60 * 1000),
            until: new Date(),
            limit: 100000,
            start: 0,
            order: 'desc'
        };
        logger.query(options, function (err, results) {
            if (err) { 
                res.status(500).json(err); 
            } else {
                res.status(200).json(results.activity);
            }
        })            
    });

    app.listen(80);
    console.log('Application server Listening');
}

var logger = setupLoggingServer();
setupAppServer(logger);