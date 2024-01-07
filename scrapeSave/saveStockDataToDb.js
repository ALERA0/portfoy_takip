const Stock = require("../models/Stock");
const scrapeStockData = require("../fetch/scrapeStockData")


const saveStockDataToDb = async () => {
    const stockData = await scrapeStockData();
  try {
    for (const stock of stockData) {
      const newStock = new Stock(stock);
      await newStock.save();
    }
    console.log('Stock data saved to database');
  } catch (error) {
    console.error('Error saving stock data to database', error);
  }
};


module.exports = saveStockDataToDb;
