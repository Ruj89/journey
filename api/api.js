const express = require('express');

const { Database } = require('../database/database');
const { WSSController } = require('../client/wss');
const { User, Share, Action } = require('../models/models');

class APIController {
  /**
   * Setup the API server controller
   * @param {number} port Port of the server
   * @param {Database} databaseController Database controller object
   * @param {WSSController} wssController WebSocket controller client
   */
  constructor(port, databaseController, wssController) {
    this.serverApplication = express();
    this.port = port;
    this.databaseController = databaseController;
    this.wssController = wssController;
  }

  /**
   * Initialize the server and set the API interfaces
   */
  initialize() {
    this.serverApplication.use('/', express.static(`${__dirname}/../public`));
    this.serverApplication.use(express.json());
    this.serverApplication.listen(this.port, () => {
      this.databaseController.initialize();
      this.wssController.connect();
      console.log(`Journey server listening at http://localhost:${this.port}`);
    });

    this.serverApplication.post(
      '/api/mining/user',
      async (request, response) => {
        try {
          await this.databaseController.createUser(
            new User({
              name: request.body.name,
              defaultHashRate: request.body.defaultHashRate,
            })
          );
          response.sendStatus(200);
        } catch (_) {
          response.sendStatus(500);
        }
      }
    );
    this.serverApplication.get('/api/mining/users', async (_, response) => {
      try {
        let users = await this.databaseController.getUsers();
        response.send(users);
      } catch (_) {
        response.sendStatus(500);
      }
    });
    this.serverApplication.put(
      '/api/mining/user/:userID/defaultHashRate',
      async (request, response) => {
        try {
          await this.databaseController.updateUser(
            request.params.userID,
            'defaultHashRate',
            request.body.defaultHashRate
          );
          response.sendStatus(200);
        } catch (_) {
          response.sendStatus(500);
        }
      }
    );

    this.serverApplication.get('/api/mining/shares', async (_, response) => {
      try {
        let shares = await this.databaseController.getShares();
        response.send(shares);
      } catch (_) {
        response.sendStatus(500);
      }
    });
    this.serverApplication.post(
      '/api/mining/share',
      async (request, response) => {
        try {
          await this.databaseController.createShare(
            new Share({
              amount: request.body.amount,
              start_time: Date(request.body.start_time),
              end_time: Date(request.body.end_time),
            })
          );
          response.sendStatus(200);
        } catch (_) {
          response.sendStatus(500);
        }
      }
    );
    this.serverApplication.get(
      '/api/mining/share/:shareID/sharesResult',
      async (request, response) => {
        try {
          let share = await this.databaseController.getShare(
            request.params.shareID
          );
          let users = await this.databaseController.getUsers();
          let actions = await this.databaseController.getActionsBetweenTimes(
            share.start_time,
            share.end_time
          );
          let responseObject = {};
          responseObject.totalMilliseconds = 0;
          responseObject.totalHashRate = 0;
          responseObject.workedMilliseconds = {};
          responseObject.amounts = {};
          users.forEach((user) => {
            let missingMilliseconds = 0;
            let lastEndDate = null;
            let action;
            for (
              let actionIndex = 0;
              actionIndex < actions.length;
              actionIndex++
            ) {
              action = actions[actionIndex];
              if (action.user == user.id) {
                if (action.type == 'Start') {
                  if (!lastEndDate) lastEndDate = new Date(share.start_time);
                  missingMilliseconds +=
                    new Date(action.date).getTime() - lastEndDate.getTime();
                } else if (action.type == 'End')
                  lastEndDate = new Date(action.date);
              }
            }
            if (action.type == 'End')
              missingMilliseconds +=
                new Date(share.end_time).getTime() -
                new Date(action.date).getTime();
            responseObject.workedMilliseconds[user.id] =
              new Date(share.end_time).getTime() -
              new Date(share.start_time).getTime() -
              missingMilliseconds;

            responseObject.totalHashRate += user.defaultHashRate;
            responseObject.totalMilliseconds +=
              responseObject.workedMilliseconds[user.id];
          });
          users.forEach((user) => {
            responseObject.amounts[user.id] =
              (share.amount *
                (responseObject.workedMilliseconds[user.id] /
                  responseObject.totalMilliseconds +
                  user.defaultHashRate / responseObject.totalHashRate)) /
              2;
          });
          response.send(responseObject);
        } catch (_) {
          response.sendStatus(500);
        }
      }
    );

    this.serverApplication.post(
      '/api/mining/block',
      async (request, response) => {
        try {
          let date = request.body.date
            ? request.body.date
            : new Date().toISOString();
          await this.databaseController.addAction(
            new Action({
              type: request.body.type,
              date: date,
              user: request.body.user,
            })
          );
          response.sendStatus(200);
        } catch (_) {
          response.sendStatus(500);
        }
      }
    );

    this.serverApplication.get('/price', (_, response) => {
      if (this.wssController.lastPrice)
        response.send(this.wssController.lastPrice);
      else response.sendStatus(200);
    });
  }
}

/**
 * Module exports
 */
module.exports = { APIController: APIController };
