const scrapeGoldData = require("../fetch/scrapeGoldData");
const Gold = require("../models/Gold");

const saveGoldDataToDb = async () => {
  const goldData = await scrapeGoldData();
  try {
    for (const gold of goldData) {
      const newGold = new Gold(gold);
      await newGold.save();
    }
    console.log('Gold data saved to database');
  } catch (error) {
    console.error('Error saving gold data to database', error);
  }
};

module.exports = saveGoldDataToDb;
