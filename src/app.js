'use strict'
const { json, send }  = require('micro')
const { router, post, get } = require('microrouter')
const payment = require('./payment')

const microCors = require('micro-cors')
const cors = microCors({ 
  origin: 'http://localhost:4200'
})

const postSubscription = async (req, res) => {
    try {
      let body = await json(req)
      const response = await payment.createSubscription(body);
      send(res, 200, response);
    } catch (err) {
      console.log(err.stack)
      send(res, err.statusCode, err.message)
    }
}

const notfound = (req, res) =>
  send(res, 404, 'Could not find route', req.url)

module.exports = router(
  post('/subscription/new', cors(postSubscription)),
  get('/*', notfound),
  post('/*', notfound)
)
