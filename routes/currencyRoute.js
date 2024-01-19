const express = require('express');
const saveCurrencyDataToDb = require('../scrapeSave/saveCurrencyDataToDb');
const Currency = require('../models/Currency');
const verifyJWT = require('../middleware/verifyJWT.js');
const router = express.Router();
const redisClient = require("../shared/redis.js")();

router.use(verifyJWT);


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
    const cachedStocks = await redisClient.get("currencies");

    if (cachedStocks) {
      // Redis'teki veriyi döndür
      return res.status(200).json({
        status: "success",
        message: "Döviz Redis'ten başarıyla getirildi",
        data: JSON.parse(cachedStocks),
      });
    }

    // Bugün eklenen hisseleri getir
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Bugünün başlangıcı
    const data = await Currency.find({ addedDate: { $gte: today } });

    // Veriyi Redis'e kaydet
    await redisClient.set("currencies", JSON.stringify(data), "EX", 60 * 60); // 1 saat TTL

    res.status(200).json({
      status: "success",
      message: "Bugün eklenen doviz verileri başarıyla getirildi",
      data,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.get("/getCurrencyDetail/:name", async (req, res) => {
  try {
    const { name } = req.params;

    const data = await Currency.find({ name: new RegExp(name, "i") });

    res.status(200).json({
      status: "success",
      message: "Döviz detayı başarıyla getirildi",
      data,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});


router.get("/getLastCurrencyDetail/:name", async (req, res) => {
  try {
    const { name } = req.params;

    const latestCurrencyDetail = await Currency.findOne({ name: new RegExp(name, "i") })
      .sort({ addedDate: -1 })
      .limit(1);

    if (!latestCurrencyDetail) {
      return res.status(404).json({ status: "error", message: "Döviz detayı bulunamadı." });
    }

    res.status(200).json({
      status: "success",
      message: "Döviz detayı başarıyla getirildi",
      data: latestCurrencyDetail,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

module.exports = router;
