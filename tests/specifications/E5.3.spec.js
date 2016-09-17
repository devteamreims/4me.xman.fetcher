import request from 'supertest';
import nock from 'nock';
import app from '../../index';

import {readFileSync} from 'fs';

beforeEach(() => {
  process.env.XMAN_URL = "http://test-url";
});

afterEach(() => {
  delete process.env.XMAN_URL;
});

test('present XML data in JSON format and produce a valid output', () => {
  const xmanRemote = nock(process.env.XMAN_URL)
    .get('/')
    .reply(200, readFileSync('./tests/xman.xml'));

  return request(app)
    .get('/processed')
    .expect('Content-Type', /json/)
    .expect(res => {
      expect(res.body).toMatchSnapshot();
    });
});
