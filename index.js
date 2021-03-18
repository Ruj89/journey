const { WSSController } = require('./client/wss');
const { APIController } = require('./api/api');
const { Database } = require('./database/database');
const utility = require('./utility/process');

let wssController = new WSSController();
let database = new Database(`${__dirname}/work/db`);
let apiController = new APIController(8080, database, wssController);
utility.setCleanUp(() => {
  console.log('Cleaning database');
  database.database.close();
});
apiController.initialize();
