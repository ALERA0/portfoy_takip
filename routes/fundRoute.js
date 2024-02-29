const express = require("express");
const saveFundDataToDb = require("../scrapeSave/saveFundDataToDB");
const verifyJWT = require("../middleware/verifyJWT");
const Fund = require("../models/Fund");
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
  
      // Belirli bir hissenin adına ve belirtilen sayıda gün içindeki verileri al
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

  module.exports = router;