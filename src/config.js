'use strict'
const config = {};
config.stripe = {};
config.stripe.apikey = process.env.STRIPE_PRIVATE_KEY || 'sk_test_ny6ghZN9qZRn50ShukKLMEee';
module.exports = config;