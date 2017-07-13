'use strict'
const json = require('micro');
const payment = require('./payment');

module.exports = async function (req, res)  {
    const js = await json(req);
    return payment.createSubscription(js);
}
