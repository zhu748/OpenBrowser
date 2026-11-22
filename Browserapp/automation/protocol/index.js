'use strict';

module.exports = {
  rpa: require('./rpa-registry'),
  appCenter: require('./app-center-protocol'),
  fanout: require('./sync-fanout'),
  windowGeneration: require('./window-generation'),
  platform: require('./cross-platform'),
};
