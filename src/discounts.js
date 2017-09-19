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

const UPDATE_DISCOUNT_CODE_AND_SUBSCRIPTION= gql`
    mutation UpdateDiscountAndSubscription($discountId: ID!, $used: Boolean!, $subscriptionId: ID, $userId: ID) {
    updateDiscountCode(id: $discountId, used: $used, pPSubscriptionId: $subscriptionId, userId: $userId) {
        id
    }
}
`

const GET_USER_DISCOUNTS_CODES = gql`
    query getUserCodes($userId: ID!, $used: Boolean!){
        User(id: $userId) {
            discountCodes(filter: {
                used: $used
            }, first: 1) {
                id
                user {
                    id
                }

                pPSubscription {
                    id
                }
            }

        }
    }
`


const GET_DISCOUNT_CODE = gql`
    query getDiscountCode($code: String!, $used: Boolean ) {
        allDiscountCodes(filter: {
            code: $code,
            used: $used
        }, first: 1) {
            id
            user {
                id
            }
            pPSubscription {
                id
            }
        }
    }
    `;


const GetDiscountCodeByCode = async function (discountCode) {
    return new Promise((resolve, reject) => {
        client.query({
            query: GET_DISCOUNT_CODE,
            variables: {
                code: discountCode,
                used: false
            }
        }).then((result) => {
            console.log('Got discount code')
            const _discount = result.data.allDiscountCodes[0];
            resolve(_discount);
        }).catch(err=> {
            console.log(err);
            reject(err);
        })
    })
}

const markDiscountCodeAsUsed = async function(req, subscriptionId){
    return new Promise((resolve, reject) => {
        console.log('Going to check user discount code');
        
        let mutation = client.mutate({
            mutation: UPDATE_DISCOUNT_CODE_AND_SUBSCRIPTION,
            variables : {
                discountId: req.discountCodeId,
                used: true,
                pPSubscriptionId: subscriptionId,
                userId: req.subscriptionId
            }
        });

        mutation.then(result => {
            const _resp = result.data.updateDiscountCode;
            resolve(_resp);
        })
        .catch(err => {
            console.log(err);
            reject(err);
        })
    })
}


const GetUserDisCountCode = async function (req) {
    return new Promise((resolve, reject) => {

        //User is logged in and everybody is happy
        if(req.subscriptorId) {
            const _userId = req.subscriptorId;
            console.log(_userId);
            console.log('Cheking user discount code');
            client.query({
                query: GET_USER_DISCOUNTS_CODES,
                variables : {
                    userId: _userId,
                    used: false
                },
                fetchPolicy: 'network-only'
            }).then(result => {
                let _discount;
                if(result.data.User && result.data.User.discountCodes && result.data.User.discountCodes.length) {
                    _discount = result.data.User.discountCodes[0];
                    
                }
                resolve(_discount);
            })
            .catch(err => {
                console.log(err);
                reject(err);
            })
        }
    })
}


const getDiscount = async function (req) {
    return new Promise((resolve, reject) => {
        let query;
        if(req.subscriptorId) {
            query = GetUserDisCountCode(req);
        }
        if(req.discountCode) {
            query = GetDiscountCodeByCode(req.discountCode);
        }
        query.then((discount)=> {
            resolve(discount);
        })
        .catch((err) => {
            console.log(err);
            reject(err)
        })
    })

}

module.exports = {
    getDiscount: async function (req) {
        return getDiscount(req)
    },

    isValid: function(discount) {
        const _valid = discount && discount.id && !discount.user && !discount.pPSubscription 
        console.log('Is discount valid?' , _valid);
        return _valid;
    },
    markDiscountCodeAsUsed: async function(req, subscriptionId) {
        return markDiscountCodeAsUsed(req, subscriptionId)
    }
}