'use strict';
const createError = require('micro').createError
const {ApolloClient} = require('apollo-client')
const createNetworkInterface = require('apollo-client').createNetworkInterface;
const moment = require('moment');
const gql = require('graphql-tag');
const config = require('./config');
const discountsService = require('./discounts');

const client = new ApolloClient({
  networkInterface: createNetworkInterface({
    uri : 'https://api.graph.cool/simple/v1/' + config.graphcool.uri
  })
});


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
            isComingAlone
            plan
        }
    }
`


const CREATE_SUBSCRIPTION_WITH_DISCOUNT_AND_WITHOUT_USER = gql`
mutation NewPPSubscriptionWithoutUserAndWithDiscount(
    $adults: Int!,
    $kids: Int!,
    $isComingAlone: Boolean,
    $email: String!,
    $plan: String!,
    $payment: Json!,
    $startsAt: DateTime!,
    $paymentSource: String!,
    $validity: DateTime!,
    $discountCodeId: ID!
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
        paymentSource: $paymentSource,
        discountCodeId: $discountCodeId
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

const CREATE_SUBSCRIPTION_WITH_DISCOUNT_CODE = gql`
    mutation NewPPSubscription(
            $adults: Int!,
            $kids: Int!,
            $isComingAlone: Boolean,
            $plan: String!,
            $subscriptorId: ID!,
            $payment: Json!,
            $startsAt: DateTime!,
            $paymentSource: String!,
            $validity: DateTime!,
            $discountCodeId: ID!
        ) {
        createPPSubscription(
            adults: $adults,
            kids: $kids,
            isComingAlone: $isComingAlone,
            plan: $plan,
            userId: $subscriptorId,
            payment: $payment,
            validity: $validity,
            startsAt: $startsAt,
            paymentSource: $paymentSource,
            discountCodeId: $discountCodeId
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
            .catch((err) => {
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


function createSubscriptionWithUser(req) {
    let mutation;
    if(req.discountCodeId) {
        mutation = client.mutate({
            mutation: CREATE_SUBSCRIPTION_WITH_DISCOUNT_CODE,
            variables: {
                kids: req.kids,
                adults: req.adults,
                isComingAlone: req.isComingAlone || false,
                plan: req.plan,
                payment: req.payment,
                subscriptorId: req.subscriptorId,
                validity: req.validity,
                startsAt: req.startsAt,
                paymentSource: req.paymentSource,
                discountCodeId: req.discountCodeId
            }
        })
    } else {
        mutation = client.mutate({
            mutation: CREATE_SUBSCRIPTION,
            variables: {
                kids: req.kids,
                adults: req.adults,
                isComingAlone: req.isComingAlone || false,
                plan: req.plan,
                payment: req.payment,
                subscriptorId: subscriptorId,
                payment: charge,
                validity: validity,
                startsAt: _formattedStartsAt,
                paymentSource: paymentSource
            }
        })
    }

    mutation
        .then(result => {
            const _subscription = result.data.createPPSubscription;
            resolve(_subscription);  
        }).catch(err=> reject(err));
}

function createSubscriptionWithoutUser(req) {
    return new Promise((resolve, reject) => {
        let mutation;
        if(req.discountCodeId) {
            mutation = client.mutate({
                mutation: CREATE_SUBSCRIPTION_WITH_DISCOUNT_AND_WITHOUT_USER,
                variables: {
                    kids: req.kids,
                    adults: req.adults,
                    isComingAlone: req.isComingAlone || false,
                    plan: req.plan,
                    payment: req.payment,
                    validity: req.validity,
                    startsAt: req.startsAt,
                    email: req.email,
                    paymentSource: req.paymentSource,
                    discountCodeId: req.discountCodeId
                }
            })
        } else {
            mutation = client.mutate({
                mutation: CREATE_SUBSCRIPTION_WITHOUT_USER,
                variables: {
                    kids: req.kids,
                    adults: req.adults,
                    isComingAlone: req.isComingAlone || false,
                    plan: req.plan,
                    payment: req.payment,
                    validity: req.validity,
                    startsAt: req.startsAt,
                    email: req.email,
                    paymentSource: req.paymentSource
                }
            })
        }

        mutation
        .then(result => {
            const _subscription = result.data.createPPSubscription;
            resolve(_subscription);  
        }).catch(err=> reject(err));
    })
    

}


function createSubscription(req) {
    return new Promise((resolve, reject)=> {
        // Cases to handle.
        // case 1: subscriptorId exists
        let mutation;
        console.log('Create subscription request: ', req);
        if(req.subscriptorId) {
            mutation = createSubscriptionWithUser(req)
        } else {
            // case 2: exists subscriptor email (for not logged in or register users)
            mutation = createSubscriptionWithoutUser(req);
        }

        mutation.then(subscription => {
            if(req.discountCodeId) {
                //the discount code has to be added to subscription, user and marked as used
                discountsService.markDiscountCodeAsUsed(req, subscription.id);
            }
            console.log('Resolving subscription creation');
            resolve(subscription);
        })
        .catch(err => {
            reject(err)
        })
    });
}

const addSubscription = function (paymentSource, charge, req, discount) {
    return new Promise((resolve, reject) => {
        const type = req.plan;
        var startsAt = moment(req.startsAt).clone();
        startsAt = startsAt.hours(0).minutes(0).seconds(0).milliseconds(0);
        const _formattedStartsAt = startsAt.toISOString();
        const validity = '' + calculateValidityDate(type, _formattedStartsAt);
        const _validDiscount = discountsService.isValid(discount);
        console.log('Charge', charge);
        let _request = {
            kids: req.kidsAmount,
            adults: req.adultsAmount,
            isComingAlone: req.isComingAlone || false,
            plan: req.plan,
            subscriptorId: req.subscriptorId,
            payment: charge,
            validity: validity,
            startsAt: _formattedStartsAt,
            paymentSource: paymentSource,
            discountCodeId: (_validDiscount) ? discount.id : null,
            email: req.email
        }

        createSubscription(_request)
            .then((result) => {
                console.log(result)
                resolve(result);
            }).catch(err=> {
                reject(err);
            })
    })
}


module.exports = {
    saveSubscriptionFromStripe: async function (charge, req, discount) {
        return addSubscription('Stripe', charge, req, discount);
    },
    saveSubscriptionFromPayPal: async function (req, discount) {
        return addSubscription('PayPal', req.payment, req, discount);
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
    },
    searchDiscountCode: async function(code) {
        return getDiscountCode(code)
    }
}