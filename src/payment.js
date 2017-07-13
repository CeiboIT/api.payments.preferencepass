'use strict';
const config = require('./config');
const stripe = require('stripe')(config.stripe.apikey);
stripe.setTimeout(20000);

module.exports = {
    createSubscription: async function (req, res) {
        const customer = await createCustomer(req);
        const source = await createSource(req, customer.id); 
        return createCharges(req);
    }
}

const createCharges = function (req, res) {
    return new Promise(function (resolve, reject) {
        stripe.charges.create({
            amount: req.amount,
            currency: req.currency,
            customer: req.customer
        }, function (err, charge) {
            if (err) {
                reject(err);
            } else {
                resolve(charge);
            }
        });
    });
}

const createCustomer = function (req, res) {
    return new Promise(function (resolve, reject) {
        stripe.customers.create({
            email: "leojquinteros@gmail.com"
        }, function (err, customer) {
            if (err) {
                reject(err);
            } else {
                resolve(customer);
            }
        });
    });
}

const createSource = function (req, customerID, res) {
    return new Promise(function (resolve, reject) {
        stripe.customers.createSource(customerID, {
            source: {
                object: req.card,
                exp_month: req.expirationMonth,
                exp_year: req.expirationYear,
                number: req.cardNumber,
                cvc: req.cvc
            }
       }, function (err, source) {
            if (err) {
                reject(err);
            } else {
                resolve(source);
            }
        });
    });
}


