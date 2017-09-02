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
    console.log('Calculating total')
    console.log(adultsAmount);
    console.log(kidsAmount);
    let pricing = prices[plan]
    console.log(pricing);
    if(!pricing) throw createError(400,'Invalid days amount value')
    const _amount = pricing.adultPrice * (adultsAmount + 1) + pricing.kidPrice * kidsAmount;
    console.log(_amount);
    return _amount * 100;
  }
}
