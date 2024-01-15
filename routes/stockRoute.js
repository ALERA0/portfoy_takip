const express = require("express");
const router = express.Router();
const saveStockDataToDb = require("../scrapeSave/saveStockDataToDb");
const Stock = require("../models/Stock");
const redisClient = require("../shared/redis.js")()

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
    // Redis'ten veriyi kontrol et
    // const cachedStocks = await redisClient.get('allStocks');

    // if (cachedStocks) {
    //   // Redis'teki veriyi döndür
    //   return res.status(200).json({
    //     status: "success",
    //     message: "Hisseler Redis'ten başarıyla getirildi",
    //     data: JSON.parse(cachedStocks),
    //   });
    // }

    // // Redis'te veri yoksa, veritabanından çek
    const data = await Stock.find();

    // // Veriyi Redis'e kaydet
    // await redisClient.set('allStocks', JSON.stringify(data), 'EX', 60 * 60); // 1 saat TTL

    res.status(200).json({
      status: "success",
      message: "Hisseler veritabanından başarıyla getirildi",
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
