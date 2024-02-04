const express = require("express");
const Portfolio = require("../models/Portfolio");
const verifyJWT = require("../middleware/verifyJWT");
const PortfolioDetail = require("../models/PortfolioDetail");
const { default: mongoose } = require("mongoose");
const Currency = require("../models/Currency");
const Gold = require("../models/Gold");
const Stock = require("../models/Stock");

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

const colorCodes = {
  Stock: "#BCFE00",
  Currency: "#00EFFE",
  Gold: "#FF7A00",
  Crypto: "#DB00FF",
  Fund: "#FF007A",
  TurkishLira: "#3401FF",
};

async function getLatestPrice(type, name) {
  const model = mongoose.model(type);
  return await model.findOne({ name }).sort({ addedDate: -1 });
}

function groupByType(portfolioDetails) {
  const groupedDetails = {};
  portfolioDetails.forEach((detail) => {
    const type = detail.type;
    if (!groupedDetails[type]) {
      groupedDetails[type] = [];
    }
    groupedDetails[type].push(detail);
  });
  return groupedDetails;
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

    // Her bir varlık için lastPrice'ı güncelle
    const updatedPortfolioDetails = await Promise.all(
      portfolio.portfolioDetails.map(async (asset) => {
        const latestData = await getLatestPrice(asset.type, asset.name);
        const purchasePrice = parseFloat(asset.purchasePrice).toFixed(2);
        const lastPrice = parseFloat(
          latestData.lastPrice.replace(",", ".")
        ).toFixed(2);
        const totalAssetValue = asset.quantity * lastPrice;
        const profitPercentage =
          ((lastPrice - asset.purchasePrice) / asset.purchasePrice) * 100;

        return {
          ...asset.toObject(),
          lastPrice,
          purchasePrice,
          profitPercentage: parseFloat(profitPercentage.toFixed(2)),
          totalAssetValue: parseFloat(totalAssetValue).toFixed(2),
        };
      })
    );

    // Her varlık türüne göre objeleri grupla
    const groupedPortfolioDetails = updatedPortfolioDetails.reduce(
      (grouped, asset) => {
        if (!grouped[asset.type]) {
          grouped[asset.type] = {
            color: colorCodes[asset.type] || "#000000", // Renk bilgisini ekleyin
            assets: [],
          };
        }
        grouped[asset.type].assets.push(asset);
        return grouped;
      },
      {}
    );

    // Gruplanmış verileri array'e dönüştür
    const formattedPortfolioDetails = Object.entries(
      groupedPortfolioDetails
    ).map(([type, { assets, color }]) => ({
      type,
      assets,
      color, // Renk bilgisini ekleyin
    }));

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
        percentage: parseFloat(percentage.toFixed(4)),
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

    const order = [
      "Stock",
      "Currency",
      "Gold",
      "Crypto",
      "Fund",
      "TurkishLira",
    ];
    formattedDistribution.sort(
      (a, b) => order.indexOf(a.type) - order.indexOf(b.type)
    );

    const adjustedDistribution = formattedDistribution.map((item) => ({
      type: item.type,
      percentage: parseFloat(item.percentage).toFixed(3),
      color: colorCodes[item.type] || "#000000",
    }));

    // Güncellenmiş portföy detayları ile birlikte portföy bilgisini döndür
    const updatedPortfolio = await Portfolio.findByIdAndUpdate(
      portfolioId,
      {
        totalAssetValue: parseFloat(totalValue).toFixed(2),
        totalProfitPercentage: parseFloat(formattedFitStatus.toFixed(2)),
        totalPurchaseValue: parseFloat(totalPurchaseValue).toFixed(2),
        portfolioDetails: updatedPortfolioDetails,
      },
      { new: true }
    );

    res.status(200).json({
      status: "success",
      message: "Portfolio detayları başarıyla getirildi",
      portfolio: {
        ...updatedPortfolio.toObject(),
        // totalValue,
        // fitStatus: formattedFitStatus,
        portfolioDetails: formattedPortfolioDetails, // Gruplanmış detayları ekleyin
      },
      distribution: adjustedDistribution,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

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

router.get(
  "/getAssetDetails/:portfolioId/:assetId/:type/:name/:numberOfDays",
  async (req, res) => {
    try {
      const { portfolioId, assetId, type, name, numberOfDays } = req.params;
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

      res.status(200).json({
        status: "success",
        message: "Asset detayları başarıyla getirildi",
        portfolioId: portfolio._id,
        assetDetails: {
          name: asset.name,
          assetId: asset._id,
          type: asset.type,
          quantity: parseFloat(asset.quantity).toFixed(2), // Virgülden sonra 2 basamak göster
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
  }
);

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
      return res
        .status(404)
        .json({
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


module.exports = router;
