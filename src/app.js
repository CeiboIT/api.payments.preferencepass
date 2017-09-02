'use strict'
const { json, send }  = require('micro');
const { router, post, get } = require('microrouter');
const payment = require('./payment');
const jwt = require('jsonwebtoken');
const microCors = require('micro-cors');
const cors = microCors();
// const microCors = require('micro-cors')
// const cors = microCors({ origin: 'http://localhost:4200', allowMethods: ['GET', 'PUT', 'POST'], allowHeaders: ['Content-Type','Authorization'] })
const postSubscription = async (req, res) => {
    console.log('Going to do Subscription');
    console.log('Headers: ', JSON.stringify(req.headers));
    console.log(req.headers.authorization);
    var token = req.headers.authorization.replace('Bearer ','');
    token = jwt.decode(token);

    try {
        let body = await json(req);
        console.log(token);
        body.subscriptorId = token.userId;
        console.log(body);
        const response = await payment.createSubscription(body);
        console.log('Checking response', response);
      send(res, 200, response.data.createSubscription);
    } catch (err) {
      console.log(err.stack);
      console.log('Entered to Error');
      send(res, err.statusCode, err.message)
    }
}

const payPalSubscription = async(req, res) => {
  console.log('Going to do Subscription');
  console.log('Headers: ', JSON.stringify(req.headers));
  console.log(req.headers.authorization);
  var token = req.headers.authorization.replace('Bearer ','');
  token = jwt.decode(token);

  try {
      let body = await json(req);
      console.log(token);
      body.subscriptorId = token.userId;
      console.log(body);
      const response = await payment.createPayPalSubscription(body);
      console.log('Checking response', response);
    send(res, 200, response.data.createSubscription);
  } catch (err) {
    console.log(err.stack);
    console.log('Entered to Error');
    send(res, err.statusCode, err.message)
  }

}

const notfound = (req, res) =>
  send(res, 404, 'Could not find route', req.url)
const handler = (req, res) => send(res, 200, 'ok!')

module.exports = cors(router(
  post('/subscription/new', postSubscription),
  post('/subscription/new/paypal', payPalSubscription)
  get('/*', notfound),
  post('/*', notfound)
));
