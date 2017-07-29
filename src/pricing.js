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
    console.log(pricing)
    if(!pricing) throw createError(400,'Invalid days amount value')
      let adultsTotalPrice = (adultsAmount + 1) * pricing.adultPrice;
      let kidsTotalPrice = kidsAmount * pricing.kidPrice;
      let total = adultsTotalPrice + kidsTotalPrice || 0;

    // return Math.round(
    //   pricing.adultPrice * (adultsAmount + 1) + 
    //   pricing.kidPrice * kidsAmount
    // )


    return Math.round((total) * 100) / 100;
  }
}
