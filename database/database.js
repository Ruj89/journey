const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const {
  User,
  Share,
  Action,
  Coin,
  StackingAmount,
} = require('../models/models');

class Database {
  /**
   * Setup the database parameters
   * @param {string} databaseFilePath Path to the database file
   */
  constructor(databaseFilePath) {
    this.databaseFilePath = databaseFilePath;
    this.database = null;
  }

  /**
   * Create the database if not exists and open a connection to it
   */
  initialize() {
    let databaseFileExists = fs.existsSync(this.databaseFilePath);
    let databaseContainingFolder = path.dirname(this.databaseFilePath);
    if (!databaseFileExists && !fs.existsSync(databaseContainingFolder))
      fs.mkdirSync(databaseContainingFolder);
    this.database = new sqlite3.Database(this.databaseFilePath, (err) => {
      if (err) console.error(err.message);
    });

    if (!databaseFileExists) {
      this.database.get('PRAGMA foreign_keys = ON');
      this.database.serialize(() => {
        this.database.run(
          '\
                CREATE TABLE "coins" ( \
                    "id"	INTEGER NOT NULL, \
                    "name"	TEXT NOT NULL, \
                    "ticker"	TEXT NOT NULL, \
                    "vs"	TEXT DEFAULT NULL, \
                    PRIMARY KEY("id" AUTOINCREMENT) \
                )'
        );
        this.database.run(
          '\
                CREATE TABLE mining_users ( \
                    id              INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, \
                    name            TEXT NOT NULL, \
                    defaultHashRate REAL NOT NULL, \
                    telegramName    TEXT NOT NULL  \
                )'
        );
        this.database.run(
          "\
                CREATE TABLE mining_action ( \
                    id    INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, \
                    type  TEXT CHECK( type IN ('Start', 'End') ) NOT NULL, \
                    date  TIMESTAMP NOT NULL, \
                    user	INTEGER NOT NULL, \
                    \
                    FOREIGN KEY(user) REFERENCES mining_users(id) \
                )"
        );
        this.database.run(
          '\
                CREATE TABLE mining_share ( \
                    id          INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, \
                    amount      REAL NOT NULL, \
                    start_time  TIMESTAMP NOT NULL, \
                    end_time    TIMESTAMP NOT NULL \
                )'
        );
        this.database.run(
          '\
                CREATE TABLE "stacking_amounts" ( \
                    "id"	      INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, \
                    "value"	    REAL NOT NULL, \
                    "coin"	    INTEGER NOT NULL, \
                    "time"	    TIMESTAMP NOT NULL \
                )'
        );
      });
    }
  }

  /**
   * Create a new user
   * @param {User} user User to be created
   * @returns the promise of the operation
   */
  createUser(user) {
    return new Promise((resolve, reject) => {
      this.database.run(
        'INSERT INTO mining_users VALUES (NULL, ?, ?)',
        [user.name, user.defaultHashRate],
        (error) => {
          if (!error) resolve();
          else reject(error);
        }
      );
    });
  }
  /**
   * Get all the users
   * @returns the users list promise
   */
  getUsers() {
    return new Promise((resolve, reject) => {
      this.database.all('SELECT * FROM mining_users', (error, users) => {
        if (!error)
          resolve(
            users.map(
              (user) =>
                new User(
                  user.name,
                  user.defaultHashRate,
                  user.telegramName,
                  user.id
                )
            )
          );
        else reject(error);
      });
    });
  }
  /**
   * Update an user field
   * @param {*} id Identifier of the user to be modified
   * @param {*} field Field name
   * @param {*} data Data to be put inside the user field
   * @returns the promise of the operation
   */
  updateUser(id, field, data) {
    return new Promise((resolve, reject) => {
      this.database.run(
        `UPDATE mining_users SET ${field} = ? WHERE id = ?`,
        [data, id],
        (error) => {
          if (!error) resolve();
          else reject(error);
        }
      );
    });
  }
  /**
   * Delete an user
   * @param {*} id Identifier of the user to be deleted
   * @returns the promise of the operation
   */
  deleteUser(id) {
    return new Promise((resolve, reject) => {
      this.database.run(
        `DELETE FROM mining_users WHERE id = ?`,
        [id],
        (error) => {
          if (!error) resolve();
          else reject(error);
        }
      );
    });
  }

  /**
   * Create e new share
   * @param {Share} share Share to be created
   * @returns the promise of the operation
   */
  createShare(share) {
    return new Promise((resolve, reject) => {
      this.database.run(
        'INSERT INTO mining_share VALUES (NULL, ?, ?, ?)',
        [
          share.amount,
          share.start_time.toISOString(),
          share.end_time.toISOString(),
        ],
        (error) => {
          if (!error) resolve();
          else reject(error);
        }
      );
    });
  }
  /**
   * Get all the shares
   * @returns the shares list promise
   */
  getShares() {
    return new Promise((resolve, reject) => {
      this.database.all('SELECT * FROM mining_share', (error, shares) => {
        if (!error)
          resolve(
            shares.map(
              (share) =>
                new Share(
                  share.amount,
                  new Date(share.start_time),
                  new Date(share.end_time),
                  share.id
                )
            )
          );
        else reject(error);
      });
    });
  }
  /**
   * Get a share
   * @param {numer} id the share identifier
   * @returns the share promise
   */
  getShare(id) {
    return new Promise((resolve, reject) => {
      this.database.get(
        'SELECT amount, start_time, end_time FROM mining_share WHERE id = ?',
        [id],
        (error, share) => {
          if (!error)
            resolve(
              new Share(
                share.amount,
                new Date(share.start_time),
                new Date(share.end_time),
                id
              )
            );
          else reject(error);
        }
      );
    });
  }

  /**
   * Create e new action
   * @param {Action} action Action to be created
   * @returns the promise of the operation
   */
  createAction(action) {
    return new Promise((resolve, reject) => {
      this.database.run(
        'INSERT INTO mining_action VALUES (NULL, ?, ?, ?)',
        [action.type, action.date.toISOString(), action.user],
        (error) => {
          if (!error) resolve();
          else reject(error);
        }
      );
    });
  }
  /**
   * Check if an action already exists (data comparison)
   * @returns the promise of the boolean
   */
  actionExists(action) {
    return new Promise((resolve, reject) => {
      this.database.all(
        'SELECT id FROM mining_action WHERE type = ? AND date = ? AND user = ?',
        [action.type, action.date, action.user],
        (error, actions) => {
          if (!error) resolve(actions.length > 0);
          else reject(error);
        }
      );
    });
  }
  /**
   * Get the actions executed between two times
   * @returns the actions list promise
   */
  getActionsBetweenTimes(start_time, end_time) {
    return new Promise((resolve, reject) => {
      this.database.all(
        'SELECT id, type, date, user FROM mining_action WHERE date > ? AND date < ? ORDER BY date',
        [start_time.toISOString(), end_time.toISOString()],
        (error, actions) => {
          if (!error)
            resolve(
              actions.map(
                (action) =>
                  new Action(
                    action.type,
                    new Date(action.date),
                    action.user,
                    action.id
                  )
              )
            );
          else reject(error);
        }
      );
    });
  }

  /**
   * Create e new coin
   * @param {Coin} coin Coin to be created
   * @returns the promise of the operation
   */
  createCoin(coin) {
    return new Promise((resolve, reject) => {
      this.database.run(
        'INSERT INTO coins VALUES (NULL, ?, ?, NULL)',
        [coin.name, coin.ticker],
        (error) => {
          if (!error) resolve();
          else reject(error);
        }
      );
    });
  }
  /**
   * Get all the coins
   * @returns the coins list promise
   */
  getCoins() {
    return new Promise((resolve, reject) => {
      this.database.all('SELECT * FROM coins', (error, coins) => {
        if (!error)
          resolve(
            coins.map(
              (coin) => new Coin(coin.name, coin.ticker, coin.vs, coin.id)
            )
          );
        else reject(error);
      });
    });
  }
  /**
   * Delete a coin
   * @param {*} id Identifier of the coin to be deleted
   * @returns the promise of the operation
   */
  deleteCoin(id) {
    return new Promise((resolve, reject) => {
      this.database.run(`DELETE FROM coins WHERE id = ?`, [id], (error) => {
        if (!error) resolve();
        else reject(error);
      });
    });
  }

  /**
   * Create a new stacking amount
   * @param {StackingAmount} stackingAmount Stacking amount to be created
   * @returns the promise of the operation
   */
  createStackingAmount(stackingAmount) {
    return new Promise((resolve, reject) => {
      this.database.run(
        'INSERT INTO stacking_amounts VALUES (NULL, ?, ?, ?)',
        [stackingAmount.value, stackingAmount.coin, stackingAmount.time],
        (error) => {
          if (!error) resolve();
          else reject(error);
        }
      );
    });
  }
  /**
   * Get all the stacking amounts
   * @returns the stacking amounts list promise
   */
  getStackingAmounts() {
    return new Promise((resolve, reject) => {
      this.database.all(
        'SELECT * FROM stacking_amounts',
        (error, stackingAmounts) => {
          if (!error)
            resolve(
              stackingAmounts.map(
                (stackingAmount) =>
                  new StackingAmount(
                    stackingAmount.value,
                    stackingAmount.coin,
                    stackingAmount.time,
                    stackingAmount.id
                  )
              )
            );
          else reject(error);
        }
      );
    });
  }
}

/**
 * Module exports
 */
module.exports = { Database: Database };
