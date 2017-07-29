'use strict'
const { json, send }  = require('micro')
const { router, post, get } = require('microrouter')
const payment = require('./payment')

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
  post('/subscription/new', postSubscription),
  get('/*', notfound),
  post('/*', notfound)
)
