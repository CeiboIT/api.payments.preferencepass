'use strict'
var config = require('./config');
var stripe = require('stripe')(config.stripe.apikey);

module.exports = async function () {
  return 'Hello, world'
}
