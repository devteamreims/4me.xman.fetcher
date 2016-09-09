import request from 'supertest';
import nock from 'nock';
import app from '../index';

import {readFileSync} from 'fs';

process.env.XMAN_URL = 'http://xmansvr';

const xmanData = readFileSync('./tests/xman.xml', 'utf8');

test('present XML data in JSON format and produce a valid output', () => {
  const xmanRemote = nock(process.env.XMAN_URL)
    .get('/')
    .reply(200, xmanData);

  return request(app)
    .get('/raw')
    .expect(res => {
      expect(res.text).toBe(xmanData);
      nock.cleanAll();
    });
});
