import d from 'debug';
const debug = d('4me.data.fetcher');
import Promise from 'bluebird';
import _ from 'lodash';

import rp from 'request-promise';

import {
  setStatus,
} from '../status';


const reqOpts = {
  resolveWithFullResponse: true,
};



const request = rp.defaults(reqOpts);

export default function fetch() {
  const xmanUrl = process.env.XMAN_URL;
  debug(`url is ${xmanUrl}`);
  debug('Fetching XMAN data');

  const MAX_REQUEST_SIZE = parseInt(process.env.MAX_REQUEST_SIZE) || 1024*1024*10; // 2MB
  const MAX_REQUEST_TIME = parseInt(process.env.MAX_REQUEST_TIME) || 1000*20; // 20 seconds


  return new Promise((resolve, reject) => {
    const r = request(xmanUrl);
    const startTime = Date.now();


    // Response event is triggered when response headers are returned
    // This event will occur before request() resolution;
    r.on('response', res => {
      const expectedFingerprint = process.env.CERT_FINGERPRINT;

      const actualFingerprint = _.get(
        res.req.connection.getPeerCertificate && res.req.connection.getPeerCertificate(),
        'fingerprint'
      );

      // We check for actualFingerprint existence because this will only be set on the first request
      // Subsequent requests will use a keep-alive connection and won't have an actualFingerprint set
      if(expectedFingerprint && actualFingerprint && expectedFingerprint !== actualFingerprint) {
        debug(`Fingerprint mismatch :`);
        debug(`Expected : ${expectedFingerprint}`);
        debug(`Returned : ${actualFingerprint}`);
        r.abort();
        reject(`SSL fingerprint mismatch !`);
      }
    });

    // Here we check response headers for file size and reject if too large
    r.on('response', res => {
      const headerSize = _.get(res, 'headers.content-length', 0);
      if(headerSize > MAX_REQUEST_SIZE) {
        debug(`Aborting request due to MAX_REQUEST_SIZE (content-length is ${headerSize})`);
        reject('Response exceeds MAX_REQUEST_SIZE');
        r.abort();
      }
    });

    let dataLen = 0;

    r.on('data', chunk => {
      dataLen += _.size(chunk);

      const elapsedTime = Date.now() - startTime;

      if(elapsedTime > MAX_REQUEST_TIME) {
        debug(`Aborting request due to MAX_REQUEST_TIME : ${MAX_REQUEST_TIME}`);
        reject('Response exceeds MAX_REQUEST_TIME');
        r.abort();
      }

      if(dataLen > MAX_REQUEST_SIZE) {
        debug(`Aborting request due to MAX_REQUEST_SIZE : ${MAX_REQUEST_SIZE}`);
        reject(`Response exceeds MAX_REQUEST_SIZE`);
        r.abort();
      }
    });

    r.then(resolve, reject);
  })
  .then(resp => {
    setStatus(resp);
    return _.get(resp, 'body');
  })
  .catch(err => {
    setStatus(_.get(err, 'response', null), _.get(err, 'message', 'Unknown error'));
    return Promise.reject(err);
  });
}
