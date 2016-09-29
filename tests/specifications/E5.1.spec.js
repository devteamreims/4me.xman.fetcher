import {
  xmlToJS,
} from '../../src/data/index';

import Promise from 'bluebird';

const readFile = Promise.promisify(require('fs').readFile);

test('handle a properly formatted XMAN XML', () => {
  return readFile('./tests/xman.xml')
    .then(data => xmlToJS(data))
    .then(data => expect(data).toMatchSnapshot());
});
