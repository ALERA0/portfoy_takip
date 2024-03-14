
const express = require("express");
const saveCryptoDataToDb = require("../scrapeSave/saveCryptoDataToDb");
const verifyJWT = require("../middleware/verifyJWT");
const router = express.Router();
const cryptoController = require("../Controllers/crypto.controller");

router.use(verifyJWT);


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