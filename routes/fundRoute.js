const express = require("express");
const saveFundDataToDb = require("../scrapeSave/saveFundDataToDB");
const verifyJWT = require("../middleware/verifyJWT");
const Fund = require("../models/Fund");
const redisClient = require("../shared/redis.js")();
const router = express.Router();

router.use(verifyJWT);


router.get("/add-fund", async (req, res) => {
    try {
      await saveFundDataToDb();
      res.send("Fund data updated successfully");
    } catch (error) {
      console.error(error);
      res.status(500).send("Error updating fund data");
    }
  });

  router.get("/getFundDetail/:name/:numberOfDays", async (req, res) => {
    try {
      const { name, numberOfDays } = req.params;
  
      const data = await Fund.find({ name: new RegExp(name, "i") })
        .sort({ addedDate: -1 })
        .limit(parseInt(numberOfDays));
  
      const fundInfo = await Fund.findOne({ name: new RegExp(name, "i") }).sort(
        { addedDate: -1 }
      );
  
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
     
  
      res.status(200).json({
        status: "success",
        message: "Fon detayı başarıyla getirildi",
        desc: fundInfo.desc,
        name: fundInfo.name,
        lastPrice: fundInfo.lastPrice,
        data: formattedData,
      });
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  });

  router.post("/searchFund/:searchParam?", async (req, res) => {
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
        const cachedFund = await redisClient.get("fundData");
        if (cachedFund) {
          // Redis'teki veriyi döndür
          return res.status(200).json({
            status: "success",
            message: "Fonlar Redis'ten başarıyla getirildi",
            data: JSON.parse(cachedFund),
          });
        } else {
          const data = await Fund.find(query);
         
  
          await redisClient.set("currencyData", JSON.stringify(data), "EX", 24 * 60 * 60);
  
          return res.status(200).json({
            status: "success",
            message: "Fonlar başarıyla getirildi",
            data: data,
          });
        }
      }
  
      // Eğer searchParam varsa ve boş değilse, adı belirtilen şekilde de filtrele
      if (searchParam && searchParam.trim() !== "") {
        query.name = new RegExp(`^${searchParam}`, "i");
      }
  
      const data = await Fund.find(query).skip(skip).limit(limit);
      
  
      res.status(200).json({
        status: "success",
        message: "Fonlar başarıyla getirildi",
        data: data,
      });
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  });

  module.exports = router;