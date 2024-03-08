const express = require("express");
const saveFundDataToDb = require("../scrapeSave/saveFundDataToDB");
const verifyJWT = require("../middleware/verifyJWT");
const fundController = require("../Controllers/fund.controller");
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

router
  .route("/getFundDetail/:name/:numberOfDays")
  .get(fundController.getFundDetail);

router.route("/searchFund/:searchParam?").post(fundController.searchFund);

module.exports = router;
