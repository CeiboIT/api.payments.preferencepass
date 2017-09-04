'use strict';
const config = require('./config');
const pricing = require('./pricing');
const subscription = require('./subscription');
const mailing = require('./mandrill');
const stripe = require('stripe')(config.stripe.apikey);
const uuidv4 = require('uuid/v4');

stripe.setTimeout(20000);

module.exports = {
    createSubscription: async function (req, res) {
        console.log('Request: ', req);
        const customer = await createSourceForCostumer(req);
        const charge = await createCharge(customer, req);
        await mailing.sendMailForNewSubscription(req);
        return subscription.saveSubscription(charge, req);
        // return createCharge(customer, req);
    },

    createPayPalSubscription: async function (req, res) {
        // The idea is act the same than with Stripe, with the only difference that the charge has been already done.
        console.log('Request for PayPal');
        await mailing.sendMailForNewSubscription(req);
        return subscription.saveSubscriptionFromPayPal(req);
    }
}

const createCharge = function (customer, req, res) {
    console.log('Going to do charge');
    const amount = pricing.totalChargeAmount(req);
    console.log('Amount to charge: ', amount);
    console.log('Customer: ', customer.id);
    console.log('Customer Resource', customer.default_source);
    
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