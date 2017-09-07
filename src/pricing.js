'use strict';
const createError = require('micro').createError
const prices = {
  OneDay: { 
    adultPrice : 19, kidPrice: 9
  },
  FourDays: { 
    adultPrice: 59, kidPrice: 29
  },
  SevenDays: { 
    adultPrice : 79, kidPrice: 39
  },
  FourteenDays: {
    adultPrice : 99, kidPrice: 49
  }
};

module.exports = {
  // Returns final price in cents in order to send it to Stripe
  totalChargeAmount: function (req, res) {
    console.log('Total charge amount for request: ' , req)
    let pricing = prices[req.plan];
    if(!pricing) throw createError(400,'Invalid plan value')
    const _amount = pricing.adultPrice * (req.adultsAmount + 1) + pricing.kidPrice * req.kidsAmount;
    return _amount * 100;
  }
}
