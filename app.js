// Packages
const express = require('express');
const colors = require('colors/safe');
const moment = require('moment');
const console = require('console');
const body_parser = require('body-parser');
const sequelize = require('sequelize');

// Shared Functions
function log(msg, color) {
    if (!color) color = colors.green;
    console.log(color('[' + moment().format('YYYY-MM-DD HH:mm:ss') + '] ') + msg);
}

function event_add(req, d) {
    Event.findAll({
        where: {startDate: d}
    }).then(function (events) {
        if (events.length > 1) {
            return;
        } else if (events.length > 0) {
            var event = events[0];
            if (event.type === "day_off" && req.body.type !== "holiday_as_workday") return;
            else if (event.type === "overtime" && req.body.type !== "holiday") return;
            else if (event.type === "holiday" && req.body.type !== "overtime") return;
            else if (event.type === "holiday_as_workday" && req.body.type !== "day_off") return;
        } else {
            if (req.body.type === "overtime") return;
        }
        Event.create({
            name: req.body.name,
            startDate: d,
            endDate: d,
            type: req.body.type,
            user: req.body.user
        });
    });
}

// Configurations
var app = express();
app.set('view engine', 'pug');
app.use(express.static('static'));
app.use(body_parser.json());
app.use(body_parser.urlencoded({extended: true}));

var db = new sequelize('deepella', null, null, {dialect: 'sqlite', storage: 'db.sqlite3', logging: false});

// Models
var User = db.define('user', {
    username: {type: sequelize.STRING, primaryKey: true},
    name: sequelize.STRING
});

var Event = db.define('event', {
    id: {type: sequelize.INTEGER, primaryKey: true, autoIncrement: true},
    name: sequelize.STRING,
    startDate: sequelize.DATE,
    endDate: sequelize.DATE,
    type: sequelize.STRING,
    user: sequelize.STRING
});

// Views
app.get('/api/users/', function (req, res) {
    User.findAll().then(function (users) {
        res.send(users);
    });
});

app.post('/api/user/', function (req, res) {
    db.sync().then(function () {
        return User.create(req.body);
    }).then(function () {
        res.status(201).send();
    });
});

app.delete('/api/user/', function (req, res) {
    db.sync().then(function () {
        return User.destroy({
            where: {username: req.body.username}
        });
    }).then(function () {
        res.status(204).send();
    });
});

app.get('/api/events/', function (req, res) {
    var where = {};
    if (req.query.user) {
        where["user"] = {$or: [req.query.user, null]};
    }
    if (req.query.start) {
        where["startDate"] = {$gte: req.query.start};
    }
    if (req.query.end) {
        where["endDate"] = {$lte: req.query.end};
    }
    Event.findAll({
        where: where
    }).then(function (events) {
        res.send(events);
    });
});

app.post('/api/events/', function (req, res) {
    db.sync().then(function () {
        var events = JSON.parse(req.body.events);
        for (var i = 0; i < events.length; i++) {
            Event.create(events[i]);
        }
    }).then(function () {
        res.status(201).send();
    });
});

app.post('/api/event/', function (req, res) {
    db.sync().then(function () {
        var start = moment(req.body.startDate);
        var end = moment(req.body.endDate).add(1, 'days');
        var current = start.clone();
        while (current.isBefore(end)) {
            event_add(req, current.clone());
            current.add(1, 'days');
        }
    }).then(function () {
        res.status(201).send();
    });
});

app.delete('/api/event/', function (req, res) {
    db.sync().then(function () {
        return Event.destroy({
            where: {id: req.body.id}
        });
    }).then(function () {
        res.status(204).send();
    });
});

app.get('*', function (req, res) {
    var v = req.path.replace(/\//g, '');
    log('Processing view request: ' + v);
    if (v === '') v = 'index';
    res.render(v, null, function (err, html) {
        if (err) {
            res.status(404).send();
            log('View not found: ' + v, colors.red);
        } else {
            res.send(html);
        }
    });
});

// Start
db.sync().then(function () {
    app.listen(9009, function () {
        log('Server started.');
    });
});

