'use strict'
const config = {};
config.stripe = {};
config.stripe.apikey = process.env.STRIPE_PRIVATE_KEY || 'sk_test_BQokikJOvBiI2HlWgH4olfQ2';
module.exports = config;