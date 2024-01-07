const scrapeCurrencyData = require("../fetch/scrapeCurrencyData");
const Currency = require("../models/Currency");


const saveCurrencyDataToDb = async () => {
  const currencyData = await scrapeCurrencyData();
  try {
    for (const currency of currencyData) {
      const newCurrency = new Currency(currency);
      await newCurrency.save();
    }
    console.log('Currency data saved to database');
  } catch (error) {
    console.error('Error saving currency data to database', error);
  }
};

module.exports = saveCurrencyDataToDb;
