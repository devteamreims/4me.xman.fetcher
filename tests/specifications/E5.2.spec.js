import request from 'supertest';
import nock from 'nock';
import app from '../../index';

beforeEach(() => {
  process.env.XMAN_URL = "http://test-url";
});

afterEach(() => {
  delete process.env.XMAN_URL;
});

test('send a request to remote server', () => {
  const remoteXman = nock(process.env.XMAN_URL)
    .get('/')
    .reply(200, "OK");

  return request(app)
    .get('/processed')
    .expect(res => {
      // Here we just expect our remote server has received a request
      expect(remoteXman.isDone()).toBeTruthy();
    });
});
