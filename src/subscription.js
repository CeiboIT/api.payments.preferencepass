'use strict';
const createError = require('micro').createError
const {ApolloClient} = require('apollo-client')
const createNetworkInterface = require('apollo-client').createNetworkInterface;
const moment = require('moment');
const gql = require('graphql-tag');
 
const client = new ApolloClient({
  networkInterface: createNetworkInterface({
    uri : 'https://api.graph.cool/simple/v1/cj41c9u2zddol0177la66g30g'
  })
});

module.exports = {
    saveSubscription: async function (charge, req, res) {
        return addSubscription(charge, req);
    }
}
function calculateValidityDate(Plan, startsAt){
    const init = moment(startsAt).set({
        'hours': 0,
        'minutes': 0,
        'seconds': 0,
        'milliseconds': 0
    });

    var validity = init.clone();
    validity = validity.hours(23).minutes(59).seconds(59);
    var formattedDate = '';
    switch(Plan){
        case('OneDay'):
            validity.add(1, 'day');
            break;
        case('FourDays'):
            validity.add(4, 'day');
            break;
        case('SevenDays'):
            validity.add(7, 'day');
            break;
        case('FourteenDays'):
            validity.add(14, 'day');
        break;
        default:
            validity = null;
    }

    if(validity){
        console.log('Validity: ', validity);
        validity = validity.hours(23).minutes(59).seconds(59);
    }
    const _formattedValidity = validity.toISOString();
    return  ''+ _formattedValidity;
}

const addSubscription = function (charge, req, res) {
    return new Promise(function (resolve, reject) {
        console.log('charge: ', charge);
        console.log('req: ', req);
        var adults = req.adultsAmount;
        var kids = req.kidsAmount
        var isComingAlone = req.isComingAlone || false;
        var type = req.plan;
        var subscriptorId = req.subscriptorId;
        
        var startsAt = moment(req.startsAt).clone();

        startsAt = startsAt.hours(0).minutes(0).seconds(0).milliseconds(0);
        var _formattedStartsAt = startsAt.toISOString();

        console.log(_formattedStartsAt);


        var validity = '' + calculateValidityDate(type, _formattedStartsAt);
        console.log('Validity: ', validity);
        console.log('Subscriptor: ', subscriptorId);
        const CREATE_SUBSCRIPTION = gql`
            mutation NewSubscription(
            $adults: Int!,
            $kids: Int!,
            $isComingAlone: Boolean,
            $plan: String!,
            $subscriptorId: ID!,
            $stripePayment: Json!,
            $startsAt: DateTime!,
            $validity: DateTime!) {
                createSubscription(
                    adults: $adults,
                    kids: $kids,
                    isComingAlone: $isComingAlone,
                    plan: $plan,
                    userId: $subscriptorId,
                    stripePayment: $stripePayment,
                    validity: $validity,
                    startsAt: $startsAt
                ) {
                    id
                    validity
                    kids
                    adults
                    companions {
                        id
                    }
                    isComingAlone
                    plan
                    user {
                        id
                    }
                    reservations {
                        id
                    }
                }
            }
            `;
        client.mutate({
            mutation: CREATE_SUBSCRIPTION,
            variables: {
                kids: adults,
                adults: kids,
                isComingAlone: isComingAlone,
                plan: type,
                subscriptorId: subscriptorId,
                stripePayment: charge,
                validity: validity,
                startsAt: _formattedStartsAt
            }
        })
        .then(data => resolve(data)).catch(error => reject(error))
    });
}
