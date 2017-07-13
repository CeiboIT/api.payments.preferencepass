'use strict'
const config = {};
config.stripe = {};
config.stripe.apikey = process.env.STRIPE_PRIVATE_KEY || 'sk_test_Z3oklQuGLKR4C7XA6NX3OzYt';
module.exports = config;