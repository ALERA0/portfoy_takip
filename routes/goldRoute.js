const express = require("express");
const saveGoldDataToDb = require("../scrapeSave/saveGoldDataToDb");
const Gold = require("../models/Gold");
const verifyJWT = require("../middleware/verifyJWT.js");
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

router.post("/getGoldDetail", async (req, res) => {
  try {
    const { name, day } = req.body;

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

    let query = {
      addedDate: { $gte: today }
    };

    if (searchParam === undefined || searchParam === null || searchParam === "") {
      const cachedGold = await redisClient.get("goldData");
      if (cachedGold) {
        // Redis'teki veriyi döndür
        return res.status(200).json({
          status: "success",
          message: "Altınlar Redis'ten başarıyla getirildi",
          data: JSON.parse(cachedGold),
        });
      } else {
        const data = await Gold.find(query);
        const formattedData = data.map(currency => ({
          ...currency.toObject(),
          changePercent: currency.changePercent.replace('%', ''),
        }));
        await redisClient.set("goldData", JSON.stringify(formattedData), "EX", 24 * 60 * 60);
        return res.status(200).json({
          status: "success",
          message: "Altınlar başarıyla getirildi",
          data:formattedData,
        });
      }
    }

    if (searchParam && searchParam.trim() !== "") {
      query.name = new RegExp(searchParam, "i");
    }
    const data = await Gold.find(query);
    const formattedData = data.map(currency => ({
      ...currency.toObject(),
      changePercent: currency.changePercent.replace('%', ''),
    }));
    res.status(200).json({
      status: "success",
      message: "Altın / Gümüş verisi başarıyla getirildi",
      data:formattedData,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

module.exports = router;
