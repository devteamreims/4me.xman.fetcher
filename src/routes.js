import express from 'express';

import {getRawData} from './data';
import getXmanDataRouter from './controller';

export function getRoutes() {

  let router = express.Router();

  router.get('/raw', rawController);

  router.use('/processed', getXmanDataRouter());

  return router;
};



function rawController(req, res, next) {
  getRawData()
    .then((xml) => {
      res.set('Content-Type', 'text/xml');
      res.send(xml)
    })
    .catch(next);
}
