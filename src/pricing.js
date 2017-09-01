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
  totalChargeAmount: function (adultsAmount, kidsAmount, plan, res) {
    let pricing = prices[plan]
    if(!pricing) throw createError(400,'Invalid days amount value')
      
    return pricing.adultPrice * (adultsAmount + 1) + 
      pricing.kidPrice * kidsAmount
  }
}
