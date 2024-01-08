const express = require('express');
const saveCurrencyDataToDb = require('../scrapeSave/saveCurrencyDataToDb');
const Currency = require('../models/Currency');
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

router.get("/getAllCurrency", async (req, res) => {
  try {
    const data = await Currency.find();
    res.status(200).json({
      status: "success",
      message: "Döviz verileri başarıyla getirildi",
      data,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.get("/getCurrencyDetail/:_id", async (req, res) => {
  try {
    const { _id } = req.params;
    const data = await Currency.findById(_id);
    res.status(200).json({
      status: "success",
      message: "Döviz detayı başarıyla getirildi",
      data,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

module.exports = router;
