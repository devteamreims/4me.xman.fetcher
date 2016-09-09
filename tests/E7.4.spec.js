import request from 'supertest';
import nock from 'nock';
import app from '../index';

import {readFileSync} from 'fs';

process.env.XMAN_URL = 'http://xmansvr';
process.env.MAX_REQUEST_TIME = 300;

test('have a request timeout', () => {
  const xmanRemote = nock(process.env.XMAN_URL)
    .get('/')
    .delay(1500)
    .reply(200, readFileSync('./tests/xman.xml'));


  return request(app)
    .get('/processed')
    .expect(500)
    .expect(res => {
      expect(res.body.error).toMatch(/MAX_REQUEST_TIME/);
      nock.cleanAll();
    });
});
