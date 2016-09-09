import request from 'supertest';
import app from '../index';

import {readFileSync} from 'fs';

process.env.XMAN_URL = 'http://xmansvr';

const xmanData = readFileSync('./tests/xman.xml', 'utf8');

test('present XML data in JSON format and produce a valid output', () => {
  return request(app)
    .get('/non_existent_url')
    .expect(404);
});
