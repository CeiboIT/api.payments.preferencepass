'use strict';
const createError = require('micro').createError
const prices = {
  OneDay: { 
    adultPrice : 19.99, kidPrice: 9.99
  },
  FourDays: { 
    adultPrice: 59.99, kidPrice: 29.99
  },
  SevenDays: { 
    adultPrice : 79.99, kidPrice: 39.99
  },
  FourteenDays: {
    adultPrice : 99.99, kidPrice: 49.99
  }
};

module.exports = {
  totalChargeAmount: function (adultsAmount, kidsAmount, plan, res) {
    let pricing = prices[plan]
    if(!pricing) throw createError(400,'Invalid days amount value')
      
    return Math.round(
      pricing.adultPrice * (adultsAmount + 1) + 
      pricing.kidPrice * kidsAmount
    ) * 100
  }
}
