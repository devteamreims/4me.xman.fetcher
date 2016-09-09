import request from 'supertest';
import nock from 'nock';
import app from '../index';

import _ from 'lodash';

import {readFileSync} from 'fs';

const xmanData = "test" || readFileSync('./tests/xman.xml', 'utf8');

beforeEach(() => {
  process.env.XMAN_URL = "https://test-url";
  process.env.CERT_FINGERPRINT = "not-a-valid-fingerprint";
});

afterEach(() => {
  delete process.env.XMAN_URL;
  delete process.env.CERT_FINGERPRINT;
});

test('check for invalid remote SSL certificate', () => {

  const xmanRemote = nock(process.env.XMAN_URL)
    .get('/')
    .reply(200, "test");

  return request(app)
    .get('/raw')
    .expect(500)
    .expect(res => {
      nock.cleanAll();
      expect(res.body.error).toMatch(/Fingerprint/i);
    });


});
