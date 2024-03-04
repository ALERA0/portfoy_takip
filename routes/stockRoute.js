const express = require("express");
const router = express.Router();
const saveStockDataToDb = require("../scrapeSave/saveStockDataToDb");
const Stock = require("../models/Stock");
const verifyJWT = require("../middleware/verifyJWT.js");
const redisClient = require("../shared/redis.js")();
const cron = require("node-cron");
const { errorCodes } = require("../shared/handlers/error/errorCodes.js");
const { customError } = require("../shared/handlers/error/customError.js");

router.use(verifyJWT);

cron.schedule("1 0 * * *", async () => {
  try {
    console.log("Cron Job Stock started at", new Date());
    await saveStockDataToDb();
    const cachedStocks = await redisClient.get("stockData");
    if (cachedStocks) {
      await redisClient.del("stockData");
      console.log("Redis'teki hisseler silindi");
    }
    console.log("Stock data updated successfully at", new Date());
  } catch (error) {
    console.error("Error updating stock data:", error.message);
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
    await redisClient.set(
      "allStocks",
      JSON.stringify(data),
      "EX",
      24 * 60 * 60
    ); // 1 saat TTL

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


    const data = await Stock.find({ name: new RegExp(name, "i") })
      .sort({ addedDate: -1 })
      .limit(parseInt(numberOfDays));

      

    const stockInfo = await Stock.findOne({ name: new RegExp(name, "i") }).sort(
      { addedDate: -1 }
    );

    if (!stockInfo || stockInfo.length === 0) {
      console.log(stockInfo);
      console.log("STOCK ERRRRORR")
     throw new customError(errorCodes.STOCK_NOT_FOUND);
    }

    // Verileri istenen formata çevir
    const formattedData = data.map((item, index, array) => ({
      value: parseFloat(item.lastPrice.replace(",", ".")),
      date: item.addedDate.toISOString().split("T")[0],
      label:
        index === 0 || index === array.length - 1
          ? item.addedDate.toISOString().split("T")[0]
          : null,
    }));

    // Name ve Desc alanlarını ayarlayın
    const nameArray = stockInfo ? stockInfo.name.split(" ") : [];
    const namePart1 = nameArray.length > 0 ? nameArray[0] : "";
    const namePart2 = nameArray.length > 1 ? nameArray.slice(1).join(" ") : "";

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

router.post("/searchStock/:searchParam?", async (req, res) => {
  try {
    let { searchParam } = req.params;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    let query = {
      addedDate: { $gte: today }
    };

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (searchParam === undefined || searchParam === null) {
      const cachedStocks = await redisClient.get("stockData");
      if (cachedStocks) {
        // Redis'teki veriyi döndür
        return res.status(200).json({
          status: "success",
          message: "Hisseler Redis'ten başarıyla getirildi",
          data: JSON.parse(cachedStocks),
        });
      } else {
        const data = await Stock.find(query);
        // Response formatını güncelle
        const formattedData = data.map(stock => {
          const [name, ...descParts] = stock.name.split(' ');
          const desc = descParts.join(' '); // Kalan kısmı birleştir
          return {
            _id: stock._id,
            lastPrice: stock.lastPrice,
            name,
            desc,
            changePercent: stock.changePercent,
            addedDate: stock.addedDate,
            __v: stock.__v
          };
        });

        await redisClient.set("stockData", JSON.stringify(formattedData), "EX", 24 * 60 * 60);
        return res.status(200).json({
          status: "success",
          message: "Hisseler başarıyla getirildi",
          data: formattedData,
        });
      }
    }

    // Eğer searchParam varsa ve boş değilse, adı belirtilen şekilde de filtrele
    if (searchParam && searchParam.trim() !== "") {
      query.name = new RegExp(`^${searchParam}`, "i");
    }

    const data = await Stock.find(query).skip(skip).limit(limit);

    // Response formatını güncelle
    const formattedData = data.map(stock => {
      const [name, ...descParts] = stock.name.split(' ');
      const desc = descParts.join(' '); // Kalan kısmı birleştir
      return {
        _id: stock._id,
        lastPrice: stock.lastPrice,
        name,
        desc,
        changePercent: stock.changePercent,
        addedDate: stock.addedDate,
        __v: stock.__v
      };
    });

    res.status(200).json({
      status: "success",
      message: "Hisseler başarıyla getirildi",
      data: formattedData,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});




module.exports = router;
