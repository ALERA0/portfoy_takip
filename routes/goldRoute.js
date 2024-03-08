const express = require("express");
const saveGoldDataToDb = require("../scrapeSave/saveGoldDataToDb");
const Gold = require("../models/Gold");
const verifyJWT = require("../middleware/verifyJWT.js");
const goldController = require("../Controllers/gold.controller");
const router = express.Router();
const redisClient = require("../shared/redis.js")();
const cron = require("node-cron");

router.use(verifyJWT);

cron.schedule("1 0 * * *", async () => {
  try {
    console.log("Cron Job Gold started at", new Date());
    await saveGoldDataToDb();
    const cachedStocks = await redisClient.get("goldData");
    if (cachedStocks) {
      await redisClient.del("goldData");
      console.log("Redis'teki altın verileri silindi");
    }
    console.log("Gold data updated successfully at", new Date());
  } catch (error) {
    console.error("Error updating gold data:", error.message);
  }
});

router.get("/add-gold", async (req, res) => {
  try {
    await saveGoldDataToDb();
    res.send("Gold data updated successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error updating gold data");
  }
});

router.get("/getAllGold", async (req, res) => {
  try {
    const cachedStocks = await redisClient.get("golds");

    if (cachedStocks) {
      // Redis'teki veriyi döndür
      return res.status(200).json({
        status: "success",
        message: "Altınlar Redis'ten başarıyla getirildi",
        data: JSON.parse(cachedStocks),
      });
    }

    // Bugün eklenen hisseleri getir
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Bugünün başlangıcı
    const data = await Gold.find({ addedDate: { $gte: today } });

    // Veriyi Redis'e kaydet
    await redisClient.set("golds", JSON.stringify(data), "EX", 24 * 60 * 60); // 1 saat TTL

    res.status(200).json({
      status: "success",
      message: "Bugün eklenen altin verileri başarıyla getirildi",
      data,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.route("/getGoldDetail").post(goldController.getGoldDetail);

router.route("/searchGold").post(goldController.searchGold);

module.exports = router;
