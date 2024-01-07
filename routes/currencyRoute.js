const express = require('express');
const saveCurrencyDataToDb = require('../scrapeSave/saveCurrencyDataToDb');
const router = express.Router();


router.get('/add-currencies', async (req, res) => {
  try {
    await saveCurrencyDataToDb();
    res.send('Currency data updated successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating currency data');
  }
});

module.exports = router;
