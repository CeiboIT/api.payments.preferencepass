'use strict';
const config = require('./config');
const pricing = require('./pricing');
const subscription = require('./subscription');
const stripe = require('stripe')(config.stripe.apikey);
const uuidv4 = require('uuid/v4');

stripe.setTimeout(20000);

module.exports = {
    createSubscription: async function (req, res) {
        let subscriptionResult;
        switch(req.type) {
            case "paypal":
                console.log('[PayPal] Request data: ', req.data);
                subscriptionResult = await subscription.saveSubscriptionFromPayPal(req.data);
                break;
            case "stripe":
                console.log('[Stripe] Request data: ', req.data);
                const customer = await createSourceForCostumer(req.data);
                const charge = await createCharge(customer, req.data);
                subscriptionResult = await subscription.saveSubscriptionFromStripe(charge, req.data);
                break;
            default:
                console.log('Can not create subscription');
        }
        return subscriptionResult;
    }
}

const createCharge = function (customer, req, res) {
    const amount = pricing.totalChargeAmount(req);
    console.log('[Stripe] Total charge amount in cents: ', amount);
    console.log('[Stripe] Customer created: ', customer.id);
    console.log('[Stripe] Customer default source', customer.default_source);

    return new Promise(function (resolve, reject) {
        stripe.charges.create({
            amount: amount,
            currency: "usd",
            customer: customer.id,
            source: customer.default_source
        }, {
            idempotency_key: uuidv4()
        }, function (err, charge) {
            if (err) {
                reject(err);
            } else {
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
                resolve(customer);
            }
        });
    });
}