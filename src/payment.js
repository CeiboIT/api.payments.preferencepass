'use strict';
const config = require('./config');
const stripe = require('stripe')(config.stripe.apikey);
const uuidv4 = require('uuid/v4');

stripe.setTimeout(20000);

module.exports = {
    createSubscription: async function (req, res) {
        const cardToken = 'src_18eYalAHEMiOZZp1l9ZTjSU0'; // retrieved by Stripe.js
        const customerEmail = 'leojquinteros@gmail.com'; 
        const customer = await createSourceForCostumer(customerEmail, cardToken, req); 
        return createCharges(customer.id, customer.sourceId, req);
    }
}

const createCharges = function (customerID, sourceID, req, res) {
    return new Promise(function (resolve, reject) {
        stripe.charges.create({
            amount: 10,
            currency: 'usd',
            customer: customerID,
            source: sourceID,
            description: 'Charges for leojquinteros@gmail.com'
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

const createSourceForCostumer = function (customerEmail, cardToken, req, res) {
    return new Promise(function (resolve, reject) {
        stripe.customers.create({
            email: customerEmail,
            source: cardToken
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
