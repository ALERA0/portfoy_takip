const express = require('express');
const saveGoldDataToDb = require('../scrapeSave/saveGoldDataToDb');
const Gold = require('../models/Gold');
const verifyJWT = require('../middleware/verifyJWT.js');
const router = express.Router();
const redisClient = require("../shared/redis.js")();


router.use(verifyJWT);


router.get('/add-gold', async (req, res) => {
  try {
    await saveGoldDataToDb();
    res.send('Gold data updated successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating gold data');
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
    await redisClient.set("golds", JSON.stringify(data), "EX", 60 * 60); // 1 saat TTL

    res.status(200).json({
      status: "success",
      message: "Bugün eklenen altin verileri başarıyla getirildi",
      data,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.get("/getGoldDetail/:name", async (req, res) => {
  try {
    let { name } = req.params;

    name = encodeURIComponent(name);

    const data = await Gold.find({ name: new RegExp(name, "i") });

    res.status(200).json({
      status: "success",
      message: "Gold detayı başarıyla getirildi",
      data,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.get("/getLastGoldDetail/:name", async (req, res) => {
  try {
    const { name } = req.params;

    const latestGoldDetail = await Gold.findOne({ name: new RegExp(name, "i") })
      .sort({ addedDate: -1 })
      .limit(1);

    if (!latestGoldDetail) {
      return res.status(404).json({ status: "error", message: "Altın / Gümüş bulunamadı." });
    }

    res.status(200).json({
      status: "success",
      message: "Altın / Gümüş detayı başarıyla getirildi",
      data: latestGoldDetail,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});


module.exports = router;
