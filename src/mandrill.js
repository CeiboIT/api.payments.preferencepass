'use strict';
const mandrill = require('mandrill-api/mandrill');
const config = require('./config');
const mandrill_client = new mandrill.Mandrill(config.mandrill.apikey);
const moment = require('moment');
const pricing = require('./pricing');
const DATE_FORMAT = "MMMM DD YYYY";

module.exports = {
    sendMailForNewSubscription: async function (req, discount, res) {
        if(req.customerEmail) {
            await sendMailToCustomer(req, discount);
            return await sendMailToPreferencePass(req, discount);
        } else {
            console.log("Unable to send subscription email - customerEmail missing");
        }
    }
}

const sendMailToCustomer = function (req, discount, res) {
    return new Promise(function (resolve, reject) {
        const template_content = [{
            "name": "name",
            "content": "new_subscription"
        }];
        const message = {
            "subject": "Thank you for your subscription!",
            "from_email": "subscriptions@preferencepass.com",
            "from_name": "Preference Pass Subscriptions",
            "to": [{
                "email": req.customerEmail
            }],
            "merge_vars": [{
                "rcpt": req.customerEmail,
                "vars": [
                    {
                        "name": "adultsAmount",
                        "content": req.adultsAmount + 1
                    },
                    {
                        "name": "kidsAmount",
                        "content": req.kidsAmount
                    },
                    {
                        "name": "plan",
                        "content": req.plan
                    },
                    {
                        "name": "price",
                        "content": pricing.finalPriceForEmail(req, discount)
                    },
                    {
                        "name": "currency",
                        "content": "USD"
                    },
                    {
                        "name": "startsAt",
                        "content": req.startsAt ? moment(req.startsAt).format(DATE_FORMAT) : ''
                    }
                ]}
            ]
        };

        mandrill_client.messages.sendTemplate({
            "template_name": "new_subscription", 
            "template_content": template_content, 
            "message": message, 
            "async": true, 
            "ip_pool": "Main Pool", 
            "send_at": moment()
            },
            function(result) {
                console.log(result);
                resolve(result);
            }, function(e) {
                console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
                //resolve promise anyway in case of error
                resolve(e);
            }
        );
    })
}

const sendMailToPreferencePass = function (req, discount, res) {
    return new Promise(function (resolve, reject) {
        const template_content = [{
            "name": "name",
            "content": "new_subscription_ppass"
        }];
        const message = {
            "subject": "New customer subscription",
            "from_email": "subscriptions@preferencepass.com",
            "from_name": "Preference Pass Subscriptions",
            "to": [{
                "email": "pt@preferencepass.com"
            }],
            "merge_vars": [{
                "rcpt": "pt@preferencepass.com",
                "vars": [
                    {
                        "name": "adultsAmount",
                        "content": req.adultsAmount + 1
                    },
                    {
                        "name": "kidsAmount",
                        "content": req.kidsAmount
                    },
                    {
                        "name": "plan",
                        "content": req.plan
                    },
                    {
                        "name": "price",
                        "content": pricing.finalPriceForEmail(req, discount)
                    },
                    {
                        "name": "currency",
                        "content": "USD"
                    },
                    {
                        "name": "startsAt",
                        "content": req.startsAt ? moment(req.startsAt).format(DATE_FORMAT) : ''
                    },
                    {
                        "name": "customerEmail",
                        "content": req.customerEmail
                    }
                ]}
            ]
        };

        mandrill_client.messages.sendTemplate({
            "template_name": "new_subscription_ppass", 
            "template_content": template_content, 
            "message": message, 
            "async": true, 
            "ip_pool": "Main Pool", 
            "send_at": moment()
            },
            function(result) {
                console.log(result);
                resolve(result);
            }, function(e) {
                console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
                //resolve promise anyway in case of error
                resolve(e);
            }
        );
    })
}
