import {getXmanData} from './data';
import express from 'express';

export default function getRoutes() {

  const router = express.Router();

  router.get('/', xmanData);

  return router;
}

function xmanData(req, res, next) {
  getXmanData()
    .then((data) => res.send(data))
    .catch(next);
}
