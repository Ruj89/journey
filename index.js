const { WSSController } = require('./client/wss');
const { APIController } = require('./api/api');
const { Database } = require('./database/database')
const utility = require('./utility/process')

utility.setCleanUp();
let wssController = new WSSController();
let database = new Database(`${__dirname}/work/db`);
let apiController = new APIController(8080, database, wssController);
apiController.initialize();