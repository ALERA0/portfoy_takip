const express = require("express");
const saveCurrencyDataToDb = require("../scrapeSave/saveCurrencyDataToDb");
const Currency = require("../models/Currency");
const verifyJWT = require("../middleware/verifyJWT.js");
const router = express.Router();
const redisClient = require("../shared/redis.js")();
const cron = require("node-cron");

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

router.get("/getCurrencyDetail/:name/:numberOfDays", async (req, res) => {
  try {
    const { name, numberOfDays } = req.params;

    const currencyName = await Currency.findOne({
      name: new RegExp(name, "i"),
    }).sort({ addedDate: -1 });

    const data = await Currency.find({ name: new RegExp(name, "i") })
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
      message: "Döviz detayı başarıyla getirildi",
      name: currencyName.name,
      lastPrice: parseFloat(currencyName.lastPrice.replace(",", ".")),
      description: currencyName.desc,
      data: formattedData,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});


router.post("/searchCurrency/:searchParam?", async (req, res) => {
  try {
    let { searchParam } = req.params;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    let query = {
      addedDate: { $gte: today }
    };

    if (searchParam === undefined || searchParam === null) {
      const cachedCurrency = await redisClient.get("currencyData");
      if (cachedCurrency) {
        // Redis'teki veriyi döndür
        return res.status(200).json({
          status: "success",
          message: "Dövizler Redis'ten başarıyla getirildi",
          data: JSON.parse(cachedCurrency),
        });
      } else {
        const data = await Currency.find(query);
        await redisClient.set("currencyData", JSON.stringify(data), "EX", 24 * 60 * 60);
        return res.status(200).json({
          status: "success",
          message: "Dövizler başarıyla getirildi",
          data,
        });
      }
    }

    // Eğer searchParam varsa ve boş değilse, adı belirtilen şekilde de filtrele
    if (searchParam && searchParam.trim() !== "") {
      query.name = new RegExp(searchParam, "i");
    }

    const data = await Currency.find(query);
    res.status(200).json({
      status: "success",
      message: "Dövizler başarıyla getirildi",
      data,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

module.exports = router;
