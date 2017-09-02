'use strict';
const config = require('./config');
const mandrill = require('mandrill-api/mandrill');
const mandrill_client = new mandrill.Mandrill(config.mandrill.apikey);
const moment = require('moment');

const NEW_SUBSCRIPTION_TEMPLATE_NAME = "new_subscription";
const DATE_FORMAT = "MMMM DD YYYY";

module.exports = {
    sendMailForNewSubscription: async function (charge, req, res) {
        if(req.customerEmail) {
            return sendMail(charge, req);
        } else {
            console.log("Unable to send subscription email - customerEmail missing");
        }
    }
}

const sendMail = function (charge, req, res) {
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
                        "content": (charge.amount) / 100 // expresado en dolares, NO centavos
                    },
                    {
                        "name": "currency",
                        "content": charge.currency //usd
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
            }, function(e) {
                console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
            }
        );
    })
}
