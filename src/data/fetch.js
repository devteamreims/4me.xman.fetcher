import d from 'debug';
const debug = d('4me.data.fetcher');
import Promise from 'bluebird';
import _ from 'lodash';

import rp from 'request-promise';

const proxy = process.env.https_proxy;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

let reqOpts = {
};

if(proxy !== undefined) {
  reqOpts = _.merge(reqOpts, {
    proxy
  });
}

const request = rp.defaults(reqOpts);

export default function fetch() {
  const xmanUrl = process.env.XMAN_URL;
  debug(`url is ${xmanUrl}`);
  debug('Fetching XMAN data');



  return new Promise((resolve, reject) => {
    const r = request(xmanUrl);

    // Response event is triggered when response headers are returned
    // This event will occur before request() resolution;
    r.on('response', res => {
      const expectedFingerprint = process.env.CERT_FINGERPRINT;
      console.log(res.req.connection.getPeerCertificate());
      const actualFingerprint = _.get(res.req.connection.getPeerCertificate(), 'fingerprint');

      // We check for actualFingerprint existence because this will only be set on the first request
      // Subsequent requests will use a keep-alive connection and won't have an actualFingerprint set
      if(expectedFingerprint && actualFingerprint && expectedFingerprint !== actualFingerprint) {
        debug(`Fingerprint mismatch :`);
        debug(`Expected : ${expectedFingerprint}`);
        debug(`Returned : ${actualFingerprint}`);
        reject(`SSL fingerprint mismatch !`);
      }
    });

    r.then(resp => resolve(resp));
  });
}
