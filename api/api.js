const moment = require('moment');

const { Database } = require('../database/database');
const { WSSController } = require('../client/wss');
const {
  User,
  Share,
  Action,
  Coin,
  StackingAmount,
} = require('../models/models');

class APIController {
  /**
   * Setup the API server controller
   * @param {serverApplication} serverApplication Express instance
   * @param {Database} databaseController Database controller object
   * @param {WSSController} wssController WebSocket controller client
   */
  constructor(serverApplication, databaseController, wssController) {
    this.serverApplication = serverApplication;
    this.databaseController = databaseController;
    this.wssController = wssController;
  }

  /**
   * Set the API interfaces
   */
  initialize() {
    this.serverApplication.post(
      '/api/mining/user',
      async (request, response) => {
        try {
          await this.databaseController.createUser(
            new User(
              request.body.name,
              request.body.defaultHashRate,
              request.body.telegramName
            )
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
    this.serverApplication.delete(
      '/api/mining/user/:userID',
      async (request, response) => {
        try {
          await this.databaseController.deleteUser(request.params.userID);
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
            new Share(
              request.body.amount,
              new Date(request.body.start_time),
              new Date(request.body.end_time)
            )
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
            ? new Date(request.body.date)
            : new Date();
          await this.databaseController.createAction(
            new Action(request.body.type, date, request.body.user)
          );
          response.sendStatus(200);
        } catch (_) {
          response.sendStatus(500);
        }
      }
    );

    this.serverApplication.post('/telegram', async (request, response) => {
      try {
        const telegramStartKeywords = ['Attacco', 'Ripartito', 'Riattacco'];
        const telegramEndKeywords = ['Stacco'];
        let users = await this.databaseController.getUsers();
        let telegramCaptionRegex =
          /([A-Za-z\s]+), \[(\d{2}\.\d{2}\.\d{2} \d{2}:\d{2})\]/g;
        let lines = request.body.text.split('\n');
        let action_type,
          action_date,
          action_user,
          caption_found = false;
        lines.forEach(async (line) => {
          let regexResults = telegramCaptionRegex.exec(line);
          if (regexResults) {
            users.forEach((user) => {
              if (user.telegramName == regexResults[1]) action_user = user.id;
            });
            action_date = moment(regexResults[2], 'DD.MM.YY HH:mm').toDate();
            caption_found = true;
          } else if (caption_found) {
            if (telegramStartKeywords.indexOf(line) > -1) action_type = 'Start';
            else if (telegramEndKeywords.indexOf(line) > -1)
              action_type = 'End';
            else caption_found = false;

            if (caption_found) {
              let action = new Action(action_type, action_date, action_user);
              if (!(await this.databaseController.actionExists(action)))
                this.databaseController.createAction(action);
              caption_found = false;
            } else {
              if (line != '') console.log(`Cannot parse ${line}`);
            }
          } else {
            if (line != '') console.log(`Cannot parse ${line}`);
            caption_found = false;
          }
        });
        response.sendStatus(200);
      } catch (_) {
        response.sendStatus(500);
      }
    });

    this.serverApplication.get('/price', (_, response) => {
      if (this.wssController.lastPrices[this.wssController.miningIndex])
        response.send(
          this.wssController.lastPrices[this.wssController.miningIndex]
        );
      else response.sendStatus(200);
    });

    this.serverApplication.get('/api/coins', async (_, response) => {
      let responseObject = await this.databaseController.getCoins();
      response.send(responseObject);
    });
    this.serverApplication.get('/api/coins/values', async (_, response) => {
      response.send(this.wssController.lastPrices);
    });
    this.serverApplication.post('/api/coins', async (request, response) => {
      try {
        await this.databaseController.createCoin(
          new Coin(request.body.name, request.body.ticker)
        );
        response.sendStatus(200);
      } catch (_) {
        response.sendStatus(500);
      }
    });
    this.serverApplication.delete(
      '/api/coins/:coinID',
      async (request, response) => {
        try {
          await this.databaseController.deleteCoin(request.params.coinID);
          response.sendStatus(200);
        } catch (_) {
          response.sendStatus(500);
        }
      }
    );

    this.serverApplication.post('/api/hwwallet', async (request, response) => {
      try {
        await this.databaseController.createStackingAmount(
          new StackingAmount(
            request.body.value,
            request.body.coin,
            new Date(request.body.time)
          )
        );
        response.sendStatus(200);
      } catch (_) {
        response.sendStatus(500);
      }
    });

    this.serverApplication.get('/api/hwwallet/amounts', async (_, response) => {
      try {
        let stackingAmounts =
          await this.databaseController.getStackingAmounts();
        let calculatedAmounts = [];
        stackingAmounts.forEach((stackingAmount) => {
          if (calculatedAmounts[stackingAmount.coin])
            calculatedAmounts[stackingAmount.coin] += stackingAmount.value;
          else calculatedAmounts[stackingAmount.coin] = stackingAmount.value;
        });
        response.send(calculatedAmounts);
      } catch (_) {
        response.sendStatus(500);
      }
    });
  }
}

/**
 * Module exports
 */
module.exports = { APIController: APIController };
