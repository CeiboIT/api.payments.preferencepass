'use strict';
const createError = require('micro').createError
const prices = {
  1: { 
    adultPrice : 19.99, kidPrice: 9.99
  },
  4: { 
    adultPrice: 59.99, kidPrice: 29.99
  },
  7: { 
    adultPrice : 79.99, kidPrice: 39.99
  },
  14: {
    adultPrice : 99.99, kidPrice: 49.99
  }
};

module.exports = {
  totalChargeAmount: function (adultsAmount, kidsAmount, days, res) {
    let pricing = prices[days]
    if(!pricing) throw createError(400,'Invalid days amount value')
    return Math.round(
      pricing.adultPrice * (adultsAmount + 1) + 
      pricing.kidPrice * kidsAmount
    )
  }
}
