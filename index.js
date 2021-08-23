const { WSSController } = require('./client/wss');
const { APIController } = require('./api/api');
const { Database } = require('./database/database');
const utility = require('./utility/process');

var database;
var wssController;
var apiController;

async function main() {
  database = new Database(`${__dirname}/work/db`);
  database.initialize();
  wssController = new WSSController(database);
  await wssController.connect();
  apiController = new APIController(8080, database, wssController);
  apiController.initialize();
}

utility.setCleanUp(() => {
  console.log('Cleaning database');
  database.database.close();
});

main();
