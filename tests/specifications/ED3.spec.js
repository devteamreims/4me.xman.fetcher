import {
  xmlToJS,
} from '../../src/data/index';

import Promise from 'bluebird';

const readFile = Promise.promisify(require('fs').readFile);

test('discard an improper XML', () => {
  return readFile('./tests/invalid-xman.xml')
    .then(data => xmlToJS(data))
    .then(data => expect(true).toBe(false))
    .catch(err => {
      expect(err).toBeDefined();
    });
});
