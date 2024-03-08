const asyncHandler = require("express-async-handler");
const { customError } = require("../shared/handlers/error/customError");
const { errorCodes } = require("../shared/handlers/error/errorCodes");
const Portfolio = require("../models/Portfolio");
const { default: mongoose } = require("mongoose");

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

const getAllPortfolio = asyncHandler(async (req, res) => {
  const portfolios = await Portfolio.find({ createdBy: req.user._id }).select(
    "-portfolioDetails"
  );
  res.status(200).json({
    status: "success",
    message: "Portfolio listesi başarıyla getirildi",
    portfolios,
  });
});

const updatedPortfolio = asyncHandler(async (req, res) => {
  const { portfolioId } = req.params;
  const { name } = req.body;
  console.log(name, "NAME");

  if (name === "" || name == undefined) {
    throw new customError(errorCodes.NAME_CAN_NOT_BE_EMPTY);
  }

  const portfolio = await Portfolio.findByIdAndUpdate(
    portfolioId,
    { name },
    { new: true }
  );

  if (!portfolio) {
    throw new customError(errorCodes.PORTFOLIO_NOT_FOUND);
  }

  res.status(200).json({
    status: "success",
    message: "Portfolio başarıyla güncellendi",
  });
});

const deletePortfolio = asyncHandler(async (req, res) => {
  const { portfolioId } = req.params;
  const userId = req.user._id;

  const portfolios = await Portfolio.find({ createdBy: userId });
  if (portfolios.length === 1) {
    return res.status(400).json({
      status: "error",
      message: "Hesabınızda en az bir portföy bulunmalıdır.",
    });
  }

  const portfolio = await Portfolio.findByIdAndDelete(portfolioId);
  if (!portfolio) {
    throw new customError(errorCodes.PORTFOLIO_NOT_FOUND);
  }
  res.status(200).json({
    status: "success",
    message: "Portfolio başarıyla silindi",
  });
});

const getPortfolioDetails = asyncHandler(async (req, res) => {
  const { portfolioId } = req.params;
  const userId = req.user._id;
  const portfolio = await Portfolio.findOne({
    _id: portfolioId,
    createdBy: userId,
  });

  if (!portfolio) {
    throw new customError(errorCodes.PORTFOLIO_NOT_FOUND);
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

      const profitValue =
        totalAssetValue - asset.quantity * asset.purchasePrice;
      const totalPurchasePrice = asset.quantity * asset.purchasePrice;
      return {
        ...asset.toObject(),
        lastPrice,
        purchasePrice,
        profitPercentage: parseFloat(profitPercentage.toFixed(2)),
        totalAssetValue: parseFloat(totalAssetValue).toFixed(2),
        profitValue: parseFloat(profitValue).toFixed(2),
        totalPurchasePrice: parseFloat(totalPurchasePrice).toFixed(2),
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
  const formattedPortfolioDetails = Object.entries(groupedPortfolioDetails).map(
    ([type, { assets, color }]) => ({
      type,
      assets,
      color, // Renk bilgisini ekleyin
    })
  );


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
    totalValue > 0
      ? ((totalValue - totalPurchaseValue) / totalPurchaseValue) * 100
      : 0;

  const formattedFitStatus = parseFloat(fitStatus.toFixed(4));

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

  const order = ["Stock", "Currency", "Gold", "Crypto", "Fund", "TurkishLira"];
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
      profitValue: parseFloat(totalValue - totalPurchaseValue).toFixed(2),
      portfolioDetails: updatedPortfolioDetails,
    },
    { new: true }
  );

  const truncatedPortfolioDetails = formattedPortfolioDetails.map((group) => {
    if (group.type === "Stock") {
      group.assets = group.assets.map((asset) => {
        const spaceIndex = asset.name.indexOf(" ");
        asset.name =
          spaceIndex !== -1 ? asset.name.substring(0, spaceIndex) : asset.name;
        return asset;
      });
    }
    return group;
  });
  res.status(200).json({
    status: "success",
    message: "Portfolio detayları başarıyla getirildi",
    portfolio: {
      ...updatedPortfolio.toObject(),
      // totalValue,
      // fitStatus: formattedFitStatus,
      portfolioDetails: truncatedPortfolioDetails,
    },
    distribution: adjustedDistribution,
  });
});

module.exports = {
  getAllPortfolio,
  updatedPortfolio,
  deletePortfolio,
  getPortfolioDetails,
};
