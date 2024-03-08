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

router.get("/getAssetPercentages/:portfolioId/:assetType", async (req, res) => {
  try {
    const { portfolioId, assetType } = req.params;
    const userId = req.user._id;

    const portfolio = await Portfolio.findOne({
      _id: portfolioId,
      createdBy: userId,
    });

    if (!portfolio) {
      return res
        .status(404)
        .json({ status: "error", message: "Portfolio not found." });
    }

    // Belirtilen varlık tipindeki varlıkları filtrele
    const filteredAssets = portfolio.portfolioDetails.filter(
      (asset) => asset.type === assetType
    );

    // Toplam varlık değerini hesapla
    const totalPortfolioValue = filteredAssets.reduce(
      (total, asset) => total + asset.totalAssetValue,
      0
    );

    // Her bir varlığın yüzdeliğini hesapla
    const assetPercentages = filteredAssets.map((asset) => ({
      name: asset.name,
      quantity: asset.quantity,
      progressBar: asset.totalAssetValue / totalPortfolioValue,
      percentage: parseFloat(
        ((asset.totalAssetValue / totalPortfolioValue) * 100).toFixed(2)
      ),
    }));

    res.status(200).json({
      status: "success",
      message: `${assetType} varlık yüzdeleri başarıyla getirildi.`,
      assetPercentages,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.post("/createPortfolio", async (req, res) => {
  try {
    const { name } = req.body;
    const createdBy = req.user._id;

    if (name.length < 3) {
      return res
        .status(400)
        .json({ message: "Portfolio ismi 3 karakterden az olamaz." });
    }

    const existingPortfolioWithSameInfo = await Portfolio.findOne({
      $or: [{ name: name, createdBy: createdBy }],
    });

    if (existingPortfolioWithSameInfo) {
      return res.status(400).json({
        status: "error",
        message: "Bu portfolio ile aynı isimde bir kayıt zaten var.",
      });
    }

    const newPortfolio = await Portfolio.create({
      name: name,
      createdBy: createdBy,
    });
    res.status(201).json({
      status: "success",
      message: "Portfolio başarıyla oluşturuldu",
      newPortfolio,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.post("/addAsset/:portfolioId", async (req, res) => {
  try {
    const { type, name, quantity, purchasePrice, purchaseDate } = req.body;
    const portfolioId = req.params.portfolioId;

    if (!type || !name || !quantity || !purchasePrice || !purchaseDate) {
      return res.status(400).json({
        status: "error",
        message: "Lütfen bütün alanları doldurunuz.",
      });
    }

    // Validate type against allowed values
    if (!["Stock", "Gold", "Currency"].includes(type)) {
      return res
        .status(400)
        .json({ status: "error", message: "Geçersiz varlık türü." });
    }

    const portfolio = await Portfolio.findById(portfolioId);

    if (!portfolio) {
      return res
        .status(404)
        .json({ status: "error", message: "Portfolio bulunamadı." });
    }

    // Kontrol: Aynı isim ve türde varlık zaten portföyde var mı?
    const existingAsset = portfolio.portfolioDetails.find(
      (asset) => asset.name === name.toUpperCase() && asset.type === type
    );

    if (existingAsset) {
      const totalQuantity = existingAsset.quantity + quantity;
      const totalPurchaseValue =
        existingAsset.purchasePrice * existingAsset.quantity +
        purchasePrice * quantity;
      const newPurchasePrice = totalPurchaseValue / totalQuantity;
      const newProfitPercentage =
        ((newPurchasePrice - existingAsset.purchasePrice) /
          existingAsset.purchasePrice) *
        100;
      const newTotalAssetValue = totalQuantity * existingAsset.lastPrice;

      // Update the existing asset with the new values
      existingAsset.quantity = totalQuantity;
      existingAsset.purchasePrice = newPurchasePrice;
      existingAsset.profitPercentage = newProfitPercentage;
      existingAsset.totalAssetValue = newTotalAssetValue;

      await portfolio.save();

      return res.status(200).json({
        status: "success",
        message: "Existing portfolio detail successfully updated.",
        updatedPortfolioDetail: existingAsset,
      });
    }

    // Büyük harfe çevir
    const upperCaseName = name.toUpperCase();

    const newPortfolioDetail = new PortfolioDetail({
      type,
      name: upperCaseName,
      quantity,
      purchasePrice,
      purchaseDate,
    });

    portfolio.portfolioDetails.push(newPortfolioDetail);

    await portfolio.save();

    res.status(201).json({
      status: "success",
      message: "Portfolio detail successfully added.",
      newPortfolioDetail,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

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

router.post("/getAssetDetails", async (req, res) => {
  try {
    const { portfolioId, assetId, type, name, numberOfDays } = req.body;
    const userId = req.user._id;

    // Belirtilen portföy ve varlık bilgilerini kontrol et
    const portfolio = await Portfolio.findOne({
      _id: portfolioId,
      createdBy: userId,
    });

    if (!portfolio) {
      return res
        .status(404)
        .json({ status: "error", message: "Portfolio not found." });
    }

    // Belirtilen varlık (asset) bilgisini bul
    const asset = portfolio.portfolioDetails.find(
      (item) => item._id.toString() === assetId
    );

    if (!asset) {
      return res.status(404).json({
        status: "error",
        message: "Asset not found in the portfolio.",
      });
    }

    // Belirtilen model (type) üzerinden tarihsel verileri al
    let historicalData = [];
    switch (type) {
      case "Stock":
        historicalData = await Stock.find({ name: new RegExp(name, "i") })
          .sort({ addedDate: -1 })
          .limit(parseInt(numberOfDays));
        break;
      case "Currency":
        historicalData = await Currency.find({ name: new RegExp(name, "i") })
          .sort({ addedDate: -1 })
          .limit(parseInt(numberOfDays));
        break;
      case "Gold":
        historicalData = await Gold.find({ name: new RegExp(name, "i") })
          .sort({ addedDate: -1 })
          .limit(parseInt(numberOfDays));
        break;
      // Diğer modeller için gerekli case'leri ekleyebilirsiniz.
      default:
        return res
          .status(400)
          .json({ status: "error", message: "Invalid asset type." });
    }

    // Verileri istenen formata çevir
    const formattedHistoricalData = historicalData.map(
      (item, index, array) => ({
        value: parseFloat(item.lastPrice.replace(",", ".")),
        date: item.addedDate.toISOString().split("T")[0],
        label:
          index === 0 || index === array.length - 1
            ? item.addedDate.toISOString().split("T")[0]
            : null,
      })
    );

    const formattedPurchaseDate = asset.purchaseDate
      ? asset.purchaseDate.toISOString().split("T")[0]
      : null;

    let formattedNames;
    let namefirst;
    let description;

    if (type === "Stock") {
      formattedNames = asset.name.split(" ");
      namefirst = formattedNames.length > 0 ? formattedNames[0] : "";
      description =
        formattedNames.length > 1 ? formattedNames.slice(1).join(" ") : "";
    } else if (type === "Currency") {
      const currency = await Currency.findOne({ name: asset.name });
      namefirst = currency.name;
      description = currency.desc;
    }

    res.status(200).json({
      status: "success",
      message: "Asset detayları başarıyla getirildi",
      portfolioId: portfolio._id,
      assetDetails: {
        fullName: asset.name,
        name: namefirst ? namefirst : "",
        description: description ? description : "",
        assetId: asset._id,
        type: asset.type,
        quantity: parseFloat(asset.quantity).toFixed(2),
        lastPrice: parseFloat(asset.lastPrice.toFixed(2)),
        purchaseDate: formattedPurchaseDate,
        purchasePrice: parseFloat(asset.purchasePrice).toFixed(2),
        totalAssetValue: parseFloat(asset.totalAssetValue).toFixed(2),
      },
      historicalData: formattedHistoricalData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.put("/updateAsset/:portfolioId/:assetId", async (req, res) => {
  try {
    const { portfolioId, assetId } = req.params;
    const { quantity, purchasePrice, purchaseDate } = req.body;
    const userId = req.user._id;

    // Portföyü bul
    const portfolio = await Portfolio.findOne({
      _id: portfolioId,
      createdBy: userId,
    });

    if (!portfolio) {
      return res
        .status(404)
        .json({ status: "error", message: "Portfolio not found." });
    }

    const assetIndex = portfolio.portfolioDetails.findIndex(
      (item) => item._id.toString() === assetId
    );

    if (assetIndex === -1) {
      return res.status(404).json({
        status: "error",
        message: "Asset not found in the portfolio.",
      });
    }

    // Update the asset details
    portfolio.portfolioDetails[assetIndex].quantity = quantity;
    portfolio.portfolioDetails[assetIndex].purchasePrice = purchasePrice;
    portfolio.portfolioDetails[assetIndex].purchaseDate = purchaseDate;

    // Save the updated portfolio
    const updatedPortfolio = await portfolio.save();

    res.status(200).json({
      status: "success",
      message: "Asset details successfully updated.",
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.get("/getPortfolioTypeDetails/:portfolioId/:type", async (req, res) => {
  try {
    const { portfolioId, type } = req.params;
    const userId = req.user._id;

    const portfolio = await Portfolio.findOne({
      _id: portfolioId,
      createdBy: userId,
    });

    if (!portfolio) {
      return res
        .status(404)
        .json({ status: "error", message: "Portfolio not found." });
    }

    // Filtreleme yap
    const filteredAssets = portfolio.portfolioDetails.filter(
      (asset) => asset.type === type
    );

    if (filteredAssets.length === 0) {
      return res.status(200).json({
        status: "error",
        message: `No assets found for the type: ${type} in the portfolio.`,
        type: type,
        totalAssets: 0,
        totalValue: 0,
        totalProfitPercentage: 0,
        totalProfitValue: 0,
        assets: [],
      });
    }

    const totalAssets = filteredAssets.length;
    const totalValue = filteredAssets.reduce(
      (total, asset) => total + asset.quantity * asset.lastPrice,
      0
    );

    const totalProfitPercentage = filteredAssets.reduce(
      (total, asset) =>
        total +
        ((asset.lastPrice - asset.purchasePrice) / asset.purchasePrice) * 100,
      0
    );

    const totalProfitValue = filteredAssets.reduce(
      (total, asset) =>
        total + (asset.quantity * asset.lastPrice - asset.totalPurchasePrice),
      0
    );

    const assetsWithPercentage = filteredAssets.map((asset) => {
      const assetPercentage =
        ((asset.quantity * asset.lastPrice) / totalValue) * 100;
      const randomColorCode = randomColor({ format: "hex" }); // random hex renk kodu al

      // Modify asset name to display only the first word for type "Stock"
      const modifiedName =
        type === "Stock" ? asset.name.split(" ")[0] : asset.name;

      return {
        ...asset.toObject(),
        assetPercentage: parseFloat(assetPercentage.toFixed(2)),
        color: randomColorCode,
        name: modifiedName, // Use modifiedName instead of asset.name
      };
    });

    res.status(200).json({
      status: "success",
      message: `Details for ${type} assets in the portfolio successfully retrieved.`,
      type: filteredAssets[0].type,
      totalAssets,
      totalValue: parseFloat(totalValue.toFixed(2)),
      totalProfitPercentage: parseFloat(totalProfitPercentage.toFixed(2)),
      totalProfitValue: parseFloat(totalProfitValue.toFixed(2)),
      assets: assetsWithPercentage,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

module.exports = router;
