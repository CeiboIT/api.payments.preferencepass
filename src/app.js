'use strict'
const { json, send }  = require('micro');
const { router, post, get } = require('microrouter');
const payment = require('./payment');
const jwt = require('jsonwebtoken');
const microCors = require('micro-cors');
const cors = microCors();
const allowedPaymentMethods = require('./config').allowedPaymentMethods;
global.fetch = require('node-fetch');

const postSubscription = async (req, res) => {
  console.log('[POST] Incoming request:', req.method, req.url);
  console.log('[POST] Headers:', JSON.stringify(req.headers));
  var token = req.headers.authorization.replace('Bearer ','');
  token = jwt.decode(token);
  try {
    let request = await json(req);  
    request.subscriptorId = token.userId;
    console.log('[POST] New subscription for request:', request);
    if (allowedPaymentMethods.includes(request.type)) {
      const response = await payment.createSubscription(request);
      send(res, 200, response.data.createPPSubscription);
    } else {
      console.log('Invalid payment type:', request.type, '- Allowed types:', allowedPaymentMethods);
      send(res, 404, 'Invalid payment type: ' + request.type);
    } 
  } catch (err) {
    console.log('An error has occurred during subscription:', err.stack);
    send(res, err.statusCode, err.message)
  }
}

const notfound = (req, res) =>
  send(res, 404, 'Could not find route: ' + req.method + req.url);

module.exports = cors(router(
  post('/subscription', postSubscription),
  get('/*', notfound)
));
