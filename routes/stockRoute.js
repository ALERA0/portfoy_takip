const express = require("express");
const router = express.Router();
const saveStockDataToDb = require("../scrapeSave/saveStockDataToDb");
const Stock = require("../models/Stock");
const verifyJWT = require("../middleware/verifyJWT.js");
const redisClient = require("../shared/redis.js")();

router.use(verifyJWT);

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
    const cachedStocks = await redisClient.get("allStocks");

    if (cachedStocks) {
      // Redis'teki veriyi döndür
      return res.status(200).json({
        status: "success",
        message: "Hisseler Redis'ten başarıyla getirildi",
        data: JSON.parse(cachedStocks),
      });
    }

    // Bugün eklenen hisseleri getir
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Bugünün başlangıcı
    const data = await Stock.find({ addedDate: { $gte: today } });

    // Veriyi Redis'e kaydet
    await redisClient.set("allStocks", JSON.stringify(data), "EX", 60 * 60); // 1 saat TTL

    res.status(200).json({
      status: "success",
      message: "Bugün eklenen hisseler başarıyla getirildi",
      data,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.get("/getStockDetail/:name", async (req, res) => {
  try {
    const { name } = req.params;

    // Belirli bir hissenin adına ve en son tarihli veriye göre sıralanmış veriyi al
    const latestData = await Stock.findOne({ name: new RegExp(name, "i") })
      .sort({ addedDate: -1 })
      .limit(1);

    // Tüm veriyi hissenin adına göre filtrele
    const data = await Stock.find({ name: new RegExp(name, "i") });

    res.status(200).json({
      status: "success",
      message: "Hisse detayı başarıyla getirildi",
      lastPrice: latestData ? parseFloat(latestData.lastPrice.replace(",", ".")) : null,
      data,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});


router.get("/getLastStockDetail/:name", async (req, res) => {
  try {
    const { name } = req.params;

    const latestStockDetail = await Stock.findOne({
      name: new RegExp(name, "i"),
    })
      .sort({ addedDate: -1 })
      .limit(1);

    if (!latestStockDetail) {
      return res
        .status(404)
        .json({ status: "error", message: "Hisse detayı bulunamadı." });
    }

    res.status(200).json({
      status: "success",
      message: "Hisse detayı başarıyla getirildi",
      data: latestStockDetail,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.post("/searchStock/:searchParam", async (req, res) => {
  try {
    const { searchParam } = req.params;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const data = await Stock.find({
      name: new RegExp(searchParam, "i"),
      addedDate: { $gte: today },
    });
    res.status(200).json({
      status: "success",
      message: "Hisseler başarıyla getirildi",
      data,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

module.exports = router;
