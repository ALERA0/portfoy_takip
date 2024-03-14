const asyncHandler = require("express-async-handler");
const { customError } = require("../shared/handlers/error/customError");
const { errorCodes } = require("../shared/handlers/error/errorCodes");
const Portfolio = require("../models/Portfolio");
const { default: mongoose } = require("mongoose");
const Currency = require("../models/Currency");
const Gold = require("../models/Gold");
const Stock = require("../models/Stock");
const randomColor = require("randomcolor");
const Budget = require("../models/Budget");
const PortfolioDetail = require("../models/PortfolioDetail");

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

const getAssetPercentages = asyncHandler(async (req, res) => {
  const { portfolioId, assetType } = req.params;
  const userId = req.user._id;

  const portfolio = await Portfolio.findOne({
    _id: portfolioId,
    createdBy: userId,
  });

  if (!portfolio) {
    throw new customError(errorCodes.PORTFOLIO_NOT_FOUND);
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
});

const createPortfolio = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const createdBy = req.user._id;

  if (name.length < 3) {
    throw new customError(errorCodes.PORTFOLIO_NAME_TOO_SHORT);
  }

  const existingPortfolioWithSameInfo = await Portfolio.findOne({
    $or: [{ name: name, createdBy: createdBy }],
  });

  if (existingPortfolioWithSameInfo) {
    throw new customError(errorCodes.PORTFOLIO_ALREADY_EXISTS);
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
});

const addAsset = asyncHandler(async (req, res) => {
  const { type, name, quantity, purchasePrice, purchaseDate } = req.body;
  const portfolioId = req.params.portfolioId;

  if (!type || !name || !quantity || !purchasePrice || !purchaseDate) {
    throw new customError(errorCodes.MISSING_FIELD);
  }

  // Validate type against allowed values
  if (!["Stock", "Gold", "Currency"].includes(type)) {
    throw new customError(errorCodes.INVALID_ASSET_TYPE);
  }

  const portfolio = await Portfolio.findById(portfolioId);

  if (!portfolio) {
    throw new customError(errorCodes.PORTFOLIO_NOT_FOUND);
  }

  const budget = await Budget.findOne({ createdBy: req.user._id });

  const totalPurchaseValue = parseFloat(quantity * purchasePrice);
  if (totalPurchaseValue > budget.totalValue) {
    throw new customError(errorCodes.BUDGET_INSUFFICIENT);
  } else {
    budget.totalValue -= totalPurchaseValue.toFixed(2);
    await budget.save();
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
});

const removeAsset = asyncHandler(async (req, res) => {
  const { portfolioId, assetId } = req.params;

  // Portföyü bul
  const portfolio = await Portfolio.findById(portfolioId);

  if (!portfolio) {
    throw new customError(errorCodes.PORTFOLIO_NOT_FOUND);
  }

  // Varlığı bul ve kaldır
  const assetToRemove = portfolio.portfolioDetails.find(
    (asset) => asset._id.toString() === assetId
  );

  if (!assetToRemove) {
    throw new customError(errorCodes.ASSET_NOT_FOUND);
  }

  const updatedPortfolioDetails = portfolio.portfolioDetails.filter(
    (asset) => asset._id.toString() !== assetId
  );

  // Hesaplamaları yap
  const budget = await Budget.findOne({ createdBy: req.user._id });
  budget.totalValue = (parseFloat(budget.totalValue) + parseFloat(assetToRemove.totalAssetValue)).toFixed(2);
  budget.totalProfitValue = (parseFloat(budget.totalProfitValue) + parseFloat(assetToRemove.profitValue)).toFixed(2);
  await budget.save();

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
});

const getAssetDetails = asyncHandler(async (req, res) => {
  const { portfolioId, assetId, type, name, numberOfDays } = req.body;
  const userId = req.user._id;

  // Belirtilen portföy ve varlık bilgilerini kontrol et
  const portfolio = await Portfolio.findOne({
    _id: portfolioId,
    createdBy: userId,
  });

  if (!portfolio) {
    throw new customError(errorCodes.PORTFOLIO_NOT_FOUND);
  }

  // Belirtilen varlık (asset) bilgisini bul
  const asset = portfolio.portfolioDetails.find(
    (item) => item._id.toString() === assetId
  );

  if (!asset) {
    throw new customError(errorCodes.ASSET_NOT_FOUND);
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
      throw new customError(errorCodes.INVALID_ASSET_TYPE);
  }

  // Verileri istenen formata çevir
  const formattedHistoricalData = historicalData.map((item, index, array) => ({
    value: parseFloat(item.lastPrice.replace(",", ".")),
    date: item.addedDate.toISOString().split("T")[0],
    label:
      index === 0 || index === array.length - 1
        ? item.addedDate.toISOString().split("T")[0]
        : null,
  }));

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
  } else if (type === "Gold") {
    const gold = await Gold.findOne({ name: asset.name });
    namefirst = gold.name;
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
});

const updateAsset = asyncHandler(async (req, res) => {
  const { portfolioId, assetId } = req.params;
  const { quantity, purchasePrice, purchaseDate } = req.body;
  const userId = req.user._id;

  // Portföyü bul
  const portfolio = await Portfolio.findOne({
    _id: portfolioId,
    createdBy: userId,
  });

  if (!portfolio) {
    throw new customError(errorCodes.PORTFOLIO_NOT_FOUND);
  }

  const assetIndex = portfolio.portfolioDetails.findIndex(
    (item) => item._id.toString() === assetId
  );

  if (assetIndex === -1) {
    throw new customError(errorCodes.ASSET_NOT_FOUND);
  }

  // Update the asset details
  portfolio.portfolioDetails[assetIndex].quantity = quantity;
  portfolio.portfolioDetails[assetIndex].purchasePrice = purchasePrice;
  portfolio.portfolioDetails[assetIndex].purchaseDate = purchaseDate;

  await portfolio.save();

  res.status(200).json({
    status: "success",
    message: "Asset details successfully updated.",
  });
});

const getPortfolioTypeDetails = asyncHandler(async (req, res) => {
  const { portfolioId, type } = req.params;
  const userId = req.user._id;

  const portfolio = await Portfolio.findOne({
    _id: portfolioId,
    createdBy: userId,
  });

  if (!portfolio) {
    throw new customError(errorCodes.PORTFOLIO_NOT_FOUND);
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
});

const updateBudget = asyncHandler(async (req, res) => {
  const { value } = req.body;
  if (!Number.isFinite(value) || value < 0) {
    throw new customError(errorCodes.INVALID_BUDGET_VALUE);
  }
  const userId = req.user._id;
  const budget = await Budget.findOneAndUpdate(
    { createdBy: userId },
    { totalValue: value },
    { new: true }
  );

  if (!budget) {
    throw new customError(errorCodes.BUDGET_NOT_FOUND);
  }

  return res.status(200).json({
    status: "success",
    message: "Bütçe başarıyla güncellendi.",
  });
});

const getBudgetDetails = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const budget = await Budget.findOne({ createdBy: userId });
  if (!budget) {
    throw new customError(errorCodes.BUDGET_NOT_FOUND);
  }
  return res.status(200).json({
    status: "success",
    message: "Bütçe detayları başarıyla getirildi.",
    budget,
  });
});

module.exports = {
  getAllPortfolio,
  updatedPortfolio,
  deletePortfolio,
  getPortfolioDetails,
  getAssetPercentages,
  createPortfolio,
  addAsset,
  removeAsset,
  getAssetDetails,
  updateAsset,
  getPortfolioTypeDetails,
  updateBudget,
  getBudgetDetails,
};
