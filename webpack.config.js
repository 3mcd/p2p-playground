var config = require('./config/webpack');

config.output.path = __dirname + '/client/build';
config.output.filename = 'client.js';

module.exports = config;
