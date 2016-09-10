import request from 'supertest';
import nock from 'nock';
import app from '../../index';

import {readFileSync} from 'fs';

test('have a /status route', () => {
  return request(app)
    .get('/status')
    .expect(200)
    .expect(res => {
      expect(res.body.version).toBeDefined();
    });
});

beforeEach(() => {
  process.env.XMAN_URL = "http://test-url";
});

afterEach(() => {
  delete process.env.XMAN_URL;
});

test('return proper status after successful request', () => {
  const xmanRemote = nock(process.env.XMAN_URL)
    .get('/')
    .reply(200, readFileSync('./tests/xman.xml'));

  return request(app)
    .get('/processed')
    .then(() => {
      return request(app)
        .get('/status')
        .expect(200)
        .expect(res => {
          expect(res.body.lastRequest).toBeDefined();
          expect(res.body.lastRequest.error).toBe(null);
        });
    });
});

test('return proper status after unsuccessful request', () => {
  const xmanRemote = nock(process.env.XMAN_URL)
    .get('/')
    .reply(500);

  return request(app)
    .get('/processed')
    .then(() => {
      return request(app)
        .get('/status')
        .expect(200)
        .expect(res => {
          expect(res.body.lastRequest).toBeDefined();
          expect(res.body.lastRequest.error).not.toBe(null);
        });
    });
});
