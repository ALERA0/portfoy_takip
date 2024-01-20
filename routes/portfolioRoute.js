const express = require("express");
const Portfolio = require("../models/Portfolio");
const verifyJWT = require("../middleware/verifyJWT");
const PortfolioDetail = require("../models/PortfolioDetail");
const router = express.Router();

router.use(verifyJWT);




router.get("/getAllPortfolio", async (req, res) => {
  try {
    const portfolios = await Portfolio.find({ createdBy: req.user._id }).select("-portfolioDetails");
    res.status(200).json({
      status: "success",
      message: "Portfolio listesi başarıyla getirildi",
      portfolios,
    });
  } catch (err) {
    console.error(err);

    res.status(500).send(err);
  }
});

router.get("/getPortfolioDetails/:portfolioId", async (req, res) => {
  try {
    const { portfolioId } = req.params;
    const portfolio = await Portfolio.findById(portfolioId);

    if (!portfolio) {
      return res.status(404).json({ status: "error", message: "Portfolio not found." });
    }

    // Toplam portföy değerini hesapla ve virgülden sonra iki basamaklı olarak düzenle
    const totalValue = parseFloat(portfolio.portfolioDetails.reduce((total, asset) => {
      return total + asset.quantity * asset.unitPrice;
    }, 0).toFixed(2));

    // Her varlık türünün yüzdelik dağılımını hesapla
    const distribution = {};

    portfolio.portfolioDetails.forEach(asset => {
      const assetValue = asset.quantity * asset.unitPrice;
      const percentage = (assetValue / totalValue) * 100;

      // Yüzde değerini doğrudan eklemeye çalışın
      if (!distribution[asset.type]) {
        distribution[asset.type] = 0;
      }
      distribution[asset.type] += percentage;
    });

    // Dağılımı tek bir nesne olarak düzenle ve yüzde toplamlarını kontrol et
    const formattedDistribution = Object.entries(distribution).map(([type, percentage]) => ({
      type,
      percentage: parseFloat(percentage.toFixed(2)),
    }));

    // Yüzde toplamlarını düzelt
    const totalPercentage = formattedDistribution.reduce((total, item) => total + item.percentage, 0);
    
    // Yüzde toplamlarının hassasiyet kontrolü
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return res.status(500).json({ status: "error", message: "Percentage calculation error." });
    }

    const adjustedDistribution = formattedDistribution.map(item => ({
      type: item.type,
      percentage: parseFloat(item.percentage.toFixed(2)), // Virgülden sonra iki basamak
    }));

    res.status(200).json({
      status: "success",
      message: "Portfolio detayları başarıyla getirildi",
      portfolio,
      totalValue,
      distribution: adjustedDistribution,
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
    const { type, name, quantity, unitPrice, purchaseDate } = req.body;
    const portfolioId = req.params.portfolioId;

    // Validate type against allowed values
    if (!["Stock", "Gold", "Currency"].includes(type)) {
      return res.status(400).json({ message: "Invalid type value." });
    }

    const portfolio = await Portfolio.findById(portfolioId);

    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio not found." });
    }

    const newPortfolioDetail = new PortfolioDetail({
      type,
      name,
      quantity,
      unitPrice,
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



module.exports = router;
