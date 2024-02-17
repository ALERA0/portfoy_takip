const express = require("express");
const saveGoldDataToDb = require("../scrapeSave/saveGoldDataToDb");
const Gold = require("../models/Gold");
const verifyJWT = require("../middleware/verifyJWT.js");
const router = express.Router();
const redisClient = require("../shared/redis.js")();

router.use(verifyJWT);

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
    console.log(data[0]);

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

router.post("/getGoldDetail", async (req, res) => {
  try {
    const { name,day } = req.body;

    const goldName = await Gold.findOne({ name: name });
    const data = await Gold.find({ name: name })
      .sort({ addedDate: -1 })
      .limit(parseInt(day));


    const formattedData = data.map((item, index, array) => ({
      value: parseFloat(item.lastPrice),
      date: item.addedDate.toISOString().split("T")[0],
      label:
        index === 0 || index === array.length - 1
          ? item.addedDate.toISOString().split("T")[0]
          : null,
    }));

    const responseData = {
      status: "success",
      message: "Altın / Gümüş detayı başarıyla getirildi",
      name: goldName.name,
      fullName: goldName.name,
      lastPrice: parseFloat(goldName.lastPrice),
      data: formattedData,
    };
    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.post("/searchGold", async (req, res) => {
  try {
    let { searchParam } = req.body;
    searchParam = searchParam.toUpperCase();
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const data = await Gold.find({
      name: new RegExp(searchParam, "i"),
      addedDate: { $gte: today },
    });
    res.status(200).json({
      status: "success",
      message: "Altın / Gümüş verisi başarıyla getirildi",
      data,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

module.exports = router;
