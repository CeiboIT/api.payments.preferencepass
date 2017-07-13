'use strict'
const json = require('micro');
const payment = require('./payment');

module.exports = async function (req, res)  {
    const js = await json(req);
    return payment.createSubscription(js, res);
}
/*
const methods = {
    'POST': postSubscription
};

module.exports = async function (req, res) {
    return methods[req.method](req, res);
}*/
