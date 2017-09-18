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

