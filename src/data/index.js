import d from 'debug';
const debug = d('4me.data');
import Promise from 'bluebird';
import _ from 'lodash';

import {parseString as parseStringCallback} from 'xml2js';
import {stripPrefix} from 'xml2js/lib/processors';

import fetchXmanData from './fetch';


const parseString = function () {
  return new Promise((resolve, reject) => {
    parseStringCallback(...arguments, (err, data) => {
      console.log(data);
      if(err) {
        return reject(err);
      }
      resolve(data);
    });
  });
};

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
  return fetchXmanData()
    .then(xmlToJS)
    .catch(err => {
      debug('Fetcher error !');
      return Promise.reject(err);
    });
}


export function xmlToJS(xmlString) {
  lastRawData.lastFetched = Date.now();
  lastRawData.rawData = xmlString;
  return parseString(xmlString, xml2jsOptions)
    .then(formatJs);
}


const extractArrivalSequence = (rawJS) => _.get(rawJS, 'arrivalSequenceCollection.arrivalSequence') || _.get(rawJS, 'arrivalSequence');
const extractMessageTime = (rawJS) => _.get(extractArrivalSequence(rawJS), 'messageTime');
const extractRunwaySequence = (rawJS) => _.get(extractArrivalSequence(rawJS), 'airport.runwaySequence');

const extractSequencingPoints = (flight) => _.get(flight, 'sequencingPoint', []);

const extractPointByType = (type) => (flight) => _.find(extractSequencingPoints(flight), {type}, {});
const extractCop = (flight) => extractPointByType('COP')(flight);


const extractTotalDelay = (flight) => _.get(extractPointByType('ARR_RUNWAY')(flight), 'delay');

const extractDelayFromPoint = (seqPoint) => _.get(seqPoint, 'delay');
const extractSmoothedDelayFromPoint = (seqPoint) => _.get(seqPoint, 'smoothedDelay');


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

const convertDelay = (str) => {
  // String format : PTxHyMzS
  // Where x, y, z represent the total delay value
  const matchDelay = /PT(\d+)H(\d+)M(\d+)S/;

  if(str === 'NIL') {
    return -1;
  }

  if(!matchDelay.test(str)) {
    return 0;
  }

  const [matched, hours, minutes, seconds] = matchDelay.exec(str);

  return 3600*parseInt(hours) + 60*parseInt(minutes) + parseInt(seconds);
};

const extractAdvisory = (flight) => {
  const cop = extractCop(flight);
  const targetTime = _.get(cop, 'timeatpoint.target');
  const estimatedTime = _.get(cop, 'timeatpoint.estimated');
  const delay = convertDelay(extractDelayFromPoint(cop));
  const smoothedDelay = convertDelay(extractSmoothedDelayFromPoint(cop));

  return {
    targetTime,
    estimatedTime,
    delay,
    smoothedDelay,
  };
};

const extractAmanState = (rawJS) => {
  const seq = extractArrivalSequence(rawJS);

  const transformState = (prev, stateObj) => {
    const component = _.get(stateObj, 'component');
    if(!component) {
      return prev;
    }
    const rest = _.omit(stateObj, 'component');

    const obj = {};
    obj[component] = _.omit(stateObj, 'component');

    return Object.assign({}, prev, obj);
  }

  const status = _.get(seq, 'amanState');
  return _.reduce(status, transformState, {});
};

const extractAirportState = (rawJS) => {
  const seq = extractArrivalSequence(rawJS);

  const airportState = _.get(seq, 'airport');

  debug(airportState);

  return {};
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
    .map(f => _.merge({}, {
      ifplId: f.ifplid,
      destination: f.ades,
      arcid: f.arcid,
      cop: 'ABNUR',
      delay: convertDelay(extractTotalDelay(f)),
      advisory: extractAdvisory(f),
      rawObj: f,
    }))
    .map(f => _.omit(f, 'sequencingPoint'))
    .value();
};


function formatJs(rawJS) {
  const flights = extractFlights(rawJS);
  const messageTime = extractMessageTime(rawJS);
  const amanState = extractAmanState(rawJS);
  const airportState = extractAirportState(rawJS);
  return {
    messageTime,
    total: flights.length,
    flights,
    amanState,
    airportState,
  };
}
