'use strict'
const config = {};
config.stripe = {};
config.stripe.apikey = process.env.STRIPE_PRIVATE_KEY || 'sk_test_eQedcE5UFm5iCf5dOYzfnXKp';
module.exports = config;