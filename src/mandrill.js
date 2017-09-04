'use strict';
const mandrill = require('mandrill-api/mandrill');
const config = require('./config');
const mandrill_client = new mandrill.Mandrill(config.mandrill.apikey);
const moment = require('moment');
const pricing = require('./pricing');

const NEW_SUBSCRIPTION_TEMPLATE_NAME = "new_subscription";
const DATE_FORMAT = "MMMM DD YYYY";

module.exports = {
    sendMailForNewSubscription: async function (req, res) {
        if(req.customerEmail) {
            return sendMail(req);
        } else {
            console.log("Unable to send subscription email - customerEmail missing");
        }
    }
}

const sendMail = function (req, res) {
    return new Promise(function (resolve, reject) {
        const template_content = [{
            "name": "name",
            "content": NEW_SUBSCRIPTION_TEMPLATE_NAME
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
                        "content": pricing.finalPriceForEmail(req)
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
            "template_name": NEW_SUBSCRIPTION_TEMPLATE_NAME, 
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
