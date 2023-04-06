import express from 'express';
import { APIController } from './api/api.js';
import { WSSController } from './client/wss.js';
import { Database } from './database/database.js';
import { setCleanUp } from './utility/process.js';
import { WebController } from './web/web.js';

var port = 8080;
var serverApplication = express();
serverApplication.use(express.json());
serverApplication.listen(port, () => {
  console.log(`Journey server listening at http://localhost:${port}`);
});

var database;
var wssController;
var apiController;
var webController;

async function main() {
  database = new Database('work/db');
  database.initialize();
  wssController = new WSSController(database);
  await wssController.connect();
  apiController = new APIController(serverApplication, database, wssController);
  apiController.initialize();
  webController = new WebController(serverApplication);
  webController.initialize();
}

function cleanUp() {
  console.log('Cleaning database');
  if (database) database.dispose();
}

setCleanUp(cleanUp);

main();
