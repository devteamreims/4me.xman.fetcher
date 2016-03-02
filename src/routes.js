import express from 'express';

import {getLastRawData} from './data';
import getXmanDataRouter from './controller';

export function getRoutes() {

  let router = express.Router();

  router.get('/raw', rawController);

  router.use('/processed', getXmanDataRouter());

  return router;
};



function rawController(req, res, next) {
  res.send(getLastRawData());
}
