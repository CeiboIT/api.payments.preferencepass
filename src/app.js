'use strict'
const json = require('micro');
const payment = require('./payment');

const postSubscription = async function (req, res)  {
    const request = await json(req);
    return payment.createSubscription(request);
}

const methods = {
    'POST': postSubscription
};

module.exports = async function (req, res) {
    return methods[req.method](req, res);
}
