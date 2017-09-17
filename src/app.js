'use strict'
const { json, send }  = require('micro');
const { router, post, get } = require('microrouter');
const payment = require('./payment');
const subscription = require('./subscription');
const jwt = require('jsonwebtoken');
const microCors = require('micro-cors');
const cors = microCors();
const allowedPaymentMethods = require('./config').allowedPaymentMethods;
global.fetch = require('node-fetch');

const postSubscription = async (req, res) => {
  console.log('[POST] Subscription for request:', req);
  console.log('[POST] Headers: ', JSON.stringify(req.headers));
  var token = req.headers.authorization.replace('Bearer ','');
  token = jwt.decode(token);
  console.log(token);
  try {
    let request = await json(req);
    if(token) {
      request.subscriptorId = token.userId;
    }
    if (allowedPaymentMethods.includes(request.type)) {
      const response = await payment.createSubscription(request);
      console.log('Checking response: ', response);
      send(res, 200, response.data.createPPSubscription);
    } else {
      send(res, 404, 'Invalid payment type: ' + request.type);
    } 
  } catch (err) {
    console.log('An error has occurred during subscription: ', err.stack);
    send(res, err.statusCode, err.message)
  }
}

const checkUserSubscriptions = async (req, res) => {
  console.log('[GET] Checking if user has  unlinked subscriptions and link if needed');
  var token = req.headers.authorization.replace('Bearer ','');
  token = jwt.decode(token);
  try {
    if(!token.userId) {
      send(res, 403, 'Unusual activity reported to system administrators');
    } else {
      const _resp = await subscription.checkUserSubscriptions(token.userId)
      send(res, 200, _resp);
    }
  } catch (err) {
    console.log('An error has occurred during subscription: ', err.stack);
    send(res, err.statusCode, err.message)
  }
}

const notfound = (req, res) =>
  send(res, 404, 'Could not find route: ' + req.method + req.url);

module.exports = cors(router(
  post('/subscription', postSubscription),
  get('/subscription/check-user', checkUserSubscriptions),
  get('/*', notfound)
));
