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
        console.log('Trying to create subscription');
        let discount = await subscription.checkIfUserHasDiscount(req);
        switch(req.type) {
            case "paypal":
                console.log('[PayPal] Request data: ', req);
                subscriptionResult = await subscription.saveSubscriptionFromPayPal(req);
                
                break;
            case "stripe":
                console.log('[Stripe] Request data: ', req);
                const customer = await createSourceForCostumer(req);
                const charge = await createCharge(customer, req, discount);
                subscriptionResult = await subscription.saveSubscriptionFromStripe(charge, req, discount);
                break;
            default:
                console.log('Can not create subscription');
        }
        console.log('Going to retreive subscription result');
        if(discount.hasDiscountCode) {
            console.log('Marking discount code as used')
            subscription.markDiscountCode(discount);
        }
        return subscriptionResult;
    }
}

const createCharge = function (customer, req, discount) {
    // check if user has any kind of discount code with him 
    const amount = pricing.totalChargeAmount(req, discount);
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