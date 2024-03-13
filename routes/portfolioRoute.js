const express = require("express");
const Portfolio = require("../models/Portfolio");
const verifyJWT = require("../middleware/verifyJWT");
const portfolioController = require("../Controllers/portfolio.controller");


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

router.route("/removeAsset/:portfolioId/:assetId").delete(portfolioController.removeAsset);

router.route("/getAssetDetails").post(portfolioController.getAssetDetails);

router.route("/updateAsset/:portfolioId/:assetId").put(portfolioController.updateAsset);

router.route("/getPortfolioTypeDetails/:portfolioId/:type").get(portfolioController.getPortfolioTypeDetails);

router.route("/updateBudget").put(portfolioController.updateBudget);

router.route("/getBudget").get(portfolioController.getBudgetDetails);

module.exports = router;
