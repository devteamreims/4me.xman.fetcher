import d from 'debug';
const debug = d('4me.data');
import Promise from 'bluebird';
import _ from 'lodash';

import {parseString as parseStringCallback} from 'xml2js';
import {stripPrefix} from 'xml2js/lib/processors';

import fs from 'fs';

const readFile = Promise.promisify(fs.readFile);
const parseString = Promise.promisify(parseStringCallback);

const xml2jsOptions = {
  mergeAttrs: true,
  explicitArray: false,
  tagNameProcessors: [stripPrefix],
  //attrNameProcessors: [stripPrefix],
  //valueProcessors: [stripPrefix]
};

let lastRawData = {
  lastUpdated: null,
  lastFetched: null,
  rawData: ''
};

export function getLastRawData() {
  return lastRawData.rawData;
}

// Async
export function getXmanData() {
  return fileToXml().then(xmlToJS);
}


export function xmlToJS(xmlString) {
  lastRawData.lastFetched = Date.now();
  return parseString(xmlString, xml2jsOptions)
    .then(formatJs);
}


const extractArrivalSequence = (rawJS) => _.get(rawJS, 'arrivalSequenceCollection.arrivalSequence');
const extractMessageTime = (rawJS) => _.get(extractArrivalSequence(rawJS), 'messageTime');
const extractRunwaySequence = (rawJS) => _.get(extractArrivalSequence(rawJS), 'airport.runwaySequence');

const extractSequencingPoint = (flight) => _.get(flight, 'sequencingPoint', []);

const fliesOver = (navPoint) => (flight) => {
  const seqPoints = _.map(extractSequencingPoint(flight), 'point.base:name');
  return _.includes(seqPoints, navPoint);
};

const copAfter = (maxTimeAtCop) => (flight) => {
  const cop = _.find(extractSequencingPoint(flight), {type: 'COP'});

  const timeAtCop = Date.parse(_.get(cop, 'timeatpoint.estimated', 0));

  debug(flight.arcid);
  debug(timeAtCop + ' / ' + maxTimeAtCop);

  return timeAtCop > maxTimeAtCop;
}



const extractFlights = (rawJS) => {
  // runwaySequence : [{runway: XX, sequencedFlights: []}, {...}]
  const extractSequence = (runwaySequence) => _.get(runwaySequence, 'sequencedFlight');

  const messageTime = Date.parse(extractMessageTime(rawJS));

  const flights = _.map(extractRunwaySequence(rawJS), extractSequence);

  return _(flights)
    .flatten()
    .compact()
    .unionBy('arcid')
    .filter(fliesOver('ABNUR'))
    .filter(copAfter(messageTime))
    .sortBy('tldt')
    .value();
};


function formatJs(rawJS) {
  const flights = extractFlights(rawJS);
  const messageTime = extractMessageTime(rawJS);
  return {
    messageTime,
    total: flights.length,
    flights
  };
}


function fileToXml() {
  debug('CALLED !!');
  return readFile('xman.sample.xml');
}
