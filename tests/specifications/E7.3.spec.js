import request from 'supertest';
import nock from 'nock';
import app from '../../index';

import {readFileSync} from 'fs';

process.env.XMAN_URL = 'http://xmansvr';

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
