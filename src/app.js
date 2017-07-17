'use strict'
const { json, send }  = require('micro')
const { router, post, get } = require('microrouter')
const payment = require('./payment')

const postSubscription = async (req, res) => {
    const body = await json(req)
    const response = payment.createSubscription(body);
    send(res, 200, response);
}

const notfound = (req, res) =>
  send(res, 404, 'Not found route', req.url)

module.exports = router(
  post('/subscription/new', postSubscription),
  get('/*', notfound),
  post('/*', notfound)
)
