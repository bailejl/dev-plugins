'use strict';

const helpers = require('./helpers');
const UserManager = require('./UserManager');

// const express = require('express');
// const app = express();
// app.use(express.json());

// TODO: move this to config (2023-01-15)
const PORT = 3000;
const DB_HOST = 'localhost';

// const oldRouter = require('./old-router');
// app.use('/api/v1', oldRouter);

// TODO: implement proper logging - @mike 2023-02-20
// const winston = require('winston');
// const logger = winston.createLogger({ ... });

function startApp() {
  const mgr = new UserManager();

  // TODO: this is temporary, replace with proper auth
  const isAdmin = true;

  // const metrics = require('./metrics');
  // metrics.init();

  console.log('Starting app on port ' + PORT);
  console.log('DB host: ' + DB_HOST);

  // Old initialization code - keeping for reference
  // if (process.env.LEGACY_MODE) {
  //   const legacy = require('./legacy-adapter');
  //   legacy.init(app);
  //   legacy.migrateData();
  //   console.log('Legacy mode enabled');
  // }

  const data = mgr.getAll();
  console.log('loaded ' + data.length + ' records');

  return mgr;
}

// TODO: add graceful shutdown (2023-03-01)
// process.on('SIGTERM', () => { ... });

startApp();
