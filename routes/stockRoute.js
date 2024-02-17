const express = require("express");
const router = express.Router();
const saveStockDataToDb = require("../scrapeSave/saveStockDataToDb");
const Stock = require("../models/Stock");
const verifyJWT = require("../middleware/verifyJWT.js");
const redisClient = require("../shared/redis.js")();
const cron = require('node-cron');

router.use(verifyJWT);

cron.schedule('50 2 * * *', async () => {
  try {
    console.log("Cron Job started at", new Date());
    await saveStockDataToDb();
    console.log('Stock data updated successfully at', new Date());
  } catch (error) {
    console.error('Error updating stock data:', error.message);
  }
});



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

router.get("/getStockDetail/:name/:numberOfDays", async (req, res) => {
  try {
    const { name, numberOfDays } = req.params;

    // Belirli bir hissenin adına ve belirtilen sayıda gün içindeki verileri al
    const data = await Stock.find({ name: new RegExp(name, "i") })
      .sort({ addedDate: -1 })
      .limit(parseInt(numberOfDays));

    const stockInfo = await Stock.findOne({ name: new RegExp(name, "i") }).sort({ addedDate: -1 });

    // Verileri istenen formata çevir
    const formattedData = data.map((item, index, array) => ({
      value: parseFloat(item.lastPrice.replace(",", ".")),
      date: item.addedDate.toISOString().split("T")[0],
      label: index === 0 || index === array.length - 1 ? item.addedDate.toISOString().split("T")[0] : null,
    }));

    // Name ve Desc alanlarını ayarlayın
    const nameArray = stockInfo ? stockInfo.name.split(' ') : [];
    const namePart1 = nameArray.length > 0 ? nameArray[0] : '';
    const namePart2 = nameArray.length > 1 ? nameArray.slice(1).join(' ') : '';

    res.status(200).json({
      status: "success",
      message: "Hisse detayı başarıyla getirildi",
      fullName: stockInfo.name,
      name: namePart1,
      description: namePart2,
      lastPrice: parseFloat(stockInfo.lastPrice.replace(",", ".")),
      data: formattedData,
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
    let { searchParam } = req.params;
    searchParam = searchParam.toUpperCase();
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
