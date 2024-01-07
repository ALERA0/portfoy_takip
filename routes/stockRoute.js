const express = require('express')
const router = express.Router()
const  saveStockDataToDb  = require("../scrapeSave/saveStockDataToDb");

router.get('/add-stocks', async (req, res) => {
    try {
      await saveStockDataToDb();
      res.send('Stock data updated successfully');
    } catch (error) {
      console.error(error);
      res.status(500).send('Error updating stock data');
    }
  });


module.exports = router
