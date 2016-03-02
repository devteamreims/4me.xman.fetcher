import d from 'debug';
const debug = d('4me.data.fetcher');
import Promise from 'bluebird';
import _ from 'lodash';

import fs from 'fs';
const readFile = Promise.promisify(fs.readFile);

import rp from 'request-promise';

const proxy = process.env.https_proxy;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

let reqOpts = {};

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
  return request(xmanUrl);
}
