const express = require("express");
const Portfolio = require("../models/Portfolio");
const verifyJWT = require("../middleware/verifyJWT");
const PortfolioDetail = require("../models/PortfolioDetail");
const { default: mongoose } = require("mongoose");
const router = express.Router();

router.use(verifyJWT);

const allowedTypes = [
  "Stock",
  "Gold",
  "Currency",
  "TurkishLira",
  "Crypto",
  "Fund",
];

async function getLatestPrice(type, name) {
  const model = mongoose.model(type);
  return await model.findOne({ name }).sort({ addedDate: -1 });
}

router.get("/getAllPortfolio", async (req, res) => {
  try {
    const portfolios = await Portfolio.find({ createdBy: req.user._id }).select(
      "-portfolioDetails"
    );
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

router.put("/updatePortfolio/:portfolioId", async (req, res) => {
  try {
    const { portfolioId } = req.params;
    const { name } = req.body;

    const portfolio = await Portfolio.findByIdAndUpdate(
      portfolioId,
      { name },
      { new: true }
    );

    if (!portfolio) {
      return res
        .status(404)
        .json({ status: "error", message: "Portfolio bulunamadı." });
    }

    res.status(200).json({
      status: "success",
      message: "Portfolio başarıyla güncellendi",
    });
  } catch (err) {
    res.status(500).send(err);
  }
});

router.delete("/deletePortfolio/:portfolioId", async (req, res) => {
  try {
    const { portfolioId } = req.params;
    await Portfolio.findByIdAndDelete(portfolioId);
    res.status(200).json({
      status: "success",
      message: "Portfolio başarıyla silindi",
    });
  } catch (error) {
    res.status(500).send(err);
  }
});

router.get("/getPortfolioDetails/:portfolioId", async (req, res) => {
  try {
    const { portfolioId } = req.params;
    const portfolio = await Portfolio.findById(portfolioId);

    if (!portfolio) {
      return res
        .status(404)
        .json({ status: "error", message: "Portfolio not found." });
    }

    // Her bir varlık için lastPrice'ı güncelle
    const updatedPortfolioDetails = await Promise.all(
      portfolio.portfolioDetails.map(async (asset) => {
        const latestData = await getLatestPrice(asset.type, asset.name);

        const lastPrice = parseFloat(latestData.lastPrice.replace(",", "."));
        const currentAssetValue = asset.quantity * lastPrice;
        const purchaseValue = asset.quantity * asset.purchasePrice;
        const totalAssetValue = asset.quantity * lastPrice;
        const profitPercentage =
          ((currentAssetValue - purchaseValue) / purchaseValue) * 100;

        return {
          ...asset.toObject(),
          lastPrice,
          profitPercentage: parseFloat(profitPercentage.toFixed(2)),
          totalAssetValue
        };
      })
    );

    // Toplam portföy değerini ve toplam varlık maliyetini hesapla
    const totalValue = parseFloat(
      updatedPortfolioDetails
        .reduce((total, asset) => {
          return total + asset.quantity * asset.lastPrice;
        }, 0)
        .toFixed(2)
    );

    const totalPurchaseValue = parseFloat(
      updatedPortfolioDetails
        .reduce((total, asset) => {
          return total + asset.quantity * asset.purchasePrice;
        }, 0)
        .toFixed(2)
    );

    const fitStatus =
      ((totalValue - totalPurchaseValue) / totalPurchaseValue) * 100;

    const formattedFitStatus = parseFloat(fitStatus.toFixed(4));

    // Her varlık türünün yüzdelik dağılımını hesapla
    const distribution = {};

    updatedPortfolioDetails.forEach((asset) => {
      const assetValue = asset.quantity * asset.lastPrice;
      const percentage = (assetValue / totalValue) * 100;

      // Yüzde değerini doğrudan eklemeye çalışın
      if (!distribution[asset.type]) {
        distribution[asset.type] = 0;
      }
      distribution[asset.type] += percentage;
    });

    // Dağılımı tek bir nesne olarak düzenle ve yüzde toplamlarını kontrol et
    const formattedDistribution = Object.entries(distribution).map(
      ([type, percentage]) => ({
        type,
        percentage: parseFloat(percentage.toFixed(2)),
      })
    );

    // Tüm varlık türlerini kontrol et ve eksik olanları 0 yüzde ile ekle
    allowedTypes.forEach((type) => {
      if (!distribution[type]) {
        formattedDistribution.push({
          type,
          percentage: 0,
        });
      }
    });

    // Yüzde toplamlarını düzelt
    const totalPercentage = formattedDistribution.reduce(
      (total, item) => total + item.percentage,
      0
    );

    // Yüzde toplamlarının hassasiyet kontrolü
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return res
        .status(500)
        .json({ status: "error", message: "Percentage calculation error." });
    }

    const adjustedDistribution = formattedDistribution.map((item) => ({
      type: item.type,
      percentage: parseFloat(item.percentage.toFixed(2)), // Virgülden sonra iki basamak
    }));

    // Güncellenmiş portföy detayları ile birlikte portföy bilgisini döndür
    const updatedPortfolio = await Portfolio.findByIdAndUpdate(
      portfolioId,
      { portfolioDetails: updatedPortfolioDetails },
      { new: true }
    );

    res.status(200).json({
      status: "success",
      message: "Portfolio detayları başarıyla getirildi",
      portfolio: {
        ...updatedPortfolio.toObject(),
        totalValue,
        fitStatus: formattedFitStatus,
      },
      distribution: adjustedDistribution,
      // portfolioDetails: updatedPortfolioDetails,
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

    // Validate type against allowed values
    if (!["Stock", "Gold", "Currency"].includes(type)) {
      return res.status(400).json({ message: "Invalid type value." });
    }

    const portfolio = await Portfolio.findById(portfolioId);

    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio not found." });
    }

    // Büyük harfe çevir
    const upperCaseName = name.toUpperCase();

    // İlgili modeli bul ve eklenen verinin en son değerini al
    const model = mongoose.model(type);

    const formattedPurchaseDate = purchaseDate
      ? new Date(purchaseDate.replace(/-/g, "/"))
      : new Date();
    const newPortfolioDetail = new PortfolioDetail({
      type,
      name: upperCaseName,
      quantity,
      purchasePrice,
      purchaseDate: formattedPurchaseDate,
      // Parse edilen lastPrice'ı kullan
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

router.delete('/removeAsset/:portfolioId/:assetId', async (req, res) => {
  try {
    const { portfolioId, assetId } = req.params;

    // Portföyü bul
    const portfolio = await Portfolio.findById(portfolioId);

    if (!portfolio) {
      return res.status(404).json({ status: 'error', message: 'Portfolio not found.' });
    }

    // Varlığı bul ve kaldır
    const updatedPortfolioDetails = portfolio.portfolioDetails.filter(asset => asset._id.toString() !== assetId);

    

    // Güncellenmiş portföyü kaydet
     await Portfolio.findByIdAndUpdate(
      portfolioId,
      { portfolioDetails: updatedPortfolioDetails },
      { new: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'Varlık portfoyunuzden başarıyla çıkarıldı.',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
