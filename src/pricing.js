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

  // returns final price in cents in order to send it to STRIPE
  totalChargeAmount: function (req, res) {
    console.log('Calculating total')
    console.log(adultsAmount);
    console.log(kidsAmount);
    let pricing = prices[req.plan];
    console.log(pricing);
    if(!pricing) throw createError(400,'Invalid days amount value')
    const _amount = pricing.adultPrice * (req.adultsAmount + 1) + pricing.kidPrice * req.kidsAmount;
    console.log(_amount);
    return _amount * 100;
  },

  // returns final price in dolars in order to show it in the subscription mail
  finalPriceForEmail: function (req, res) {
    let pricing = prices[req.plan];
    return pricing.adultPrice * (req.adultsAmount + 1) + 
      pricing.kidPrice * req.kidsAmount;
  }
}
