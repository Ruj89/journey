const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class Database {
    constructor(databaseFilePath) {
        this.databaseFilePath = databaseFilePath;
        this.database = null;
    }

    initialize() {
        let databaseFileExists = fs.existsSync(this.databaseFilePath);
        let databaseContainingFolder = path.dirname(this.databaseFilePath);
        if (!databaseFileExists && !fs.existsSync(databaseContainingFolder))
            fs.mkdirSync(databaseContainingFolder);
        this.database = new sqlite3.Database(this.databaseFilePath, (err) => {
            if (err) console.error(err.message);
        });

        if (!databaseFileExists) {
            this.database.get("PRAGMA foreign_keys = ON");
            this.database.serialize(() => {
                this.database.run("\
                CREATE TABLE mining_users ( \
                    id              INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, \
                    name            TEXT NOT NULL, \
                    defaultHashRate REAL NOT NULL \
                )");
                this.database.run("\
                CREATE TABLE mining_action ( \
                    id          INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, \
                    type        TEXT CHECK( type IN ('Start', 'End') ) NOT NULL, \
                    date        TIMESTAMP NOT NULL, \
                    user		INTEGER NOT NULL, \
                    \
                    FOREIGN KEY(user) REFERENCES mining_users(id) \
                )");
                this.database.run("\
                CREATE TABLE mining_share ( \
                    id          INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, \
                    amount      REAL NOT NULL, \
                    start_time  TIMESTAMP NOT NULL, \
                    end_time    TIMESTAMP NOT NULL \
                )");
            });
        }
    }
}

module.exports = { Database: Database }