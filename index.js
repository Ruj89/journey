const fs = require('fs');
const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');

const sqlite3 = require('sqlite3').verbose();

const WebSocket = require('ws');
const { request } = require('express');

const serverApplication = express();
const port = 8080;
const databaseFilePath = `${__dirname}/work/db`;
var database;
var lastPrice = 0;

// Process

process.stdin.resume();

[`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
    process.on(eventType, cleanUpServer.bind(null, eventType));
});

function cleanUpServer() {
    console.log("cleaning db");
    database.close();
}

// Database

function initDB() {
    var databaseFileExists = fs.existsSync(databaseFilePath);
    var databaseContainingFolder = path.dirname(databaseFilePath);
    if (!databaseFileExists && !fs.existsSync(databaseContainingFolder))
        fs.mkdirSync(databaseContainingFolder);
    database = new sqlite3.Database(databaseFilePath, (err) => {
        if (err) console.error(err.message);
    });

    if (!databaseFileExists) {
        database.get("PRAGMA foreign_keys = ON");
        database.serialize(() => {
            database.run("\
                CREATE TABLE mining_users ( \
                    id              INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, \
                    name            TEXT NOT NULL, \
                    defaultHashRate REAL NOT NULL \
                )");
            database.run("\
                CREATE TABLE mining_action ( \
                    id          INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, \
                    type        TEXT CHECK( type IN ('Start', 'End') ) NOT NULL, \
                    date        TIMESTAMP NOT NULL, \
                    user		INTEGER NOT NULL, \
                    \
                    FOREIGN KEY(user) REFERENCES mining_users(id) \
                )");
            database.run("\
                CREATE TABLE mining_share ( \
                    id          INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, \
                    amount      REAL NOT NULL, \
                    start_time  TIMESTAMP NOT NULL, \
                    end_time    TIMESTAMP NOT NULL \
                )");
        });
    }
}

// Server

serverApplication.use(bodyParser.json());

serverApplication.use('/', express.static(`${__dirname}/public`));
serverApplication.listen(port, () => {
    initDB();
    console.log(`Journey server listening at http://localhost:${port}`);
});

serverApplication.post('/api/mining/user', (request, response) => {
    database.run(
        "INSERT INTO mining_users VALUES (NULL, ?, ?)",
        [request.body.name, request.body.defaultHashRate],
        (error) => {
            if (!error) response.sendStatus(200);
            else response.sendStatus(500);
        });
});
serverApplication.get('/api/mining/users', (_, response) => {
    database.all("SELECT * FROM mining_users", (error, users) => {
        if (!error) response.send(users);
        else response.sendStatus(500);
    });
});
serverApplication.put('/api/mining/user/:userID/defaultHashRate', (request, response) => {
    database.run(
        "UPDATE mining_users SET defaultHashRate = ? WHERE id = ?",
        [request.body.defaultHashRate, request.params.userID],
        (error) => {
            if (!error) response.sendStatus(200);
            else response.sendStatus(500);
        });
});

serverApplication.get('/api/mining/shares', (_, response) => {
    database.all("SELECT * FROM mining_share", (error, shares) => {
        if (!error) response.send(shares);
        else response.sendStatus(500);
    });
});
serverApplication.post('/api/mining/share', (request, response) => {
    database.run(
        "INSERT INTO mining_share VALUES (NULL, ?, ?, ?)",
        [request.body.amount, request.body.start_time, request.body.end_time],
        (error) => {
            if (!error) response.sendStatus(200);
            else response.sendStatus(500);
        });
});
serverApplication.get('/api/mining/share/:shareID/sharesResult', (request, response) => {
    database.get(
        "SELECT amount, start_time, end_time FROM mining_share WHERE id = ?",
        [request.params.shareID],
        (error, share) => {
            if (!error) {
                database.all("SELECT id, defaultHashRate FROM mining_users", (error, users) => {
                    if (!error) {
                        database.all("SELECT type, date, user FROM mining_action WHERE date > ? AND date < ? ORDER BY date",
                            [share.start_time, share.end_time],
                            (error, actions) => {
                                if (!error) {
                                    var responseObject = {};
                                    responseObject.totalMilliseconds = 0;
                                    responseObject.totalHashRate = 0;
                                    responseObject.workedMilliseconds = {};
                                    responseObject.amounts = {};
                                    users.forEach((user) => {
                                        var missingMilliseconds = 0;
                                        var lastEndDate = null;
                                        var action;
                                        for (var actionIndex = 0; actionIndex < actions.length; actionIndex++) {
                                            action = actions[actionIndex];
                                            if (action.user == user.id) {
                                                if (action.type == "Start") {
                                                    if (!lastEndDate) lastEndDate = new Date(share.start_time);
                                                    missingMilliseconds += new Date(action.date).getTime() - lastEndDate.getTime();
                                                }
                                                else if (action.type == "End") lastEndDate = new Date(action.date);
                                            }
                                        }
                                        if (action.type == "End")
                                            missingMilliseconds += new Date(share.end_time).getTime() - new Date(action.date).getTime();
                                        responseObject.workedMilliseconds[user.id] = new Date(share.end_time).getTime() - new Date(share.start_time).getTime() - missingMilliseconds;
                                        
                                        responseObject.totalHashRate += user.defaultHashRate;
                                        responseObject.totalMilliseconds += responseObject.workedMilliseconds[user.id];
                                    });
                                    users.forEach((user) => {
                                        responseObject.amounts[user.id] = share.amount * ((responseObject.workedMilliseconds[user.id] / responseObject.totalMilliseconds) + (user.defaultHashRate / responseObject.totalHashRate)) / 2;
                                    })
                                    response.send(responseObject)
                                } else response.sendStatus(500);
                            });
                    } else response.sendStatus(500);
                });
            } else response.sendStatus(500);
        });
});

serverApplication.post('/api/mining/block', (request, response) => {
    var date = (request.body.date) ? request.body.date : (new Date()).toISOString();
    database.run(
        "INSERT INTO mining_action VALUES (NULL, ?, ?, ?)",
        [request.body.type, date, request.body.user],
        (error) => {
            if (!error) response.sendStatus(200);
            else response.sendStatus(500);
        });
});

serverApplication.get('/price', (_, response) => {
    if (lastPrice) response.send(lastPrice);
    else response.sendStatus(200);
});

// WSS

const ws = new WebSocket('wss://ws-feed.pro.coinbase.com');

ws.on('open', function open() {
    console.log('Websocket connected');
    ws.send(JSON.stringify({
        "type": "subscribe",
        "channels": [{ "name": "ticker", "product_ids": ["ETH-EUR"] }]
    }));
});

ws.on('close', function close() {
    console.log('Websocket disconnected');
});

ws.on('message', (data) => {
    var responseObject = JSON.parse(data);
    if (responseObject.type == "ticker")
        lastPrice = responseObject.price;
});