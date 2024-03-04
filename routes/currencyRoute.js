const express = require("express");
const saveCurrencyDataToDb = require("../scrapeSave/saveCurrencyDataToDb");
const Currency = require("../models/Currency");
const verifyJWT = require("../middleware/verifyJWT.js");
const router = express.Router();
const redisClient = require("../shared/redis.js")();
const cron = require("node-cron");
const currencyController = require("../Controllers/currency.controller");



router.use(verifyJWT);

cron.schedule("1 0 * * *", async () => {
  try {
    console.log("Cron Job Currency started at", new Date());
    await saveCurrencyDataToDb();
    const cachedStocks = await redisClient.get("currencyData");
    if (cachedStocks) {
      await redisClient.del("currencyData");
      console.log("Redis'teki dövizler silindi");
    }
    console.log("Currency data updated successfully at", new Date());
  } catch (error) {
    console.error("Error updating currency data:", error.message);
  }
});

router.get("/add-currencies", async (req, res) => {
  try {
    await saveCurrencyDataToDb();
    res.send("Currency data updated successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error updating currency data");
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
    await redisClient.set(
      "currencies",
      JSON.stringify(data),
      "EX",
      24 * 60 * 60
    ); // 1 saat TTL

    res.status(200).json({
      status: "success",
      message: "Bugün eklenen doviz verileri başarıyla getirildi",
      data,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.route("/getCurrencyDetail/:name/:numberOfDays").get(currencyController.getCurrencyDetail);


router.route("/searchCurrency/:searchParam?").post(currencyController.searchCurrency);



module.exports = router;
