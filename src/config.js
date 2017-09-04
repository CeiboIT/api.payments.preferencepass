'use strict'
const config = {};

// STRIPE config
config.stripe = {};
// ***** DEV *****
config.stripe.apikey = process.env.STRIPE_PRIVATE_KEY || 'sk_test_ny6ghZN9qZRn50ShukKLMEee';
// ***** PROD *****
// config.stripe.apikey = process.env.STRIPE_PRIVATE_KEY || 'sk_test_ny6ghZN9qZRn50ShukKLMEee';

// MANDRILL config
config.mandrill = {};
// ***** DEV *****
config.mandrill.apikey = process.env.MANDRILL_API_KEY || '7GZhk_UytExYjiiB9briAw';
// ***** PROD *****
// config.mandrill.apikey = process.env.MANDRILL_API_KEY || '7GZhk_UytExYjiiB9briAw';

// GRAPHCOOL config
config.graphcool = {};
// ***** DEV *****
config.graphcool.uri = process.env.GRAPHCOOL_SUBSCRIPTIONS_URI || 'cj41c9u2zddol0177la66g30g';
// ***** PROD *****
//config.graphcool.uri = process.env.GRAPHCOOL_SUBSCRIPTIONS_URI || 'cj76588cy10aq0133eli0nu97';

module.exports = config;