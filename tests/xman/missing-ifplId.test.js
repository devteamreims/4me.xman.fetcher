import {
  xmlToJS,
} from '../../src/data/index';

import {get} from 'lodash';

import Promise from 'bluebird';

const readFile = Promise.promisify(require('fs').readFile);

test('handle flights without ifplId', () => {
  return readFile('./tests/xman/missing-ifplId.xml')
    .then(data => xmlToJS(data))
    .then(data => {
      const flight = get(data, 'flights[0]');
      expect(flight).toBeTruthy();
      expect(flight.ifplId).toBeTruthy();
    });
});
