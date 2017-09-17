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
    query getUserCodes($userId: ID!, $used: Boolean!){
        User(id: $userId) {
            discountCodes(filter: {
                used: $used
              }, first: 1) {
                id
              }

        }
    }
`

const GET_USER_BASIC_DATA = gql`
    query GetUser($userId: ID!) {
        User(id: $userId) {
            id
            email
            givenName
            name
            familyName
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

const CHECK_SUBSCRIPTIONS_BY_EMAIL = gql`
    query CheckSubscriptionsByEmail($email: String! ) {
        allPPSubscriptions(filter:{
            email: $email
        }) {
            id
            user {
                id
            }
        }
    }
`

const CREATE_SUBSCRIPTION_WITHOUT_USER = gql`
    mutation NewPPSubscriptionWithoutUser(
        $adults: Int!,
        $kids: Int!,
        $isComingAlone: Boolean,
        $email: String!,
        $plan: String!,
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
            email: $email,
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
`

const UPDATE_SUBSCRIPTION_USER = gql`
    mutation UpdateSubscriptionUser($userId: ID!, $subscriptionId: ID!) {
        updatePPSubscription(
            id: $subscriptionId
            userId: $userId
          ) {
            id
          }
    }
`;

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


const getUserBasicData = async function(userId) {
    return new Promise((resolve, reject) => {
        client.query({
            query: GET_USER_BASIC_DATA,
            variables: {
                userId: userId
            }
        }).then((result) => {
            resolve(result.data.User);
        }).catch(err => {
            console.log(err);
            reject(err)
        })
    })
}

const markDiscountCodeAsUsed = async function(discount){
    return new Promise((resolve, reject) => {
        console.log('Going to check user discount code');
        client.mutate({
            mutation: UPDATE_DISCOUNT_CODE,
            variables : {
                discountId: discount.id,
                used: true
            }
        }).then(result => {
            const _resp = result.data.updateDiscountCode;
            resolve(_resp);
        })
        .catch(err => {
            console.log(err);
            reject(err);
        })
    })
}

const getSubscriptionsByEmail = async function(email) {
    const _response = await client.query({
        query: CHECK_SUBSCRIPTIONS_BY_EMAIL,
        variables: {
            email: email
        }, 
        fetchPolicy: 'network-only'
    })
    return _response.data.allPPSubscriptions;
}

const LinkSubscriptionsWithUser = async function(userId, subscriptionsToLink){
    return new Promise((resolve, reject) => {
        let _promises = [];
        subscriptionsToLink.forEach((subscription) => {
            const _mutationPromise = client.mutate({
                mutation: UPDATE_SUBSCRIPTION_USER,
                variables: {
                    userId: userId,
                    subscriptionId: subscription.id
                }
            })
            _promises.push(_mutationPromise);
        });

        Promise.all(_promises)
            .then((result=> resolve(result)))
            .catch(err => {
                console.log(err);
                reject(err);
            })
    })
}

const CheckIfUserHasUnlinkedSubscriptions = async function(userId) {
    return new Promise((resolve, reject) => { 
        if(!userId) {
            reject({
                error: {stack: 'Unexpected activity on checking subscriptions'}
            })
        } else {
            getUserBasicData(userId).then((user) => {
                let _subscriptionsToLink = [];
                getSubscriptionsByEmail(user.email).then((subscriptions) => {
                    subscriptions.forEach((subscription) => {
                        if (!subscription.user) {
                            _subscriptionsToLink.push(subscription);
                        }
                    });
                    if (_subscriptionsToLink.length) {
                        LinkSubscriptionsWithUser(userId, _subscriptionsToLink).then(result => {
                            resolve({
                                linked: true
                            })
                        }).catch(err=> {
                            console.log(err);
                            reject(err);
                        })
                    } else {
                        resolve({linked: false})
                    }
                }).catch((err) => {
                    console.log(err);
                    reject(err);
                } )
                
            }).catch(err => {
                console.log(err);
                reject(err);
            })
            
        }
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
    console.log('Formatted Validity: ', '' + _formattedValidity)
    return  ''+ _formattedValidity;
}

const GetUserDisCountCode = async function (req, res) {
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
                let resp = {
                    id: '',
                    hasDiscountCode: false
                }
                if(result.data.User && result.data.User.discountCodes && result.data.User.discountCodes.length) {
                    const _discount = result.data.User.discountCodes[0];
                    resp.hasDiscountCode = true;
                    resp.id = _discount.id;
                    console.log('Discount Code Result: ', resp);
                    
                }
                resolve(resp);
            })
            .catch(err => {
                console.log(err);
                reject(err);
            })
        } else {


        }
    })
}

const addSubscription = function (paymentSource, charge, req, res) {
    return new Promise((resolve, reject) => {
        const type = req.plan;
        var startsAt = moment(req.startsAt).clone();
        startsAt = startsAt.hours(0).minutes(0).seconds(0).milliseconds(0);
        const _formattedStartsAt = startsAt.toISOString();
        const validity = '' + calculateValidityDate(type, _formattedStartsAt);
        
        if(req.subscriptorId) {
            const subscriptorId = req.subscriptorId;
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
            }).then(data => {
                console.log('Subscription mutation response: ', data);
                resolve(data);
            }).catch(error => {
                console.log(err)
                reject(error)
            })
        } else {
            //If subscriptor is trying to pay but is not logged in
            client.mutate({
                mutation: CREATE_SUBSCRIPTION_WITHOUT_USER,
                variables: {
                    kids: req.kidsAmount,
                    adults: req.adultsAmount,
                    isComingAlone: req.isComingAlone || false,
                    plan: type,
                    payment: charge,
                    validity: validity,
                    startsAt: _formattedStartsAt,
                    email: req.email,
                    paymentSource: paymentSource
                }
            }).then(data => {
                console.log('Subscription mutation response: ', data);
                resolve(data);
            }).catch(error => {
                console.log(err)
                reject(error)
            })

        }
        
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
    }, 
    getUserIdentity: async function(userId) {
        return getUserBasicData(userId)
    },
    checkUserSubscriptions: async function(userId) {
        return CheckIfUserHasUnlinkedSubscriptions(userId);
    }
}