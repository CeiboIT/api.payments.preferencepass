'use strict';
const createError = require('micro').createError
// import ApolloClient, { createNetworkInterface } from 'apollo-client';
const {ApolloClient} = require('apollo-client')
const createNetworkInterface = require('apollo-client').createNetworkInterface
const gql = require('graphql-tag')
 
const client = new ApolloClient({
  networkInterface: createNetworkInterface({
    uri : 'https://api.graph.cool/simple/v1/cj41c9u2zddol0177la66g30g'
  }),
});

module.exports = {
    saveSubscription: async function (charge, req, res) {
        return addSubscription(charge, req);
    }
}

const addSubscription = function (charge, req, res) {
    return new Promise(function (resolve, reject) {
        console.log('charge: ', charge);
        console.log('req: ', req);
        var data = {
            adults: 1,
            kids: 1,
            isComingAlone: false,
            validity: 111111111,
            type: 'OneDay'
        }
        client.mutate({
            mutation: gql`
                mutation createSubscription($adults: Int!, $kids: Int, $isComingAlone: Boolean, $validity: DateTime!, $type: Plans!) {
                    createSubscription(adults: $adults, kids: $kids, isComingAlone: $isComingAlone, validity: $validity, type: $type)
                }
            `,
            variables: {
                data: data
            }
            })
            .then(data => console.log(data))
            .catch(error => console.error(error));

        // createSubscription(adults: req.adultsAmount, kids: req.kidsAmount, isComingAlone: req.isComingAlone, validity: 123, subscriptorId: userID, type: req.plan)
        resolve();
    });
}
