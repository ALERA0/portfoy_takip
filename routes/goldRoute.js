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

router.get("/getGoldDetail/:name/:numberOfDays", async (req, res) => {
  try {
    const { name, numberOfDays } = req.params;

    const nameEncoded = encodeURIComponent(name);

    console.log(nameEncoded);

    const goldName = await Gold.findOne({ name: new RegExp(nameEncoded, "i") });

    const data = await Gold.find({ name: new RegExp(nameEncoded, "i") })
      .sort({ addedDate: -1 })
      .limit(parseInt(numberOfDays));

      console.log(data,"data")

    const formattedData = data.map((item, index, array) => ({
      value: parseFloat(item.lastPrice.replace(",", ".")),
      date: item.addedDate.toISOString().split("T")[0],
      label: index === 0 || index === array.length - 1 ? item.addedDate.toISOString().split("T")[0] : null,
    }));

    const responseData = {
      status: "success",
      message: "Altın / Gümüş detayı başarıyla getirildi",
      data: formattedData,
    };
    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});


router.get("/getLastGoldDetail/:name/:numberOfDays", async (req, res) => {
  try {
    const { name,numberOfDays } = req.params;

    
    nameEncoded = encodeURIComponent(name);


    const data = await Gold.find({ name: new RegExp(nameEncoded, "i") })
    .sort({ addedDate: -1 })
    .limit(parseInt(numberOfDays));

    const formattedData = data.map((item, index, array) => ({
      value: parseFloat(item.lastPrice.replace(",", ".")),
      date: item.addedDate.toISOString().split("T")[0],
      label:
        index === 0 || index === array.length - 1
          ? item.addedDate.toISOString().split("T")[0]
          : null,
    }));

    res.status(200).json({
      status: "success",
      message: "Altın / Gümüş detayı başarıyla getirildi",
      data: formattedData,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});






module.exports = router;
