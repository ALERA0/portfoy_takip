const express = require("express");
const Portfolio = require("../models/Portfolio");
const verifyJWT = require("../middleware/verifyJWT");
const router = express.Router();



router.use(verifyJWT);

router.get("/getAllPortfolio", async (req, res) => {
  try {
    const portfolios = await Portfolio.find({ createdBy: req.user._id })
      
    console.log(req.user,"USER")

    res.status(200).json({
      status: "success",
      message: "Portfolio listesi başarıyla  getirildi",
      portfolios,
    });
  } catch (err) {
    console.error(err);

    res.status(500).send(err);
  }
});

module.exports = router;



module.exports = router;
