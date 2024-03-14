const scrapeCryptoData = require("../fetch/scrapeCryptoData");
const Crypto = require("../models/Crypto");

const saveCryptoDataToDb = async () => {
    const cryptoData = await scrapeCryptoData();
    try {
      for (const crypto of cryptoData) {
        const newCrypto = new Crypto(crypto);
        await newCrypto.save();
      }
      console.log('Crypto data saved to database');
    } catch (error) {
      console.error('Error saving crypto data to database', error);
    }
  };
  
  module.exports = saveCryptoDataToDb;
  