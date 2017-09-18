'use strict';
const config = require('./config');
const pricing = require('./pricing');
const subscription = require('./subscription');
const discountsService = require('./discounts');
const stripe = require('stripe')(config.stripe.apikey);
const uuidv4 = require('uuid/v4');

stripe.setTimeout(20000);

module.exports = {
    createSubscription: async function (req, res) {
        let subscriptionResult;
        console.log('Trying to create subscription');
        let discount = await discountsService.getDiscount(req);
        console.log('Got discount', discount);
        switch(req.type) {
            case "paypal":
                console.log('[PayPal] Request data: ', req);
                subscriptionResult = await subscription.saveSubscriptionFromPayPal(req, discount);
                console.log('Subscription Result obtained in PayPal', subscriptionResult);
                break;
            case "stripe":
                console.log('[Stripe] Request data: ', req);
                let customerData;
                if(req.subscriptorId) {
                    customerData = await subscription.getUserIdentity(req.subscriptorId);
                } else {
                    customerData = {
                        email: req.email
                    }
                }
                const customer = await createSourceForCostumer(req, customerData);
                const charge = await createCharge(customer, req, discount);
                subscriptionResult = await subscription.saveSubscriptionFromStripe(charge, req, discount);
                console.log('Subscription Result obtained in Stripe', subscriptionResult);
                break;
            default:
                console.log('Can not create subscription');
        }
        console.log('Going to retreive subscription result');
        return subscriptionResult;
    }
}

const createCharge = function (customer, req, discount) {
    // check if user has any kind of discount code with him 
    const amount = pricing.totalChargeAmount(req, discountsService.isValid(discount));
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

const createSourceForCostumer = function (req, customerData) {
    return new Promise(function (resolve, reject) {
        let _payload = {
            description: 'Customer for Preference Pass',
            source: req.cardToken,
            email: customerData.email,
            metadata: {
                plan: req.plan,
                kids: req.kidsAmount,
                adults: req.adultsAmount
            }
        }
        if(customerData.givenName) {
            _payload.metadata.givenName = customerData.givenName
        }
        if(customerData.name) {
            _payload.metadata.name = customerData.name
        }
        if(customerData.familyName) {
            _payload.metadata.familyName = customerData.familyName
        }

        stripe.customers.create(_payload, {
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