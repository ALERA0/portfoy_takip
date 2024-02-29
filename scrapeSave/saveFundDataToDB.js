
const scrapeFundData = require("../fetch/scrapeFundData");
const Fund = require("../models/Fund");

const saveFundDataToDb = async () => {
  const fundData = await scrapeFundData();
  try {
    for (const fund of fundData) {
      const newFund = new Fund(fund);
      await newFund.save();
    }
    console.log('Fund data saved to database');
  } catch (error) {
    console.error('Error saving fund data to database', error);
  }
};

module.exports = saveFundDataToDb;
