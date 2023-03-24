const express = require('express');
const { WSSController } = require('./client/wss');
const { APIController } = require('./api/api');
const { Database } = require('./database/database');
const utility = require('./utility/process');
const { WebController } = require('./web/web');

var port = 8080;
var serverApplication = express();
serverApplication.use(express.json());
serverApplication.listen(port, () => {
  console.log(`Journey server listening at http://localhost:${port}`);
});

var database;
var wssController;
var apiController;

async function main() {
  database = new Database(`${__dirname}/work/db`);
  database.initialize();
  wssController = new WSSController(database);
  await wssController.connect();
  apiController = new APIController(serverApplication, database, wssController);
  apiController.initialize();
  webController = new WebController(serverApplication);
  webController.initialize();
}

utility.setCleanUp(() => {
  console.log('Cleaning database');
  database.database.close();
});

main();
