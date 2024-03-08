const express = require("express");
const randomColor = require("randomcolor");
const Portfolio = require("../models/Portfolio");
const verifyJWT = require("../middleware/verifyJWT");
const PortfolioDetail = require("../models/PortfolioDetail");
const { default: mongoose } = require("mongoose");
const Currency = require("../models/Currency");
const Gold = require("../models/Gold");
const Stock = require("../models/Stock");
const portfolioController = require("../Controllers/portfolio.controller");
const { errorCodes } = require("../shared/handlers/error/errorCodes");
const { customError } = require("../shared/handlers/error/customError");

const router = express.Router();

router.use(verifyJWT);

router.route("/getAllPortfolio").get(portfolioController.getAllPortfolio);

router
  .route("/updatePortfolio/:portfolioId")
  .put(portfolioController.updatedPortfolio);

router
  .route("/deletePortfolio/:portfolioId")
  .delete(portfolioController.deletePortfolio);

router
  .route("/getPortfolioDetails/:portfolioId")
  .get(portfolioController.getPortfolioDetails);

router.route("/getAssetPercentages/:portfolioId/:assetType").get(portfolioController.getAssetPercentages);

router.route("/createPortfolio").post(portfolioController.createPortfolio);

router.route("/addAsset/:portfolioId").post(portfolioController.addAsset);

router.delete("/removeAsset/:portfolioId/:assetId", async (req, res) => {
  try {
    const { portfolioId, assetId } = req.params;

    // Portföyü bul
    const portfolio = await Portfolio.findById(portfolioId);

    if (!portfolio) {
      return res
        .status(404)
        .json({ status: "error", message: "Portfolio not found." });
    }

    // Varlığı bul ve kaldır
    const updatedPortfolioDetails = portfolio.portfolioDetails.filter(
      (asset) => asset._id.toString() !== assetId
    );

    // Güncellenmiş portföyü kaydet
    await Portfolio.findByIdAndUpdate(
      portfolioId,
      { portfolioDetails: updatedPortfolioDetails },
      { new: true }
    );

    res.status(200).json({
      status: "success",
      message: "Varlık portfoyunuzden başarıyla çıkarıldı.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.route("/getAssetDetails").post(portfolioController.getAssetDetails);

router.route("/updateAsset/:portfolioId/:assetId").put(portfolioController.updateAsset);

router.route("/getPortfolioTypeDetails/:portfolioId/:type").get(portfolioController.getPortfolioTypeDetails);

module.exports = router;
