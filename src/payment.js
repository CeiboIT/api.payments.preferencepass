'use strict';
const config = require('./config');
const pricing = require('./pricing');
const stripe = require('stripe')(config.stripe.apikey);
const uuidv4 = require('uuid/v4');

stripe.setTimeout(20000);

module.exports = {
    createSubscription: async function (req, res) {
        const customer = await createSourceForCostumer(req); 
        return createCharge(customer, req);
    }
}

const createCharge = function (customer, req, res) {
    return new Promise(function (resolve, reject) {
        stripe.charges.create({
            amount: pricing.totalChargeAmount(req.adultsAmount, req.kidsAmount, req.days),
            currency: "usd",
            customer: customer.id,
            source: customer.default_source
        }, {
            idempotency_key: uuidv4()
        }, function (err, charge) {
            if (err) {
                reject(err);
            } else {
                console.log('Charges created:', charge.id);
                resolve(charge);
            }
        });
    });
}

const createSourceForCostumer = function (req, res) {
    return new Promise(function (resolve, reject) {
        stripe.customers.create({
            description: 'Customer for Preference Pass',
            source: req.cardToken
        }, {
            idempotency_key: uuidv4()
       }, function (err, customer) {
            if (err) {
                reject(err);
            } else {
                console.log('Customer created:', customer.id);
                resolve(customer);
            }
        });
    });
}
