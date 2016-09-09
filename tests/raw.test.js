import request from 'supertest';
import nock from 'nock';
import app from '../index';

import {readFileSync} from 'fs';

const xmanData = readFileSync('./tests/xman.xml', 'utf8');

beforeEach(() => {
  process.env.XMAN_URL = "http://test-url";
});

afterEach(() => {
  delete process.env.XMAN_URL;
});

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
