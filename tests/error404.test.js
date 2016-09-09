import request from 'supertest';
import app from '../index';

test('present XML data in JSON format and produce a valid output', () => {
  return request(app)
    .get('/non_existent_url')
    .expect(404);
});
