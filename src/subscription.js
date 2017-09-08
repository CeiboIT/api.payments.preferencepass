'use strict';
const createError = require('micro').createError
const {ApolloClient} = require('apollo-client')
const createNetworkInterface = require('apollo-client').createNetworkInterface;
const moment = require('moment');
const gql = require('graphql-tag');
const config = require('./config');
 
const client = new ApolloClient({
  networkInterface: createNetworkInterface({
    uri : 'https://api.graph.cool/simple/v1/' + config.graphcool.uri
  })
});

const GET_USER_DISCOUNTS_CODES = gql`
    query getUserCodes($userId: ID!){
        User(id: $userId) {
            discountCodes(filter: {
                used: false
              }, first: 1) {
                id
              }

        }
    }
`

const UPDATE_DISCOUNT_CODE = gql`
    mutation UpdateDiscount($discountId: ID!, $used: Boolean!) {
        updateDiscountCode(id: $discountId, used: $used) {
            id
        }

    }
`

const CREATE_SUBSCRIPTION = gql`
    mutation NewPPSubscription(
        $adults: Int!,
        $kids: Int!,
        $isComingAlone: Boolean,
        $plan: String!,
        $subscriptorId: ID!,
        $payment: Json!,
        $startsAt: DateTime!,
        $paymentSource: String!,
        $validity: DateTime!
    ) {
    createPPSubscription(
        adults: $adults,
        kids: $kids,
        isComingAlone: $isComingAlone,
        plan: $plan,
        userId: $subscriptorId,
        payment: $payment,
        validity: $validity,
        startsAt: $startsAt
        paymentSource: $paymentSource
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

const markDiscountCodeAsUsed = async function(discount){
    return new Promise((resolve, reject) => {
        client.mutate({
            mutation: UPDATE_DISCOUNT_CODE,
            variables : {
                discountId: discount.id,
                used: true
            }
        }).map(result => {
            const _resp = result.data.updateDiscountCode;
            resolve(_resp);
        })
        .catch(err => {
            console.log(err);
            reject(err);
        })
    })
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

const GetUserDisCountCode = async function (req, res) {
    return new Promise((resolve, reject) => {
        const _userId = req.subscriptorId;

        client.query({
            query: GET_USER_DISCOUNTS_CODES,
            variables : {
                userId: _userId
            }
        }).map(result => {
            let resp = {
                id: '',
                hasDiscountCode: false
            }
            if(result.data.User && result.data.User.discountCodes && result.data.User.discountCodes.length) {
                const _discount = result.data.User.discountCodes[0];
                resp.hasDiscountCode = true;
                resp.id = _discount.id;
                resolve(resp);
            }

        })
        .catch(err => {
            console.log(err);
            reject(err);
        })
    })
}

const addSubscription = function (paymentSource, charge, req, res) {
    return new Promise((resolve, reject) => {
        const type = req.plan;
        const subscriptorId = req.subscriptorId;
        var startsAt = moment(req.startsAt).clone();
        startsAt = startsAt.hours(0).minutes(0).seconds(0).milliseconds(0);
        const _formattedStartsAt = startsAt.toISOString();
        const validity = '' + calculateValidityDate(type, _formattedStartsAt);
        console.log('Validity: ', validity);
        console.log('Subscriptor: ', subscriptorId);
        client.mutate({
            mutation: CREATE_SUBSCRIPTION,
            variables: {
                kids: req.kidsAmount,
                adults: req.adultsAmount,
                isComingAlone: req.isComingAlone || false,
                plan: type,
                subscriptorId: subscriptorId,
                payment: charge,
                validity: validity,
                startsAt: _formattedStartsAt,
                paymentSource: paymentSource
            }
        }).then(data => resolve(data)).catch(error => reject(error))
    })
}

module.exports = {
    saveSubscriptionFromStripe: async function (charge, req, res) {
        return addSubscription('Stripe', charge, req);
    },
    saveSubscriptionFromPayPal: async function (req, res) {
        return addSubscription('PayPal', req.payment, req);
    },

    checkIfUserHasDiscount: async function(req, res) {
        return GetUserDisCountCode(req, res);
    },
    markDiscountCode: async function(discount) {
        return markDiscountCodeAsUsed(discount)
    }
}