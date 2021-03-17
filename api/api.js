const express = require('express');

class APIController {
    constructor(port, databaseController, wssController) {
        this.serverApplication = express();
        this.port = port;
        this.databaseController = databaseController;
        this.wssController = wssController;
    }

    initialize() {
        this.serverApplication.use('/', express.static(`${__dirname}/../public`));
        this.serverApplication.listen(this.port, () => {
            this.databaseController.initialize();
            this.wssController.connect();
            console.log(`Journey server listening at http://localhost:${this.port}`);
        });

        this.serverApplication.post('/api/mining/user', (request, response) => {
            this.databaseController.database.run(
                "INSERT INTO mining_users VALUES (NULL, ?, ?)",
                [request.body.name, request.body.defaultHashRate],
                (error) => {
                    if (!error) response.sendStatus(200);
                    else response.sendStatus(500);
                });
        });
        this.serverApplication.get('/api/mining/users', (_, response) => {
            this.databaseController.database.all("SELECT * FROM mining_users", (error, users) => {
                if (!error) response.send(users);
                else response.sendStatus(500);
            });
        });
        this.serverApplication.put('/api/mining/user/:userID/defaultHashRate', (request, response) => {
            this.databaseController.database.run(
                "UPDATE mining_users SET defaultHashRate = ? WHERE id = ?",
                [request.body.defaultHashRate, request.params.userID],
                (error) => {
                    if (!error) response.sendStatus(200);
                    else response.sendStatus(500);
                });
        });

        this.serverApplication.get('/api/mining/shares', (_, response) => {
            this.databaseController.database.all("SELECT * FROM mining_share", (error, shares) => {
                if (!error) response.send(shares);
                else response.sendStatus(500);
            });
        });
        this.serverApplication.post('/api/mining/share', (request, response) => {
            this.databaseController.database.run(
                "INSERT INTO mining_share VALUES (NULL, ?, ?, ?)",
                [request.body.amount, request.body.start_time, request.body.end_time],
                (error) => {
                    if (!error) response.sendStatus(200);
                    else response.sendStatus(500);
                });
        });
        this.serverApplication.get('/api/mining/share/:shareID/sharesResult', (request, response) => {
            this.databaseController.database.get(
                "SELECT amount, start_time, end_time FROM mining_share WHERE id = ?",
                [request.params.shareID],
                (error, share) => {
                    if (!error) {
                        this.databaseController.database.all("SELECT id, defaultHashRate FROM mining_users", (error, users) => {
                            if (!error) {
                                this.databaseController.database.all("SELECT type, date, user FROM mining_action WHERE date > ? AND date < ? ORDER BY date",
                                    [share.start_time, share.end_time],
                                    (error, actions) => {
                                        if (!error) {
                                            let responseObject = {};
                                            responseObject.totalMilliseconds = 0;
                                            responseObject.totalHashRate = 0;
                                            responseObject.workedMilliseconds = {};
                                            responseObject.amounts = {};
                                            users.forEach((user) => {
                                                let missingMilliseconds = 0;
                                                let lastEndDate = null;
                                                let action;
                                                for (let actionIndex = 0; actionIndex < actions.length; actionIndex++) {
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

        this.serverApplication.post('/api/mining/block', (request, response) => {
            let date = (request.body.date) ? request.body.date : (new Date()).toISOString();
            this.databaseController.database.run(
                "INSERT INTO mining_action VALUES (NULL, ?, ?, ?)",
                [request.body.type, date, request.body.user],
                (error) => {
                    if (!error) response.sendStatus(200);
                    else response.sendStatus(500);
                });
        });

        this.serverApplication.get('/price', (_, response) => {
            if (this.wssController.lastPrice) response.send(this.wssController.lastPrice);
            else response.sendStatus(200);
        });
    }
}

module.exports = { APIController: APIController }