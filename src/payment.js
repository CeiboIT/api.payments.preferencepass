'use strict';
const config = require('./config');
const stripe = require('stripe')(config.stripe.apikey);
stripe.setTimeout(20000);

const createSubscription = async function (req, res) {
    const costumer = await createCustomer(req);
    const source = await createSource(req, customer); 
    return createCharges(req);
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
            email: req.email
        }, function (err, charge) {
            if (err) {
                reject(err);
            } else {
                resolve(charge);
            }
        });
    });
}

const createSource = function (req, customer, res) {
    return new Promise(function (resolve, reject) {
        stripe.customers.createSource(customer.id, {
            source: {
                object: req.card,
                exp_month: req.expirationMonth,
                exp_year: req.expirationYear,
                number: req.cardNumber,
                cvc: req.cvc
            }
       }, function (err, charge) {
            if (err) {
                reject(err);
            } else {
                resolve(charge);
            }
        });
    });
}

module.exports = createSubscription;
