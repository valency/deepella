// Packages
const express = require('express');
const colors = require('colors/safe');
const moment = require('moment');
const console = require('console');
const body_parser = require('body-parser');
const sequelize = require('sequelize');
const otpauth = require('otpauth');

const debug = true;

// Shared Functions
function log(msg, color) {
    if (!color) color = colors.green;
    console.log(color('[' + moment().format('YYYY-MM-DD HH:mm:ss') + '] ') + msg);
}

function event_all(where, callback) {
    Event.findAll({
        where: where
    }).then(function (events) {
        if (callback) callback(events);
    });
}

function event_create(name, d, type, user, group) {
    if (debug) log("New event: " + d + ", " + group);
    Event.findAll({
        where: {
            startDate: d,
            group: group,
            user: {
                $or: [user, null]
            }
        }
    }).then(function (events) {
        if (debug) log("# of events of the same day: " + events.length);
        if (events.length > 1) {
            return;
        } else if (events.length > 0) {
            var event = events[0];
            if (debug) log("Checking, event.type = " + event.type + ", type = " + type);
            if ((event.type === "day_off" || event.type === "day_off_half") && type !== "holiday_as_workday") return;
            else if ((event.type === "overtime" || event.type === "overtime_half") && type !== "holiday") return;
            else if (event.type === "holiday" && (type !== "overtime" && type !== "overtime_half")) return;
            else if (event.type === "holiday_as_workday" && (type !== "day_off" && type !== "day_off_half")) return;
        } else {
            if (type === "overtime" || type === "overtime_half") return;
        }
        if (debug) log("Event will be created.");
        Event.create({
            name: name,
            startDate: d,
            endDate: d,
            type: type,
            user: user,
            group: group
        });
    });
}

function event_add(req, d) {
    if (req.body.group) {
        event_create(req.body.name, d, req.body.type, req.body.user, req.body.group);
    } else {
        User.find({where: {username: req.body.user}}).then(function (user) {
            event_create(req.body.name, d, req.body.type, user.username, user.group);
        });
    }
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
    name: sequelize.STRING,
    group: sequelize.INTEGER // 1: Flexible, 2: Weekends only
});

var Event = db.define('event', {
    id: {type: sequelize.INTEGER, primaryKey: true, autoIncrement: true},
    name: sequelize.STRING,
    startDate: sequelize.DATE,
    endDate: sequelize.DATE,
    type: sequelize.STRING,
    user: sequelize.STRING,
    group: sequelize.INTEGER // Same as User.group
});

// Views
app.get('/api/auth/', function (req, res) {
    var totp = new otpauth.TOTP({
        'issuer': 'Deepera Co., Ltd.',
        'label': 'deepella@deepera.com',
        'secret': otpauth.Secret.fromB32('ELLACHANBFF')
    });
    res.send({status: req.query.p === totp.generate()});
});

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
    if (req.query.start) {
        where["startDate"] = {$gte: req.query.start};
    }
    if (req.query.end) {
        where["endDate"] = {$lte: req.query.end};
    }
    if (req.query.user) {
        User.find({
            where: {username: req.query.user}
        }).then(function (user) {
            where["user"] = {$or: [user.username, null]};
            where["group"] = user.group;
            event_all(where, function (events) {
                res.send(events);
            });
        });
    } else {
        event_all(where, function (events) {
            res.send(events);
        });
    }
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

