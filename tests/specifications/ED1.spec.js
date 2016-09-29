import request from 'supertest';
import nock from 'nock';
import app from '../../index';

import _ from 'lodash';

import {readFileSync} from 'fs';

const xmanData = readFileSync('./tests/xman.xml');

beforeEach(() => {
  process.env.XMAN_URL = "http://test-url";
});

afterEach(() => {
  delete process.env.XMAN_URL;
});

test('have a request timeout', () => {
  process.env.MAX_REQUEST_TIME = 300;

  const xmanRemote = nock(process.env.XMAN_URL)
    .get('/')
    .delay(500)
    .reply(200, xmanData);


  return request(app)
    .get('/processed')
    .expect(() => delete process.env.MAX_REQUEST_TIME)
    .expect(500)
    .expect(res => {
      expect(res.body.error).toMatch(/MAX_REQUEST_TIME/);
      nock.cleanAll();
    });
});
