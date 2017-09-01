'use strict'
const config = {};

// STRIPE config
config.stripe = {};
config.stripe.apikey = process.env.STRIPE_PRIVATE_KEY || 'sk_test_ny6ghZN9qZRn50ShukKLMEee';

// MANDRILL config
config.mandrill = {};
config.mandrill.apikey = process.env.MANDRILL_API_KEY || '7GZhk_UytExYjiiB9briAw';

module.exports = config;