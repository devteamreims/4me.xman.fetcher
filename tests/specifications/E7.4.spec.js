import request from 'supertest';
import nock from 'nock';
import app from '../../index';

import {readFileSync} from 'fs';

const xmanData = readFileSync('./tests/xman.xml');

test('have a request timeout', () => {
  process.env.XMAN_URL = 'http://xmansvr';
  process.env.MAX_REQUEST_TIME = 300;

  const xmanRemote = nock(process.env.XMAN_URL)
    .get('/')
    .delay(500)
    .reply(200, xmanData);


  return request(app)
    .get('/processed')
    .expect(500)
    .expect(res => {
      expect(res.body.error).toMatch(/MAX_REQUEST_TIME/);
      nock.cleanAll();
    });
});

test('have a maximum allowed size for server response', () => {
  process.env.XMAN_URL = 'http://xmansvr';

  const xmanRemote = nock(process.env.XMAN_URL)
    .defaultReplyHeaders({
      'Content-Length': 1024*1024*1024*2, // 2 GB
    })
    .get('/')
    .reply(200, xmanData);

  return request(app)
    .get('/processed')
    .expect(500)
    .expect(res => {
      expect(res.body.error).toMatch(/MAX_REQUEST_SIZE/);
      nock.cleanAll();
    });

});

test('reject large downloads even if content-length header does not match', () => {
  const longData = (new Array(10*1024*1024)).join("x"); // 10MB

  const xmanRemote = nock(process.env.XMAN_URL)
    .defaultReplyHeaders({
      'Content-Length': 1024*12, // Server replies 12KB
    })
    .get('/')
    .reply(200, longData);

  return request(app)
    .get('/processed')
    .expect(500)
    .expect(res => {
      expect(res.body.error).toMatch(/MAX_REQUEST_SIZE/);
      nock.cleanAll();
    });

});
