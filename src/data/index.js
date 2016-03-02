import d from 'debug';
const debug = d('4me.data');
import Promise from 'bluebird';
import _ from 'lodash';

import {parseString as parseStringCallback} from 'xml2js';
import {stripPrefix} from 'xml2js/lib/processors';

import fetchXmanData from './fetch';


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
  if(lastRawData.rawData !== '') {
    return Promise.resolve(lastRawData.rawData);
  }
  return fetchXmanData();
}

// Async
export function getXmanData() {
  return fetchXmanData().then(xmlToJS);
}


export function xmlToJS(xmlString) {
  lastRawData.lastFetched = Date.now();
  lastRawData.rawData = xmlString;
  return parseString(xmlString, xml2jsOptions)
    .then(formatJs);
}


const extractArrivalSequence = (rawJS) => _.get(rawJS, 'arrivalSequenceCollection.arrivalSequence');
const extractMessageTime = (rawJS) => _.get(extractArrivalSequence(rawJS), 'messageTime');
const extractRunwaySequence = (rawJS) => _.get(extractArrivalSequence(rawJS), 'airport.runwaySequence');

const extractSequencingPoints = (flight) => _.get(flight, 'sequencingPoint', []);

const extractPointByType = (type) => (flight) => _.find(extractSequencingPoints(flight), {type}, {});
const extractCop = (flight) => extractPointByType('COP')(flight);


const extractTotalDelay = (flight) => _.get(extractPointByType('ARR_RUNWAY')(flight), 'delay');


const fliesOver = (navPoint) => (flight) => {
  const seqPoints = _.map(extractSequencingPoints(flight), 'point.base:name');
  return _.includes(seqPoints, navPoint);
};

const copAfter = (maxTimeAtCop) => (flight) => {
  const cop = extractCop(flight);

  const timeAtCop = Date.parse(_.get(cop, 'timeatpoint.estimated', 0));

  debug(flight.arcid);
  debug(timeAtCop + ' / ' + maxTimeAtCop);

  return timeAtCop > maxTimeAtCop;
};

const extractAdvisory = (flight) => {

};




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
    .map(f => _.merge({}, f, {totalDelay: extractTotalDelay(f)}))
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
