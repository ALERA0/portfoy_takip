const express = require("express");
const router = express.Router();
const saveStockDataToDb = require("../scrapeSave/saveStockDataToDb");
const Stock = require("../models/Stock");

router.get("/add-stocks", async (req, res) => {
  try {
    await saveStockDataToDb();
    res.send("Stock data updated successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error updating stock data");
  }
});

router.get("/getAllStock", async (req, res) => {
  try {
    const data = await Stock.find();
    res.status(200).json({
      status: "success",
      message: "Hisseler başarıyla getirildi",
      data,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.get("/getStockDetail/:_id", async (req, res) => {
  try {
    const { _id } = req.params;
    const data = await Stock.findById(_id);
    res.status(200).json({
      status: "success",
      message: "Hisse detayı başarıyla getirildi",
      data,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});
module.exports = router;
