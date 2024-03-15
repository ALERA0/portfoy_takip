
const express = require("express");
const saveCryptoDataToDb = require("../scrapeSave/saveCryptoDataToDb");
const verifyJWT = require("../middleware/verifyJWT");
const router = express.Router();
const cryptoController = require("../Controllers/crypto.controller");
const cron = require("node-cron");


router.use(verifyJWT);


cron.schedule("1 0 * * *", async () => {
  try {
    console.log("Cron Job Crypto started at", new Date());
    await saveCryptoDataToDb();
    const cachedStocks = await redisClient.get("cryptoData");
    if (cachedStocks) {
      await redisClient.del("cryptoData");
      console.log("Redis'teki kripto silindi");
    }
    console.log("Crypto data updated successfully at", new Date());
  } catch (error) {
    console.error("Error updating crypto data:", error.message);
  }
});

router.get("/add-crypto", async (req, res) => {
  try {
    await saveCryptoDataToDb();
    res.send("Currency data updated successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error updating currency data");
  }
});

router.route("/getCryptoDetail/:name/:numberOfDays").get(cryptoController.getCryptoDetail);
router.route("/searchCrypto/:searchParam?").post(cryptoController.searchCrypto);



module.exports = router;