'use strict';
const config = require('./config');
const stripe = require('stripe')(config.stripe.apikey);
const uuidv4 = require('uuid/v4');

stripe.setTimeout(20000);

module.exports = {
    createSubscription: async function (req, res) {
        const customer = await createSourceForCostumer(req); 
        return createCharges(customer, req);
    }
}

const createCharges = function (customer, req, res) {
    return new Promise(function (resolve, reject) {
        stripe.charges.create({
            amount: req.amount,
            currency: req.currency,
            customer: customer.id,
            source: customer.sourceId,
            description: req.description
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
            email: req.customerEmail,
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
